'use client';

import React, { useState, useRef, useEffect } from 'react';

type Props = {
  protocols: { name: string }[];
  active: string;
  onSetActive: (n: string) => void;
  onAdd: (n: string) => void;
  onRename: (oldName: string, nn: string) => void;
  onRemove: (n: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export default function ProtocolsManager({
  protocols,
  active,
  onSetActive,
  onAdd,
  onRename,
  onRemove,
  onReorder,
}: Props) {
  const [editingProtocol, setEditingProtocol] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingProtocol && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProtocol]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (name: string) => {
    setMenuOpen(null);
    setEditingProtocol(name);
    setEditValue(name);
  };

  const handleConfirmRename = () => {
    const trimmed = editValue.trim();
    if (!editingProtocol || !trimmed || trimmed === editingProtocol) {
      setEditingProtocol(null);
      return;
    }
    const exists = protocols.some((p) => p.name === trimmed && p.name !== editingProtocol);
    if (!exists) onRename(editingProtocol, trimmed);
    setEditingProtocol(null);
  };

  const handleKeyDownEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    if (e.key === 'Escape') {
      setEditingProtocol(null);
    }
  };

  const handleAddNew = () => {
    let n = 1;
    while (protocols.some((p) => p.name === `Protocolo ${n}`)) n++;
    const defaultName = `Protocolo ${n}`;
    onAdd(defaultName);
    setEditingProtocol(defaultName);
    setEditValue(defaultName);
  };

  const handleRemove = (name: string) => {
    setMenuOpen(null);
    onRemove(name);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(fromIndex) && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-1">
      <div className="protocol-tabs">
        {protocols.map((p, index) => (
          <div
            key={p.name}
            className={`protocol-tab-wrapper ${draggedIndex === index ? 'protocol-dragging' : ''} ${dragOverIndex === index ? 'protocol-drag-over' : ''}`}
            draggable={editingProtocol !== p.name}
            onDragStart={(e) => editingProtocol !== p.name && handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {editingProtocol === p.name ? (
              <input
                ref={editInputRef}
                type="text"
                className="form-control form-control-sm protocol-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleConfirmRename}
                onKeyDown={handleKeyDownEdit}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className={`protocol-tab-pill ${active === p.name ? 'active' : ''}`}
                ref={menuOpen === p.name ? menuRef : undefined}
              >
                <button
                  type="button"
                  className="protocol-tab"
                  onClick={() => {
                    setMenuOpen(null);
                    onSetActive(p.name);
                  }}
                >
                  {p.name}
                </button>
                <div className="protocol-tab-menu">
                  <button
                    type="button"
                    className="protocol-tab-dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === p.name ? null : p.name);
                    }}
                    title="Opciones"
                    aria-label="Menú"
                  >
                    ⋮
                  </button>
                  {menuOpen === p.name && (
                    <div className="protocol-dropdown">
                      <button
                        type="button"
                        className="protocol-dropdown-item"
                        onClick={() => handleStartRename(p.name)}
                      >
                        Cambiar nombre
                      </button>
                      <button
                        type="button"
                        className="protocol-dropdown-item protocol-dropdown-item-remove"
                        onClick={() => handleRemove(p.name)}
                        disabled={protocols.length <= 1}
                      >
                        Eliminar protocolo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="protocol-tab-add"
          onClick={handleAddNew}
          title="Nuevo protocolo"
        >
          +
        </button>
      </div>
    </div>
  );
}
