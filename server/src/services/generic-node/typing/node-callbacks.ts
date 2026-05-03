import type { CallTrace } from './trace';
import type { NodeEvent } from '../node-event';


export type Callbacks = {
  continue: (evt: NodeEvent, index?: number) => void
  updateNode(frontendEmit?: boolean),
  trace: CallTrace

  emitPromises?: Array<Promise<void>>
}
