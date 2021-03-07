import { save } from 'hibernatets';
import { getId } from 'hibernatets/utils';
import { runInNewContext } from 'vm';

import { Thenable, TransformationResponse } from './connection-response';
import { Timer } from './timer';
import { Transformation } from './transformation';


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

    getContext(sendData) {
        const el = this;
        return {
            data: sendData,
            delay: (<T>(sekunden: number, objectToSend?: T): Thenable<T | void> | T => {
                const millis = sekunden * 1000;
                return {
                    time: millis,
                    then: (thisArg, fncName, ...args) => {
                        const id = getId(thisArg)
                        const className = thisArg.constructor.name;
                        const timer = new Timer({
                            startTimestamp: Date.now(),
                            endtimestamp: Date.now() + millis,
                            args: [fncName, objectToSend, ...args],
                            classId: id,
                            className: className,
                            data: sendData
                        })
                        save(timer);
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