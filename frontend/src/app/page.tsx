'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Location } from '@/types';
import AppHeader from './components/Layout/AppHeader';
import AuthGuard from './components/AuthGuard';
import SummaryTable from './components/Summary/SummaryTable';
import ProtocolsManager from './components/Protocols/ProtocolsManager';
import AccordionCatalog from './components/Catalog/AccordionCatalog';
import QuoteDataForm from './components/Quote/QuoteDataForm';
import Toast from '@/components/Toast';
import { useCatalog, useGeneration, useProtocols, useSelections, useToast } from '@/hooks';
import { getExecutiveTitle, getExecutiveFromSession } from '@/utils/executiveTitle';

export default function Page() {
  const { data: session } = useSession();
  const toast = useToast();
  const [company, setCompany] = useState('');
  const [recipient, setRecipient] = useState('');
  const [location, setLocation] = useState<Location>('Lima');
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);
  const [margin, setMargin] = useState<number | string>(20);
  const [clinicForDisplay, setClinicForDisplay] = useState('');

  const executive = getExecutiveFromSession(session?.user?.email, session?.user?.name);

  const {
    catalog,
    clinics,
    pricesByClinic,
    loading,
    error: catalogError,
    setError: setCatalogError,
  } = useCatalog(location, selectedClinics, clinicForDisplay, typeof margin === 'number' && margin >= 20 ? margin : 20);

  const protocols = useProtocols();
  const selections = useSelections(protocols.activeProtocol);

  const { generate, generating } = useGeneration();

  const handleRemoveProtocol = useCallback(
    (n: string) => {
      protocols.removeProtocol(n);
      selections.filterByProtocol(n);
    },
    [protocols.removeProtocol, selections.filterByProtocol]
  );

  const handleRenameProtocol = useCallback(
    (oldName: string, newName: string) => {
      protocols.renameProtocol(oldName, newName);
      selections.renameProtocolInSelections(oldName, newName);
    },
    [protocols.renameProtocol, selections.renameProtocolInSelections]
  );

  useEffect(() => {
    if (!clinicForDisplay || !selectedClinics.includes(clinicForDisplay)) {
      setClinicForDisplay(selectedClinics[0] || '');
    }
  }, [selectedClinics, clinicForDisplay]);

  useEffect(() => {
    selections.syncWithCatalog(catalog);
  }, [catalog]);

  const handleGenerate = async () => {
    if (!company || !recipient || !executive) {
      toast.error('Completa Empresa, Destinatario y Ejecutivo');
      return;
    }
    if (selections.selections.length === 0) {
      toast.error('Selecciona al menos una prueba');
      return;
    }
    try {
      await generate({
        company,
        recipient,
        executive,
        executive_title: getExecutiveTitle(executive),
        location,
        selections: selections.selections,
        protocols: protocols.protocols,
        images: [],
        clinics:
          location === 'Provincia' && selectedClinics.length > 0
            ? selectedClinics
            : undefined,
        margin: location === 'Provincia' ? (typeof margin === 'number' && margin >= 20 ? margin : 20) : undefined,
      });
      toast.success('Cotización generada');
    } catch {
      toast.error('No se pudo generar el documento');
    }
  };

  // Mostrar errores de catálogo como toast
  useEffect(() => {
    if (catalogError) {
      toast.error(catalogError);
      setCatalogError(null);
    }
  }, [catalogError, setCatalogError, toast]);

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
      <AppHeader onGenerate={handleGenerate} generating={generating} />
      <main className="app-content">
        <div className="container" style={{ maxWidth: 1200 }}>
          <QuoteDataForm
            company={company}
            recipient={recipient}
            executive={executive}
            location={location}
            selectedClinics={selectedClinics}
            clinics={clinics}
            onCompanyChange={setCompany}
            onRecipientChange={setRecipient}
            onLocationChange={setLocation}
            onSelectedClinicsChange={setSelectedClinics}
          />

          <section className="mb-4">
            <h6 className="section-title">2. Creación de protocolos</h6>
            <ProtocolsManager
              protocols={protocols.protocols}
              active={protocols.activeProtocol}
              onSetActive={protocols.setActiveProtocol}
              onAdd={protocols.addProtocol}
              onRemove={handleRemoveProtocol}
              onRename={handleRenameProtocol}
              onReorder={protocols.reorderProtocols}
            />
          </section>

          <section>
            <h6 className="section-title">3. Elegir pruebas y revisar</h6>
            <div className="row g-3">
          <div className="col-lg-7">
            <div className="app-card catalog-card">
              {location === 'Provincia' && selectedClinics.length === 0 ? (
                <div className="catalog-placeholder">
                  <p className="catalog-placeholder-text">Para elegir pruebas en provincia, primero selecciona una o más sedes arriba.</p>
                </div>
              ) : (
                <>
                  {location === 'Provincia' && selectedClinics.length > 1 && (
                    <div className="mb-2 catalog-clinic-select-wrap">
                      <select
                        className="form-select form-select-sm app-input catalog-clinic-select"
                        value={clinicForDisplay || selectedClinics[0]}
                        onChange={(e) => setClinicForDisplay(e.target.value)}
                        style={{
                          minWidth: (() => {
                            const name = clinicForDisplay || selectedClinics[0] || '';
                            const fullLen = 'Sede provincia: '.length + name.length;
                            return Math.min(480, Math.max(240, fullLen * 9));
                          })(),
                          width: 'auto',
                        }}
                      >
                        {selectedClinics.map((c) => (
                          <option key={c} value={c}>
                            Sede provincia: {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {loading ? (
                    <div className="text-muted small">Cargando catálogo…</div>
                  ) : (
                    <AccordionCatalog
                      catalog={catalog}
                      selectionsForActive={selections.selectionsMap}
                      onToggleType={selections.onToggleType}
                    />
                  )}
                </>
              )}
              </div>
              </div>
              <div className="col-lg-5">
            <div className="app-card selection-card overflow-auto">
              <header className="selection-card-header">
                <h6 className="selection-card-title">Tu selección</h6>
                {location === 'Provincia' && selectedClinics.length > 0 && (
                  <div className="selection-card-margin">
                    <label className="selection-card-margin-label" title="Margen para sedes en provincia">Margen %</label>
                    <input
                      type="number"
                      className="form-control form-control-sm app-input selection-card-margin-input"
                      value={margin}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setMargin('');
                          return;
                        }
                        const v = parseFloat(raw);
                        setMargin(Number.isNaN(v) ? raw : v);
                      }}
                      onBlur={() => {
                        const v = typeof margin === 'string' ? (margin === '' ? NaN : parseFloat(margin)) : margin;
                        if (margin === '' || Number.isNaN(v) || v < 20) setMargin(20);
                      }}
                    />
                  </div>
                )}
              </header>
              {location === 'Provincia' && selectedClinics.length === 0 ? (
                <div className="selection-empty">
                  Selecciona al menos una sede en provincia para ver tu selección.
                </div>
              ) : (
                <SummaryTable
                  selections={selections.selectionsActive}
                  onRemove={selections.removeSel}
                  onClassChange={selections.changeClass}
                  onDetailChange={selections.changeDetail}
                />
              )}
              </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
