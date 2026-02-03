'use client';

import { useEffect, useState } from 'react';
import { getCatalog, getClinics } from '@/api';
import type { Location, Test } from '@/types';

export function useCatalog(
  location: Location,
  selectedClinics: string[],
  clinicForDisplay: string,
  margin: number
) {
  const [catalog, setCatalog] = useState<Test[]>([]);
  const [clinics, setClinics] = useState<string[]>([]);
  const [pricesByClinic, setPricesByClinic] = useState<Record<string, Test[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClinics()
      .then(setClinics)
      .catch(() => setClinics([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const clinic = clinicForDisplay || selectedClinics[0] || '';
    getCatalog({
      location,
      clinic: location === 'Provincia' ? clinic : undefined,
      margin: location === 'Provincia' ? margin : undefined,
    })
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar el catálogo. Intenta de nuevo.');
          setCatalog([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location, selectedClinics, clinicForDisplay, margin]);

  // Cargar precios por clínica (Provincia, múltiples clínicas)
  useEffect(() => {
    if (location !== 'Provincia' || selectedClinics.length === 0) {
      setPricesByClinic({});
      return;
    }
    Promise.all(
      selectedClinics.map((clinicName) =>
        getCatalog({ location, clinic: clinicName, margin })
      )
    ).then((results) => {
      const res: Record<string, Test[]> = {};
      selectedClinics.forEach((name, i) => {
        res[name] = results[i] ?? [];
      });
      setPricesByClinic(res);
    });
  }, [location, selectedClinics, margin]);

  return { catalog, clinics, pricesByClinic, loading, error, setError };
}
