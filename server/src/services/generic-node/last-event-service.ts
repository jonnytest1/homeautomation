import { lastEventFile, lastEventTimesFile } from './generic-node-constants';
import type { NodeEventJsonData } from './node-event';
import type { ElementNode, NodeEventTimes } from './typing/generic-node-type';
import { BehaviorSubject } from 'rxjs';
import { writeFileSync, readFileSync } from "fs"

export const lastEventDataObs = new BehaviorSubject<Record<string, NodeEventJsonData>>({})



export const lastEventTimesObs = new BehaviorSubject<NodeEventTimes>({})



export function setLastEventInputTime(node: ElementNode, eventTime: number) {
  lastEventTimesObs.next({
    ...lastEventTimesObs.value,
    [node.uuid]: {
      ...lastEventTimesObs.value?.[node.uuid] ?? {},
      input: eventTime
    }
  })
  writeFileSync(lastEventTimesFile, JSON.stringify(lastEventTimesObs.value, undefined, "   "))
}
export function setLastEventOutputTime(node: ElementNode, eventTime: number) {
  lastEventTimesObs.next({
    ...lastEventTimesObs.value,
    [node.uuid]: {
      ...lastEventTimesObs.value?.[node.uuid] ?? {},
      output: eventTime
    }
  })
  writeFileSync(lastEventTimesFile, JSON.stringify(lastEventTimesObs.value, undefined, "   "))
}
export function setLastEvent(node: ElementNode, event: NodeEventJsonData) {
  lastEventDataObs.next({
    ...lastEventDataObs.value,
    [node.uuid]: event
  })

  writeFileSync(lastEventFile, JSON.stringify(lastEventDataObs.value, undefined, "   "))
}



export function getLastEvent<P>(node: ElementNode): NodeEventJsonData<P> {
  return lastEventDataObs.value[node.uuid] as NodeEventJsonData<P>
}



function loadEvents() {
  try {
    const data = readFileSync(lastEventFile, { encoding: "utf8" })
    const eventDAta = JSON.parse(data)
    lastEventDataObs.next(eventDAta)
  } catch (e) {
    console.error(e)
  }

  try {
    const data = readFileSync(lastEventTimesFile, { encoding: "utf8" })
    const eventDAta = JSON.parse(data)
    lastEventTimesObs.next(eventDAta)
  } catch (e) {
    console.error(e)
  }
}

loadEvents()