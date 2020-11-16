import { column, primary, table } from 'hibernatets'
import { settable, settableValidator } from '../util/settable'

import { autosaveable } from '../express-db-wrapper'
import { TscCompiler } from '../util/tsc-compiler'

@table()
@autosaveable
export class Transformation {


    @primary()
    id: number

    @column({
        size: "large"
    })
    @settableValidator(validateTransformation)
    transformation: string

    @column({
        size: "medium"
    })
    @settable
    transformationKey?: string

    @column()
    @settable
    name

    definitionFile

}


/**
 * @this {instanceof Transformation}
 * @param transformation
 */
async function validateTransformation(this: Transformation, transformation: string) {
    let obj;
    try {
        if (!transformation || !transformation.length || transformation == "(NULL)") {
            return {}
        }

        const compiler = new TscCompiler()
        await compiler.prepare(transformation);
        const result = await compiler.compile()
        if (!result || !result.length) {
            return;
        }
        const returnObj = {};
        result.forEach(res => {
            returnObj[JSON.stringify(res.pos)] = res.reason
        })
        return returnObj;
    } catch (e) {
        let stacklines = e.stack.split('\n');
        const errorText = stacklines.shift();
        stacklines = stacklines.filter(line => line.trim().length && !line.trim()
            .startsWith('at '));
        return { ___: errorText };
    }
    /*  if (typeof obj !== 'object') {
          return { ___: 'transformation needs to return an object' };
      }
  
      if (obj.title && typeof obj.title !== 'string') {
          return { title: 'title needs to be string' };
      }*/
}