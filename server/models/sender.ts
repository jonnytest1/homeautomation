import { column, mapping, Mappings, primary, primaryOptions, table } from 'hibernatets';
import { autosaveable } from '../express-db-wrapper';
import { ResponseCodeError } from '../util/express-util.ts/response-code-error';
import { logKibana } from '../util/log';
import { settable } from '../util/settable';
import { BatteryLevel } from './battery';
import { Connection } from './connection';
import { EventHistory } from './event';
import { Transformation } from './transformation';
import { Transformer } from './transformer';

@table()
@autosaveable
export class Sender extends Transformer {

    @primary()
    id: number;

    @mapping(Mappings.OneToMany, Connection, 'sender')
    public connections: Array<Connection>;

    @mapping(Mappings.OneToMany, BatteryLevel, 'sender')
    public batteryEntries: Array<BatteryLevel> = [];

    @mapping(Mappings.OneToMany, EventHistory, 'sender')
    public events: Array<EventHistory> = [];

    @mapping(Mappings.OneToMany, Transformation, 'sender')
    transformation: Array<Transformation>

    @column()
    @settable
    transformationAttribute;

    @column()
    @settable
    deviceKey: string;

    @column()
    @settable
    description: string;

    @column()
    @settable
    name: String;

    constructor() {
        super()
    }

    async trigger(body) {
        let data = body;
        let newData;
        if (this.transformationAttribute) {
            const transformation = this.transformation.find(transform => transform.transformationKey == data[this.transformationAttribute]);
            if (transformation) {
                newData = await this.transform(data, transformation);
            } else {
                logKibana("INFO", {
                    message: "no transformer for message",
                    data: data,
                    transformerAttribute: this.transformationAttribute,
                    keys: this.transformation.map(tr => tr.transformationKey)
                })
                newData = false;
                throw new ResponseCodeError(404, "didnt find tranformation for key")
            }
        } else if (this.transformation.length) {
            newData = await this.transform(data, this.transformation[0]);
        }
        if (newData === false) {
            return [];
        }
        if (newData.promise) {
            newData.promise.then((pData) => Promise.all(this.connections.map(connection => connection.execute(pData))));
            return [newData];
        }
        return Promise.all(this.connections.map(connection => connection.execute(newData)))
    }

    getContext(data: any) {
        return {
            ...super.getContext(data),
            sender: JSON.parse(JSON.stringify(this))
        }
    }

}