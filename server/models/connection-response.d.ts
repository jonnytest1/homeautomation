

interface TransformationRes extends SenderResponse {
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

declare global {
    type TransformationResponse = TransformationRes;
    function delay(time: number, res: SenderResponse): Delayed<SenderResponse>
    let data: DataObj
}


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

interface SenderResponse<SoundDef = SoundType, NotificationType = NotificationData<SoundDef>> {
    promise?: Delayed<SenderResponse>;
    notification?: NotificationType,

    attributes?: {
        messageId?: string
    }

}

export type SoundType = soundListRuntime | '*' | Array<soundListRuntime>

type soundListRuntime = string