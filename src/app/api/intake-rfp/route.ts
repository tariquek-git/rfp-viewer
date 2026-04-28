import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import ExcelJS from 'exceljs';
import { handleAnthropicError, parseAIJson } from '@/lib/parseAIResponse';
import { ExtractedQuestionsArraySchema } from '@/lib/schemas';
import type { ExtractedQuestion, IntakeResult } from '@/types';

const client = new Anthropic();

// 25MB cap. RFPs run 5-15MB typically; 25 leaves headroom without inviting abuse.
// On Vercel Hobby this would exceed the 4.5MB request cap — Pro plan or
// a chunked upload would be needed in deployment.
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

const EXTRACTION_PROMPT = `You are extracting RFP questions from a document for Brim Financial.

The document is an RFP (Request for Proposal) from a bank, listing questions and requirements that vendors are asked to address. Your job is to extract every distinct question and return them as a JSON array.

For each question, return:
- ref: unique identifier in the form "{category} {number}" — e.g. "Compliance & Reporting 1"
- category: the section heading the question falls under. Infer it from headers, table of contents, or topical groupings if not explicit.
- number: sequential number within that category, starting at 1
- topic: a 3-7 word label summarizing the question
- requirement: the verbatim or near-verbatim question text the bank is asking, including sub-bullets if any

Rules:
- Skip cover pages, instructions, evaluation criteria, table of contents, signature blocks — extract only the actual questions/requirements vendors must answer.
- If categories aren't explicit, group by topic (e.g. "Security", "Implementation", "Pricing").
- Preserve the bank's original phrasing in \`requirement\`. Do not paraphrase.
- One question per JSON object. If a question has lettered sub-parts (a, b, c), keep them inside the same \`requirement\` field unless they are clearly separate questions.
- Preserve the order they appear in the document.

Also return at the END of your output, on a new line after the JSON, a single line in this format:
ACCOUNT: <bank name>

Where <bank name> is the issuing bank's name as it appears in the document. If unclear, write "Unknown".

Return the JSON array first, then the ACCOUNT line. No other commentary.`;

/**
 * Pull readable cell content from an Excel workbook into a flat text dump
 * Claude can parse. Preserves sheet boundaries and row order.
 */
async function extractExcelText(
  buffer: ArrayBuffer,
): Promise<{ text: string; sheetCount: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const lines: string[] = [];
  let sheetCount = 0;

  wb.eachSheet((sheet) => {
    sheetCount++;
    lines.push(`\n=== Sheet: ${sheet.name} ===`);
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        if (v == null) return;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          cells.push(String(v));
        } else if (typeof v === 'object' && 'text' in v) {
          // Rich text cell
          cells.push(String(v.text ?? ''));
        } else if (typeof v === 'object' && 'result' in v) {
          // Formula cell
          cells.push(String(v.result ?? ''));
        }
      });
      if (cells.length) lines.push(cells.join(' | '));
    });
  });

  return { text: lines.join('\n'), sheetCount };
}

function parseAccountFromText(raw: string): string {
  const match = raw.match(/^ACCOUNT:\s*(.+?)\s*$/im);
  return match ? match[1].trim() : '';
}

/**
 * Strips the ACCOUNT trailer line so the rest can be parsed as JSON.
 */
function stripAccountLine(raw: string): string {
  return raw.replace(/^ACCOUNT:\s*.+$/im, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 25MB.` },
        { status: 413 },
      );
    }

    const fileName = file.name || 'upload';
    const lower = fileName.toLowerCase();
    let fileType: 'pdf' | 'xlsx';
    if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      fileType = 'xlsx';
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileName}. Upload a PDF or Excel file.` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    let userContent: Anthropic.MessageParam['content'];
    const warnings: string[] = [];
    let pageCount: number | undefined;

    if (fileType === 'pdf') {
      // Anthropic accepts PDFs as base64 document blocks; the model parses
      // pages natively (text + visual structure), better than a raw text dump.
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      userContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
          title: fileName,
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ];
    } else {
      const { text, sheetCount } = await extractExcelText(arrayBuffer);
      pageCount = sheetCount;
      if (!text.trim()) {
        return NextResponse.json(
          { error: 'Excel file appears empty or unreadable.' },
          { status: 400 },
        );
      }
      if (text.length > 200_000) {
        warnings.push(
          `Excel content is very large (${text.length} chars); extraction may miss tail rows.`,
        );
      }
      userContent = [
        { type: 'text', text: `${EXTRACTION_PROMPT}\n\n--- DOCUMENT (${fileName}) ---\n${text}` },
      ];
    }

    const timeout = AbortSignal.timeout(120_000);
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{ role: 'user', content: userContent }],
      },
      { signal: timeout },
    );

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const detectedAccountName = parseAccountFromText(raw);
    const jsonText = stripAccountLine(raw);

    const parsed = parseAIJson<unknown[]>(jsonText, [], 'intake-rfp');
    const validated = ExtractedQuestionsArraySchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'AI returned malformed question list',
          details: validated.error.issues.slice(0, 5).map((i) => i.message),
          rawSample: raw.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const result: IntakeResult = {
      questions: validated.data as ExtractedQuestion[],
      detectedAccountName,
      fileName,
      fileType,
      pageCount,
      warnings,
    };

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Extraction timed out after 120s. Try a smaller file or split it.' },
        { status: 504 },
      );
    }
    return handleAnthropicError(error, 'intake-rfp');
  }
}
