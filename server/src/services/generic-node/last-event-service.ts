import type { NodeEventJsonData } from './node-event';
import type { NodeEventTimes } from './typing/generic-node-type';
import type { ElementNode } from './typing/element-node';
import { genericNodeDataStore } from './generic-store/reference';
import { LastEventTime } from './models/last-event-time';
import { LastNodeEvent } from './models/last-node-event';
import { createAction, props } from '../../util/data-store/action';
import { logKibana } from '../../util/log';
import { BehaviorSubject } from 'rxjs';
import { load, PsqlBase, save, SqlCondition } from 'hibernatets';

const lastEventDataObs = new BehaviorSubject<Record<string, NodeEventJsonData>>({})

const setInputTimeAction = createAction("set input time", props<{
  nodeUuid: string,
  eventTime: number,
  index: number
}>())
const setOutputTimeAction = createAction("set output time", props<{
  nodeUuid: string,
  eventTime: number,
  index: number
}>())
const setEventTimes = createAction("set event times", props<{
  data: NodeEventTimes,
}>())
genericNodeDataStore.addReducer(setInputTimeAction, (s, a) => {
  let key = "input"
  if (a.index > 0) {
    key += a.index
  }
  return ({
    ...s,
    lastEventTimes: {
      ...s.lastEventTimes,
      [a.nodeUuid]: {
        ...s.lastEventTimes[a.nodeUuid] ?? {},
        [key]: a.eventTime
      }
    }
  });
})
genericNodeDataStore.addReducer(setOutputTimeAction, (s, a) => ({
  ...s,
  lastEventTimes: {
    ...s.lastEventTimes,
    [a.nodeUuid]: {
      ...s.lastEventTimes[a.nodeUuid] ?? {},
      //0 should jsut be "output"
      [`output${a.index || ""}`]: a.eventTime
    }
  }
}))
genericNodeDataStore.addReducer(setEventTimes, (s, a) => ({
  ...s,
  lastEventTimes: a.data
}))

export const lastEventTimes = genericNodeDataStore.createSelector(st => st.lastEventTimes)
export const lastEventTimesForNode = (nodeUuid: string) => {
  return lastEventTimes.chain(times => times[nodeUuid])
}
export const lastEventTimesForNodes = (nodeUuids: Set<string>) => {
  return lastEventTimes.chain(times => {
    return Object.fromEntries(Object.entries(times)
      .filter(([key]) => nodeUuids.has(key))) as NodeEventTimes
  })
}


const eventTimesPool = new PsqlBase({
  keepAlive: true
})

export function setLastEventInputTime(node: ElementNode, index: number, eventTime: number) {

  genericNodeDataStore.dispatch(setInputTimeAction({
    nodeUuid: node.uuid,
    eventTime,
    index: index
  }))

  const evtTime = LastEventTime.from(node.uuid, `input${index === 0 ? "" : index}`, eventTime)
  save(evtTime, {
    db: eventTimesPool,
    updateOnDuplicate: true
  }).catch(e => {
    debugger
  })
}
export function setLastEventOutputTime(nodeUuid: string, index: number, eventTime: number) {

  genericNodeDataStore.dispatch(setOutputTimeAction({
    nodeUuid: nodeUuid,
    eventTime,
    index
  }))
  const evtTime = LastEventTime.from(nodeUuid, `output${index === 0 ? "" : index}`, eventTime)

  save(evtTime, {
    db: eventTimesPool,
    updateOnDuplicate: true
  }).catch(e => {
    debugger
  })
}
export function setLastEvent(node: ElementNode, event: NodeEventJsonData) {
  lastEventDataObs.next({
    ...lastEventDataObs.value,
    [node.uuid]: event
  })


  const evt = LastNodeEvent.from(node, event)
  save(evt, {
    updateOnDuplicate: true,
    db: eventTimesPool
  }).catch(e => {
    logKibana("ERROR", {
      message: "error saving event",
      node: node.uuid
    }, e)
  })
}



export function getLastEvent<P>(node: { uuid: string }): NodeEventJsonData<P> {
  return lastEventDataObs.value[node.uuid] as NodeEventJsonData<P>
}



function loadEvents() {
  try {

    load(LastNodeEvent, SqlCondition.ALL, undefined, {
      db: eventTimesPool,
    })
      .then(events => {

        const eventTimes: Record<string, NodeEventJsonData> = {
          ...lastEventDataObs.value ?? {}
        }


        for (const evt of events) {
          eventTimes[evt.nodeUuid] = evt.event
        }

        lastEventDataObs.next(eventTimes)
      })
      .catch(e => {
        console.error(e)
        debugger
        logKibana("ERROR", {
          message: "error laoding last events"
        }, e)
      })



    // const data = readFileSync(lastEventFile, { encoding: "utf8" })
    /// const eventDAta = JSON.parse(data)
    // lastEventDataObs.next(eventDAta)
  } catch (e) {
    console.error(e)
    lastEventDataObs.next({})

  }
  genericNodeDataStore.dispatch(setEventTimes({ data: {} }))

  load(LastEventTime, SqlCondition.ALL, undefined, {
    db: eventTimesPool
  })
    .then(times => {

      const eventTimes: NodeEventTimes = {}

      for (const time of times) {
        eventTimes[time.nodeUuid] ??= {}
        eventTimes[time.nodeUuid][time.keyindex] = +time.timestamp
      }
      genericNodeDataStore.dispatch(setEventTimes({ data: eventTimes }))
    })
    .catch(e => {
      console.error(e)
      debugger
      logKibana("ERROR", {
        message: "error laoding last event times"
      }, e)
    })

}

loadEvents()


export const withSideEffects = true