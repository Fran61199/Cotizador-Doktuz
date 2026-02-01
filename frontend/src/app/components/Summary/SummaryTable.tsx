'use client';

import React from 'react';
import type { TestSelection, PriceType } from '@/types';

type Props = {
  selections: TestSelection[];
  onRemove: (id: number) => void;
  onClassChange: (id: number, c: string | null) => void;
  onDetailChange: (id: number, d: string) => void;
};

const CLASS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'condicional', label: 'C' },
  { value: 'requisito', label: 'R' },
  { value: 'adicional', label: 'A' },
];

export default function SummaryTable({
  selections,
  onRemove,
  onClassChange,
  onDetailChange,
}: Props) {
  if (selections.length === 0) {
    return <div className="selection-empty">Sin selecciones.</div>;
  }
  return (
    <div className="selection-table-wrap table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th className="small">Prueba</th>
            <th className="small" style={{ width: 56, minWidth: 56 }}>Clasif.</th>
            <th className="small" style={{ minWidth: 120 }}>Detalle</th>
            <th className="small">Ing.</th>
            <th className="small">Per.</th>
            <th className="small">Ret.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {selections.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="fw-semibold small">{s.name}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.category}</div>
              </td>
              <td style={{ width: 56, minWidth: 80 }}>
                <select
                  className="form-select form-select-sm app-input selection-class-select"
                  value={s.classification ?? ''}
                  onChange={(e) => onClassChange(s.id, e.target.value || null)}
                  style={{ width: '100%' }}
                >
                  {CLASS_OPTIONS.map((o) => (
                    <option key={o.value || '_'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ minWidth: 120 }}>
                {s.classification === 'adicional' ? (
                  <span className="text-muted small">Examen adicional</span>
                ) : (
                  <input
                    className="form-control form-control-sm app-input"
                    value={s.detail ?? ''}
                    onChange={(e) => onDetailChange(s.id, e.target.value)}
                    placeholder={s.classification ? 'Descripción...' : ''}
                    disabled={!s.classification}
                    style={{ minWidth: 110 }}
                  />
                )}
              </td>
              {(['ingreso', 'periodico', 'retiro'] as PriceType[]).map((tp) => {
                const on = s.types.includes(tp);
                const price = on ? (s.overrides?.[tp] ?? s.prices[tp]) : null;
                return (
                  <td key={tp} className="selection-price-cell">
                    {on ? (
                      <span className="selection-price-value">
                        S/ {price != null ? Number(price).toFixed(2) : '0.00'}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                );
              })}
              <td className="text-end">
                <button
                  className="btn btn-sm btn-link text-danger p-0"
                  onClick={() => onRemove(s.id)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
