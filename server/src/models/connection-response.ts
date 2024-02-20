

export interface TransformationRes extends SenderResponse {
  status?: number;
  error?: number;


  response?: {
    [key: string]: unknown
  }

}


export interface ConnectionResponse extends TransformationRes {

  withRequest?: boolean
}


export interface Delayed<T> {

  nestedObject: T,
  sentData: unknown
  time: number
}


//globals start
declare global {
  type TransformationResponse = TransformationRes;
  function delay<T extends SenderResponse>(time: number, res: T): Delayed<T>
  let data: DataObj
}


//globals end
interface DataObj {
  usedTransformation: {
    name: string
  }
}


interface NotificationData<SoundDef = SoundType> {
  title?: string;
  sound?: SoundDef;
  body?: string;
}

export interface SenderResponse<SoundDef = SoundType, NotificationType = NotificationData<SoundDef>> {
  promise?: Delayed<SenderResponse>;
  notification?: NotificationType,

  attributes?: {
    messageId?: string
  }

  read?: {
    text: string
  }

}

export type SoundType = soundListRuntime | '*' | Array<soundListRuntime>

type soundListRuntime = string