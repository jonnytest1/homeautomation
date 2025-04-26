export function jsonClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}




export function jsonEqual<T>(a: T, b: T) {
  if (a === b) {
    return true;
  }

  return JSON.stringify(a) === JSON.stringify(b)
}
