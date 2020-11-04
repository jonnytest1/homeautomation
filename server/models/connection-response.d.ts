export interface TransformationResponse extends SenderResponse {
    status?: number;
    error?: number;

    promise?: Thenable<SenderResponse>;

    response?: {
        [key: string]: any
    }
}


export interface Thenable<T> {

    then<U>(cb: (res: T) => U)
}


interface delay {
    <T>(time: number, res: T): Thenable<T>
    // (time: number): Thenable<void>
}

declare global {
    const delay: delay
}

interface SenderResponse {
    notification?: {
        title: string
        sound?: string,
        body?: string
    }
}