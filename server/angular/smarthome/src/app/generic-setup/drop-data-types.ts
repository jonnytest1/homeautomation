import type { NodeDefintion } from '../settings/interfaces'


export interface DropData {
  dragOffset: { x: number, y: number }
  node: Node,


  connectionDrag: true
  nodeDrag: true

  nodeDefinition: NodeDefintion
}