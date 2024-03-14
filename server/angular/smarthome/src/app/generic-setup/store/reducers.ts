import { createReducer, on } from '@ngrx/store';
import { backendActions, setNodeData, updateNode, updateNodeDef } from './action';
import { Connection, NodeData, type ElementNode, type NodeDefintion } from '../../settings/interfaces';
import { isSameConnection } from '../line/line-util';


export interface GenericNodeState extends NodeData {
  nodeDefinitions: Record<string, NodeDefintion>
}


const initialState: GenericNodeState = {
  connections: [],
  nodes: [],
  globals: {},
  nodeDefinitions: {}
}


function patchNode(st: GenericNodeState, node: string, callback: (n: NodeData["nodes"][number]) => NodeData["nodes"][number]): GenericNodeState {
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


export const featureName = "generic-node"

export const genericReducer = createReducer(
  initialState,
  on(setNodeData, (st, a) => {
    return {
      ...st,
      ...a.data
    };
  }),
  on(updateNodeDef, (st, a) => {
    return {
      ...st,
      nodeDefinitions: a.data
    };
  }),
  on(backendActions.updatePosition, (st, a) => {
    return patchNode(st, a.node, n => ({ ...n, position: a.position }));
  }),
  on(backendActions.deleteNode, (st, a) => {
    return ({
      ...st,
      nodes: st.nodes.filter(node => node.uuid !== a.node),
      connections: st.connections.filter(con => con.source.uuid !== a.node && con.target.uuid !== a.node)
    });
  }),
  on(backendActions.deleteConnection, (st, a) => ({
    ...st,
    connections: st.connections.filter(con => !isSameConnection(con, a.connection))
  })),
  on(backendActions.addConnection, (st, a) => ({
    ...st,
    connections: [...st.connections, a.connection]
  })),
  on(backendActions.addNode, (st, a) => ({
    ...st,
    nodes: [...st.nodes, a.node],
  })),
  on(backendActions.updateGlobals, (st, a) => ({
    ...st,
    globals: {
      ...st.globals ?? {},
      ...a.globals
    }
  })),
  on(backendActions.updateParameters, (st, a) => patchNode(st, a.node, n => ({
    ...n, parameters: {
      ...n.parameters,
      ...a.params
    }
  }))),
  on(updateNode, (st, a) => {
    const newNodes: Array<ElementNode> = []
    let foundMAtch = false
    for (const node of st.nodes) {
      if (node.uuid === a.data.uuid) {
        newNodes.push(a.data)
        foundMAtch = true
      } else {
        newNodes.push(node)
      }
    }
    if (!foundMAtch) {
      newNodes.push(a.data)
    }
    return ({
      ...st,
      nodes: newNodes
    });
  })
)