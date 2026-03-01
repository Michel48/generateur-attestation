// lib/drawCertificate.ts
// Pure canvas drawing engine — no React dependency

export interface Apprenant {
  nom: string;
  civilite: string;
}

export interface CertParams {
  apprenant: Apprenant;
  city: string;
  date: string; // YYYY-MM-DD
  logoImg: HTMLImageElement | null;
  sigImg: HTMLImageElement | null;
}

const CW = 1754;
const CH = 1240;

function formatDate(val: string): string {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  const months = [
    'janvier','février','mars','avril','mai','juin',
    'juillet','août','septembre','octobre','novembre','décembre',
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function drawCorners(c: CanvasRenderingContext2D, W: number, H: number) {
  // TOP-LEFT
  c.fillStyle = '#e53935';
  c.beginPath(); c.moveTo(0,0); c.lineTo(220,0); c.lineTo(0,165); c.closePath(); c.fill();
  c.fillStyle = '#1976d2';
  c.beginPath(); c.moveTo(0,0); c.lineTo(140,0); c.lineTo(0,95); c.closePath(); c.fill();
  c.fillStyle = '#bbdefb';
  c.beginPath(); c.moveTo(0,0); c.lineTo(72,0); c.lineTo(0,52); c.closePath(); c.fill();
  c.fillStyle = '#ff9800';
  c.beginPath(); c.moveTo(0,165); c.lineTo(62,165); c.lineTo(0,228); c.closePath(); c.fill();
  c.fillStyle = '#e53935';
  c.fillRect(0, 228, 20, 65);
  c.fillStyle = '#1976d2';
  c.fillRect(0, 296, 20, 32);

  // TOP-RIGHT
  c.fillStyle = '#e3f2fd';
  c.beginPath(); c.moveTo(W,0); c.lineTo(W-185,0); c.lineTo(W,135); c.closePath(); c.fill();
  c.fillStyle = '#bbdefb';
  c.beginPath(); c.moveTo(W,0); c.lineTo(W-105,0); c.lineTo(W,75); c.closePath(); c.fill();
  c.fillStyle = '#1976d2';
  c.beginPath(); c.moveTo(W-20,0); c.lineTo(W,0); c.lineTo(W,62); c.lineTo(W-20,42); c.closePath(); c.fill();

  // BOTTOM-RIGHT
  c.fillStyle = '#e53935';
  c.beginPath(); c.moveTo(W,H); c.lineTo(W-185,H); c.lineTo(W,H-135); c.closePath(); c.fill();
  c.fillStyle = '#ffd740';
  c.beginPath(); c.moveTo(W,H); c.lineTo(W-115,H); c.lineTo(W,H-84); c.closePath(); c.fill();
  c.fillStyle = '#1976d2';
  c.beginPath(); c.moveTo(W-20,H); c.lineTo(W,H); c.lineTo(W,H-52); c.lineTo(W-20,H-32); c.closePath(); c.fill();

  // BOTTOM-LEFT
  c.fillStyle = '#1976d2';
  c.beginPath(); c.moveTo(0,H); c.lineTo(82,H); c.lineTo(0,H-62); c.closePath(); c.fill();
  c.fillStyle = '#e53935';
  c.beginPath(); c.moveTo(0,H); c.lineTo(42,H); c.lineTo(0,H-32); c.closePath(); c.fill();
}

export function drawCertificate(
  canvas: HTMLCanvasElement,
  params: CertParams,
): void {
  const { apprenant, city, date, logoImg, sigImg } = params;
  const W = CW, H = CH;
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;

  // Background
  c.fillStyle = '#0d0d0d';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#141414';
  c.fillRect(30, 30, W - 60, H - 60);

  // Corners
  drawCorners(c, W, H);

  // Logo
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const lw = 170, lh = 170;
    c.drawImage(logoImg, W / 2 - lw / 2, 36, lw, lh);
  }

  // ATTESTATION title
  c.font = `900 90px Montserrat, "Arial Black", sans-serif`;
  c.fillStyle = '#e53935';
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillText('ATTESTATION', W / 2, 222);

  // DE FORMATION
  c.font = `700 48px Montserrat, Arial, sans-serif`;
  c.fillStyle = '#1976d2';
  c.fillText('DE FORMATION', W / 2, 326);

  // Separator
  c.strokeStyle = '#1976d2';
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(W/2-220, 392); c.lineTo(W/2+220, 392); c.stroke();

  // décernée à
  c.font = `400 32px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#cccccc';
  c.fillText('décernée à', W / 2, 408);

  // Separator 2
  c.beginPath(); c.moveTo(W/2-220, 452); c.lineTo(W/2+220, 452); c.stroke();

  // Student name — auto-scale
  const displayName = apprenant.civilite
    ? `${apprenant.civilite} ${apprenant.nom.toUpperCase()}`
    : apprenant.nom.toUpperCase();

  let fontSize = 80;
  c.font = `900 ${fontSize}px Montserrat, "Arial Black", sans-serif`;
  while (c.measureText(displayName).width > W * 0.84 && fontSize > 26) {
    fontSize -= 2;
    c.font = `900 ${fontSize}px Montserrat, "Arial Black", sans-serif`;
  }
  c.fillStyle = '#ffffff';
  c.textBaseline = 'middle';
  c.fillText(displayName, W / 2, 524);

  // Body text
  c.textBaseline = 'top';
  c.font = `400 27px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#bbbbbb';
  const lines = [
    'En reconnaissance de sa participation et de la validation des compétences',
    'pratiques et théoriques lors de la formation, dispensée par Loïc Rémy YAO,',
  ];
  lines.forEach((line, i) => c.fillText(line, W / 2, 596 + i * 44));

  c.font = `700 27px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#ffffff';
  c.fillText('CEO de LOIC RÉMY TRADING ACADEMIE.', W / 2, 596 + 2 * 44);

  c.font = `400 27px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#bbbbbb';
  c.fillText("Cette formation lui a permis d'acquérir les connaissances essentielles pour évoluer", W / 2, 596 + 3.8 * 44);
  c.fillText('sur les marchés financiers avec méthode, rigueur et discipline.', W / 2, 596 + 4.8 * 44);

  // Date
  const dateStr = `Fait à ${city || 'Abidjan'}, le ${formatDate(date)}.`;
  c.font = `400 28px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#cccccc';
  c.textAlign = 'right';
  c.fillText(dateStr, W - 115, 878);

  // Signature image — drawn BEFORE left text so it overlaps naturally
  if (sigImg && sigImg.complete && sigImg.naturalWidth > 0) {
    // Render sig to temp canvas with color inversion for dark background
    const tmp = document.createElement('canvas');
    tmp.width = sigImg.naturalWidth;
    tmp.height = sigImg.naturalHeight;
    const tc = tmp.getContext('2d')!;
    tc.drawImage(sigImg, 0, 0);
    const imageData = tc.getImageData(0, 0, tmp.width, tmp.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg < 160) {
        // Dark pixel → white
        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
      } else {
        // Light pixel → transparent
        data[i + 3] = 0;
      }
    }
    tc.putImageData(imageData, 0, 0);

    const sw = 310;
    const sh = Math.round(sw * sigImg.naturalHeight / sigImg.naturalWidth);
    const sigX = W - 115 - sw; // right-aligned with date
    c.drawImage(tmp, sigX, 900, sw, sh);
  }

  // Left: Loïc REMY info
  c.textAlign = 'left';
  c.font = `700 28px Montserrat, Arial, sans-serif`;
  c.fillStyle = '#ffffff';
  c.fillText('Loïc REMY', 112, 948);
  c.font = `400 23px "Open Sans", Arial, sans-serif`;
  c.fillStyle = '#999999';
  c.fillText('Formateur / Trader indépendant', 112, 984);
  c.fillText('CEO de Loïc Rémy Trading Académie', 112, 1014);
}

export { CW, CH };
