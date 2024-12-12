import { settable } from 'express-hibernate-wrapper';
import { column, primary, table } from 'hibernatets';

@table()
export class Order {


  @primary()
  id: number


  @settable
  @column()
  type: "amazon" | "custom" | "aliexpress" = "amazon"

  @column()
  @settable
  trackingInfo: string

  @column()
  @settable
  orderId: string


  @column()
  @settable
  orderStatus: "pending" | "received" | "storniert"
}