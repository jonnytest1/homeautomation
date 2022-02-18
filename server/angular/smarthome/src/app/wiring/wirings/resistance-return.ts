import type { ResistanceReturn } from './wiring.a';

export function noConnection(): ResistanceReturn {
  return {
    resistance: NaN,
    afterBlock: []
  }
}


export function noResistance(): ResistanceReturn {
  return {
    resistance: 0,
    afterBlock: []
  }
}