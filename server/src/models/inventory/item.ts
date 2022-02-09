import { settable } from 'express-hibernate-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { Location } from "./location"
import { Order } from './order';
@table()
export class Item {


    @primary()
    id

    @column()
    @settable
    description: string

    @mapping(Mappings.OneToOne, Location, l => l.id)
    location: Location

    @settable
    @column({ type: "number" })
    amount: number


    @mapping(Mappings.OneToOne, Order, l => l.id)
    order: Order


    @column()
    @settable
    productLink: string

    @column()
    @settable
    orderImageSrc: string
}



export type FrontendOrder = Order & { items: Array<Item> }