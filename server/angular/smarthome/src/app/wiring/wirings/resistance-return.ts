import type { ResistanceReturn, Wiring } from './wiring.a';

export function noConnection(obj: Wiring): ResistanceReturn {
  return {
    resistance: NaN,
    afterBlock: [],
    steps: [obj]
  }
}


export function noResistance(obj: Wiring): ResistanceReturn {
  return {
    resistance: 0,
    afterBlock: [],
    steps: [obj]
  }
}