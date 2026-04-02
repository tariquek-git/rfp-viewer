import { NextResponse } from 'next/server';
import type { RFPData } from '@/types';
import type { KnowledgeBase, ValidationRule } from '@/types';
import { exportToWord } from '@/lib/exportWord';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    data: RFPData;
    knowledgeBase?: KnowledgeBase;
    globalRules?: string[];
    validationRules?: ValidationRule[];
  };

  const buffer = await exportToWord(body.data, {
    knowledgeBase: body.knowledgeBase,
    globalRules: body.globalRules,
    validationRules: body.validationRules,
    returnBuffer: true,
  });

  const buf = buffer as Buffer;
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="BSB_RFP_Response_Brim_Financial.docx"',
    },
  });
}
