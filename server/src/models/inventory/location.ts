import { column, primary, table } from 'hibernatets';

@table()
export class Location {
  @primary()
  id: number

  @column()
  description: string
}