import { column, mapping, Mappings, primary, primaryOptions, table } from 'hibernatets';
import { settable } from '../util/settable';
import { BatteryLevel } from './battery';
import { Connection } from './connection';
import { EventHistory } from './event';

@table()
export class Sender {

    @primary()
    id: number;

    @mapping(Mappings.OneToMany, Connection, 'sender')
    public connections: Array<Connection>;

    @mapping(Mappings.OneToMany, BatteryLevel, 'sender')
    public batteryEntries: Array<BatteryLevel> = [];

    @mapping(Mappings.OneToMany, EventHistory, 'sender')
    public events: Array<EventHistory> = [];

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

    }
}