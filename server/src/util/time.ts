import { HOUR, MINUTE, SECOND } from '../constant'

export function convertTimeDiff(opts: {
  milis: number
}) {
  let millis = opts.milis
  const hours = Math.floor(millis / HOUR)
  millis -= HOUR * hours
  const minutes = Math.floor(millis / MINUTE)
  millis -= MINUTE * minutes
  const seconds = Math.floor(millis / SECOND)
  millis -= seconds * SECOND

  let str = ""
  if (hours) {
    str += `${hours}h`
  }

  if (minutes) {
    str += `${minutes}m`
  }

  if (seconds) {
    str += `${seconds}s`
  }
  return str

}