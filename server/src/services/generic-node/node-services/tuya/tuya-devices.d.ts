import type { NodeOptionTypes } from '../../typing/node-options'

export interface TuyaDevice {
  ip: string
  id: string

  name: string

  localKey: string

  actions: Array<{
    name: string,
    argument: NodeOptionTypes,
    index: number
  }>
}