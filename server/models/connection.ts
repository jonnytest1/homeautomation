import { column, mapping, Mappings, primary, primaryOptions, table } from 'hibernatets';
import { runInNewContext } from 'vm';
import { autosaveable } from '../express-db-wrapper';
import { settable, settableValidator } from '../util/settable';
import { TransformationResponse } from './connection-response';
import { Receiver } from './receiver';
import { convertToOS, writeFileDir } from '../util/file';
import { Transformer } from './transformer';
import { Transformation } from './transformation';


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
            newData.promise.then((pData) => this.receiver.send(pData));
            return newData;
        }
        return {
            error: await this.receiver.send(newData)
        };
    }

    getContext(data) {
        return {
            transformation: this.transformation?.transformation,
            receiver: JSON.parse(JSON.stringify(this.receiver)),
            ...super.getContext(data)
        };
    }
}