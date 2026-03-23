#!/usr/bin/env python3
import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

DATA_FILE = "public/rfp_data.json"
OUTPUT = "BSB_RFP_QA_Report.xlsx"

with open(DATA_FILE) as f:
    root = json.load(f)

questions = root['questions']
wb = Workbook()

FONT = Font(name='Arial', size=10)
HEADER_FONT = Font(name='Arial', size=10, bold=True, color='FFFFFF')
SECTION_FONT = Font(name='Arial', size=11, bold=True, color='FFFFFF')
WRAP = Alignment(wrap_text=True, vertical='top')
THIN_BORDER = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

# Section colors
BSB_FILL = PatternFill('solid', fgColor='1F4E79')       # Dark blue - BSB asks
BRIM_FILL = PatternFill('solid', fgColor='2E7D32')       # Dark green - Brim responds
AI_FILL = PatternFill('solid', fgColor='7B1FA2')         # Purple - Claude AI
META_FILL = PatternFill('solid', fgColor='424242')       # Dark gray - metadata

# Cell tints (light versions for data rows)
BSB_TINT = PatternFill('solid', fgColor='D6E4F0')        # Light blue
BRIM_TINT = PatternFill('solid', fgColor='E8F5E9')       # Light green
AI_TINT = PatternFill('solid', fgColor='F3E5F5')         # Light purple
META_TINT = PatternFill('solid', fgColor='F5F5F5')       # Light gray

# Confidence colors
GREEN_FILL = PatternFill('solid', fgColor='C6EFCE')
YELLOW_FILL = PatternFill('solid', fgColor='FFEB9C')
RED_FILL = PatternFill('solid', fgColor='FFC7CE')
CONF_MAP = {'GREEN': GREEN_FILL, 'YELLOW': YELLOW_FILL, 'RED': RED_FILL}

# AI detection words
AI_WORDS = {
    'additionally': ('Filler transition', 'Remove or replace with a direct connector like "Also" or just start the next point'),
    'furthermore': ('Filler transition', 'Remove — start the sentence directly'),
    'moreover': ('Filler transition', 'Remove — just state the next fact'),
    'comprehensive': ('Vague superlative', 'Replace with specific scope: "covers X, Y, Z" or "spans 12 modules"'),
    'robust': ('Vague superlative', 'Replace with measurable claim: "handles X TPS" or "tested against Y scenarios"'),
    'seamless': ('Vague superlative', 'Replace with specifics: "zero-downtime migration" or "single API call"'),
    'leverage': ('Corporate buzzword', 'Replace with "use", "apply", or "build on"'),
    'utilize': ('Corporate buzzword', 'Replace with "use"'),
    'facilitate': ('Corporate buzzword', 'Replace with "enable", "support", or "allow"'),
    'streamline': ('Vague claim', 'Replace with specific efficiency gain: "reduces steps from 5 to 2"'),
    'cutting-edge': ('Vague superlative', 'Remove or replace with specific tech: "cloud-native" or "event-driven"'),
    'best-in-class': ('Unverifiable superlative', 'Remove or cite the ranking: "ranked #1 by Datos in 2025"'),
    'industry-leading': ('Unverifiable superlative', 'Remove or cite specific evidence'),
    'synergy': ('Corporate buzzword', 'Replace with specific benefit: "shared data layer" or "combined reporting"'),
    'holistic': ('Vague superlative', 'Replace with "end-to-end" or list what it covers'),
    'paradigm': ('Corporate buzzword', 'Replace with plain language: "approach" or "model"'),
    'ecosystem': ('Overused tech buzzword', 'Replace with "platform", "network", or "integration layer"'),
}

PASSIVE_PATTERNS = [
    (' is designed ', 'Passive voice', 'Rewrite active: "We designed X to..." or "X does Y"'),
    (' are configured ', 'Passive voice', 'Rewrite active: "We configure X to..."'),
    (' is enabled ', 'Passive voice', 'Rewrite active: "X enables..." or "We enable..."'),
    (' is provided ', 'Passive voice', 'Rewrite active: "We provide..." or "Brim provides..."'),
    (' are provided ', 'Passive voice', 'Rewrite active: "We provide..."'),
    (' is supported ', 'Passive voice', 'Rewrite active: "We support..." or "X supports..."'),
    (' is integrated ', 'Passive voice', 'Rewrite active: "X integrates with..."'),
    (' is managed ', 'Passive voice', 'Rewrite active: "We manage..." or "X manages..."'),
    (' is maintained ', 'Passive voice', 'Rewrite active: "We maintain..."'),
    (' is processed ', 'Passive voice', 'Rewrite active: "We process..." or "The system processes..."'),
]

def detect_ai_score(text):
    if not text:
        return 0, [], [], []
    lower = text.lower()
    found_words = []
    reasons = []
    fixes = []
    for w, (reason, fix) in AI_WORDS.items():
        if w in lower:
            found_words.append(w)
            reasons.append(f'"{w}" — {reason}')
            fixes.append(f'"{w}" → {fix}')
    for pattern, reason, fix in PASSIVE_PATTERNS:
        count = lower.count(pattern)
        if count > 0:
            found_words.append(pattern.strip())
            reasons.append(f'"{pattern.strip()}" x{count} — {reason}')
            fixes.append(fix)
    score = len(found_words)
    return score, found_words, reasons, fixes

def style_header_row(ws, row, col_start, col_end, fill):
    for c in range(col_start, col_end + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = HEADER_FONT
        cell.fill = fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

# ============================================================
# SHEET 1: Full RFP — Color-coded sections
# ============================================================
ws1 = wb.active
ws1.title = "Full RFP"

# Section labels row (row 1)
sections = [
    (1, 3, "METADATA", META_FILL),
    (4, 7, "BSB ASKS", BSB_FILL),
    (8, 12, "BRIM RESPONDS", BRIM_FILL),
    (13, 18, "BRIM METADATA", META_FILL),
    (19, 25, "CLAUDE AI ANALYSIS", AI_FILL),
]

for col_start, col_end, label, fill in sections:
    mid = (col_start + col_end) // 2
    cell = ws1.cell(row=1, column=mid, value=label)
    cell.font = SECTION_FONT
    cell.alignment = Alignment(horizontal='center')
    for c in range(col_start, col_end + 1):
        ws1.cell(row=1, column=c).fill = fill
        ws1.cell(row=1, column=c).font = SECTION_FONT

# Column headers (row 2)
headers = [
    # META (1-3)
    'Ref', 'Category', '#',
    # BSB ASKS (4-7)
    'Topic', 'Requirement', 'Compliant', 'Confidence',
    # BRIM RESPONDS (8-12)
    'Bullet Response', 'Paragraph Response', 'A:OOB', 'B:Config', 'C:Custom',
    # BRIM META (13-18)
    'Pricing', 'Capability', 'Availability', 'Strategic Notes', 'Notes', 'Reg Enable',
    # AI ANALYSIS (19-25)
    'AI Detection Score', 'AI Words Found', 'Word Count (Bullet)', 'Word Count (Para)',
    'Rationale', 'Committee Review', 'Committee Score',
]

keys = [
    'ref', 'category', 'number',
    'topic', 'requirement', 'compliant', 'confidence',
    'bullet', 'paragraph', 'a_oob', 'b_config', 'c_custom',
    'pricing', 'capability', 'availability', 'strategic', 'notes', 'reg_enable',
    '_ai_score', '_ai_words', '_wc_bullet', '_wc_para',
    'rationale', 'committee_review', 'committee_score',
]

# Tint map: which columns get which tint
tint_ranges = [
    (1, 3, META_TINT),
    (4, 7, BSB_TINT),
    (8, 12, BRIM_TINT),
    (13, 18, META_TINT),
    (19, 25, AI_TINT),
]

def get_tint(col):
    for s, e, t in tint_ranges:
        if s <= col <= e:
            return t
    return None

# Header fills match section
header_fills = {}
for s, e, _, fill in sections:
    for c in range(s, e + 1):
        header_fills[c] = fill

for i, h in enumerate(headers, 1):
    cell = ws1.cell(row=2, column=i, value=h)
    cell.font = HEADER_FONT
    cell.fill = header_fills.get(i, META_FILL)
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

ws1.auto_filter.ref = f"A2:{get_column_letter(len(headers))}2"
ws1.freeze_panes = 'A3'

# Data rows
for r, q in enumerate(questions, 3):
    # Compute AI detection
    bullet = q.get('bullet', '') or ''
    para = q.get('paragraph', '') or ''
    combined = bullet + ' ' + para
    ai_score, ai_words, _, _ = detect_ai_score(combined)
    wc_bullet = len(bullet.split()) if bullet else 0
    wc_para = len(para.split()) if para else 0

    for c, key in enumerate(keys, 1):
        if key == '_ai_score':
            val = ai_score
        elif key == '_ai_words':
            val = ', '.join(ai_words) if ai_words else 'Clean'
        elif key == '_wc_bullet':
            val = wc_bullet
        elif key == '_wc_para':
            val = wc_para
        else:
            val = q.get(key, '')

        cell = ws1.cell(row=r, column=c, value=val)
        cell.font = FONT
        cell.alignment = WRAP
        cell.border = THIN_BORDER

        # Apply section tint
        tint = get_tint(c)
        if tint:
            cell.fill = tint

        # Override for confidence column
        if key == 'confidence' and val in CONF_MAP:
            cell.fill = CONF_MAP[val]

        # Override for AI score - red if high
        if key == '_ai_score':
            if val >= 3:
                cell.fill = RED_FILL
            elif val >= 1:
                cell.fill = YELLOW_FILL
            else:
                cell.fill = GREEN_FILL

# Column widths
widths = [12, 20, 5, 25, 45, 9, 11, 50, 50, 6, 6, 6,
          15, 12, 14, 40, 30, 10,
          12, 25, 12, 12, 35, 40, 8]
for i, w in enumerate(widths, 1):
    ws1.column_dimensions[get_column_letter(i)].width = w

# ============================================================
# SHEET 2: Summary by Category
# ============================================================
ws2 = wb.create_sheet("Summary by Category")
sum_headers = ['Category', 'Total', 'GREEN', 'YELLOW', 'RED', '% Compliant', 'Avg AI Score', 'Avg Word Count']
for i, h in enumerate(sum_headers, 1):
    cell = ws2.cell(row=1, column=i, value=h)
    cell.font = HEADER_FONT
    cell.fill = PatternFill('solid', fgColor='2F5496')
    cell.alignment = Alignment(horizontal='center')
ws2.auto_filter.ref = f"A1:{get_column_letter(len(sum_headers))}1"
ws2.freeze_panes = 'A2'

cats = {}
for q in questions:
    cat = q.get('category', 'Unknown')
    if cat not in cats:
        cats[cat] = {'total': 0, 'GREEN': 0, 'YELLOW': 0, 'RED': 0, 'compliant': 0, 'ai_scores': [], 'wc': []}
    cats[cat]['total'] += 1
    conf = q.get('confidence', '')
    if conf in ('GREEN', 'YELLOW', 'RED'):
        cats[cat][conf] += 1
    if q.get('compliant') == 'Y':
        cats[cat]['compliant'] += 1
    bullet = q.get('bullet', '') or ''
    para = q.get('paragraph', '') or ''
    ai_s, _, _, _ = detect_ai_score(bullet + ' ' + para)
    cats[cat]['ai_scores'].append(ai_s)
    cats[cat]['wc'].append(len(para.split()) if para else len(bullet.split()) if bullet else 0)

for r, (cat, s) in enumerate(cats.items(), 2):
    ws2.cell(row=r, column=1, value=cat).font = FONT
    ws2.cell(row=r, column=2, value=s['total']).font = FONT
    g = ws2.cell(row=r, column=3, value=s['GREEN']); g.font = FONT; g.fill = GREEN_FILL
    y = ws2.cell(row=r, column=4, value=s['YELLOW']); y.font = FONT; y.fill = YELLOW_FILL
    rd = ws2.cell(row=r, column=5, value=s['RED']); rd.font = FONT; rd.fill = RED_FILL
    pct = s['compliant'] / s['total'] if s['total'] else 0
    ws2.cell(row=r, column=6, value=pct).font = FONT
    ws2.cell(row=r, column=6).number_format = '0.0%'
    avg_ai = sum(s['ai_scores']) / len(s['ai_scores']) if s['ai_scores'] else 0
    ws2.cell(row=r, column=7, value=round(avg_ai, 1)).font = FONT
    avg_wc = sum(s['wc']) / len(s['wc']) if s['wc'] else 0
    ws2.cell(row=r, column=8, value=round(avg_wc, 0)).font = FONT
    for c in range(1, 9):
        ws2.cell(row=r, column=c).border = THIN_BORDER

for w, col in [(25,1),(8,2),(8,3),(8,4),(8,5),(12,6),(12,7),(14,8)]:
    ws2.column_dimensions[get_column_letter(col)].width = w

# ============================================================
# SHEET 3: RED Questions
# ============================================================
ws3 = wb.create_sheet("RED Questions")
red_headers = ['Ref', 'Category', '#', 'Topic', 'Requirement', 'Bullet Response', 'Paragraph Response',
               'Confidence', 'Capability', 'Availability', 'Strategic', 'Rationale']
red_keys = ['ref', 'category', 'number', 'topic', 'requirement', 'bullet', 'paragraph',
            'confidence', 'capability', 'availability', 'strategic', 'rationale']

for i, h in enumerate(red_headers, 1):
    cell = ws3.cell(row=1, column=i, value=h)
    cell.font = HEADER_FONT
    cell.fill = PatternFill('solid', fgColor='C0392B')
    cell.alignment = Alignment(horizontal='center', wrap_text=True)
ws3.auto_filter.ref = f"A1:{get_column_letter(len(red_headers))}1"
ws3.freeze_panes = 'A2'

reds = [q for q in questions if q.get('confidence') == 'RED']
for r, q in enumerate(reds, 2):
    for c, key in enumerate(red_keys, 1):
        cell = ws3.cell(row=r, column=c, value=q.get(key, ''))
        cell.font = FONT
        cell.alignment = WRAP
        cell.border = THIN_BORDER
        cell.fill = PatternFill('solid', fgColor='FADBD8')

red_widths = [12, 20, 5, 25, 45, 50, 50, 11, 12, 14, 40, 40]
for i, w in enumerate(red_widths, 1):
    ws3.column_dimensions[get_column_letter(i)].width = w

# ============================================================
# SHEET 4: QA Changes Log
# ============================================================
ws4 = wb.create_sheet("QA Changes Log")
log_headers = ['#', 'Date', 'Question Ref', 'Field', 'Change Description', 'Type', 'Pass']
for i, h in enumerate(log_headers, 1):
    cell = ws4.cell(row=1, column=i, value=h)
    cell.font = HEADER_FONT
    cell.fill = PatternFill('solid', fgColor='2F5496')
    cell.alignment = Alignment(horizontal='center')
ws4.auto_filter.ref = f"A1:{get_column_letter(len(log_headers))}1"
ws4.freeze_panes = 'A2'

TYPE_COLORS = {
    'Hallucination Fix': RED_FILL,
    'Consistency Fix': YELLOW_FILL,
    'Name Fix': PatternFill('solid', fgColor='BDD7EE'),
    'Accuracy Fix': PatternFill('solid', fgColor='D5E8D4'),
    'Date Fix': PatternFill('solid', fgColor='FFF2CC'),
    'Formatting': PatternFill('solid', fgColor='E2EFDA'),
    'Cleanup': PatternFill('solid', fgColor='F2F2F2'),
}

changes = [
    # Pass 1 - Initial cleanup
    ("2026-03-22", "All (20 questions)", "multiple", "Removed all Coast Capital Savings references (fabricated client)", "Hallucination Fix", "Pass 1"),
    ("2026-03-22", "All", "multiple", "Removed all Continental Currency references (fabricated client)", "Hallucination Fix", "Pass 1"),
    ("2026-03-22", "Activation & Fulfillment 15", "paragraph", "Removed fabricated 73% first-transaction metric", "Hallucination Fix", "Pass 1"),
    ("2026-03-22", "Processing 26", "paragraph", "Removed fabricated 99.997% settlement accuracy metric", "Hallucination Fix", "Pass 1"),
    ("2026-03-22", "Multiple", "multiple", "Replaced East Coast references with Eastern time zone", "Accuracy Fix", "Pass 1"),
    ("2026-03-22", "Partner Relationships 8", "paragraph", "Fixed Wolfsberg FCCQ 45/45 → completed self-assessment", "Hallucination Fix", "Pass 1"),
    # Pass 2 - Today's QA
    ("2026-03-23", "Partner Relationships 1", "notes", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Partner Relationships 7", "bullet", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Partner Relationships 7", "paragraph", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Partner Relationships 13", "bullet", "Softened deconversion: 'in production' → 'developed with'", "Hallucination Fix", "Pass 2"),
    ("2026-03-23", "Partner Relationships 13", "paragraph", "Softened deconversion: 'in production' → 'developed with'", "Hallucination Fix", "Pass 2"),
    ("2026-03-23", "Partner Relationships 14", "strategic", "Softened Mastercard EXCLUSIVE → strategic", "Hallucination Fix", "Pass 2"),
    ("2026-03-23", "Technology 24", "bullet", "Standardized uptime SLA 99.95% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Technology 24", "paragraph", "Standardized uptime SLA 99.95% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Technology 24", "bullet", "Fixed trailing uptime 99.97% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Technology 24", "paragraph", "Fixed trailing uptime 99.97% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Activation & Fulfillment 15", "rationale", "Removed self-referential audit notes", "Cleanup", "Pass 2"),
    ("2026-03-23", "Compliance & Reporting 3", "strategic", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Processing 19", "bullet", "Fixed Verafin: 'runs in production' → 'planned'", "Hallucination Fix", "Pass 2"),
    ("2026-03-23", "Processing 19", "paragraph", "Fixed Verafin: 'runs in production' → 'planned'", "Hallucination Fix", "Pass 2"),
    ("2026-03-23", "Processing 22", "bullet", "Fixed trailing uptime 99.97% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Processing 26", "rationale", "Removed self-referential audit notes", "Cleanup", "Pass 2"),
    ("2026-03-23", "Processing 32", "bullet", "Fixed trailing uptime 99.97% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Processing 42", "bullet", "Fixed trailing uptime 99.97% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Accounting & Finance 3", "strategic", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Accounting & Finance 4", "strategic", "Renamed Aite-Novarica → Datos", "Name Fix", "Pass 2"),
    ("2026-03-23", "Accounting & Finance 15", "availability", "Updated past date Est. Q1 2026 → Est. Q2 2026", "Date Fix", "Pass 2"),
    ("2026-03-23", "Product Operations 21", "paragraph", "Standardized uptime SLA 99.95% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "Product Operations 33", "paragraph", "Standardized uptime SLA 99.95% → 99.99%", "Consistency Fix", "Pass 2"),
    ("2026-03-23", "BULK (68 questions)", "bullet/paragraph", "Added terminal punctuation to 68 responses", "Formatting", "Pass 2"),
]

for r, (date, ref, field, desc, typ, pass_num) in enumerate(changes, 2):
    ws4.cell(row=r, column=1, value=r-1).font = FONT
    ws4.cell(row=r, column=2, value=date).font = FONT
    ws4.cell(row=r, column=3, value=ref).font = FONT
    ws4.cell(row=r, column=4, value=field).font = FONT
    ws4.cell(row=r, column=5, value=desc).font = FONT
    c6 = ws4.cell(row=r, column=6, value=typ); c6.font = FONT
    if typ in TYPE_COLORS:
        c6.fill = TYPE_COLORS[typ]
    ws4.cell(row=r, column=7, value=pass_num).font = FONT
    for c in range(1, 8):
        ws4.cell(row=r, column=c).border = THIN_BORDER
        ws4.cell(row=r, column=c).alignment = WRAP

ws4.column_dimensions['A'].width = 5
ws4.column_dimensions['B'].width = 12
ws4.column_dimensions['C'].width = 30
ws4.column_dimensions['D'].width = 15
ws4.column_dimensions['E'].width = 55
ws4.column_dimensions['F'].width = 18
ws4.column_dimensions['G'].width = 8

# ============================================================
# SHEET 5: AI Detection — with Why and How to Improve
# ============================================================
ws5 = wb.create_sheet("AI Detection")
ai_headers = ['Ref', 'Category', '#', 'AI Score', 'Status', 'AI Words Found',
              'Why Flagged', 'How to Improve', 'Word Count', 'Confidence', 'Sample Text (first 200 chars)']
for i, h in enumerate(ai_headers, 1):
    cell = ws5.cell(row=1, column=i, value=h)
    cell.font = HEADER_FONT
    cell.fill = PatternFill('solid', fgColor='7B1FA2')
    cell.alignment = Alignment(horizontal='center', wrap_text=True)
ws5.auto_filter.ref = f"A1:{get_column_letter(len(ai_headers))}1"
ws5.freeze_panes = 'A2'

flagged = 0
low_risk = 0
clean = 0

for r, q in enumerate(questions, 2):
    bullet = q.get('bullet', '') or ''
    para = q.get('paragraph', '') or ''
    combined = bullet + ' ' + para
    ai_score, ai_words, reasons, fixes = detect_ai_score(combined)
    wc = len(para.split()) if para else len(bullet.split()) if bullet else 0
    sample = (para[:200] if para else bullet[:200]) if (para or bullet) else ''

    if ai_score == 0:
        status = 'CLEAN'
        why = 'No AI-typical language detected'
        how = 'No action needed'
        clean += 1
    elif ai_score <= 2:
        status = 'LOW RISK'
        why = '\n'.join(reasons)
        how = '\n'.join(fixes)
        low_risk += 1
    else:
        status = 'FLAG — REWRITE'
        why = '\n'.join(reasons)
        how = '\n'.join(fixes)
        flagged += 1

    ws5.cell(row=r, column=1, value=q.get('ref', '')).font = FONT
    ws5.cell(row=r, column=2, value=q.get('category', '')).font = FONT
    ws5.cell(row=r, column=3, value=q.get('number', '')).font = FONT

    sc = ws5.cell(row=r, column=4, value=ai_score); sc.font = FONT
    if ai_score >= 3: sc.fill = RED_FILL
    elif ai_score >= 1: sc.fill = YELLOW_FILL
    else: sc.fill = GREEN_FILL

    st = ws5.cell(row=r, column=5, value=status); st.font = FONT
    if status == 'CLEAN': st.fill = GREEN_FILL
    elif status == 'LOW RISK': st.fill = YELLOW_FILL
    else: st.fill = RED_FILL

    ws5.cell(row=r, column=6, value=', '.join(ai_words) if ai_words else 'None').font = FONT
    ws5.cell(row=r, column=7, value=why).font = FONT
    ws5.cell(row=r, column=8, value=how).font = FONT
    ws5.cell(row=r, column=9, value=wc).font = FONT
    ws5.cell(row=r, column=10, value=q.get('confidence', '')).font = FONT
    ws5.cell(row=r, column=11, value=sample).font = Font(name='Arial', size=9, color='666666')

    for c in range(1, 12):
        ws5.cell(row=r, column=c).border = THIN_BORDER
        ws5.cell(row=r, column=c).alignment = WRAP

for w, col in [(12,1),(20,2),(5,3),(10,4),(15,5),(30,6),(45,7),(45,8),(10,9),(11,10),(40,11)]:
    ws5.column_dimensions[get_column_letter(col)].width = w

wb.save(OUTPUT)
print(f"Saved {OUTPUT}")
print(f"  Sheet 1: Full RFP - color-coded ({len(questions)} rows)")
print(f"  Sheet 2: Summary by Category ({len(cats)} categories)")
print(f"  Sheet 3: RED Questions ({len(reds)} rows)")
print(f"  Sheet 4: QA Changes Log ({len(changes)} entries)")
print(f"  Sheet 5: AI Detection ({len(questions)} rows)")
print(f"\nAI Detection Summary:")
print(f"  CLEAN: {clean}")
print(f"  LOW RISK: {low_risk}")
print(f"  FLAGGED: {flagged}")
