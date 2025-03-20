import type { Sender } from '../../models/sender'
import type { SenderTriggerService } from '../sender-trigger-service'

export type ServiceMap = {
  ref: Sender,
  service: SenderTriggerService
}

export type ServiceTypes = ServiceMap["ref"]
export type ServiceType<T extends ServiceTypes> = (ServiceMap & { ref: T })["service"]


export type ConditionalServiceType<T extends object> = T extends ServiceTypes ? (ServiceMap & { ref: T })["service"] : never