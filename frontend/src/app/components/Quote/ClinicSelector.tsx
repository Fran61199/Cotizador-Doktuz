'use client';

import React, { useState, useRef, useEffect } from 'react';

type ClinicSelectorProps = {
  clinics: string[];
  selectedClinics: string[];
  onSelectedChange: (clinics: string[]) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  /** Si es true, al elegir una sede se selecciona solo esa y se cierra el dropdown (una sola sede). */
  singleSelection?: boolean;
};

export default function ClinicSelector({
  clinics,
  selectedClinics,
  onSelectedChange,
  label = 'Clínicas',
  placeholder = 'Buscar clínica...',
  showLabel = true,
  singleSelection = false,
}: ClinicSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? clinics.filter((c) =>
        c.toLowerCase().includes(search.trim().toLowerCase())
      )
    : clinics;

  const toggle = (name: string) => {
    if (singleSelection) {
      onSelectedChange([name]);
      setOpen(false);
      setSearch('');
      inputRef.current?.blur();
      return;
    }
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
        if (singleSelection && selectedClinics.length > 0) setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [singleSelection, selectedClinics.length]);

  // Al abrir el dropdown en selección única, hacer scroll al ítem seleccionado
  useEffect(() => {
    if (!open || !singleSelection || !selectedClinics[0] || !listRef.current) return;
    const selected = listRef.current.querySelector('.clinic-selector-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [open, singleSelection, selectedClinics[0]]);

  return (
    <div className="clinic-selector" ref={containerRef}>
      {showLabel && (
        <label className="form-label small text-muted mb-1">{label}</label>
      )}

      {/* Seleccionadas como chips (solo en multi-selección; en selección única no se muestran) */}
      {selectedClinics.length > 0 && !singleSelection && (
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

      {/* Input de búsqueda + dropdown (en selección única el input muestra la sede elegida cuando no se está buscando) */}
      <div className="clinic-selector-input-wrap">
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm app-input clinic-selector-input"
          placeholder={placeholder}
          value={singleSelection && selectedClinics[0] && search === '' && !open ? selectedClinics[0] : search}
          onChange={(e) => {
            const v = e.target.value;
            setSearch(v);
            if (singleSelection && v === '') onSelectedChange([]);
          }}
          onFocus={() => {
            setOpen(true);
            if (singleSelection && selectedClinics[0]) setSearch('');
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setOpen(false);
            if (singleSelection && selectedClinics[0]) setSearch('');
          }}
        />
        {open && (
          <div className="clinic-selector-dropdown">
            {filtered.length === 0 ? (
              <div className="clinic-selector-empty small text-muted p-2">
                {search.trim() ? 'Ninguna sede coincide.' : 'No hay sedes en provincia.'}
              </div>
            ) : (
              <ul className="clinic-selector-list" ref={listRef}>
                {filtered.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className={`clinic-selector-item ${selectedClinics.includes(c) ? 'selected' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggle(c);
                      }}
                    >
                      {!singleSelection && (
                        <span className="clinic-selector-item-check">
                          {selectedClinics.includes(c) ? '✓' : ''}
                        </span>
                      )}
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
