import { Collection } from './collection';
import type { Wiring } from './wiring.a';


export interface StrucureReturn extends Array<Wiring | StrucureReturn | { parrallel: StrucureReturn }> {}


export abstract class ControlCollection extends Collection {

  abstract getStructure(detailed?: boolean): StrucureReturn;

}
