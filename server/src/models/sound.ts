

import { autosaveable, getter, settable } from 'express-hibernate-wrapper';

import { column, primary, table } from 'hibernatets';
import type { HttpRequest } from 'express-hibernate-wrapper';

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