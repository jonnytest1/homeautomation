import { HOUR } from '../../../../constant';
import { updateServerContext } from '../../element-node-fnc';
import type { NodeEvent } from '../../node-event';
import type { EvalNode } from '../../typing/generic-node-type'
import type { NodeDefOptinos } from '../../typing/node-options'


export type WithHistory = {
  outputhistory: {
    type: "number";
    title: string;
    hideWithoutValue: true;
  };
  inputhistory: {
    type: "number";
    title: string;
    hideWithoutValue: true;
  }
}


type HistoryArray = Array<{
  timestamp: number;
  evt: unknown;
  index: number;
}>;

export type HistoryServerContext = {
  inputhistory?: HistoryArray;
  outputhistory?: HistoryArray
}


export function trackInputHistory<O extends NodeDefOptinos, R extends HistoryServerContext>(node: EvalNode<O, R>, data: NodeEvent) {
  const inputHistory = node.serverContext?.inputhistory ?? []
  const historyKey = `inputhistory${data.inputIndex > 0 ? data.inputIndex : ""}`
  const historyKeyParam = node.parameters?.[historyKey];
  if (historyKeyParam?.length) {
    const inputhistoryNum = +historyKeyParam
    if (!isNaN(inputhistoryNum) && inputhistoryNum > 0) {
      const inputHistoryDays = inputhistoryNum * HOUR * 24

      inputHistory.push({
        timestamp: Date.now(),
        evt: data.payload,
        index: data.inputIndex,
      })
      const cutoff = Date.now() - inputHistoryDays
      while (inputHistory[0]?.timestamp < cutoff) {
        inputHistory.shift()
      }
      updateServerContext(node, {
        inputhistory: inputHistory
      } as Partial<R>)
    }
  }
  return inputHistory
}


export function shiftInputHistory<O extends NodeDefOptinos & WithHistory, R extends HistoryServerContext>(node: EvalNode<O, R>, history: HistoryArray) {
  while (history[0]) {
    const input0ts = history[0]?.timestamp
    const input0key = `inputhistory${history[0].index > 0 ? history[0].index : ""}`;
    const inputhistoryNum = +(node.parameters?.[input0key] ?? 0)
    if (!isNaN(inputhistoryNum) && inputhistoryNum > 0) {
      const inputHistoryDays = inputhistoryNum * HOUR * 24
      const cutoff = Date.now() - inputHistoryDays

      if (input0ts < cutoff) {
        history.shift()
      } else {
        break;
      }

    } else {
      history.shift()
    }
  }

}



export function addOutputHistoryEvent<O extends NodeDefOptinos & WithHistory, R extends HistoryServerContext>(node: EvalNode<O, R>, data: NodeEvent, emitIndex: number) {

  const key = `outputhistory${emitIndex || ''}`


  const paramValue = node.parameters?.[key];
  if (paramValue?.length) {
    const outputHistoryNum = +paramValue;
    if (!isNaN(outputHistoryNum) && outputHistoryNum > 0) {
      const outputHistoryDays = outputHistoryNum * HOUR * 24;

      const outputHistoryData = node.serverContext?.outputhistory ?? [];
      outputHistoryData.push({
        timestamp: Date.now(),
        evt: data.payload,
        index: emitIndex
      });
      const cutoff = Date.now() - outputHistoryDays;
      while (outputHistoryData[0]?.timestamp < cutoff) {
        outputHistoryData.shift();
      }
      updateServerContext(node, {
        outputhistory: outputHistoryData
      } as Partial<R>);
    }
  }
}
