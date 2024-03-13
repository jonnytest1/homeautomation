
import type { Item } from '../models/inventory/item';
import type { Receiver } from '../models/receiver';
import type { Sender } from "../models/sender"
import type { Timer } from '../models/timer';
import type { StoreEvents } from '../services/generic-node/typing/frontend-events';
import type { ElementNode, NodeData, NodeDefintion, NodeEventTimes } from '../services/generic-node/typing/generic-node-type';


export interface ActionTriggersEvent {
  type: "action-triggers";
  data: {
    name: "generic-node";
    deviceKey: "generic-node"
    actions: Array<{
      name: string;
      displayText?: string
    }>;
  };
}

export type GenericNodeEvents = {
  type: "nodeDefinitions",
  data: Record<string, NodeDefintion>
} | {
  type: "nodeData"
  data: NodeData
} | ActionTriggersEvent | {
  type: "lastEventTimes"
  data: NodeEventTimes
} | {
  type: "nodeUpdate"
  data: ElementNode
} | {
  type: "store-reducer",
  data: StoreEvents & { fromSocket?: true }
}


export interface SocketResponses {
  timerUpdate: Array<Timer>

  senderUpdate: Array<Sender>


  inventoryUpdate: Array<Item>

  receiverUpdate: Receiver

  /* nodeDefinitions: Record<string, NodeDefintion>
 
   nodeData: NodeData
 
   lastEventTimes: NodeEventTimes
 
   nodeUpdate: ElementNode*/

  genericNode: GenericNodeEvents

}
