import { LoadingManager } from 'three';

export class InMemoryLaodMAanger extends LoadingManager {

  constructor(private readonly objectMap: Record<string, File>, initial: string) {
    super()


    this.setURLModifier(url => {
      if (url == initial) {
        return url
      }
      const name = decodeURIComponent(url.split("/").at(-1))
      if (name in objectMap) {
        return URL.createObjectURL(objectMap[name])
      }
      // debugger

      return ""
    })
  }


}