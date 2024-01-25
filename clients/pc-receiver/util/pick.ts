export function pick<T>(options: Array<T>): T {

  return options[Math.floor(Math.random() * options.length)]
}