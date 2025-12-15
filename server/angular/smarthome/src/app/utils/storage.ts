import type { SenderFe } from '../settings/interfaces';


export interface SessionStorageType {
  _senders_cache: Array<SenderFe>
}



export function setSessionStorage<K extends keyof SessionStorageType>(key: K, item: SessionStorageType[K]) {
  sessionStorage.setItem("ls_" + key, JSON.stringify(item))
}

export function getSessionStorage<K extends keyof SessionStorageType>(key: K, defaultV: SessionStorageType[K]): SessionStorageType[K] {
  const str = sessionStorage.getItem("ls_" + key)

  if (str == undefined || str == null) {
    return defaultV
  }
  return JSON.parse(str)
}