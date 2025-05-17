import { settable } from 'express-hibernate-wrapper';
import { column, mapping, Mappings, primary, table } from 'hibernatets';

@table()
export class Location {
  @primary()
  id: number

  @column()
  @settable
  description: string



  @mapping(Mappings.OneToOne, Promise.resolve(Location))
  parent: Location


  parentOffset

}