import { settable } from 'express-hibernate-wrapper';
import { column, primary, table } from 'hibernatets';

@table()
export class Location {
  @primary()
  id: number

  @column()
  @settable
  description: string
}