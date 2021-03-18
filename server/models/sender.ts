
import { BatteryLevel } from './battery';
import { Connection } from './connection';
import { EventHistory } from './event';
import { Timer } from './timer';
import { Transformation } from './transformation';
import { Transformer } from './transformer';
import { TransformationRes } from './connection-response';
import { settable } from '../util/settable';
import { logKibana } from '../util/log';
import { ResponseCodeError } from '../util/express-util.ts/response-code-error';
import { autosaveable } from '../express-db-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';

@table()
@autosaveable
export class Sender extends Transformer {

    @primary()
    id: number;

    @mapping(Mappings.OneToMany, Connection, 'sender')
    public connections: Array<Connection> = [];

    @mapping(Mappings.OneToMany, BatteryLevel, 'sender')
    public batteryEntries: Array<BatteryLevel> = [];

    @mapping(Mappings.OneToMany, EventHistory, 'sender')
    public events: Array<EventHistory> = [];

    @mapping(Mappings.OneToMany, Transformation, 'sender')
    transformation: Array<Transformation> = []

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
    name: string;

    @column()
    @settable
    type: "manual" | "automated" = "automated"

    constructor() {
        super()
    }

    async trigger(body: unknown) {
        const data = body;
        let newData: TransformationRes | false = body;
        let usedTransformation = null;
        if (this.transformationAttribute) {
            usedTransformation = this.getTransformer(data);
            if (usedTransformation) {
                newData = await this.transform(data, usedTransformation);
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
            usedTransformation = this.transformation[0]
            newData = await this.transform(data, usedTransformation);
        }
        if (newData === false) {
            return [];
        }

        if (newData && newData.promise) {
            newData.response.time = newData.promise.time / (1000);
        }
        return this.checkPromise(newData, usedTransformation, true)
    }

    private getTransformer(data: unknown) {
        return this.transformation.find(transform => transform.transformationKey == data[this.transformationAttribute]);
    }

    async checkPromise(pData: TransformationRes, usedTransformation: Transformation, initialRequest = false) {
        if (pData && pData.promise) {
            Timer.start(this, "checkPromise", pData.promise, usedTransformation);
        }
        if (pData && pData.notification) {
            if (pData.notification.title == undefined) {
                pData.notification.title = usedTransformation.name || this.name || ''
            }

        }
        return Promise.all(this.connections.map(connection => connection.execute(pData, initialRequest, usedTransformation)
            .then(errs => {
                if (pData.response) {
                    errs = { ...errs, ...pData.response };
                }
                return errs;
            })
        ));

    }

    getContext(data: unknown) {
        return {
            ...super.getContext(data),
            sender: JSON.parse(JSON.stringify(this)),
            transformer: this.getTransformer(data)

        }
    }

}