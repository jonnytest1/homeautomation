
import { autosaveable } from '../express-db-wrapper';
import { settable } from '../util/settable';
import { column, primary, table } from 'hibernatets';

@table()
@autosaveable
export class Transformation {


    @primary()
    id: number

    @column({
        size: "large"
    })

    @settable
    public transformation: string

    @column({
        size: "large"
    })
    @settable
    tsTransformation: string

    @column({
        size: "medium"
    })
    @settable
    transformationKey?: string

    @column()
    @settable
    name

    definitionFile?

}