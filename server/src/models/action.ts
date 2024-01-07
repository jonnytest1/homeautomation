import { settable } from 'express-hibernate-wrapper';
import { column, primary, table } from 'hibernatets';

@table()
export class Action {


  @primary()
  readonly id;

  @settable
  @column()
  name: string

  @settable
  @column({
    size: "large"
  })
  icon: string

  @settable
  @column()
  confirm: boolean

  @settable
  @column()
  description: string

  constructor() {
    //
  }
}