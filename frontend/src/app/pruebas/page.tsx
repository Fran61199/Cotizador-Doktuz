'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '../components/Layout/AppHeader';
import AuthGuard from '../components/AuthGuard';
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
  searchTests,
} from '@/api';
import type { PriceRow, PricesListResult, SearchTestResult, ImportPreviewRow } from '@/api';

export default function PruebasPage() {
  const toast = useToast();
  const [priceImportResult, setPriceImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [priceImportLoading, setPriceImportLoading] = useState(false);
  const [priceImportError, setPriceImportError] = useState<string | null>(null);

  const [clinics, setClinics] = useState<string[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('Lima');
  const [priceList, setPriceList] = useState<PricesListResult | null>(null);
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

  const loadClinics = useCallback(() => {
    getClinics()
      .then((names) => setClinics(names || []))
      .catch(() => setClinics([]));
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

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTestName.trim();
    const category = newTestCategory.trim();
    if (!name || !category) {
      toast.error('Nombre y categoría son obligatorios');
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      await addPrice({
        test_name: name,
        category,
        clinic_id: priceList?.clinic_id ?? null,
        ingreso: typeof newIngreso === 'number' ? newIngreso : parseFloat(String(newIngreso)) || 0,
        periodico: typeof newPeriodico === 'number' ? newPeriodico : parseFloat(String(newPeriodico)) || 0,
        retiro: typeof newRetiro === 'number' ? newRetiro : parseFloat(String(newRetiro)) || 0,
      });
      setNewTestName('');
      setNewTestCategory('');
      setNewIngreso(0);
      setNewPeriodico(0);
      setNewRetiro(0);
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
          <div className="container pruebas-page-container" style={{ maxWidth: 1200 }}>
            <section className="mb-4 pruebas-section">
              <h6 className="section-title">1. Buscar prueba</h6>
              <div className="app-card pruebas-search-card">
                <input
                  type="text"
                  className="form-control form-control-sm app-input pruebas-search-input"
                  placeholder="Buscar por nombre…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchLoading && <span className="text-muted small ms-2">Buscando…</span>}
                {searchResults !== null && !searchLoading && (
                  <div className="pruebas-search-results mt-3">
                    {searchResults.length === 0 ? (
                      <span className="text-muted small">Sin resultados</span>
                    ) : (
                      searchResults.map((t) => (
                        <div key={t.test_id} className="pruebas-search-item">
                          <div className="pruebas-search-item-header">
                            <span className="fw-semibold small">{t.test_name}</span>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>{t.category}</span>
                          </div>
                          {t.clinics_with_price.length > 0 && (
                            <div className="table-responsive">
                              <table className="table table-sm align-middle mb-1" style={{ fontSize: '0.75rem' }}>
                                <thead>
                                  <tr>
                                    <th className="small text-muted">Clínica</th>
                                    <th className="small text-end text-muted">Ing.</th>
                                    <th className="small text-end text-muted">Per.</th>
                                    <th className="small text-end text-muted">Ret.</th>
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
                            <div className="pruebas-search-sin-precio">
                              <span className="small text-muted">Sin precio:</span>
                              <span className="ms-1">{t.clinics_without_price.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="mb-4 pruebas-section">
              <h6 className="section-title">2. Importar precios</h6>
              <div className="app-card pruebas-import-card">
                <div className="pruebas-import-actions d-flex flex-wrap align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm pruebas-import-btn"
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
                    Plantilla .xlsx
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
                  <label htmlFor="price-import-file" className="btn btn-primary btn-sm mb-0 pruebas-import-btn">
                    {priceImportLoading ? 'Cargando…' : 'Cargar'}
                  </label>
                  {priceImportResult && priceImportResult.errors.length > 0 && (
                    <span className="small text-warning pruebas-import-errors">
                      {priceImportResult.errors.length} error(es)
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="pruebas-section">
              <h6 className="section-title">3. Precios por sede</h6>
              <div className="app-card">
              <div className="pruebas-toolbar mb-3">
                <select
                  className="form-select form-select-sm app-input pruebas-clinic-select"
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                >
                  <option value="Lima">Lima</option>
                  {clinics.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="position-relative pruebas-table-search-wrap">
                  <span className="position-absolute top-50 start-0 translate-middle-y ps-2 text-muted pruebas-search-icon" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm app-input pruebas-table-search-input"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Buscar en tabla…"
                  />
                </div>
                <form onSubmit={handleAddPrice} className="pruebas-form-add">
                  <input
                    type="text"
                    className="form-control form-control-sm app-input pruebas-input-name"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="Nueva prueba"
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm app-input pruebas-input-category"
                    value={newTestCategory}
                    onChange={(e) => setNewTestCategory(e.target.value)}
                    placeholder="Categoría"
                    list="pruebas-categories"
                  />
                  {categories.length > 0 && (
                    <datalist id="pruebas-categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  )}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="form-control form-control-sm app-input text-end pruebas-input-ing"
                    value={newIngreso === '' ? '' : newIngreso}
                    onChange={(e) => setNewIngreso(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="Ing"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="form-control form-control-sm app-input text-end pruebas-input-per"
                    value={newPeriodico === '' ? '' : newPeriodico}
                    onChange={(e) => setNewPeriodico(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="Per"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="form-control form-control-sm app-input text-end pruebas-input-ret"
                    value={newRetiro === '' ? '' : newRetiro}
                    onChange={(e) => setNewRetiro(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="Ret"
                  />
                  <button type="submit" className="btn btn-primary btn-sm pruebas-btn-add" disabled={addLoading}>
                    {addLoading ? '…' : '+'}
                  </button>
                </form>
              </div>

              {listError && (
                <div className="text-danger small mb-2">{listError}</div>
              )}
              {listLoading ? (
                <span className="text-muted small">Cargando…</span>
              ) : priceList && priceList.tests.length > 0 ? (
                <div className="table-responsive pruebas-table-wrap">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="small text-muted">Prueba</th>
                        <th className="small text-muted">Categoría</th>
                        <th className="small text-end text-muted">Ing.</th>
                        <th className="small text-end text-muted">Per.</th>
                        <th className="small text-end text-muted">Ret.</th>
                        <th className="small" style={{ width: 32 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceList.tests
                        .filter((row) => {
                          const q = tableSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return row.test_name.toLowerCase().includes(q) || row.category.toLowerCase().includes(q);
                        })
                        .map((row) => {
                        const vals = editRows[row.test_id] ?? { ingreso: row.ingreso, periodico: row.periodico, retiro: row.retiro };
                        const isSaving = savingTestId === row.test_id;
                        return (
                          <tr key={row.test_id}>
                            <td>
                              <span className="fw-semibold small">{row.test_name}</span>
                              {isSaving && <span className="ms-1 text-success small">…</span>}
                            </td>
                            <td className="text-muted small">{row.category}</td>
                            <td style={{ width: 72 }}>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="form-control form-control-sm app-input text-end"
                                value={vals.ingreso === 0 ? '' : vals.ingreso}
                                onChange={(e) => setEditValue(row.test_id, 'ingreso', parseFloat(e.target.value) || 0)}
                                onBlur={() => handleBlur(row.test_id)}
                                placeholder="0"
                              />
                            </td>
                            <td style={{ width: 72 }}>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="form-control form-control-sm app-input text-end"
                                value={vals.periodico === 0 ? '' : vals.periodico}
                                onChange={(e) => setEditValue(row.test_id, 'periodico', parseFloat(e.target.value) || 0)}
                                onBlur={() => handleBlur(row.test_id)}
                                placeholder="0"
                              />
                            </td>
                            <td style={{ width: 72 }}>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="form-control form-control-sm app-input text-end"
                                value={vals.retiro === 0 ? '' : vals.retiro}
                                onChange={(e) => setEditValue(row.test_id, 'retiro', parseFloat(e.target.value) || 0)}
                                onBlur={() => handleBlur(row.test_id)}
                                placeholder="0"
                              />
                            </td>
                            <td className="text-center position-relative">
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-muted p-0"
                                onClick={() => setContextMenuTest(contextMenuTest === row.test_id ? null : row.test_id)}
                              >
                                ⋮
                              </button>
                              {contextMenuTest === row.test_id && (
                                <div className="position-absolute bg-white border rounded shadow-sm" style={{ right: 0, top: '100%', zIndex: 1000, minWidth: 100, marginTop: 2 }}>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : priceList ? (
                <span className="text-muted small">Sin pruebas</span>
              ) : null}
              </div>
            </section>
          </div>
        </main>

        {deleteModalTest && (
          <div className="modal show d-block pruebas-delete-modal" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-sm pruebas-delete-dialog">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h6 className="modal-title small">{deleteModalTest.test_name}</h6>
                  <button type="button" className="btn-close btn-close-sm" onClick={() => { setDeleteModalTest(null); setDeleteError(null); }}></button>
                </div>
                <div className="modal-body py-2 small">
                  <div className="form-check mb-1">
                    <input className="form-check-input" type="radio" name="deleteScope" id="scope-clinic" value="clinic" checked={deleteScope === 'clinic'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                    <label className="form-check-label" htmlFor="scope-clinic">Solo esta sede ({priceList?.clinic || 'Lima'})</label>
                  </div>
                  <div className="form-check mb-1">
                    <input className="form-check-input" type="radio" name="deleteScope" id="scope-lima" value="lima" checked={deleteScope === 'lima'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                    <label className="form-check-label" htmlFor="scope-lima">Solo Lima</label>
                  </div>
                  <div className="form-check mb-1">
                    <input className="form-check-input" type="radio" name="deleteScope" id="scope-provincia" value="all_provincia" checked={deleteScope === 'all_provincia'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                    <label className="form-check-label" htmlFor="scope-provincia">Todas provincia</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="deleteScope" id="scope-all" value="all" checked={deleteScope === 'all'} onChange={(e) => setDeleteScope(e.target.value as any)} />
                    <label className="form-check-label" htmlFor="scope-all">Todas partes</label>
                  </div>
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
          <div className="modal show d-block import-preview-modal" role="dialog" aria-labelledby="import-preview-title" aria-modal="true">
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
