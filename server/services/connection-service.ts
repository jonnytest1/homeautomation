import { TimerFactory } from './timer-factory';
import type { Connection } from '../models/connection';
import type { ConnectionResponse, TransformationRes } from '../models/connection-response';
import { Transformation } from '../models/transformation';
import { ReceiverData } from '../models/receiver-data';

const defaultTransformation = new Transformation()
defaultTransformation.transformation = "false"
export class ConnectionService {


    constructor(private connection: Connection) { }


    async execute(data, initialRequest: boolean, usedTransformation?: Transformation): Promise<TransformationRes> {
        const dataCp = { ...data, usedTransformation: usedTransformation };
        delete dataCp.promise;
        let transformation = defaultTransformation;
        if (!initialRequest || (this.connection.transformation && this.connection.transformation.transformation)) {
            transformation = this.connection.transformation;
        }
        const newData: ConnectionResponse | false = await this.connection.transform(dataCp, transformation);
        if (newData === false) {
            return {};
        }
        if (newData.promise) {
            TimerFactory.create(this.connection, "sendToReceiver", newData.promise);
            return newData;
        }
        return {
            error: await this.connection.sendToReceiver(new ReceiverData(newData), initialRequest)
        };
    }
}