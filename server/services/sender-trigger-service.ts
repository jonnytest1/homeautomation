import { TimerFactory } from './timer-factory';
import { ConnectionService } from './connection-service';
import type { TransformationRes } from '../models/connection-response';
import type { Sender } from '../models/sender';
import type { Transformation } from '../models/transformation';

export class SenderTriggerService {

    constructor(private sender: Sender) {

    }

    async trigger(body: unknown) {

        const { usedTransformation, responseData } = await this.sender.transformData(body)

        if (responseData === false) {
            return [];
        }

        if (responseData && responseData.promise) {
            responseData.response.time = responseData.promise.time / (1000);
        }
        return this.checkPromise(responseData, usedTransformation, true)
    }


    async checkPromise(pData: TransformationRes, usedTransformation: Transformation, initialRequest = false) {
        if (pData && pData.promise) {
            TimerFactory.create(this.sender, "checkPromise", pData.promise, usedTransformation);
        }
        if (pData && pData.notification) {
            if (pData.notification.title == undefined) {
                pData.notification.title = usedTransformation.name || this.sender.name || ''
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