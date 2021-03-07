import { column, mapping, Mappings, primary, table } from 'hibernatets';

import { autosaveable } from '../express-db-wrapper';
import { SenderResponse, TransformationResponse } from './connection-response';
import { Receiver } from './receiver';
import { Transformation } from './transformation';
import { Transformer } from './transformer';


@autosaveable
@table()
export class Connection extends Transformer {

    @primary()
    id: number;

    @mapping(Mappings.OneToOne, Receiver)
    receiver: Receiver;

    @mapping(Mappings.OneToOne, Transformation)
    transformation: Transformation = new Transformation();

    @column()
    description: string;

    constructor(receiver?: Receiver) {
        super()
        if (receiver) {
            this.receiver = receiver;
        }
    }

    async execute(data: any): Promise<TransformationResponse> {
        const dataCp = { ...data };
        delete dataCp.promise;

        const newData = await this.transform(dataCp, this.transformation);
        if (newData === false) {
            return;
        }
        if (newData.promise) {
            newData.promise.then(this, "sendToReceiver");
            return newData;
        }
        return {
            error: await this.receiver.send(newData)
        };
    }

    sendToReceiver(pData: SenderResponse) {
        this.receiver.send(pData)
    }

    getContext(data) {
        return {
            transformation: this.transformation?.transformation,
            receiver: JSON.parse(JSON.stringify(this.receiver)),
            ...super.getContext(data)
        };
    }
}