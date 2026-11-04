'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadedFile = { name: string; size: number; type: string; text: string };

function parseRows(file: LoadedFile): { headers: string[]; rows: string[][] } | null {
  const raw = file.text.trim();
  if (!raw) return null;
  if (file.name.endsWith('.json') || file.type.includes('json')) {
    try {
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : [data];
      const objects = arr.filter((r) => r && typeof r === 'object');
      if (!objects.length) return null;
      const headers = Array.from(new Set(objects.flatMap((o) => Object.keys(o)))).slice(0, 12);
      const rows = objects.slice(0, 100).map((o) =>
        headers.map((h) => {
          const v = (o as Record<string, unknown>)[h];
          return v === undefined || v === null ? '' : String(v);
        })
      );
      return { headers, rows };
    } catch {
      return null;
    }
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return null;
  const split = (line: string) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
  return { headers: split(lines[0]), rows: lines.slice(1, 101).map(split) };
}

/** Read-only previewer for files the OS opens with PRIMEVEST (manifest file_handlers). */
export function FilePreview() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const queue = (window as unknown as { launchQueue?: { setConsumer: (cb: (p: { files: unknown[] }) => void) => void } }).launchQueue;
    if (!queue) {
      setSupported(false);
      return;
    }
    queue.setConsumer((params) => {
      const handle = params.files?.[0] as { name: string; size: number; type: string; text: () => Promise<string> } | undefined;
      if (!handle) return;
      handle.text().then((text) => setFile({ name: handle.name, size: handle.size, type: handle.type, text }));
    });
  }, []);

  const table = useMemo(() => (file ? parseRows(file) : null), [file]);

  return (
    <section className="shell py-14">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">File handling</p>
      <h1 className="font-display mt-2 text-3xl md:text-4xl">File preview</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        PRIMEVEST can open <code>.csv</code> and <code>.json</code> files directly from your operating system
        (&ldquo;Open with&rdquo; or a downloaded statement). Previews are read-only: nothing is uploaded, stored or shared.
      </p>

      {!supported && (
        <div className="panel mt-8 p-6 text-sm text-muted">
          This browser does not expose the File Handling API, so files cannot be launched into the app here.
          Chrome and Edge on desktop support it; the manifest declaration remains valid for packaging.
        </div>
      )}

      {supported && !file && (
        <div className="panel mt-8 p-6 text-sm text-muted">
          No file received yet. Choose a <code>.csv</code> or <code>.json</code> file in your OS and open it with
          PRIMEVEST to see a read-only preview in this panel.
        </div>
      )}

      {file && (
        <div className="panel mt-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}</p>
          </div>
          {table ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-muted">
                    {table.headers.map((h, i) => <th key={i} className="px-4 py-2 font-medium">{h || `col ${i + 1}`}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      {table.headers.map((_, j) => <td key={j} className="px-4 py-1.5 text-muted">{r[j] ?? ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="max-h-96 overflow-auto px-5 py-4 text-xs text-muted">{file.text.slice(0, 20000)}</pre>
          )}
        </div>
      )}
    </section>
  );
}
