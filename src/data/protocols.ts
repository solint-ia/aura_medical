import { PRICE_PER_VIAL, type EnzymeId } from "./enzymes";

export interface ProtocolComponent {
  enzyme: EnzymeId;
  vials: number;
}

export interface Protocol {
  id: string;
  name: string;
  composition: ProtocolComponent[];
  sessions: string;
  /** Kit price in BRL, already agreed with the commercial team. */
  totalPrice: number;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "queixo-duplo",
    name: "Queixo Duplo",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "perfilamento-facial",
    name: "Perfilamento Facial",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "gordura-localizada",
    name: "Gordura Localizada",
    composition: [
      { enzyme: "slim", vials: 2 },
      { enzyme: "smooth", vials: 1 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "2 a 8 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "celulite",
    name: "Celulite",
    composition: [
      { enzyme: "slim", vials: 4 },
      { enzyme: "smooth", vials: 4 },
      { enzyme: "drain", vials: 2 },
    ],
    sessions: "2 a 4 sessões · a cada 2 semanas · ambas as pernas",
    totalPrice: 3900,
  },
  {
    id: "cicatrizes",
    name: "Cicatrizes",
    composition: [
      { enzyme: "smooth", vials: 3 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "4 sessões · a cada 2 semanas",
    totalPrice: 1560,
  },
  {
    id: "fibrose-pos-cirurgica",
    name: "Fibrose Pós-Cirúrgica",
    composition: [
      { enzyme: "slim", vials: 1 },
      { enzyme: "smooth", vials: 3 },
      { enzyme: "drain", vials: 1 },
    ],
    sessions: "6 sessões · a cada 2 semanas",
    totalPrice: 1950,
  },
];

export function countVials(protocol: Protocol): number {
  return protocol.composition.reduce((total, item) => total + item.vials, 0);
}

export { PRICE_PER_VIAL };
