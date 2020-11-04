
import { runInNewContext } from 'vm';
import { Thenable, TransformationResponse } from './connection-response';
import { Transformation } from './transformation';
import { v4 as uuidv4 } from 'uuid';
import { Timer } from '../resources/timer';
export abstract class Transformer {


    private static timeouts: {
        [key: string]: {
            time: number, start: number, obj: any, data: any, ref: Transformer
        }
    } = {}

    static getActiveTimers(senderId: number) {
        return Object.keys(Transformer.timeouts)
            .filter(key => Transformer.timeouts[key].ref['id'] == senderId)
            .map(key => ({
                uuid: key,
                ...Transformer.timeouts[key]
            }));

    }

    getContext(data) {
        const el = this;
        return {
            data: data,
            delay: (<T>(sekunden, obj?: T): Thenable<T | void> | T => {
                const timerId = uuidv4()
                const millis = sekunden * 1000;
                Transformer.timeouts[timerId] = { start: Date.now(), time: Date.now() + millis, obj, data: data, ref: el };
                const promise = new Promise<any>(res => setTimeout(res, millis)).then(() => {
                    delete Transformer.timeouts[timerId]
                })
                if (obj) {
                    return promise.then(() => obj)
                }
                return promise;
            }) as typeof delay
        };
    }


    getContextKeys() {
        return Object.keys(this.getContext({}));
    }

    async transform(data: any, transformation: Transformation): Promise<TransformationResponse | false> {
        if (transformation && transformation.transformation) {
            const context = this.getContext(data);
            data = runInNewContext(`${transformation.transformation}`, context, {
                displayErrors: true,
            });
            return data;
        }
        return data;
    }


}