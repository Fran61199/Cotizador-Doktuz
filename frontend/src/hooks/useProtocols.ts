'use client';

import { useState, useCallback } from 'react';

export function useProtocols() {
  const [protocols, setProtocols] = useState<{ name: string }[]>([
    { name: 'Protocolo 1' },
  ]);
  const [activeProtocol, setActiveProtocol] = useState<string>('Protocolo 1');

  const addProtocol = useCallback((n: string) => {
    const name = n.trim();
    if (!name) return;
    setProtocols((p) =>
      p.find((x) => x.name === name) ? p : [...p, { name }]
    );
    setActiveProtocol(name);
  }, []);

  const removeProtocol = useCallback((n: string) => {
    let nextActive = 'Protocolo 1';
    setProtocols((p) => {
      const remaining = p.filter((x) => x.name !== n);
      nextActive =
        remaining.length === 0
          ? 'Protocolo 1'
          : remaining[0]?.name ?? 'Protocolo 1';
      return remaining.length === 0 ? [{ name: 'Protocolo 1' }] : remaining;
    });
    setActiveProtocol((prev) => (prev === n ? nextActive : prev));
  }, []);

  const renameProtocol = useCallback((oldName: string, newName: string) => {
    const nn = newName.trim();
    if (!nn) return;
    setProtocols((p) =>
      p.map((x) => (x.name === oldName ? { name: nn } : x))
    );
    setActiveProtocol((prev) => (prev === oldName ? nn : prev));
  }, []);

  const reorderProtocols = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setProtocols((p) => {
      const arr = [...p];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }, []);

  return {
    protocols,
    activeProtocol,
    setActiveProtocol,
    addProtocol,
    removeProtocol,
    renameProtocol,
    reorderProtocols,
  };
}
