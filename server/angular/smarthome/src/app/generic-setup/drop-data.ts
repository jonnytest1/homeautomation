import type { MBDragEvent } from '../utils/directive/drag-start.directive'


export class DropDataHandler<DropData extends Record<string, any>> {
  setDropData<T extends keyof DropData & string>(evt: MBDragEvent, key: T, value: DropData[T]) {
    evt.dataTransferHandler?.setData(key.toLowerCase(), value)
  }


  getDropData<T extends keyof DropData & string>(evt: MBDragEvent, key: T) {
    const dragData = evt.dataTransferHandler?.getData(key.toLowerCase())
    if (dragData == "") {
      return null
    }
    if (dragData == undefined) {
      return null
    }
    return dragData as DropData[T]
  }

  hasKey<T extends keyof DropData & string>(evt: MBDragEvent, key: T) {
    return evt.dataTransferHandler.hasKey(key.toLowerCase())
  }
}
