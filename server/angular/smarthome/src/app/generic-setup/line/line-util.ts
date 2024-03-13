import { Connection } from '../../settings/interfaces'

export function isSameConnection(conA: Connection, conB: Connection) {
  if (conA.source.uuid !== conB.source.uuid) {
    return false
  }
  if (conA.target.uuid !== conB.target.uuid) {
    return false
  }
  if (conA.source.index !== conB.source.index) {
    return false
  }
  if (conA.target.index !== conB.target.index) {
    return false
  }
  return true
}