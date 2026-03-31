/**
 * ClinicalPDFExport.tsx — RadCalcPro PDF & WhatsApp Share Engine
 * Place this file at: src/components/ClinicalPDFExport.tsx
 *
 * Uses pure jsPDF (already in package.json as "jspdf": "^2.5.1")
 * No html2canvas, no DOM capture, no react-to-print needed.
 *
 * Exports:
 *   ExportButton   — drop-in JSX button (PDF + WhatsApp)
 *   ClinicalReport — TypeScript interface for report data
 */

import React, { useState, useCallback } from 'react';
import { FileDown, MessageCircle, Share2, Loader2, Check } from 'lucide-react';

export interface PDFParameter { label: string; value: string | number; unit?: string; }
export interface PDFResult { label: string; value: string | number; unit?: string; highlight?: boolean; warn?: boolean; danger?: boolean; }
export interface PDFRepopulation { k: number; tk: number; note?: string; effectiveRepopDays?: number; eqd2Loss?: number; }
export interface PDFCompensation { label: string; value: string; preferred?: boolean; }
export interface ClinicalReport {
  title: string; toolName: string; subtitle?: string; patientRef?: string;
  parameters: PDFParameter[]; results: PDFResult[]; interpretation: string;
  repopulation?: PDFRepopulation; compensation?: PDFCompensation[];
  references?: string[]; urgencyLabel?: string;
}

const C = {
  navy:[30,58,95] as [number,number,number], gold:[212,175,55] as [number,number,number],
  white:[255,255,255] as [number,number,number], offWhite:[248,250,252] as [number,number,number],
  slate100:[241,245,249] as [number,number,number], slate200:[226,232,240] as [number,number,number],
  slate400:[148,163,184] as [number,number,number], slate600:[71,85,105] as [number,number,number],
  slate700:[51,65,85] as [number,number,number], slate900:[15,23,42] as [number,number,number],
  amber100:[254,243,199] as [number,number,number], amber700:[180,83,9] as [number,number,number],
  red100:[254,226,226] as [number,number,number], red700:[185,28,28] as [number,number,number],
  green100:[220,252,231] as [number,number,number], green700:[21,128,61] as [number,number,number],
  teal500:[45,212,191] as [number,number,number],
};
const PAGE_W=210, PAGE_H=297, MARGIN=16, COL_W=210-16*2;
const HEADER_H=30, CONTENT_TOP=MARGIN+HEADER_H+6, CONTENT_BOTTOM=PAGE_H-MARGIN-18;

let _jsPDF: any = null;
async function getJsPDF() {
  if (_jsPDF) return _jsPDF;
  const mod = await import('jspdf');
  _jsPDF = mod.jsPDF || mod.default;
  return _jsPDF;
}

function drawHeader(doc:any, report:ClinicalReport, isFirst:boolean) {
  doc.setFillColor(...C.navy); doc.rect(0,0,PAGE_W,MARGIN+HEADER_H,'F');
  doc.setFillColor(...C.gold); doc.rect(0,MARGIN+HEADER_H,PAGE_W,0.8,'F');
  if (isFirst) {
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...C.white); doc.text('RadCalcPro',MARGIN,19);
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.teal500); doc.text('CLINICAL PHYSICS DECISION SUPPORT  ·  v2.1.0',MARGIN,24.5);
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...C.gold); doc.text(report.title,PAGE_W-MARGIN,18,{align:'right'});
    if (report.subtitle) { doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...C.slate400); doc.text(report.subtitle,PAGE_W-MARGIN,23.5,{align:'right'}); }
    const dateStr=new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...C.slate400); doc.text(`Generated: ${dateStr}`,PAGE_W-MARGIN,29,{align:'right'});
    if (report.patientRef) doc.text(`Patient Ref: ${report.patientRef}`,MARGIN,29);
  } else {
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...C.white); doc.text('RadCalcPro',MARGIN,14);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...C.gold); doc.text(report.title,PAGE_W-MARGIN,14,{align:'right'});
  }
}
function drawFooter(doc:any, report:ClinicalReport, pageNum:number) {
  const fy=PAGE_H-MARGIN-10;
  doc.setFillColor(...C.slate100); doc.rect(0,PAGE_H-MARGIN-12,PAGE_W,14,'F');
  doc.setDrawColor(...C.slate200); doc.setLineWidth(0.3); doc.line(MARGIN,fy-2,PAGE_W-MARGIN,fy-2);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...C.slate400);
  doc.text('RadCalcPro · Not for direct clinical use without verification',MARGIN,fy+3.5);
  doc.text(`Page ${pageNum}`,PAGE_W-MARGIN,fy+3.5,{align:'right'});
}
function drawWatermark(doc:any) {
  doc.saveGraphicsState(); doc.setGState(doc.GState({opacity:0.04}));
  doc.setFont('helvetica','bold'); doc.setFontSize(52); doc.setTextColor(...C.navy);
  doc.text('DRAFT — VERIFY',PAGE_W/2,PAGE_H/2+10,{align:'center',angle:45}); doc.restoreGraphicsState();
}
function drawSectionHeader(doc:any, title:string, y:number) {
  doc.setFillColor(...C.navy); doc.rect(MARGIN,y,2,7,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...C.navy); doc.text(title.toUpperCase(),MARGIN+5,y+5);
  doc.setDrawColor(...C.slate200); doc.setLineWidth(0.3); doc.line(MARGIN+5,y+7,MARGIN+COL_W,y+7);
}

async function generatePDF(report:ClinicalReport): Promise<Uint8Array> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  let y=CONTENT_TOP, pageNum=1;
  const newPage=()=>{ drawFooter(doc,report,pageNum); doc.addPage(); pageNum++; drawHeader(doc,report,false); drawWatermark(doc); y=CONTENT_TOP; };
  const checkY=(n:number)=>{ if(y+n>CONTENT_BOTTOM) newPage(); };
  drawHeader(doc,report,true); drawWatermark(doc);

  if (report.urgencyLabel && report.urgencyLabel!=='None' && report.urgencyLabel!=='No Effect') {
    const isCrit=report.urgencyLabel==='CRITICAL', isHigh=report.urgencyLabel==='High';
    const urgBg=isCrit?C.red100:isHigh?[255,237,213] as [number,number,number]:C.amber100;
    const urgFg=isCrit?C.red700:isHigh?[234,88,12] as [number,number,number]:C.amber700;
    checkY(12); doc.setFillColor(...urgBg); doc.roundedRect(MARGIN,y,COL_W,10,2,2,'F');
    doc.setDrawColor(...urgFg); doc.setLineWidth(0.6); doc.roundedRect(MARGIN,y,COL_W,10,2,2,'S');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...urgFg);
    doc.text(`⚠  ${report.urgencyLabel.toUpperCase()} CLINICAL IMPACT — Verify compensation before continuing treatment`,MARGIN+4,y+6.2); y+=14;
  }

  if (report.parameters.length>0) {
    checkY(10); drawSectionHeader(doc,'Input Parameters',y); y+=8;
    report.parameters.forEach((row,i)=>{
      checkY(8);
      if(i%2===0){doc.setFillColor(...C.slate100);doc.rect(MARGIN,y,COL_W,7,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...C.slate600);doc.text(row.label,MARGIN+3,y+4.8);
      doc.setFont('helvetica','bold');doc.setTextColor(...C.slate900);
      doc.text(`${row.value}${row.unit?' '+row.unit:''}`,MARGIN+COL_W-3,y+4.8,{align:'right'}); y+=7;
    }); y+=5;
  }

  if (report.results.length>0) {
    checkY(12); drawSectionHeader(doc,'Calculated Results',y); y+=8;
    const highlights=report.results.filter(r=>r.highlight||r.warn||r.danger);
    const normals=report.results.filter(r=>!r.highlight&&!r.warn&&!r.danger);
    if(highlights.length>0){
      const boxW=highlights.length===1?COL_W:(COL_W-4)/Math.min(highlights.length,3), boxH=22;
      checkY(boxH+4);
      highlights.forEach((res,i)=>{
        const col=i%3; const bx=MARGIN+col*(boxW+2);
        if(col===0&&i>0){y+=boxH+4;checkY(boxH+4);}
        const bg=res.danger?C.red100:res.warn?C.amber100:C.navy;
        const fg=res.danger?C.red700:res.warn?C.amber700:C.white;
        const sub=res.danger?C.red700:res.warn?C.amber700:C.teal500;
        doc.setFillColor(...bg);doc.roundedRect(bx,y,boxW,boxH,3,3,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...(res.highlight?C.teal500:fg));doc.text(res.label.toUpperCase(),bx+4,y+6);
        doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(...fg);doc.text(String(res.value),bx+4,y+15.5);
        if(res.unit){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...sub);doc.text(res.unit,bx+4,y+20.5);}
      }); y+=boxH+8;
    }
    normals.forEach((row,i)=>{
      checkY(7);
      if(i%2===0){doc.setFillColor(...C.offWhite);doc.rect(MARGIN,y,COL_W,6.5,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...C.slate600);doc.text(row.label,MARGIN+3,y+4.4);
      doc.setFont('helvetica','bold');doc.setTextColor(...C.slate900);
      doc.text(`${row.value}${row.unit?' '+row.unit:''}`,MARGIN+COL_W-3,y+4.4,{align:'right'}); y+=6.5;
    }); if(normals.length>0) y+=5;
  }

  if (report.repopulation) {
    const rep=report.repopulation; checkY(30); drawSectionHeader(doc,'Repopulation Parameters',y); y+=8;
    const statW=(COL_W-4)/3;
    [{label:'k (Gy/day)',value:rep.k.toFixed(2),sub:'EQD2 loss/day'},{label:'Tk (kick-off)',value:`${rep.tk}d`,sub:'Days from start'},{label:'EQD2 Loss',value:rep.eqd2Loss!==undefined?rep.eqd2Loss.toFixed(2):'—',sub:'Gy lost to gap'}]
    .forEach((s,i)=>{ const bx=MARGIN+i*(statW+2); checkY(20);
      doc.setFillColor(...C.slate100);doc.roundedRect(bx,y,statW,18,2,2,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(...C.slate400);doc.text(s.label.toUpperCase(),bx+3,y+5);
      doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...C.navy);doc.text(s.value,bx+3,y+13);
      doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(...C.slate400);doc.text(s.sub,bx+3,y+17);
    }); y+=22;
    if(rep.note){checkY(12);doc.setFillColor(...C.amber100);doc.roundedRect(MARGIN,y,COL_W,10,2,2,'F');
      doc.setFont('helvetica','italic');doc.setFontSize(8);doc.setTextColor(...C.amber700);
      const lines=doc.splitTextToSize(`⚕  ${rep.note}`,COL_W-8);doc.text(lines[0],MARGIN+4,y+6.5);y+=14;}
  }

  if (report.compensation?.length) {
    checkY(12); drawSectionHeader(doc,'Compensation Strategies',y); y+=8;
    report.compensation.forEach(strat=>{
      checkY(10); const ip=strat.preferred;
      doc.setFillColor(...(ip?C.navy:C.slate100));doc.roundedRect(MARGIN,y,COL_W,8,1.5,1.5,'F');
      if(ip){doc.setDrawColor(...C.gold);doc.setLineWidth(0.4);doc.roundedRect(MARGIN,y,COL_W,8,1.5,1.5,'S');}
      doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...(ip?C.gold:C.slate700));
      doc.text(strat.label+(ip?' ★ Recommended':''),MARGIN+3,y+5.2);
      doc.setFont('helvetica','normal');doc.setTextColor(...(ip?C.white:C.slate600));
      doc.text(strat.value,MARGIN+COL_W-3,y+5.2,{align:'right'}); y+=10;
    }); y+=4;
  }

  if (report.interpretation) {
    checkY(14); drawSectionHeader(doc,'Clinical Interpretation',y); y+=8;
    const lines=doc.splitTextToSize(report.interpretation,COL_W-10);
    const h=lines.length*5.5+8; checkY(h);
    doc.setFillColor(...C.offWhite);doc.rect(MARGIN,y,COL_W,h,'F');
    doc.setFillColor(...C.navy);doc.rect(MARGIN,y,2.5,h,'F');
    doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(...C.slate700);
    lines.forEach((line:string,i:number)=>doc.text(line,MARGIN+6,y+6+i*5.5)); y+=h+6;
  }

  if (report.references?.length) {
    checkY(10); drawSectionHeader(doc,'References',y); y+=8;
    report.references.forEach((ref,i)=>{
      checkY(6); doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...C.slate400);
      const rl=doc.splitTextToSize(`[${i+1}] ${ref}`,COL_W-4);
      rl.forEach((l:string)=>{doc.text(l,MARGIN+2,y);y+=5;});
    }); y+=3;
  }

  checkY(32); y+=4;
  doc.setDrawColor(...C.slate200);doc.setLineWidth(0.3);doc.line(MARGIN,y,MARGIN+COL_W,y);y+=6;
  doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(...C.red700);doc.text('CLINICAL SAFETY DISCLAIMER',MARGIN,y);y+=5;
  const disc='This report is generated by RadCalcPro, a decision-support tool for qualified radiation oncology professionals only. All calculations must be independently verified by a second qualified physicist or oncologist before clinical implementation. This document is NOT a prescription.';
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...C.slate400);
  doc.splitTextToSize(disc,COL_W).forEach((dl:string)=>{doc.text(dl,MARGIN,y);y+=4.2;});
  y+=6;
  doc.setDrawColor(...C.slate400);doc.setLineWidth(0.4);
  doc.line(MARGIN,y,MARGIN+COL_W/2-5,y);doc.line(MARGIN+COL_W/2+10,y,MARGIN+COL_W,y);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...C.slate400);
  doc.text('Radiation Physicist',MARGIN,y+3.5);doc.text('Radiation Oncologist',MARGIN+COL_W/2+10,y+3.5);
  const crc=Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substring(2,6).toUpperCase();
  doc.setFont('courier','normal');doc.setFontSize(6.5);doc.setTextColor(...C.slate200);
  doc.text(`CRC: ${crc}`,MARGIN+COL_W-3,y+3.5,{align:'right'});
  drawFooter(doc,report,pageNum);
  return doc.output('arraybuffer') as unknown as Uint8Array;
}

function buildWhatsAppText(report: ClinicalReport): string {
  const d = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  const lines = [`🏥 *RadCalcPro — ${report.title}*`, `📅 ${d}`];
  if (report.patientRef) lines.push(`🆔 Ref: ${report.patientRef}`);
  lines.push('');
  if (report.urgencyLabel && report.urgencyLabel !== 'None') {
    const e = report.urgencyLabel === 'CRITICAL' ? '🔴' : report.urgencyLabel === 'High' ? '🟠' : report.urgencyLabel === 'Moderate' ? '🟡' : '🟢';
    lines.push(`${e} *Impact: ${report.urgencyLabel}*`, '');
  }
  lines.push('*📋 Parameters*');
  report.parameters.forEach(p => lines.push(`• ${p.label}: *${p.value}${p.unit ? ' ' + p.unit : ''}*`));
  lines.push('', '*📊 Results*');
  report.results.forEach(r => { const f = r.danger ? '🔴 ' : r.warn ? '🟡 ' : r.highlight ? '✅ ' : '• '; lines.push(`${f}${r.label}: *${r.value}${r.unit ? ' ' + r.unit : ''}*`); });
  if (report.repopulation) {
    const rep = report.repopulation; lines.push('', '*🔬 Repopulation*', `• k = ${rep.k.toFixed(2)} Gy/day · Tk = ${rep.tk} days`);
    if (rep.eqd2Loss !== undefined) lines.push(`• EQD2 Loss = ${rep.eqd2Loss.toFixed(2)} Gy`);
    if (rep.note) lines.push(`• _${rep.note}_`);
  }
  if (report.compensation?.length) { lines.push('', '*💊 Compensation*'); report.compensation.forEach(c => lines.push(`${c.preferred ? '⭐' : '•'} ${c.label}: ${c.value}`)); }
  if (report.interpretation) { lines.push('', '*🩺 Interpretation*', report.interpretation); }
  lines.push('', '⚠️ _Verify before clinical use. RadCalcPro is a decision-support tool only._');

  const fullText = lines.join('\n');
  if (fullText.length > 1800) {
    let truncated = '';
    for (const line of lines) {
      if ((truncated + line + '\n').length > 1800) break;
      truncated += line + '\n';
    }
    return truncated + '\n\n_[Full report: see attached PDF]_';
  }
  return fullText;
}

interface ExportButtonProps { report: ClinicalReport; compact?: boolean; className?: string; }
type ExportState = 'idle'|'generating'|'done'|'error';

export const ExportButton: React.FC<ExportButtonProps> = ({ report, compact=false, className='' }) => {
  const [state, setState] = useState<ExportState>('idle');
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePDF = useCallback(async () => {
    setState('generating'); setMenuOpen(false);
    try {
      const pdfBytes = await generatePDF(report);
      const blob=new Blob([pdfBytes],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=`radcalcpro_${report.toolName.toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`; a.click();
      URL.revokeObjectURL(url); setState('done'); setTimeout(()=>setState('idle'),3000);
    } catch(err) { console.error('[ClinicalPDFExport]',err); setState('error'); setTimeout(()=>setState('idle'),4000); }
  }, [report]);

  const handleWhatsApp = useCallback(async () => {
    setMenuOpen(false);
    setState('generating');
    try {
      const pdfBytes = await generatePDF(report);
      const filename = `radcalcpro_${report.toolName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([pdfBytes], filename, { type: 'application/pdf' });
      const text = buildWhatsAppText(report);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: report.title, text });
        setState('done');
      } else {
        // Fallback
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n\n[PDF report downloaded to device]")}`, '_blank', 'noopener,noreferrer');
        setState('done');
      }
      setTimeout(() => setState('idle'), 3000);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setState('idle');
        return;
      }
      console.error('[ClinicalPDFExport]', err);
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  }, [report]);

  const isLoading = state==='generating';

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button onClick={()=>setMenuOpen(o=>!o)} disabled={isLoading} title="Export / Share"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg bg-[#1e3a5f] hover:bg-[#162d4a] text-white disabled:opacity-60">
          {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:state==='done'?<Check className="w-4 h-4 text-[#2DD4BF]"/>:<Share2 className="w-4 h-4"/>}
        </button>
        {menuOpen&&(
          <>
            <div className="absolute right-0 bottom-12 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-44">
              <button onClick={handlePDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <FileDown className="w-4 h-4 text-[#1e3a5f]"/>Download PDF
              </button>
              <div className="h-px bg-slate-100"/>
              <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-green-50 transition-colors">
                <MessageCircle className="w-4 h-4 text-green-600"/>Share on WhatsApp
              </button>
            </div>
            <div className="fixed inset-0 z-40" onClick={()=>setMenuOpen(false)}/>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <button onClick={handlePDF} disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-l-xl font-bold text-sm transition-all bg-[#1e3a5f] hover:bg-[#162d4a] text-white disabled:opacity-60 shadow-sm border-r border-[#D4AF37]/30"
        title="Download A4 PDF">
        {isLoading?<Loader2 className="w-4 h-4 animate-spin"/>:state==='done'?<Check className="w-4 h-4 text-[#2DD4BF]"/>:<FileDown className="w-4 h-4"/>}
        <span>{isLoading?'Generating…':state==='done'?'Downloaded':state==='error'?'Error — retry':'Export PDF'}</span>
      </button>
      <button onClick={handleWhatsApp}
        className="flex items-center gap-2 px-3 py-2.5 rounded-r-xl font-bold text-sm transition-all bg-[#25D366] hover:bg-[#1da851] text-white shadow-sm"
        title="Share on WhatsApp">
        <MessageCircle className="w-4 h-4"/>
        <span className="hidden sm:inline">WhatsApp</span>
      </button>
    </div>
  );
};

export default ExportButton;
