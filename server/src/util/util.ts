export function hasKey<O extends object | unknown, K extends PropertyKey>(
  obj: O,
  key: K
): obj is O & Record<K, unknown> {
  return typeof obj === "object" && obj != null && key in obj;
}



export function getKey<O extends object | unknown, K extends PropertyKey>(
  obj: O,
  key: K
) {
  return hasKey(obj, key) ? obj[key] : undefined;
}
