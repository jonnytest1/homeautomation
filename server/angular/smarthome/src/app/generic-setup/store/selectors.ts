import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GenericNodeState, featureName } from './reducers';
import { logKibana } from '../../global-error-handler';
import type { ElementNode } from '../../settings/interfaces';

const genericNodeDAtaFeature = createFeatureSelector<GenericNodeState>(featureName)

export const selectNodeData = createSelector(genericNodeDAtaFeature, d => d)

export const selectNodes = createSelector(selectNodeData, data => {
  return data.nodes ?? []
})
export const selectNodesMap = createSelector(selectNodes, data => {
  return Object.fromEntries(data.map(n => [n.uuid, n]))
})

export const selectNode = (uuid: string) => {
  return createSelector(selectNodesMap, (data): ElementNode | undefined => {
    return data[uuid]
  })
}
export const selectNodeDefByType = (type: string) => {
  return createSelector(selectNodeData, data => {
    const nodeDef = data.nodeDefinitions[type];
    if (!nodeDef) {
      logKibana("ERROR", {
        message: "Missing node type",
        node_Type: type
      })
    }
    return nodeDef
  })
}

export const selectNodeDefs = createSelector(selectNodeData, n => n.nodeDefinitions)