'use client';

import React, { useMemo, useState } from 'react';
import type { Test, PriceType } from '@/types';

type Props = {
  catalog: Test[];
  selectionsForActive: Record<number, PriceType[]>;
  onToggleType: (test: Test, t: PriceType) => void;
};

function normalizeCategory(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function AccordionCatalog({
  catalog,
  selectionsForActive,
  onToggleType,
}: Props) {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const filtered = q
      ? catalog.filter(
          (t) =>
            t.name.toLowerCase().includes(q.toLowerCase()) ||
            (t.category || '').toLowerCase().includes(q.toLowerCase())
        )
      : catalog;
    const map = new Map<string, { title: string; items: Test[] }>();
    for (const t of filtered) {
      const key = normalizeCategory(t.category || 'general');
      if (!map.has(key)) map.set(key, { title: t.category || 'General', items: [] });
      map.get(key)!.items.push(t);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [catalog, q]);

  return (
    <div>
      <div className="mb-3">
        <input
          className="form-control form-control-sm app-input"
          placeholder="Buscar prueba..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="accordion accordion-flush" id="catalogAccordion">
        {groups.map((g, idx) => {
          const headerId = `head-${g.key}-${idx}`;
          const colId = `col-${g.key}-${idx}`;
          return (
            <div
              className="accordion-item border-0 border-bottom"
              key={g.key}
              style={{ borderColor: 'var(--border-light) !important' }}
            >
              <h2 className="accordion-header" id={headerId}>
                <button
                  className="accordion-button py-2 collapsed bg-transparent shadow-none"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${colId}`}
                  aria-expanded={false}
                  aria-controls={colId}
                >
                  <span className="fw-semibold small">{g.title}</span>
                  <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>
                    {g.items.length}
                  </span>
                </button>
              </h2>
              <div
                id={colId}
                className="accordion-collapse collapse"
                aria-labelledby={headerId}
                data-bs-parent="#catalogAccordion"
              >
                <div className="accordion-body py-2">
                  {g.items.map((t) => {
                    const picked = selectionsForActive[t.id] || [];
                    const isOn = (tp: PriceType) => picked.includes(tp);
                    return (
                      <div
                        key={t.id}
                        className="d-flex align-items-center justify-content-between py-2 border-bottom border-light"
                      >
                        <span className="small">{t.name}</span>
                        <div className="btn-group btn-group-sm">
                          {(['ingreso', 'periodico', 'retiro'] as const).map((tp) => (
                            <button
                              key={tp}
                              type="button"
                              className={`btn btn-sm ${
                                isOn(tp)
                                  ? 'btn-primary'
                                  : 'btn-outline-secondary'
                              }`}
                              onClick={() => onToggleType(t, tp)}
                            >
                              {tp === 'ingreso' ? 'Ing.' : tp === 'periodico' ? 'Per.' : 'Ret.'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
