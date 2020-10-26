
import { column, mapping, Mappings, primary, primaryOptions, table } from 'hibernatets';
import { runInNewContext } from 'vm';
import { settable, settableValidator } from '../util/settable';
import { Receiver } from './receiver';

/**
 * @this {instanceof Connection}
 * @param transformation
 */
function validateTransformation(this: Connection, transformation: String) {
    let obj;
    try {
        obj = this.transform(null, transformation);
    } catch (e) {
        let stacklines = e.stack.split('\n');
        stacklines.shift();
        stacklines = stacklines.filter(line => line.trim().length && !line.trim()
            .startsWith('at '));
        return { ___: stacklines.join('\n') };
    }
    if (typeof obj !== 'object') {
        return { ___: 'transformation needs to return an object' };
    }

    if (obj.title && typeof obj.title !== 'string') {
        return { title: 'title needs to be string' };
    }
}

@table()
export class Connection {

    @primary()
    id: number;

    @mapping(Mappings.OneToOne, Receiver)
    receiver: Receiver;

    @settableValidator(validateTransformation)
    @column()
    transformation: string;

    @column()
    description: string;

    constructor(receiver?: Receiver) {
        if (receiver) {
            this.receiver = receiver;
        }
    }

    async execute(data: any): Promise<number> {
        data = await this.transform(data, this.transformation);
        return this.receiver.send(data);
    }

    getContext(data) {
        return {
            transformation: this.transformation,
            receiver: this.receiver,
            data: data
        };
    }

    getContextKeys() {
        return Object.keys(this.getContext(null));
    }

    transform(data: any, transformation): any {
        if (transformation) {
            const context = this.getContext(data);
            const methodCall = Object.keys(context)
                .join(',');
            data = runInNewContext(`${transformation}`, context, {
                displayErrors: true,
            });
        }
        return data;
    }
}