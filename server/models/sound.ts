import { column, primary, table } from 'hibernatets';
import { autosaveable, getter } from '../express-db-wrapper';
import { HttpRequest } from '../express-wrapper';
import { settable } from '../util/settable';

@table()
@getter({
    name: "all"
})
@getter<Sound>({
    name: "bykey/:bykey",
    condition: (obj, req: HttpRequest) => obj.key = req.params.bykey
})
@autosaveable
export class Sound {


    @column({ type: "text", size: "large" })
    @settable
    bytes: string

    @primary({ strategy: "custom" })
    @settable
    key: string
}