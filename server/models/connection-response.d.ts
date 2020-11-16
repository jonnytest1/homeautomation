


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

    then<U>(cb: (res: T) => U)

    time: number
}

declare global {
    type TransformationResponse = TransformationRes;
    const delay: <T>(time: number, res: T) => Thenable<T>
}

interface SenderResponse {
    promise?: Thenable<SenderResponse>;
    notification?: {
        title?: string
        sound?: string,
        body?: string
    }
}