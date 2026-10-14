'use client';

import { useState } from 'react';

const LIMIT = 220;

export function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LIMIT;
  return (
    <>
      <p style={{ whiteSpace: 'pre-line' }}>{open || !long ? text : `${text.slice(0, LIMIT)}…`}</p>
      {long && (
        <button type="button" className="btn-lire" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {open ? 'Réduire' : 'Lire la suite'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      )}
    </>
  );
}
