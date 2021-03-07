


interface TransformationRes extends SenderResponse {
    status?: number;
    error?: number;


    response?: {
        [key: string]: any
    }
}

export interface TransformationResponse extends TransformationRes {

}


export interface Thenable<T> {

    then<U>(thisArg: U, methodName: keyof U, ...args)

    time: number
}

declare global {
    type TransformationResponse = TransformationRes;
    function delay(time: number, res: SenderResponse): Thenable<SenderResponse>
}

interface SenderResponse {
    promise?: Thenable<SenderResponse>;
    notification?: {
        title?: string
        sound?: Sound,
        body?: string
    },

    attributes?: {
        messageId?: string
    }
}

type Sound = string