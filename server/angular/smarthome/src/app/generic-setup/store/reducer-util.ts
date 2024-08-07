import type { NodeData } from '../../settings/interfaces'
import type { GenericNodeState } from './reducers'

export function patchNode(st: GenericNodeState, node: string, callback: (n: NodeData["nodes"][number]) => NodeData["nodes"][number]): GenericNodeState {

  return {
    ...st,
    nodes: (st.nodes ?? []).map(stNode => {
      if (stNode.uuid === node) {
        return callback(stNode)
      }
      return stNode
    })

  }
}
