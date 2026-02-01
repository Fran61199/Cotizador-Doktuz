'use client';

import type { Test, TestSelection } from '@/types';

const CRA_LETTERS: Record<string, string> = {
  condicional: 'C',
  requisito: 'R',
  adicional: 'A',
};

type ClinicPricesTableProps = {
  selections: TestSelection[];
  selectedClinics: string[];
  pricesByClinic: Record<string, Test[]>;
};

export default function ClinicPricesTable({
  selections,
  selectedClinics,
  pricesByClinic,
}: ClinicPricesTableProps) {
  return (
    <div className="mt-3 pt-3 border-top" >
      <h6 className="fw-semibold mb-2 small">Precios por clínica</h6>
      <div
        className="table-responsive"
        style={{ maxHeight: 280, overflow: 'auto' }}
      >
        <table className="table table-sm">
          <thead>
            <tr>
              <th className="small">Prueba</th>
              <th className="small">Tipo</th>
              {selectedClinics.map((c) => (
                <th key={c} className="small">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selections.flatMap((s) => {
              const types = s.types as Array<'ingreso' | 'periodico' | 'retiro'>;
              const isCra = ['condicional', 'requisito', 'adicional'].includes(
                s.classification ?? ''
              );
              const letter = isCra ? CRA_LETTERS[s.classification ?? ''] ?? '' : '';
              return types.map((t) => (
                <tr key={`${s.id}-${t}`}>
                  <td className="small">{s.name}</td>
                  <td className="small text-capitalize text-muted">{t}</td>
                  {selectedClinics.map((clinicName) => {
                    if (isCra)
                      return (
                        <td key={clinicName} className="small">
                          {letter}
                        </td>
                      );
                    const test = (pricesByClinic[clinicName] ?? []).find(
                      (x: Test) => x.name === s.name
                    );
                    const price = test?.prices?.[t];
                    return (
                      <td key={clinicName} className="small">
                        {price != null
                          ? `S/ ${Number(price).toFixed(2)}`
                          : '-'}
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
