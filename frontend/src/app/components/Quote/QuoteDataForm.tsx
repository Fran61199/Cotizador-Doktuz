'use client';

import type { Location } from '@/types';
import ClinicSelector from './ClinicSelector';

type QuoteDataFormProps = {
  company: string;
  recipient: string;
  executive: string;
  location: Location;
  selectedClinics: string[];
  clinics: string[];
  onCompanyChange: (v: string) => void;
  onRecipientChange: (v: string) => void;
  onLocationChange: (v: Location) => void;
  onSelectedClinicsChange: (clinics: string[]) => void;
};

export default function QuoteDataForm({
  company,
  recipient,
  executive,
  location,
  selectedClinics,
  clinics,
  onCompanyChange,
  onRecipientChange,
  onLocationChange,
  onSelectedClinicsChange,
}: QuoteDataFormProps) {
  return (
    <section className="mb-4">
      <h6 className="section-title">1. Datos de la cotización</h6>
      <div className="row g-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">Empresa</label>
          <input
            className="form-control form-control-sm app-input"
            placeholder="Nombre de la empresa"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">Destinatario</label>
          <input
            className="form-control form-control-sm app-input"
            placeholder="Nombre del destinatario"
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label small text-muted mb-1">Ejecutivo</label>
          <div className="form-control form-control-sm app-input bg-light text-body" style={{ minHeight: '31px', lineHeight: '1.5' }}>
            {executive}
          </div>
        </div>
        <div className="col-md-2">
          <label className="form-label small text-muted mb-1">Sede</label>
          <div className="pill-group">
            <button
              type="button"
              className={`pill-btn ${location === 'Lima' ? 'active' : ''}`}
              onClick={() => onLocationChange('Lima')}
            >
              Lima
            </button>
            <button
              type="button"
              className={`pill-btn ${location === 'Provincia' ? 'active' : ''}`}
              onClick={() => onLocationChange('Provincia')}
            >
              Provincia
            </button>
          </div>
        </div>
      </div>

      {location === 'Provincia' && (
        <div className="row g-3 mt-2">
          <div className="col-md-8 col-lg-6">
            <ClinicSelector
              clinics={clinics}
              selectedClinics={selectedClinics}
              onSelectedChange={onSelectedClinicsChange}
              label="Sedes en provincia"
              placeholder="Buscar sede en provincia..."
            />
          </div>
        </div>
      )}
    </section>
  );
}
