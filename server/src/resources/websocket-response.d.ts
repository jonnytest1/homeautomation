
import type { Item } from '../models/inventory/item';
import type { Receiver } from '../models/receiver';
import type { Sender } from "../models/sender"
import type { Timer } from '../models/timer';
import type { NodeData, NodeDefintion } from '../services/generic-node/generic-node-type';

export interface SocketResponses {
  timerUpdate: Array<Timer>

  senderUpdate: Array<Sender>


  inventoryUpdate: Array<Item>

  receiverUpdate: Receiver

  nodeDefinitions: Record<string, NodeDefintion>

  nodeData: NodeData
}
