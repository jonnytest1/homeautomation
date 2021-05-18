
import { ConnectionResponse, TransformationRes } from './connection-response';
import { Receiver } from './receiver';
import { Timer } from './timer';
import { Transformation } from './transformation';
import { Transformer } from './transformer';
import { autosaveable } from '../express-db-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';


const defaultTransformation = new Transformation()
defaultTransformation.transformation = "false"

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

    async execute(data, initialRequest: boolean, usedTransformation?: Transformation): Promise<TransformationRes> {
        const dataCp = { ...data, usedTransformation: usedTransformation };
        delete dataCp.promise;
        let transformation = defaultTransformation;
        if (!initialRequest || (this.transformation && this.transformation.transformation)) {
            transformation = this.transformation;
        }
        const newData: ConnectionResponse | false = await this.transform(dataCp, transformation);
        if (newData === false) {
            return {};
        }
        if (newData.promise) {
            Timer.start(this, "sendToReceiver", newData.promise);
            return newData;
        }
        return {
            error: await this.sendToReceiver(newData, initialRequest)
        };
    }

    async sendToReceiver(pData: ConnectionResponse, initialRequest = false) {
        if (!!initialRequest == !!pData.withRequest)
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