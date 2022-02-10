
import type { Delayed as Delayed, TransformationRes } from './connection-response';
import type { Transformation } from './transformation';
import { runInNewContext } from 'vm';


export abstract class Transformer {

    getContext(sendData) {
        return {
            data: sendData,
            delay: (<T>(sekunden: number, objectToSend?: T): Delayed<T | void> | T => {
                const millis = sekunden * 1000;
                return {
                    time: millis,
                    sentData: sendData,
                    nestedObject: objectToSend
                }
            }) as typeof delay
        };
    }


    getContextKeys() {
        return Object.keys(this.getContext({}));
    }

    async transform(data: unknown, transformation: Transformation): Promise<TransformationRes | false> {
        let transformedData = data as TransformationRes | false
        if (transformation && transformation.transformation) {
            const context = this.getContext(data);
            transformedData = runInNewContext(`${transformation.transformation}`, context, {
                displayErrors: true,
            }) as TransformationRes | false;
            return transformedData;
        }
        return transformedData;
    }


}