'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useImages } from '@/lib/useImages';
import { drawCertificate, type Apprenant } from '@/lib/drawCertificate';
import { generatePDF, sanitizeName, downloadBlob } from '@/lib/generatePDF';

interface ApprenantRow extends Apprenant {}

function useToast() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const show = (m: string) => {
    setMsg(m); setVisible(true);
    setTimeout(() => setVisible(false), 3200);
  };
  return { msg, visible, show };
}

export default function Generator() {
  const { logoImg, sigImg, ready } = useImages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();

  const [defaultCivilite, setDefaultCivilite] = useState('M.');
  const [city, setCity] = useState('Abidjan');
  const [date, setDate] = useState('2025-06-09');
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [manualText, setManualText] = useState('');
  const [csvRows, setCsvRows] = useState<ApprenantRow[]>([]);
  const [names, setNames] = useState<ApprenantRow[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const getNames = useCallback((): ApprenantRow[] => {
    if (tab === 'csv') return csvRows;
    return manualText.split('\n').map(s => s.trim()).filter(Boolean)
      .map(nom => ({ nom, civilite: defaultCivilite }));
  }, [tab, csvRows, manualText, defaultCivilite]);

  // KEY FIX: draw imperatively, never rely on useEffect timing
  const draw = useCallback((nameObj: ApprenantRow) => {
    const canvas = canvasRef.current;
    if (!canvas) { console.warn('[draw] canvas not mounted yet'); return; }
    if (!ready)  { console.warn('[draw] images not ready yet'); return; }
    drawCertificate(canvas, { apprenant: nameObj, city, date, logoImg, sigImg });
  }, [ready, city, date, logoImg, sigImg]);

  // Auto-redraw when images become ready (logoImg/sigImg change triggers this)
  useEffect(() => {
    if (!ready || !showPreview) return;
    const target = names[currentIdx] ?? { nom: 'HASSANE SOUCAIRADJOU', civilite: 'M.' };
    requestAnimationFrame(() => draw(target));
  }, [ready, logoImg, sigImg, showPreview, names, currentIdx, draw]);

  const handleGenerate = () => {
    const list = getNames();
    if (!list.length) { toast.show('⚠ Ajoutez au moins un nom !'); return; }
    setNames(list);
    setCurrentIdx(0);
    setShowPreview(true);
    // Draw after React commits the DOM update (canvas becomes visible)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        draw(list[0]);
        document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
    toast.show(`✦ ${list.length} attestation(s) prête(s)`);
  };

  const navigate = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(names.length - 1, currentIdx + dir));
    setCurrentIdx(next);
    requestAnimationFrame(() => draw(names[next]));
  };

  const handleDownloadCurrent = async () => {
    const current = names[currentIdx];
    if (!current) return;
    toast.show('Génération en cours...');
    const blob = await generatePDF({ apprenant: current, city, date, logoImg, sigImg });
    downloadBlob(blob, `attestation_${sanitizeName(current.nom)}.pdf`);
    toast.show(`✓ Téléchargé : ${current.nom}`);
  };

  const handleDownloadAll = async () => {
    if (!names.length) { toast.show('⚠ Aucun nom'); return; }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('attestations_loic_remy')!;
    for (let i = 0; i < names.length; i++) {
      setProgress({ current: i + 1, total: names.length });
      const blob = await generatePDF({ apprenant: names[i], city, date, logoImg, sigImg });
      folder.file(`attestation_${sanitizeName(names[i].nom)}.pdf`, blob);
      await new Promise(r => setTimeout(r, 0));
    }
    setProgress(null);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'attestations_loic_remy.zip');
    toast.show(`🎉 ${names.length} attestations téléchargées !`);
  };

  const handleFileImport = async (file: File) => {
    const isXlsx = /\.xlsx?$/i.test(file.name);
    let rows: ApprenantRow[] = [];
    if (isXlsx) {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      const headers: string[] = [];
      ws.getRow(1).eachCell(cell => headers.push(String(cell.value ?? '')));
      const data: Record<string, string>[] = [];
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const obj: Record<string, string> = {};
        row.eachCell((cell, colNum) => {
          const key = headers[colNum - 1];
          if (key) obj[key] = String(cell.value ?? '');
        });
        if (Object.values(obj).some(v => v.trim())) data.push(obj);
      });
      rows = parseRows(data);
    } else {
      const Papa = (await import('papaparse')).default;
      const result = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: true });
      rows = parseRows(result.data);
    }
    setCsvRows(rows); setTab('csv');
    toast.show(`✓ ${rows.length} apprenants importés`);
  };

  function parseRows(data: Record<string, string>[]): ApprenantRow[] {
    if (!data.length) return [];
    const keys = Object.keys(data[0]);
    const civKey = keys.find(k => /civil|genre|titre|prefix/i.test(k)) ?? null;
    const nomKey = keys.find(k => /nom|name/i.test(k)) ?? keys[1] ?? keys[0];
    return data.filter(r => r[nomKey]?.trim()).map(r => ({
      nom: r[nomKey].trim(),
      civilite: civKey ? (r[civKey]?.trim() ?? defaultCivilite) : defaultCivilite,
    }));
  }

  const nameCount = getNames().length;

  return (
    <div style={{ background: '#0d0d0d', fontFamily: 'var(--font-opensans)', minHeight: '100vh' }}>

      {/* HEADER */}
      <header className="px-6 md:px-10 flex items-center justify-between"
        style={{ background: '#0d0d0d', borderBottom: '2px solid #e53935', minHeight: 70 }}>
        <div className="flex items-center gap-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.ico" alt="Logo" className="h-12 w-11 object-contain" />
          <div style={{ fontFamily: 'var(--font-montserrat)' }}>
            <div className="font-bold text-white text-base tracking-wide">Loïc Rémy</div>
            <div className="font-semibold text-xs tracking-widest" style={{ color: '#1976d2' }}>TRADING ACADÉMIE</div>
          </div>
        </div>
        <div className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: '#e53935', color: '#fff' }}>
          Générateur d&apos;Attestations
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-24">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Générateur d&apos;<span style={{ color: '#e53935' }}>Attestations</span>
          </h1>
          <p className="text-sm mb-1" style={{ color: '#6b7280' }}>Loïc Rémy Trading Académie</p>

        </div>

        {/* PANEL 1 */}
        <Panel title="01 — Paramètres de l'attestation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Civilité par défaut">
              <select value={defaultCivilite} onChange={e => setDefaultCivilite(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white"
                style={{ background: '#0d0d0d', border: '1px solid #2d3548' }}>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="">Aucune</option>
              </select>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                Utilisée en saisie manuelle. En Excel, la colonne &quot;Civilité&quot; prime.
              </p>
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white"
                style={{ background: '#0d0d0d', border: '1px solid #2d3548' }} />
            </Field>
            <Field label="Ville">
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm text-white"
                style={{ background: '#0d0d0d', border: '1px solid #2d3548' }} />
            </Field>
          </div>
        </Panel>

        {/* PANEL 2 */}
        <Panel title={
          <span className="flex items-center gap-2">
            02 — Liste des Apprenants
            {nameCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#e53935', color: '#fff' }}>{nameCount}</span>
            )}
          </span>
        }>
          <div className="flex gap-1 p-1 rounded mb-4" style={{ background: '#0d0d0d' }}>
            <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')}>Saisie manuelle</TabBtn>
            <TabBtn active={tab === 'csv'} onClick={() => setTab('csv')}>Importer Excel / CSV</TabBtn>
          </div>

          {tab === 'manual' && (
            <div>
              <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                placeholder={"Un nom par ligne (sans M./Mme) :\nHASSANE SOUCAIRADJOU\nAMINATA KONÉ"}
                rows={5} className="w-full px-3 py-3 rounded text-sm text-white resize-y"
                style={{ background: '#0d0d0d', border: '1px solid #2d3548', lineHeight: 1.7 }} />
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                La civilité sélectionnée ci-dessus est appliquée à tous les noms.
              </p>
            </div>
          )}

          {tab === 'csv' && (
            <div>
              <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileImport(f); }}
                className="relative rounded text-center cursor-pointer p-6"
                style={{ border: `1.5px dashed ${dragging ? '#e53935' : '#2d3548'}`, background: dragging ? '#1a0f0f' : '#0d0d0d' }}>
                <input type="file" accept=".csv,.xlsx,.xls"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={e => { if (e.target.files?.[0]) handleFileImport(e.target.files[0]); }} />
                <div className="text-3xl mb-2">📂</div>
                <p className="text-sm font-semibold" style={{ color: '#9ca3af' }}>Glissez votre fichier ici</p>
                <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                  Excel <strong style={{ color: '#9ca3af' }}>.xlsx</strong> ou <strong style={{ color: '#9ca3af' }}>CSV</strong> —
                  colonnes : <strong style={{ color: '#1976d2' }}>Civilité</strong> + <strong style={{ color: '#1976d2' }}>Nom Complet</strong>
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: '#4b5563' }}>Pas encore de fichier ?</p>
                <a href="/modele_apprenants.xlsx" download className="text-xs font-semibold" style={{ color: '#1976d2' }}>
                  ⬇ Télécharger le modèle Excel
                </a>
              </div>
              {csvRows.length > 0 && (
                <div className="mt-4 rounded overflow-hidden" style={{ border: '1px solid #252d3d' }}>
                  <table className="w-full text-xs">
                    <thead><tr style={{ background: '#1976d2' }}>
                      <th className="px-3 py-2 text-left text-white">Civilité</th>
                      <th className="px-3 py-2 text-left text-white">Nom Complet</th>
                    </tr></thead>
                    <tbody>
                      {csvRows.slice(0, 5).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#141414' : '#0d0d0d' }}>
                          <td className="px-3 py-2" style={{ color: '#9ca3af' }}>{r.civilite}</td>
                          <td className="px-3 py-2 text-white">{r.nom}</td>
                        </tr>
                      ))}
                      {csvRows.length > 5 && (
                        <tr><td colSpan={2} className="px-3 py-2 text-center" style={{ color: '#4b5563' }}>
                          … et {csvRows.length - 5} autres
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Generate */}
        <div className="text-center my-6">
          <button onClick={handleGenerate} disabled={!ready}
            className="font-black text-sm tracking-widest uppercase px-12 py-4 rounded disabled:opacity-40"
            style={{ fontFamily: 'var(--font-montserrat)', background: '#e53935', color: '#fff' }}>
            {ready ? 'Générer les attestations' : '⏳ Chargement…'}
          </button>
        </div>

        {/*
          CANVAS IS ALWAYS IN THE DOM — display:none on wrapper only.
          This guarantees canvasRef.current is never null when draw() fires.
        */}
        <div id="preview-section" style={{ display: showPreview ? 'block' : 'none' }}>
          <SectionLabel>Aperçu du certificat</SectionLabel>
          <div className="rounded-lg p-4 md:p-6 mb-4"
            style={{ background: '#000', border: '1px solid #252d3d' }}>
            <canvas ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto',
                borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }} />
            <div className="flex items-center justify-center gap-4 mt-4 text-sm" style={{ color: '#6b7280' }}>
              <NavButton disabled={currentIdx === 0} onClick={() => navigate(-1)}>← Précédent</NavButton>
              <span>{currentIdx + 1} / {names.length}</span>
              <NavButton disabled={currentIdx >= names.length - 1} onClick={() => navigate(1)}>Suivant →</NavButton>
            </div>
          </div>

          {progress && (
            <div className="mb-4">
              <div className="rounded-full overflow-hidden h-1.5" style={{ background: '#0d0d0d', border: '1px solid #252d3d' }}>
                <div className="h-full transition-all rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%`, background: 'linear-gradient(90deg,#e53935,#1976d2)' }} />
              </div>
              <p className="text-xs text-center mt-2" style={{ color: '#6b7280' }}>
                Génération {progress.current} / {progress.total}…
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={handleDownloadCurrent}
              className="px-6 py-3 rounded text-sm font-bold tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-montserrat)', background: 'transparent', color: '#9ca3af', border: '1px solid #2d3548' }}>
              Ce certificat (PDF)
            </button>
            <button onClick={handleDownloadAll} disabled={!!progress}
              className="px-6 py-3 rounded text-sm font-bold tracking-wider uppercase disabled:opacity-40"
              style={{ fontFamily: 'var(--font-montserrat)', background: '#1976d2', color: '#fff' }}>
              Tout télécharger (ZIP)
            </button>
          </div>
        </div>

      </main>

      {/* Toast */}
      <div className="fixed bottom-7 right-7 px-4 py-3 rounded text-sm z-50 transition-all duration-300"
        style={{ background: '#161b27', color: '#fff', borderLeft: '3px solid #e53935',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transform: toast.visible ? 'translateY(0)' : 'translateY(80px)',
          opacity: toast.visible ? 1 : 0 }}>
        {toast.msg}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 mb-5" style={{ background: '#141414', border: '1px solid #252d3d' }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold tracking-widest uppercase"
          style={{ color: '#e53935', fontFamily: 'var(--font-montserrat)' }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: '#252d3d' }} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 text-center py-2 rounded text-xs font-bold transition-all"
      style={{ fontFamily: 'var(--font-montserrat)', background: active ? '#e53935' : 'transparent', color: active ? '#fff' : '#6b7280' }}>
      {children}
    </button>
  );
}

function NavButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-4 py-1.5 rounded text-xs disabled:opacity-30"
      style={{ background: '#1a1f2e', color: '#9ca3af', border: '1px solid #252d3d' }}>
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold tracking-widest uppercase"
        style={{ color: '#e53935', fontFamily: 'var(--font-montserrat)' }}>{children}</span>
      <div className="flex-1 h-px" style={{ background: '#252d3d' }} />
    </div>
  );
}
