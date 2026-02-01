'use client';

import React, { useState, useRef, useEffect } from 'react';

type ClinicSelectorProps = {
  clinics: string[];
  selectedClinics: string[];
  onSelectedChange: (clinics: string[]) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
};

export default function ClinicSelector({
  clinics,
  selectedClinics,
  onSelectedChange,
  label = 'Clínicas',
  placeholder = 'Buscar clínica...',
  showLabel = true,
}: ClinicSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? clinics.filter((c) =>
        c.toLowerCase().includes(search.trim().toLowerCase())
      )
    : clinics;

  const toggle = (name: string) => {
    if (selectedClinics.includes(name)) {
      onSelectedChange(selectedClinics.filter((x) => x !== name));
    } else {
      onSelectedChange([...selectedClinics, name].sort());
    }
  };

  const remove = (name: string) => {
    onSelectedChange(selectedClinics.filter((x) => x !== name));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="clinic-selector" ref={containerRef}>
      {showLabel && (
        <label className="form-label small text-muted mb-1">Clínicas</label>
      )}

      {/* Seleccionadas como chips */}
      {selectedClinics.length > 0 && (
        <div className="clinic-selector-chips mb-2">
          {selectedClinics.map((c) => (
            <span key={c} className="clinic-selector-chip">
              {c}
              <button
                type="button"
                className="clinic-selector-chip-remove"
                onClick={() => remove(c)}
                aria-label={`Quitar ${c}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input de búsqueda + dropdown */}
      <div className="clinic-selector-input-wrap">
        <input
          type="text"
          className="form-control form-control-sm app-input clinic-selector-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="clinic-selector-dropdown">
            {filtered.length === 0 ? (
              <div className="clinic-selector-empty small text-muted p-2">
                {search.trim() ? 'Ninguna sede coincide.' : 'No hay sedes en provincia.'}
              </div>
            ) : (
              <ul className="clinic-selector-list">
                {filtered.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className={`clinic-selector-item ${selectedClinics.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggle(c)}
                    >
                      <span className="clinic-selector-item-check">
                        {selectedClinics.includes(c) ? '✓' : ''}
                      </span>
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
