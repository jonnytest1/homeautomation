import { TimerFactory } from './timer-factory';
import { ConnectionService } from './connection-service';
import type { TransformationRes } from '../models/connection-response';
import type { Sender } from '../models/sender';
import type { Transformation } from '../models/transformation';
import { SmartHomeTrigger } from '../node-red/register-custom-type';
import { ReceiverData } from '../models/receiver-data';

export class SenderTriggerService {

    constructor(private sender: Sender) {

    }

    async trigger(body: Record<string, unknown>) {
        SmartHomeTrigger.instances.forEach(i => i.trigger(body))

        const { usedTransformation, responseData } = await this.sender.transformData(body)

        if (responseData === false) {
            return [];
        }

        if (responseData?.promise) {
            responseData.response ??= {}
            responseData.response.time = responseData.promise.time / (1000);
        }
        return this.checkPromise(responseData, usedTransformation, true)
    }


    async checkPromise(pData: TransformationRes, usedTransformation: Transformation | null, initialRequest = false) {
        if (pData?.promise) {
            const promiseData = pData.promise
            Promise.all(this.sender.connections.map(async connection => {
                connection.receiver.send(new ReceiverData({
                    read: {
                        text: `started ${usedTransformation?.name} in ${Math.round(promiseData.time / (1000 * 60))} minuten`
                    }
                }))
            }))

            TimerFactory.create(this.sender, "checkPromise", pData.promise, usedTransformation);
        }
        if (pData && pData.notification) {
            if (pData.notification.title == undefined) {
                pData.notification.title = usedTransformation?.name || this.sender.name || ''
            }

        }
        return Promise.all(this.sender.connections.map(connection => new ConnectionService(connection).execute(pData, initialRequest, usedTransformation)
            .then(errs => {
                if (pData.response) {
                    errs = { ...errs, ...pData.response };
                }
                return errs;
            })
        ));

    }

}