'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AppHeader from '../components/Layout/AppHeader';
import AuthGuard from '../components/AuthGuard';
import ClinicSelector from '../components/Quote/ClinicSelector';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import {
  downloadPricesTemplate,
  getImportPreview,
  importPricesFile,
  getPricesList,
  updatePrice,
  addPrice,
  deletePrice,
  getClinics,
  getClinicsWithIds,
  createClinic,
  searchTests,
} from '@/api';
import type { PriceRow, PricesListResult, SearchTestResult, ImportPreviewRow, ClinicWithId } from '@/api';

export default function PruebasPage() {
  const toast = useToast();
  const [priceImportResult, setPriceImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [priceImportLoading, setPriceImportLoading] = useState(false);
  const [priceImportError, setPriceImportError] = useState<string | null>(null);

  const [clinics, setClinics] = useState<string[]>([]);
  const [clinicsWithIds, setClinicsWithIds] = useState<ClinicWithId[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('Lima');
  const [priceList, setPriceList] = useState<PricesListResult | null>(null);

  const [addClinicOpen, setAddClinicOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [addClinicLoading, setAddClinicLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [savingTestId, setSavingTestId] = useState<number | null>(null);
  const [editRows, setEditRows] = useState<Record<number, { ingreso: number; periodico: number; retiro: number }>>({});
  const [contextMenuTest, setContextMenuTest] = useState<number | null>(null);

  const [newTestName, setNewTestName] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('');
  const [newIngreso, setNewIngreso] = useState<number | ''>(0);
  const [newPeriodico, setNewPeriodico] = useState<number | ''>(0);
  const [newRetiro, setNewRetiro] = useState<number | ''>(0);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteModalTest, setDeleteModalTest] = useState<PriceRow | null>(null);
  const [deleteScope, setDeleteScope] = useState<'clinic' | 'lima' | 'all_provincia' | 'all'>('clinic');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchTestResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [tableSearchQuery, setTableSearchQuery] = useState('');

  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    rows: ImportPreviewRow[];
    validCount: number;
    invalidCount: number;
  } | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [importConfirmLoading, setImportConfirmLoading] = useState(false);
  const importPreviewFileRef = useRef<File | null>(null);

  const [addTestModalOpen, setAddTestModalOpen] = useState(false);

  const loadClinics = useCallback(() => {
    getClinics()
      .then((names) => setClinics(names || []))
      .catch(() => setClinics([]));
    getClinicsWithIds()
      .then((list) => setClinicsWithIds(list || []))
      .catch(() => setClinicsWithIds([]));
  }, []);

  const loadPriceList = useCallback(() => {
    if (!selectedClinic) return;
    setListLoading(true);
    setListError(null);
    setTableSearchQuery('');
    getPricesList(selectedClinic)
      .then((data) => {
        setPriceList(data);
        const initial: Record<number, { ingreso: number; periodico: number; retiro: number }> = {};
        data.tests.forEach((t) => {
          initial[t.test_id] = { ingreso: t.ingreso, periodico: t.periodico, retiro: t.retiro };
        });
        setEditRows(initial);
      })
      .catch((err) => setListError(err instanceof Error ? err.message : 'Error al cargar.'))
      .finally(() => setListLoading(false));
  }, [selectedClinic]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    loadPriceList();
  }, [loadPriceList]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuTest !== null) {
        setContextMenuTest(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuTest]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    const t = setTimeout(() => {
      setSearchLoading(true);
      searchTests(q)
        .then((r) => setSearchResults(r.tests))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSaveRow = async (testId: number) => {
    if (!priceList) return;
    const values = editRows[testId];
    if (!values) return;
    
    setSavingTestId(testId);
    try {
      await updatePrice({
        test_id: testId,
        clinic_id: priceList.clinic_id,
        ingreso: values.ingreso,
        periodico: values.periodico,
        retiro: values.retiro,
      });
      toast.success('Precio actualizado');
    } catch {
      toast.error('Error al actualizar precio');
    } finally {
      setSavingTestId(null);
    }
  };

  const setEditValue = (testId: number, field: 'ingreso' | 'periodico' | 'retiro', value: number) => {
    setEditRows((prev) => ({
      ...prev,
      [testId]: {
        ...(prev[testId] ?? { ingreso: 0, periodico: 0, retiro: 0 }),
        [field]: value,
      },
    }));
  };

  const handleBlur = (testId: number) => {
    // Guardar al salir del campo (blur)
    handleSaveRow(testId);
  };

  const categories = priceList ? [...new Set(priceList.tests.map((t) => t.category))].sort() : [];

  function normalizeCategory(cat: string) {
    return cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  const priceGroups = useMemo(() => {
    if (!priceList?.tests.length) return [];
    const q = tableSearchQuery.trim().toLowerCase();
    const filtered = q
      ? priceList.tests.filter(
          (t) =>
            t.test_name.toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q)
        )
      : priceList.tests;
    const map = new Map<string, { title: string; items: PriceRow[] }>();
    for (const t of filtered) {
      const key = normalizeCategory(t.category || 'general');
      if (!map.has(key)) map.set(key, { title: t.category || 'General', items: [] });
      map.get(key)!.items.push(t);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [priceList, tableSearchQuery]);

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) {
      toast.error('Selecciona una sede antes de añadir una prueba');
      return;
    }
    const name = newTestName.trim();
    const category = newTestCategory.trim();
    if (!name || !category) {
      toast.error('Nombre y categoría son obligatorios');
      return;
    }
    setAddError(null);
    setAddLoading(true);
    const clinicIdForAdd: number | null = selectedClinic === 'Lima' ? null : (priceList?.clinic_id ?? clinicsWithIds.find((c) => c.name === selectedClinic)?.id ?? null);
    if (selectedClinic !== 'Lima' && clinicIdForAdd == null) {
      toast.error('No se pudo identificar la sede. Recarga la página o vuelve a seleccionarla.');
      setAddLoading(false);
      return;
    }
    try {
      await addPrice({
        test_name: name,
        category,
        clinic_id: clinicIdForAdd,
        ingreso: typeof newIngreso === 'number' ? newIngreso : parseFloat(String(newIngreso)) || 0,
        periodico: typeof newPeriodico === 'number' ? newPeriodico : parseFloat(String(newPeriodico)) || 0,
        retiro: typeof newRetiro === 'number' ? newRetiro : parseFloat(String(newRetiro)) || 0,
        scope: 'one',
        only_one_clinic: true,
      });
      setNewTestName('');
      setNewTestCategory('');
      setNewIngreso(0);
      setNewPeriodico(0);
      setNewRetiro(0);
      setAddTestModalOpen(false);
      toast.success('Prueba agregada');
      loadPriceList();
    } catch (err) {
      toast.error('No se pudo añadir la prueba');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalTest) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deletePrice({
        test_id: deleteModalTest.test_id,
        scope: deleteScope,
        clinic_id: deleteScope === 'clinic' ? priceList?.clinic_id : undefined,
      });
      setDeleteModalTest(null);
      toast.success('Precio eliminado');
      loadPriceList();
    } catch (err) {
      toast.error('No se pudo eliminar');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div>
        {toast.toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => toast.removeToast(t.id)}
          />
        ))}
        <AppHeader />
        <main className="app-content">
          <div className="container pruebas-page-container pruebas-dashboard" style={{ maxWidth: 1200 }}>
            {/* Cabecera: título + botones (mismas categorías de texto que página principal) */}
            <header className="pruebas-dashboard-header">
              <h1 className="pruebas-dashboard-title">Pruebas y precios</h1>
              <div className="pruebas-dashboard-actions">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm pruebas-btn-header"
                  onClick={() => { setAddClinicOpen(true); setNewClinicName(''); }}
                >
                  Añadir sede
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm pruebas-btn-header"
                  disabled={!selectedClinic}
                  title={!selectedClinic ? 'Selecciona una sede primero' : undefined}
                  onClick={() => setAddTestModalOpen(true)}
                >
                  Añadir prueba
                </button>
              </div>
            </header>

            {/* Selector de sede: misma forma de búsqueda que la página principal */}
            <div className="pruebas-dashboard-selector clinic-selector-wrap">
              <ClinicSelector
                clinics={['Lima', ...clinics.filter((c) => c !== 'Lima')]}
                selectedClinics={selectedClinic ? [selectedClinic] : []}
                onSelectedChange={(arr) => {
                  const next = arr[0] ?? '';
                  setSelectedClinic(next);
                  if (!next) setPriceList(null);
                }}
                label="Sede"
                placeholder="Seleccionar"
                singleSelection
              />
            </div>

            {/* Total (misma categoría texto que página principal) */}
            <div className="pruebas-dashboard-toolbar">
              <span className="pruebas-total-count">
                TOTAL: {listLoading ? '—' : (priceList?.tests.length ?? 0)}
              </span>
            </div>

            {/* Lista por categorías (mismo formato que página principal: section-title + catalog-card) */}
            <section className="mb-4">
              <h6 className="section-title">Precios por sede</h6>
            <div className="app-card catalog-card pruebas-prices-card">
              {listError && (
                <div className="alert alert-danger py-2 mb-3" role="alert">{listError}</div>
              )}
              {listLoading ? (
                <p className="text-muted small mb-0 py-4">Cargando precios…</p>
              ) : priceList && priceList.tests.length > 0 ? (
                <>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control form-control-sm app-input pruebas-catalog-search"
                      placeholder="Buscar prueba..."
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      aria-label="Buscar prueba"
                    />
                  </div>
                  <div className="accordion accordion-flush" id="pruebasPricesAccordion">
                    {priceGroups.map((g, idx) => {
                      const headerId = `pruebas-head-${g.key}-${idx}`;
                      const colId = `pruebas-col-${g.key}-${idx}`;
                      return (
                        <div
                          className="accordion-item border-0 border-bottom pruebas-accordion-item"
                          key={g.key}
                          style={{ borderColor: 'var(--border-light) !important' }}
                        >
                          <h2 className="accordion-header" id={headerId}>
                            <button
                              className="accordion-button collapsed py-2 bg-transparent shadow-none pruebas-accordion-btn"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#${colId}`}
                              aria-expanded="false"
                              aria-controls={colId}
                            >
                              <span className="fw-semibold small">{g.title}</span>
                              <span className="badge bg-secondary ms-2 pruebas-category-badge">{g.items.length}</span>
                            </button>
                          </h2>
                          <div
                            id={colId}
                            className="accordion-collapse collapse"
                            aria-labelledby={headerId}
                            data-bs-parent="#pruebasPricesAccordion"
                          >
                            <div className="accordion-body py-2">
                              {g.items.map((row) => {
                                const vals = editRows[row.test_id] ?? { ingreso: row.ingreso, periodico: row.periodico, retiro: row.retiro };
                                const isSaving = savingTestId === row.test_id;
                                return (
                                  <div
                                    key={row.test_id}
                                    className="d-flex align-items-center justify-content-between py-2 border-bottom border-light pruebas-price-row"
                                  >
                                    <span className="small pruebas-price-row-name">
                                      {row.test_name}
                                      {isSaving && <span className="text-muted small ms-1">Guardando…</span>}
                                    </span>
                                    <div className="d-flex align-items-center gap-2 flex-wrap pruebas-price-row-inputs">
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        className="form-control form-control-sm app-input text-end pruebas-price-input"
                                        value={vals.ingreso === 0 ? '' : vals.ingreso}
                                        onChange={(e) => setEditValue(row.test_id, 'ingreso', parseFloat(e.target.value) || 0)}
                                        onBlur={() => handleBlur(row.test_id)}
                                        placeholder="Ing."
                                        title="Ingreso"
                                        aria-label={`Ingreso ${row.test_name}`}
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        className="form-control form-control-sm app-input text-end pruebas-price-input"
                                        value={vals.periodico === 0 ? '' : vals.periodico}
                                        onChange={(e) => setEditValue(row.test_id, 'periodico', parseFloat(e.target.value) || 0)}
                                        onBlur={() => handleBlur(row.test_id)}
                                        placeholder="Per."
                                        title="Periódico"
                                        aria-label={`Periódico ${row.test_name}`}
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        className="form-control form-control-sm app-input text-end pruebas-price-input"
                                        value={vals.retiro === 0 ? '' : vals.retiro}
                                        onChange={(e) => setEditValue(row.test_id, 'retiro', parseFloat(e.target.value) || 0)}
                                        onBlur={() => handleBlur(row.test_id)}
                                        placeholder="Ret."
                                        title="Retiro"
                                        aria-label={`Retiro ${row.test_name}`}
                                      />
                                      <div className="position-relative pruebas-price-row-menu">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-muted p-1 pruebas-row-more"
                                          onClick={() => setContextMenuTest(contextMenuTest === row.test_id ? null : row.test_id)}
                                          aria-label="Más opciones"
                                          aria-expanded={contextMenuTest === row.test_id}
                                        >
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                                        </button>
                                        {contextMenuTest === row.test_id && (
                                          <div className="pruebas-context-menu" style={{ right: 0, top: '100%', marginTop: 4, minWidth: 120, zIndex: 1000 }}>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-link text-danger text-start w-100 text-decoration-none"
                                              onClick={() => {
                                                setDeleteModalTest(row);
                                                setDeleteScope('clinic');
                                                setDeleteError(null);
                                                setContextMenuTest(null);
                                              }}
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        )}
                                      </div>
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
                </>
              ) : priceList ? (
                <div className="pruebas-empty-state py-4 text-center">
                  <p className="text-muted small mb-1">No hay pruebas para esta sede.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddTestModalOpen(true)}>
                    Añadir prueba
                  </button>
                </div>
              ) : !selectedClinic ? (
                <p className="text-muted small mb-0 py-4">Selecciona una sede para ver los precios.</p>
              ) : null}
            </div>
            </section>

            {/* Buscar e Importar (misma categoría que página principal) */}
            <section className="pruebas-secondary mt-4">
              <h6 className="section-title mb-2">Buscar e importar</h6>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm app-input pruebas-search-input"
                    placeholder="Buscar prueba en todas las sedes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minWidth: 220 }}
                  />
                  {searchLoading && <span className="text-muted small">Buscando…</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={async () => {
                    setPriceImportError(null);
                    try {
                      await downloadPricesTemplate();
                      toast.success('Plantilla descargada');
                    } catch {
                      toast.error('No se pudo descargar');
                    }
                  }}
                >
                  Descargar plantilla
                </button>
                <input
                  type="file"
                  accept=".xlsx"
                  id="price-import-file"
                  className="d-none"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setPriceImportError(null);
                    setPriceImportResult(null);
                    setPriceImportLoading(true);
                    try {
                      const preview = await getImportPreview(file);
                      importPreviewFileRef.current = file;
                      setImportPreviewData(preview);
                      setShowOnlyErrors(false);
                      setImportPreviewOpen(true);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'No se pudo leer el archivo');
                    } finally {
                      setPriceImportLoading(false);
                    }
                  }}
                />
                <label htmlFor="price-import-file" className="btn btn-outline-primary btn-sm mb-0">
                  {priceImportLoading ? 'Cargando…' : 'Importar Excel'}
                </label>
              </div>
              {searchResults !== null && !searchLoading && searchQuery.trim().length >= 2 && (
                <div className="pruebas-search-results mt-3">
                  {searchResults.length === 0 ? (
                    <p className="text-muted small mb-0">Sin resultados.</p>
                  ) : (
                    searchResults.map((t) => (
                      <div key={t.test_id} className="pruebas-search-item py-2 border-bottom border-light">
                        <div className="pruebas-search-item-header">
                          <span className="fw-semibold small">{t.test_name}</span>
                          <span className="text-muted small ms-2">{t.category}</span>
                        </div>
                        {t.clinics_with_price.length > 0 && (
                          <div className="table-responsive mt-1">
                            <table className="table table-sm mb-0" style={{ fontSize: '0.75rem' }}>
                              <thead>
                                <tr>
                                  <th className="small text-muted">Sede</th>
                                  <th className="small text-end text-muted">Ingreso</th>
                                  <th className="small text-end text-muted">Periódico</th>
                                  <th className="small text-end text-muted">Retiro</th>
                                </tr>
                              </thead>
                              <tbody>
                                {t.clinics_with_price.map((c) => (
                                  <tr key={c.clinic_name}>
                                    <td className="small">{c.clinic_name}</td>
                                    <td className="text-end small">{c.ingreso}</td>
                                    <td className="text-end small">{c.periodico}</td>
                                    <td className="text-end small">{c.retiro}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {t.clinics_without_price.length > 0 && (
                          <div className="pruebas-search-sin-precio small text-muted mt-1">
                            Sin precio en: {t.clinics_without_price.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Modal Nueva sede — mismo formato que el resto de la plataforma */}
        {addClinicOpen && (
          <div className="modal show d-block app-modal app-modal-backdrop" role="dialog" aria-labelledby="pruebas-new-clinic-title" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 id="pruebas-new-clinic-title" className="modal-title">Nueva sede</h2>
                  <button type="button" className="btn-close" onClick={() => { setAddClinicOpen(false); setNewClinicName(''); }} aria-label="Cerrar" />
                </div>
                <div className="modal-body">
                  <label htmlFor="pruebas-new-clinic-input" className="form-label visually-hidden">Nombre de la sede</label>
                  <input
                    id="pruebas-new-clinic-input"
                    type="text"
                    className="form-control form-control-sm app-input"
                    placeholder="Nombre de la sede"
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('pruebas-add-clinic-submit')?.click())}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAddClinicOpen(false); setNewClinicName(''); }}>Cancelar</button>
                  <button
                    id="pruebas-add-clinic-submit"
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={addClinicLoading || !newClinicName.trim()}
                    onClick={async () => {
                      const name = newClinicName.trim();
                      if (!name) return;
                      setAddClinicLoading(true);
                      try {
                        await createClinic(name);
                        setAddClinicOpen(false);
                        setNewClinicName('');
                        toast.success('Sede añadida');
                        loadClinics();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'No se pudo crear la sede');
                      } finally {
                        setAddClinicLoading(false);
                      }
                    }}
                  >
                    {addClinicLoading ? 'Añadiendo…' : 'Añadir'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Añadir prueba */}
        {addTestModalOpen && (
          <div className="modal show d-block app-modal app-modal-backdrop" role="dialog" aria-labelledby="pruebas-add-test-title" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ maxWidth: 420 }}>
                <div className="modal-header py-2">
                  <h2 id="pruebas-add-test-title" className="modal-title h6">Añadir prueba</h2>
                  <button type="button" className="btn-close btn-close-sm" onClick={() => setAddTestModalOpen(false)} aria-label="Cerrar" />
                </div>
                <form onSubmit={handleAddPrice}>
                  <div className="modal-body py-2">
                    <p className="small text-muted mb-2">Se añadirá a la sede: <strong>{selectedClinic}</strong></p>
                    <div className="mb-2">
                      <label className="form-label small mb-1">Nombre</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newTestName}
                        onChange={(e) => setNewTestName(e.target.value)}
                        placeholder="Ej. Hemograma completo"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small mb-1">Categoría</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newTestCategory}
                        onChange={(e) => setNewTestCategory(e.target.value)}
                        placeholder="Ej. Hematología"
                        list="pruebas-categories"
                      />
                      {categories.length > 0 && (
                        <datalist id="pruebas-categories">
                          {categories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div className="row g-2">
                      <div className="col-4">
                        <label className="form-label small mb-1">Ingreso</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="form-control form-control-sm text-end"
                          value={newIngreso === '' ? '' : newIngreso}
                          onChange={(e) => setNewIngreso(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Periódico</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="form-control form-control-sm text-end"
                          value={newPeriodico === '' ? '' : newPeriodico}
                          onChange={(e) => setNewPeriodico(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Retiro</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="form-control form-control-sm text-end"
                          value={newRetiro === '' ? '' : newRetiro}
                          onChange={(e) => setNewRetiro(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer py-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddTestModalOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={addLoading}>
                      {addLoading ? 'Añadiendo…' : 'Añadir'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {deleteModalTest && (
          <div className="modal show d-block app-modal app-modal-backdrop pruebas-delete-modal">
            <div className="modal-dialog modal-dialog-centered modal-sm pruebas-delete-dialog">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h6 className="modal-title small">{deleteModalTest.test_name}</h6>
                  <button type="button" className="btn-close btn-close-sm" onClick={() => { setDeleteModalTest(null); setDeleteError(null); }}></button>
                </div>
                <div className="modal-body py-2 small">
                  <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                    Lima es una sede. Las demás son sedes de provincia.
                  </p>
                  {selectedClinic === 'Lima' ? (
                    <>
                      <div className="form-check mb-1">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-clinic" value="clinic" checked={deleteScope === 'clinic'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-clinic">Lima</label>
                      </div>
                      <div className="form-check mb-1">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-provincia" value="all_provincia" checked={deleteScope === 'all_provincia'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-provincia">Todas las sedes de provincia</label>
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-all" value="all" checked={deleteScope === 'all'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-all">Lima y todas las sedes de provincia</label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-check mb-1">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-clinic" value="clinic" checked={deleteScope === 'clinic'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-clinic">Solo esta sede ({selectedClinic})</label>
                      </div>
                      <div className="form-check mb-1">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-lima" value="lima" checked={deleteScope === 'lima'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-lima">Lima</label>
                      </div>
                      <div className="form-check mb-1">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-provincia" value="all_provincia" checked={deleteScope === 'all_provincia'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-provincia">Todas las sedes de provincia</label>
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="radio" name="deleteScope" id="scope-all" value="all" checked={deleteScope === 'all'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                        <label className="form-check-label" htmlFor="scope-all">Lima y todas las sedes de provincia</label>
                      </div>
                    </>
                  )}
                  {deleteError && <div className="text-danger small mb-1">{deleteError}</div>}
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setDeleteModalTest(null); setDeleteError(null); }} disabled={deleteLoading}>Cancelar</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteConfirm} disabled={deleteLoading}>{deleteLoading ? '…' : 'Eliminar'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {importPreviewOpen && importPreviewData && (
          <div className="modal show d-block app-modal app-modal-backdrop import-preview-modal" role="dialog" aria-labelledby="import-preview-title" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg import-preview-dialog">
              <div className="modal-content import-preview-content">
                <div className="modal-header import-preview-header">
                  <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                    <h5 id="import-preview-title" className="modal-title import-preview-title">Importar precios desde Excel</h5>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm import-preview-download"
                        onClick={async () => {
                          try {
                            await downloadPricesTemplate();
                            toast.success('Plantilla descargada');
                          } catch {
                            toast.error('No se pudo descargar');
                          }
                        }}
                      >
                        Descargar plantilla
                      </button>
                      <button type="button" className="btn-close" onClick={() => { setImportPreviewOpen(false); setImportPreviewData(null); importPreviewFileRef.current = null; }} aria-label="Cerrar" />
                    </div>
                  </div>
                </div>
                <div className="modal-body import-preview-body">
                  <div className="import-preview-summary">
                    <span className="import-preview-summary-label">Vista previa</span>
                    <div className="import-preview-badges">
                      <span className="import-preview-badge import-preview-badge-valid">
                        {importPreviewData.validCount} válida{importPreviewData.validCount !== 1 ? 's' : ''}
                      </span>
                      <span className="import-preview-badge import-preview-badge-invalid">
                        {importPreviewData.invalidCount} inválida{importPreviewData.invalidCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="form-check form-switch import-preview-toggle">
                    <input className="form-check-input" type="checkbox" id="show-only-errors" checked={showOnlyErrors} onChange={(e) => setShowOnlyErrors(e.target.checked)} />
                    <label className="form-check-label" htmlFor="show-only-errors">Mostrar sólo errores</label>
                  </div>
                  <div className="import-preview-table-wrap">
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 import-preview-table">
                        <thead>
                          <tr>
                            <th>Prueba</th>
                            <th>Categoría</th>
                            <th>Clínica</th>
                            <th>Ingreso</th>
                            <th>Periódico</th>
                            <th>Retiro</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showOnlyErrors ? importPreviewData.rows.filter((r) => !r.valid) : importPreviewData.rows).map((row, i) => (
                            <tr key={i} className={row.valid ? '' : 'import-preview-row-error'}>
                              <td>{String(row.prueba)}</td>
                              <td>{String(row.categoria)}</td>
                              <td>{String(row.clinica || 'Lima')}</td>
                              <td>{Number(row.ingreso)}</td>
                              <td>{Number(row.periodico)}</td>
                              <td>{Number(row.retiro)}</td>
                              <td>
                                {row.valid ? (
                                  <span className="import-preview-status-ok">OK</span>
                                ) : (
                                  <span className="import-preview-status-error">{row.error || '—'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="modal-footer import-preview-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setImportPreviewOpen(false); setImportPreviewData(null); importPreviewFileRef.current = null; }}>Cancelar</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={importConfirmLoading || importPreviewData.validCount === 0}
                    onClick={async () => {
                      const file = importPreviewFileRef.current;
                      if (!file) return;
                      setImportConfirmLoading(true);
                      try {
                        const res = await importPricesFile(file);
                        setImportPreviewOpen(false);
                        setImportPreviewData(null);
                        importPreviewFileRef.current = null;
                        toast.success(`${res.imported} importado(s)`);
                        loadClinics();
                        loadPriceList();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'No se pudo importar');
                      } finally {
                        setImportConfirmLoading(false);
                      }
                    }}
                  >
                    {importConfirmLoading ? 'Importando…' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
