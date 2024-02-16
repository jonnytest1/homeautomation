
import type { Item } from '../models/inventory/item';
import type { Receiver } from '../models/receiver';
import type { Sender } from "../models/sender"
import type { Timer } from '../models/timer';
import type { ElementNode, NodeData, NodeDefintion, NodeEventTimes } from '../services/generic-node/typing/generic-node-type';

export interface SocketResponses {
  timerUpdate: Array<Timer>

  senderUpdate: Array<Sender>


  inventoryUpdate: Array<Item>

  receiverUpdate: Receiver

  nodeDefinitions: Record<string, NodeDefintion>

  nodeData: NodeData

  lastEventTimes: NodeEventTimes

  nodeUpdate: ElementNode
}
