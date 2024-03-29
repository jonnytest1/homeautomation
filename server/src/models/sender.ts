
import { BatteryLevel } from './battery';
import { Connection } from './connection';
import { EventHistory } from './event';
import { Transformation } from './transformation';
import { Transformer } from './transformer';
import type { TransformationRes } from './connection-response';

import { logKibana } from '../util/log';
import { autosaveable, settable } from 'express-hibernate-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { ResponseCodeError } from 'express-hibernate-wrapper';

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
    getTransformer(data: Record<string, unknown>) {
        return this.transformation.find(transform => transform.transformationKey == data[this.transformationAttribute]);
    }
    getContext(data: Record<string, unknown>) {
        return {
            ...super.getContext(data),
            sender: JSON.parse(JSON.stringify(this)),
            transformer: this.getTransformer(data)

        }
    }


    async transformData(data: Record<string, unknown>): Promise<{ usedTransformation: Transformation | null; responseData: TransformationRes | false; }> {
        let newData = data as TransformationRes | false;
        let usedTransformation: Transformation | null | undefined = null;
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

        return {
            usedTransformation,
            responseData: newData
        }
    }

}