'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Test, PriceType, TestSelection } from '@/types';

export function useSelections(
  activeProtocol: string
) {
  const [selections, setSelections] = useState<TestSelection[]>([]);

  const selectionsMap = useMemo(() => {
    const m: Record<number, PriceType[]> = {};
    for (const s of selections) {
      if (s.protocol !== activeProtocol) continue;
      m[s.testId] = s.types;
    }
    return m;
  }, [selections, activeProtocol]);

  const selectionsActive = useMemo(
    () => selections.filter((s) => s.protocol === activeProtocol),
    [selections, activeProtocol]
  );

  const onToggleType = useCallback(
    (test: Test, t: PriceType) => {
      setSelections((prev) => {
        const idx = prev.findIndex(
          (s) => s.testId === test.id && s.protocol === activeProtocol
        );
        if (idx >= 0) {
          const cur = prev[idx];
          const exists = cur.types.includes(t);
          const nextTypes = exists ? cur.types.filter((x) => x !== t) : [...cur.types, t];
          if (nextTypes.length === 0) return prev.filter((_, i) => i !== idx);
          const cp = [...prev];
          cp[idx] = { ...cur, types: nextTypes };
          return cp;
        }
        return [
          ...prev,
          {
            id: Date.now(),
            testId: test.id,
            name: test.name,
            category: test.category,
            protocol: activeProtocol,
            types: [t],
            prices: test.prices,
            classification: null,
            detail: '',
            overrides: {},
          },
        ];
      });
    },
    [activeProtocol]
  );

  const removeSel = useCallback((id: number) => {
    setSelections((p) => p.filter((s) => s.id !== id));
  }, []);

  const changeClass = useCallback((id: number, c: string | null) => {
    setSelections((p) =>
      p.map((s) => {
        if (s.id !== id) return s;
        const newDetail = !c || c === 'adicional' ? '' : s.detail;
        return { ...s, classification: c, detail: newDetail };
      })
    );
  }, []);

  const changeDetail = useCallback((id: number, d: string) => {
    setSelections((p) => p.map((s) => (s.id === id ? { ...s, detail: d } : s)));
  }, []);

  const changeOverride = useCallback((id: number, t: PriceType, v: number) => {
    setSelections((p) =>
      p.map((s) => {
        if (s.id !== id) return s;
        const nx = { ...s, overrides: { ...(s.overrides || {}) } } as TestSelection;
        if (Number.isNaN(v)) delete nx.overrides![t];
        else nx.overrides![t] = v;
        return nx;
      })
    );
  }, []);

  const syncWithCatalog = useCallback(
    (catalog: Test[]) => {
      if (catalog.length === 0) return;
      setSelections((prev) =>
        prev.map((s) => {
          const catalogTest = catalog.find((t) => t.id === s.testId);
          if (catalogTest?.prices) return { ...s, prices: catalogTest.prices };
          return s;
        })
      );
    },
    []
  );

  const filterByProtocol = useCallback((protocol: string) => {
    setSelections((s) => s.filter((x) => x.protocol !== protocol));
  }, []);

  const renameProtocolInSelections = useCallback(
    (oldName: string, newName: string) => {
      setSelections((s) =>
        s.map((x) =>
          x.protocol === oldName ? { ...x, protocol: newName } : x
        )
      );
    },
    []
  );

  return {
    selections,
    setSelections,
    selectionsMap,
    selectionsActive,
    onToggleType,
    removeSel,
    changeClass,
    changeDetail,
    changeOverride,
    syncWithCatalog,
    filterByProtocol,
    renameProtocolInSelections,
  };
}
