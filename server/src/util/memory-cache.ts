
interface MemoryCacheOptions {
  key: string

  validityMillis?: number
}


const cacheObj: Record<string, WeakRef<{
  obj: unknown,
  generated: number
}>> = {}


export async function memoryCache<T>(options: MemoryCacheOptions | string, generator: (key: string) => (T | Promise<T>)): Promise<T> {
  if (typeof options == "string") {
    options = {
      key: options
    }
  }
  let cacheInstance = cacheObj[options.key]?.deref()
  const validityMillis = options.validityMillis ?? 1000 * 60;

  if (!cacheInstance || (cacheInstance.generated + validityMillis) < Date.now()) {
    cacheInstance = {
      obj: await generator(options.key),
      generated: Date.now()
    }
    cacheObj[options.key] = new WeakRef(cacheInstance)
  }
  return cacheInstance.obj as T
}