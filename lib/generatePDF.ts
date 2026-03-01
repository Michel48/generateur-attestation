// // lib/generatePDF.ts
// import type { CertParams } from './drawCertificate';
// import { drawCertificate, CW, CH } from './drawCertificate';

// export async function generatePDF(params: CertParams): Promise<Blob> {
//   // jsPDF v4 changed its export — handle both v3 and v4
//   const jsPDFModule = await import('jspdf');
//   const jsPDF = (jsPDFModule as any).jsPDF ?? jsPDFModule.default;

//   const offscreen = document.createElement('canvas');
//   offscreen.width = CW;
//   offscreen.height = CH;
//   drawCertificate(offscreen, params);

//   const imgData = offscreen.toDataURL('image/jpeg', 0.97);
//   const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
//   const W = doc.internal.pageSize.getWidth();
//   const H = doc.internal.pageSize.getHeight();
//   doc.addImage(imgData, 'JPEG', 0, 0, W, H);

//   return doc.output('blob');
// }

// export function sanitizeName(s: string): string {
//   return s
//     .replace(/[^a-zA-Z0-9À-ÿ\s\-]/g, '')
//     .replace(/\s+/g, '_')
//     .substring(0, 60);
// }

// export function downloadBlob(blob: Blob, filename: string) {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   a.click();
//   URL.revokeObjectURL(url);
// }
// lib/generatePDF.ts
import type { CertParams } from './drawCertificate';
import { drawCertificate, CW, CH } from './drawCertificate';

export async function generatePDF(params: CertParams): Promise<Blob> {
  // jsPDF v4 changed its export — handle both v3 and v4
  const jsPDFModule = await import('jspdf');
  const jsPDF = (jsPDFModule as any).jsPDF ?? jsPDFModule.default;

  const offscreen = document.createElement('canvas');
  offscreen.width = CW;
  offscreen.height = CH;
  drawCertificate(offscreen, params);

  const imgData = offscreen.toDataURL('image/jpeg', 0.97);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.addImage(imgData, 'JPEG', 0, 0, W, H);

  return doc.output('blob');
}

export function sanitizeName(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9À-ÿ\s\-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
