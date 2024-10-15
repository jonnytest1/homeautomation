import { Wiring } from '../wiring.a';




type REgistrationNode = { name: string, details?: any } | Array<REgistrationNode>


export interface RegisterOptions {
  nodes: Array<REgistrationNode>;
  until: Wiring;
  from?: any;

  parrallelLevel: number

  registrationTimestamp: number


  withSerialise: boolean
}