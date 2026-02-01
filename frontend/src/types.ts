export type PriceType = 'ingreso'|'periodico'|'retiro';
export type Test = { id:number; name:string; category:string; clinic?:string; prices: Record<PriceType, number>; };
export type TestSelection = { id:number; testId:number; name:string; category:string; protocol:string; types:PriceType[]; prices:Record<PriceType,number>; classification: string | null; detail:string; overrides?: Partial<Record<PriceType, number>>; };
export type GenerationPayload = {
  company: string;
  recipient: string;
  executive: string;          // NOMBRE_COMERCIAL
  executive_title?: string;   // PUESTO_COMERCIAL
  location: Location;
  selections: TestSelection[];
  protocols: { name: string }[];
  images: any[];
  proposal_number: string;
  clinics?: string[];         // sedes en provincia para totales por clínica
  margin?: number;            // margen % para sedes en provincia
};
/** Lima = sede Lima de la clínica; Provincia = sedes en provincia */
export type Location = 'Lima'|'Provincia';
