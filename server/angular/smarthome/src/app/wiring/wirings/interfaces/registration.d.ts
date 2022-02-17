import { Wiring } from '../wiring.a';

export interface RegisterOptions {
  nodes: Array<any>;
  until: Wiring;
  from?: any;

  parrallelLevel: number

  registrationTimestamp: number
}