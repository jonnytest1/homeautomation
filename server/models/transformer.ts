
import { runInNewContext } from 'vm';
import { Thenable, TransformationResponse } from './connection-response';
import { Transformation } from './transformation';
import { v4 as uuidv4 } from 'uuid';
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
            delay: (<T>(sekunden: number, obj?: T): Thenable<T | void> | T => {
                const millis = sekunden * 1000;
                return {
                    time: millis,
                    then: (cb) => {
                        const timerId = uuidv4()
                        Transformer.timeouts[timerId] = {
                            start: Date.now(),
                            time: Date.now() + millis,
                            obj,
                            data: data,
                            ref: el
                        };
                        setTimeout(() => {
                            delete Transformer.timeouts[timerId]
                            cb(obj);
                        }, millis)
                    }
                }
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