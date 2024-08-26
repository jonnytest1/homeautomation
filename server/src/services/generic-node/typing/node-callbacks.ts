import type { NodeEvent } from '../node-event';


export type Callbacks = {
  continue: (evt: NodeEvent, index?: number) => void
  updateNode(frontendEmit?: boolean)
}
