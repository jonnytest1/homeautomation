import { Collection } from './collection';
import { Wiring } from './wiring.a';


export interface StrucureReturn extends Array<Wiring | StrucureReturn> { }


export abstract class ControlCollection extends Collection {


    abstract getStructure(detailed?: boolean): StrucureReturn



}