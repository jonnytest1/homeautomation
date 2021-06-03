
import { Receiver } from './receiver';
import { Transformation } from './transformation';
import { Transformer } from './transformer';
import type { ReceiverData } from './receiver-data';
import { autosaveable } from '../util/express-db-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';


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

    async sendToReceiver(pData: ReceiverData, initialRequest = false) {
        if (!!initialRequest == !!pData.data.withRequest)
            return this.receiver.send(pData)
    }

    getContext(data) {
        return {
            transformation: this.transformation?.transformation,
            receiver: JSON.parse(JSON.stringify(this.receiver)),
            ...super.getContext(data)
        };
    }
}