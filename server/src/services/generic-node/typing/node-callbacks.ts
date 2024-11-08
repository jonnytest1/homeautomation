import type { NodeEvent } from '../node-event';
import type { CallTrace } from '../node-trace';


export type Callbacks = {
  continue: (evt: NodeEvent, index?: number) => void
  updateNode(frontendEmit?: boolean),
  trace: CallTrace
}
