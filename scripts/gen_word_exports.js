/**
 * Generates both Word exports directly — bypasses the HTTP server.
 * Run: node scripts/gen_word_exports.js
 */
'use strict';

const { readFileSync, writeFileSync } = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType, PageBreak,
  Header, Footer, BorderStyle, PageNumber,
} = require('docx');

const data = JSON.parse(readFileSync(require('path').join(__dirname, '../public/rfp_data.json'), 'utf8'));
const now  = new Date();
const TS   = now.toISOString().slice(0,10) + '_' + now.toTimeString().slice(0,5).replace(':','');

// ── Shared colors ────────────────────────────────────────────────────────────
const C = {
  navy:'1E3A5F', navyBg:'EBF2FA', green:'047857', greenBg:'ECFDF5',
  yellow:'B45309', yellowBg:'FFFBEB', yellowFeedbackBg:'FFFDE7',
  red:'B91C1C', redBg:'FEF2F2', gray:'6B7280', grayBg:'F3F4F6',
  grayLight:'E5E7EB', grayMid:'D1D5DB', dark:'111827', medium:'374151',
};

function ep(before=0, after=0) { return new Paragraph({ spacing:{before,after} }); }

function confColor(c) {
  if (c==='GREEN')  return {text:'GREEN',  color:C.green};
  if (c==='YELLOW') return {text:'YELLOW', color:C.yellow};
  if (c==='RED')    return {text:'RED',    color:C.red};
  return {text:c, color:C.gray};
}
function compColor(v) {
  if (v==='Y') return {text:'Compliant',     color:C.green};
  if (v==='N') return {text:'Non-Compliant', color:C.red};
  return {text:'Partial', color:C.yellow};
}

// ── GROUP ────────────────────────────────────────────────────────────────────
const grouped = {};
for (const q of data.questions) {
  if (!grouped[q.category]) grouped[q.category] = [];
  grouped[q.category].push(q);
}

// ════════════════════════════════════════════════════════════════════════════
// WORD REVIEW — paragraph + feedback boxes
// ════════════════════════════════════════════════════════════════════════════
function buildReview() {
  const sections = [];

  // Cover
  sections.push(
    new Paragraph({ spacing:{before:1200,after:200}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'BSB Credit Card Program RFP',bold:true,size:52,font:'Calibri',color:C.navy})] }),
    new Paragraph({ spacing:{before:0,after:200}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'Working Copy — Paragraph Responses with Review Notes',size:28,font:'Calibri',color:C.gray})] }),
    new Paragraph({ spacing:{before:600,after:100}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'Prepared by BRIM Financial',bold:true,size:24,font:'Calibri',color:C.medium})] }),
    new Paragraph({ spacing:{before:0,after:100}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),size:22,font:'Calibri',color:C.gray})] }),
    new Paragraph({ spacing:{before:0,after:100}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:`${data.questions.length} Requirements · ${data.categories.length} Categories`,size:20,font:'Calibri',color:C.gray})] }),
    new Paragraph({ spacing:{before:600,after:0}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'For Internal Review Only — Confidential',size:18,font:'Calibri',color:C.red,italics:true})] }),
    new Paragraph({children:[new PageBreak()]}),
  );

  // ToC
  sections.push(new Paragraph({heading:HeadingLevel.HEADING_1, spacing:{before:200,after:160},
    children:[new TextRun({text:'Table of Contents',bold:true,size:28,font:'Calibri',color:C.navy})]}));
  for (let i=0;i<data.categories.length;i++) {
    const cat=data.categories[i]; const count=(grouped[cat]||[]).length;
    sections.push(new Paragraph({spacing:{before:60,after:60},children:[
      new TextRun({text:`${i+1}.  `,bold:true,size:20,font:'Calibri',color:C.navy}),
      new TextRun({text:cat,size:20,font:'Calibri',color:C.dark}),
      new TextRun({text:`  (${count} questions)`,size:18,font:'Calibri',color:C.gray}),
    ]}));
  }
  sections.push(new Paragraph({children:[new PageBreak()]}));

  // Category Scorecard
  sections.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:200,after:160},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.grayLight}},children:[new TextRun({text:'Category Scorecard',bold:true,size:28,font:'Calibri',color:C.navy})]}));
  const scorecardRows=[new TableRow({tableHeader:true,children:[
    new TableCell({width:{size:38,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Category',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:10,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Qs',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Avg Score',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.green},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'GREEN',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.yellow},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'YELLOW',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'RED',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
  ]})];
  data.categories.forEach((cat,i)=>{
    const cqs=grouped[cat]||[]; const avg=cqs.length?cqs.reduce((s,q)=>s+(q.committee_score||0),0)/cqs.length:0;
    const g=cqs.filter(q=>q.confidence==='GREEN').length, y=cqs.filter(q=>q.confidence==='YELLOW').length, r=cqs.filter(q=>q.confidence==='RED').length;
    const bg=i%2===0?'FFFFFF':C.grayBg; const sc=avg>=7?C.green:avg>=5?C.yellow:C.red;
    scorecardRows.push(new TableRow({children:[
      new TableCell({width:{size:38,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:`${i+1}. ${cat}`,size:18,font:'Calibri',color:C.dark})]})]}),
      new TableCell({width:{size:10,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${cqs.length}`,size:18,font:'Calibri',color:C.gray})]})]}),
      new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:avg.toFixed(1),bold:true,size:18,font:'Calibri',color:sc})]})]}),
      new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${g}`,bold:g>0,size:18,font:'Calibri',color:g>0?C.green:C.gray})]})]}),
      new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${y}`,bold:y>0,size:18,font:'Calibri',color:y>0?C.yellow:C.gray})]})]}),
      new TableCell({width:{size:13,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${r}`,bold:r>0,size:18,font:'Calibri',color:r>0?C.red:C.gray})]})]}),
    ]}));
  });
  sections.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:scorecardRows}));
  sections.push(new Paragraph({children:[new PageBreak()]}));

  // Action Required
  const actionQs=data.questions.filter(q=>q.confidence==='RED'||q.compliant==='N'||(q.committee_score>0&&q.committee_score<5));
  sections.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:200,after:80},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.red}},children:[new TextRun({text:`Action Required  (${actionQs.length} questions)`,bold:true,size:28,font:'Calibri',color:C.red})]}));
  sections.push(new Paragraph({spacing:{before:0,after:160},children:[new TextRun({text:'Questions with RED confidence, Non-Compliant status, or committee score below 5/10.',size:18,font:'Calibri',color:C.gray,italics:true})]}));
  if(actionQs.length){
    const arRows=[new TableRow({tableHeader:true,children:[
      new TableCell({width:{size:12,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Ref',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
      new TableCell({width:{size:32,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Topic',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
      new TableCell({width:{size:16,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Confidence',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
      new TableCell({width:{size:16,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Compliant',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
      new TableCell({width:{size:10,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Score',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
      new TableCell({width:{size:14,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.red},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:'Category',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    ]})];
    actionQs.forEach((q,i)=>{
      const cf=confColor(q.confidence); const cp=compColor(q.compliant); const bg=i%2===0?'FFF5F5':'FFFFFF';
      arRows.push(new TableRow({children:[
        new TableCell({width:{size:12,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:q.ref,bold:true,size:17,font:'Courier New',color:C.navy})]})]}),
        new TableCell({width:{size:32,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:q.topic||'',size:17,font:'Calibri',color:C.dark})]})]}),
        new TableCell({width:{size:16,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:cf.text,bold:true,size:17,font:'Calibri',color:cf.color})]})]}),
        new TableCell({width:{size:16,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:cp.text,bold:true,size:17,font:'Calibri',color:cp.color})]})]}),
        new TableCell({width:{size:10,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${q.committee_score}/10`,bold:true,size:17,font:'Calibri',color:q.committee_score<5?C.red:C.yellow})]})]}),
        new TableCell({width:{size:14,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:q.category,size:15,font:'Calibri',color:C.gray})]})]}),
      ]}));
    });
    sections.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:arRows}));
  }
  sections.push(new Paragraph({children:[new PageBreak()]}));

  // Per-category
  for (let ci=0; ci<data.categories.length; ci++) {
    const cat=data.categories[ci]; const catQs=grouped[cat]||[];
    if (!catQs.length) continue;
    const avgScore = catQs.reduce((s,q)=>s+(q.committee_score||0),0)/catQs.length;
    const green=catQs.filter(q=>q.confidence==='GREEN').length;
    const yellow=catQs.filter(q=>q.confidence==='YELLOW').length;
    const red=catQs.filter(q=>q.confidence==='RED').length;

    sections.push(new Paragraph({
      heading:HeadingLevel.HEADING_1, pageBreakBefore:ci>0, spacing:{before:200,after:160},
      border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.grayLight}},
      children:[new TextRun({text:`${ci+1}. ${cat}`,bold:true,size:28,font:'Calibri',color:C.navy})],
    }));
    sections.push(new Paragraph({spacing:{before:0,after:200},children:[
      new TextRun({text:`${catQs.length} questions  ·  Avg ${avgScore.toFixed(1)}/10  ·  `,size:18,font:'Calibri',color:C.gray}),
      new TextRun({text:`${green} GREEN  `,size:18,font:'Calibri',color:C.green}),
      ...(yellow>0?[new TextRun({text:`${yellow} YELLOW  `,size:18,font:'Calibri',color:C.yellow})]:[]),
      ...(red>0?[new TextRun({text:`${red} RED`,size:18,font:'Calibri',color:C.red})]:[]),
    ]}));

    for (const q of catQs) {
      const conf=confColor(q.confidence); const comp=compColor(q.compliant); const score=q.committee_score??0;
      const response=(q.paragraph||q.bullet||'').trim();

      // Header line
      sections.push(new Paragraph({spacing:{before:240,after:60},children:[
        new TextRun({text:q.ref,bold:true,size:20,font:'Courier New',color:C.navy}),
        new TextRun({text:'  ·  ',size:20,font:'Calibri',color:C.gray}),
        new TextRun({text:q.topic||'',size:20,font:'Calibri',color:C.medium}),
        new TextRun({text:'  ·  ',size:20,font:'Calibri',color:C.gray}),
        new TextRun({text:comp.text,bold:true,size:20,font:'Calibri',color:comp.color}),
        new TextRun({text:'  ·  ',size:20,font:'Calibri',color:C.gray}),
        new TextRun({text:conf.text,bold:true,size:20,font:'Calibri',color:conf.color}),
        new TextRun({text:`  ·  ${score}/10`,size:20,font:'Calibri',color:score>=7?C.green:score>=5?C.yellow:C.red}),
      ]}));

      // Metadata tags line
      const delivery=[]; if(q.a_oob)delivery.push('OOB'); if(q.b_config)delivery.push('Config'); if(q.c_custom)delivery.push('Custom'); if(q.d_dnm)delivery.push('DNM');
      const metaRuns=[];
      if(delivery.length){metaRuns.push(new TextRun({text:'Delivery: ',size:18,font:'Calibri',color:C.gray})); metaRuns.push(new TextRun({text:delivery.join(' / '),bold:true,size:18,font:'Calibri',color:C.navy})); metaRuns.push(new TextRun({text:'   ',size:18,font:'Calibri',color:C.gray}));}
      if(q.strategic){metaRuns.push(new TextRun({text:'★ Strategic',bold:true,size:18,font:'Calibri',color:C.green})); metaRuns.push(new TextRun({text:'   ',size:18,font:'Calibri',color:C.gray}));}
      if(q.reg_enable){metaRuns.push(new TextRun({text:'⚑ Reg-Enabled',bold:true,size:18,font:'Calibri',color:C.yellow})); metaRuns.push(new TextRun({text:'   ',size:18,font:'Calibri',color:C.gray}));}
      if(q.status){metaRuns.push(new TextRun({text:'Status: ',size:18,font:'Calibri',color:C.gray})); metaRuns.push(new TextRun({text:(q.status||'').toUpperCase(),bold:true,size:18,font:'Calibri',color:C.medium}));}
      if(metaRuns.length) sections.push(new Paragraph({spacing:{before:0,after:80},children:metaRuns}));

      // Requirement box
      sections.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[new TableCell({
        shading:{type:ShadingType.SOLID,color:C.grayBg},
        margins:{top:100,bottom:100,left:160,right:160},
        borders:{top:{style:BorderStyle.SINGLE,size:4,color:C.grayLight},bottom:{style:BorderStyle.SINGLE,size:4,color:C.grayLight},left:{style:BorderStyle.THICK,size:12,color:C.gray},right:{style:BorderStyle.SINGLE,size:4,color:C.grayLight}},
        children:[
          new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:'BSB REQUIREMENT',bold:true,size:16,font:'Calibri',color:C.gray,allCaps:true})]}),
          new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:q.requirement||'—',size:20,font:'Calibri',color:C.medium})]}),
        ],
      })]})]}));

      sections.push(ep(80,0));

      // Response label + text
      sections.push(new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:'BRIM FINANCIAL RESPONSE',bold:true,size:16,font:'Calibri',color:C.navy,allCaps:true})]}));
      const lines=response?response.split('\n'):['No response provided.'];
      for (const line of lines) {
        sections.push(new Paragraph({spacing:{before:0,after:80},children:[new TextRun({text:line||'',size:22,font:'Calibri',color:line?C.dark:C.gray,italics:!line})]}));
      }

      // Committee assessment
      const assessRows=[];
      function mkAssessRow(label,text,color){return new TableRow({children:[new TableCell({width:{size:22,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navyBg},margins:{top:60,bottom:60,left:120,right:120},borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},children:[new Paragraph({children:[new TextRun({text:label,bold:true,size:17,font:'Calibri',color:color||C.navy})]})]}),new TableCell({width:{size:78,type:WidthType.PERCENTAGE},margins:{top:60,bottom:60,left:120,right:120},borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},children:[new Paragraph({children:[new TextRun({text,size:18,font:'Calibri',color:C.medium})]})]})]});}
      if(q.committee_review) assessRows.push(mkAssessRow('Committee Review',q.committee_review,C.navy));
      if(q.committee_risk) assessRows.push(mkAssessRow('Risk Assessment',q.committee_risk,C.red));
      if(q.rationale) assessRows.push(mkAssessRow('Rationale',q.rationale,C.navy));
      if(q.compliance_notes) assessRows.push(mkAssessRow('Compliance Notes',q.compliance_notes,C.yellow));
      if(assessRows.length){sections.push(ep(60,0)); sections.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:{style:BorderStyle.SINGLE,size:4,color:C.navyBg},bottom:{style:BorderStyle.SINGLE,size:4,color:C.navyBg},left:{style:BorderStyle.THICK,size:12,color:C.navy},right:{style:BorderStyle.NONE}},rows:assessRows}));}

      // Feedback box
      sections.push(ep(60,0));
      sections.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[new TableCell({
        shading:{type:ShadingType.SOLID,color:C.yellowFeedbackBg},
        margins:{top:100,bottom:200,left:160,right:160},
        borders:{top:{style:BorderStyle.DASHED,size:4,color:C.yellow},bottom:{style:BorderStyle.DASHED,size:4,color:C.yellow},left:{style:BorderStyle.THICK,size:12,color:C.yellow},right:{style:BorderStyle.DASHED,size:4,color:C.yellow}},
        children:[
          new Paragraph({spacing:{before:0,after:80},children:[new TextRun({text:'FEEDBACK / REVIEW NOTES',bold:true,size:16,font:'Calibri',color:C.yellow,allCaps:true})]}),
          new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:'Reviewed by: ________________________________   Date: ____________',size:17,font:'Calibri',color:C.yellow})]}),
          new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:'',size:20})]}),
          new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:'',size:20})]}),
          new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:'',size:20})]}),
          new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:'',size:20})]}),
          new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:'',size:20})]}),
          new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:'',size:20})]}),
        ],
      })]})]}));

      // Divider
      sections.push(new Paragraph({spacing:{before:200,after:0},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.grayLight}},children:[]}));
    }
  }

  return new Document({
    sections:[{
      properties:{page:{margin:{top:1080,bottom:1080,left:1080,right:1080}}},
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'BSB RFP — Working Copy · BRIM Financial',size:16,color:C.gray,font:'Calibri'})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Confidential — For Internal Review Only · BRIM Financial · Page ',size:16,color:C.gray,font:'Calibri'}),new TextRun({children:[PageNumber.CURRENT],size:16,color:C.gray,font:'Calibri'}),new TextRun({text:' of ',size:16,color:C.gray,font:'Calibri'}),new TextRun({children:[PageNumber.TOTAL_PAGES],size:16,color:C.gray,font:'Calibri'})]})]})},
      children:sections,
    }],
  });
}

// ════════════════════════════════════════════════════════════════════════════
// WORD SUBMISSION — clean BSB doc
// ════════════════════════════════════════════════════════════════════════════
function buildSubmission() {
  const blocks = [];
  const compliantY = data.questions.filter(q=>q.compliant==='Y').length;
  const green = data.questions.filter(q=>q.confidence==='GREEN').length;

  // Cover
  blocks.push(
    new Paragraph({spacing:{before:2400,after:200},alignment:AlignmentType.CENTER,children:[new TextRun({text:'BSB Credit Card Program',bold:true,size:64,font:'Calibri',color:C.navy})]}),
    new Paragraph({spacing:{before:0,after:200},alignment:AlignmentType.CENTER,children:[new TextRun({text:'Request for Proposal — Response',size:36,font:'Calibri',color:C.gray})]}),
    new Paragraph({spacing:{before:600,after:100},alignment:AlignmentType.CENTER,children:[new TextRun({text:'Prepared by BRIM Financial',bold:true,size:26,font:'Calibri',color:C.medium})]}),
    new Paragraph({spacing:{before:0,after:100},alignment:AlignmentType.CENTER,children:[new TextRun({text:now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),size:22,font:'Calibri',color:C.gray})]}),
    new Paragraph({spacing:{before:600,after:80},alignment:AlignmentType.CENTER,children:[new TextRun({text:`${data.questions.length} Requirements Addressed · ${data.categories.length} Categories`,size:20,font:'Calibri',color:C.gray})]}),
    new Paragraph({spacing:{before:0,after:80},alignment:AlignmentType.CENTER,children:[new TextRun({text:`${compliantY} Requirements Fully Compliant (${Math.round(compliantY/data.questions.length*100)}%)`,size:20,font:'Calibri',color:C.gray})]}),
    new Paragraph({spacing:{before:0,after:80},alignment:AlignmentType.CENTER,children:[new TextRun({text:`${green} Responses Rated Strong by BRIM Review Committee`,size:20,font:'Calibri',color:C.gray})]}),
    new Paragraph({spacing:{before:1200,after:0},alignment:AlignmentType.CENTER,children:[new TextRun({text:'Confidential',size:18,font:'Calibri',color:C.gray,italics:true})]}),
    new Paragraph({children:[new PageBreak()]}),
  );

  // Executive Summary
  blocks.push(
    new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:200,after:200},children:[new TextRun({text:'Executive Summary',bold:true,size:36,font:'Calibri',color:C.navy})]}),
    new Paragraph({spacing:{before:0,after:160},children:[new TextRun({text:`BRIM Financial's response to Bangor Savings Bank's Credit Card Program Request for Proposal addresses all ${data.questions.length} requirements across ${data.categories.length} functional areas.`,size:22,font:'Calibri',color:C.dark})]}),
    new Paragraph({spacing:{before:0,after:160},children:[new TextRun({text:`Of the ${data.questions.length} requirements, ${compliantY} (${Math.round(compliantY/data.questions.length*100)}%) are fully compliant with BSB's specifications. BRIM Financial's purpose-built credit card platform, one-to-many agent banking architecture, and deep US regulatory experience position us as the right program management partner for BSB's credit card program.`,size:22,font:'Calibri',color:C.dark})]}),
    new Paragraph({spacing:{before:0,after:160},children:[new TextRun({text:"All responses represent current capabilities deployed in production across BRIM Financial's live programs, including CONTINENTAL BANK (US), MANULIFE BANK, and AFFINITY CREDIT UNION.",size:22,font:'Calibri',color:C.dark})]}),
    new Paragraph({children:[new PageBreak()]}),
  );

  // ToC
  blocks.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:200,after:200},children:[new TextRun({text:'Table of Contents',bold:true,size:36,font:'Calibri',color:C.navy})]}));
  for (let i=0;i<data.categories.length;i++) {
    const cat=data.categories[i]; const count=(grouped[cat]||[]).length;
    blocks.push(new Paragraph({spacing:{before:80,after:80},children:[
      new TextRun({text:`${i+1}.  `,bold:true,size:22,font:'Calibri',color:C.navy}),
      new TextRun({text:cat,size:22,font:'Calibri',color:C.dark}),
      new TextRun({text:`  ·  ${count} requirements`,size:18,font:'Calibri',color:C.gray}),
    ]}));
  }
  blocks.push(new Paragraph({children:[new PageBreak()]}));

  // Compliance Summary
  blocks.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:200,after:80},border:{bottom:{style:BorderStyle.THICK,size:8,color:C.navy}},shading:{type:ShadingType.SOLID,color:C.navyBg},children:[new TextRun({text:'Compliance Summary',bold:true,size:32,font:'Calibri',color:C.navy})]}));
  blocks.push(new Paragraph({spacing:{before:0,after:160},children:[new TextRun({text:`Compliance status for all ${data.questions.length} requirements across ${data.categories.length} functional areas.`,size:20,font:'Calibri',color:C.gray,italics:true})]}));
  const compRows=[new TableRow({tableHeader:true,children:[
    new TableCell({width:{size:12,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Ref',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:42,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Requirement Topic',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:22,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:'Category',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
    new TableCell({width:{size:24,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:C.navy},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Compliance Status',bold:true,size:18,font:'Calibri',color:'FFFFFF'})]})]  }),
  ]})];
  data.questions.forEach((q,i)=>{
    const isY=q.compliant==='Y'; const isN=q.compliant==='N';
    const bg=i%2===0?'FFFFFF':C.grayBg;
    const sc=isY?C.green:isN?C.red:'2E5F9F'; const st=isY?'Compliant':isN?'Non-Compliant':'Partial';
    compRows.push(new TableRow({children:[
      new TableCell({width:{size:12,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:50,bottom:50,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:q.ref,size:16,font:'Courier New',color:C.navy})]})]}),
      new TableCell({width:{size:42,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:50,bottom:50,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:q.topic||'',size:16,font:'Calibri',color:C.dark})]})]}),
      new TableCell({width:{size:22,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:50,bottom:50,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:q.category,size:15,font:'Calibri',color:C.gray})]})]}),
      new TableCell({width:{size:24,type:WidthType.PERCENTAGE},shading:{type:ShadingType.SOLID,color:bg},margins:{top:50,bottom:50,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:st,bold:true,size:16,font:'Calibri',color:sc})]})]}),
    ]}));
  });
  blocks.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:compRows}));
  blocks.push(new Paragraph({children:[new PageBreak()]}));

  // Per-category
  for (let ci=0; ci<data.categories.length; ci++) {
    const cat=data.categories[ci]; const catQs=grouped[cat]||[];
    if (!catQs.length) continue;

    blocks.push(new Paragraph({
      heading:HeadingLevel.HEADING_1, pageBreakBefore:ci>0, spacing:{before:240,after:200},
      border:{bottom:{style:BorderStyle.THICK,size:8,color:C.navy}},
      shading:{type:ShadingType.SOLID,color:C.navyBg},
      children:[new TextRun({text:`${ci+1}. ${cat}`,bold:true,size:32,font:'Calibri',color:C.navy})],
    }));

    for (const q of catQs) {
      const response=(q.paragraph||q.bullet||'').trim();

      blocks.push(new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:320,after:80},children:[new TextRun({text:`${q.number||''}. ${q.topic||''}`,bold:true,size:24,font:'Calibri',color:C.navy})]}));
      blocks.push(new Paragraph({spacing:{before:0,after:80},children:[new TextRun({text:'Reference: ',bold:true,size:17,font:'Calibri',color:C.gray}),new TextRun({text:q.ref,size:17,font:'Courier New',color:C.gray})]}));

      // Requirement box
      blocks.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[new TableCell({
        shading:{type:ShadingType.SOLID,color:C.grayBg},
        margins:{top:100,bottom:100,left:160,right:160},
        borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.THICK,size:16,color:C.navy},right:{style:BorderStyle.NONE}},
        children:[
          new Paragraph({spacing:{before:0,after:60},children:[new TextRun({text:'BSB Requirement',bold:true,size:17,font:'Calibri',color:C.gray})]}),
          new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:q.requirement||'—',size:20,font:'Calibri',color:C.medium,italics:true})]}),
        ],
      })]})]}));
      blocks.push(ep(120,0));

      blocks.push(new Paragraph({spacing:{before:0,after:80},children:[new TextRun({text:'BRIM Financial Response',bold:true,size:20,font:'Calibri',color:C.navy})]}));
      const lines=response?response.split('\n').filter(l=>l.trim()):['No response provided.'];
      for (const line of lines) {
        blocks.push(new Paragraph({spacing:{before:0,after:120},children:[new TextRun({text:line.trim(),size:22,font:'Calibri',color:C.dark})]}));
      }
      blocks.push(new Paragraph({spacing:{before:200,after:0},border:{bottom:{style:BorderStyle.SINGLE,size:2,color:C.grayLight}},children:[]}));
    }
  }

  // Closing
  blocks.push(
    new Paragraph({children:[new PageBreak()]}),
    new Paragraph({spacing:{before:1200,after:200},alignment:AlignmentType.CENTER,border:{top:{style:BorderStyle.SINGLE,size:4,color:C.grayLight}},children:[new TextRun({text:'This document is confidential and prepared solely for Bangor Savings Bank.',size:18,font:'Calibri',color:C.gray,italics:true})]}),
    new Paragraph({spacing:{before:0,after:0},alignment:AlignmentType.CENTER,children:[new TextRun({text:`BRIM Financial · ${now.getFullYear()}`,size:18,font:'Calibri',color:C.gray})]}),
  );

  return new Document({
    sections:[{
      properties:{page:{margin:{top:1080,bottom:1080,left:1260,right:1260}}},
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.grayLight}},children:[new TextRun({text:'BSB Credit Card Program RFP Response · BRIM Financial · Confidential',size:16,color:C.gray,font:'Calibri'})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,border:{top:{style:BorderStyle.SINGLE,size:4,color:C.grayLight}},children:[new TextRun({text:`BRIM Financial · BSB RFP Response · ${now.getFullYear()} · Confidential · Page `,size:16,color:C.gray,font:'Calibri'}),new TextRun({children:[PageNumber.CURRENT],size:16,color:C.gray,font:'Calibri'}),new TextRun({text:' of ',size:16,color:C.gray,font:'Calibri'}),new TextRun({children:[PageNumber.TOTAL_PAGES],size:16,color:C.gray,font:'Calibri'})]})]})},
      children:blocks,
    }],
  });
}

// ── Generate & save ──────────────────────────────────────────────────────────
async function main() {
  const reviewDoc = buildReview();
  const reviewBuf = await Packer.toBuffer(reviewDoc);
  const reviewPath = require('path').join(require('os').homedir(), `Desktop/BSB_RFP_WorkingCopy_BRIM_FINAL_${TS.slice(0,10)}.docx`);
  writeFileSync(reviewPath, reviewBuf);
  console.log(`Review: ${reviewPath} (${Math.round(reviewBuf.byteLength/1024)}KB)`);

  const subDoc = buildSubmission();
  const subBuf = await Packer.toBuffer(subDoc);
  const subPath = require('path').join(require('os').homedir(), `Desktop/BSB_RFP_Submission_BRIM_FINAL_${TS.slice(0,10)}.docx`);
  writeFileSync(subPath, subBuf);
  console.log(`Submission: ${subPath} (${Math.round(subBuf.byteLength/1024)}KB)`);
}
main().catch(err => { console.error(err); process.exit(1); });
