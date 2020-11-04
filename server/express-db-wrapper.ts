import { load, queries, remove, save } from 'hibernatets';
import { getDBConfig } from 'hibernatets/utils';
import { HttpRequest, resources } from "./express-wrapper"
import { ResponseCodeError } from './util/express-util.ts/response-code-error';
import { logKibana } from './util/log';
import { assign } from './util/settable';


export interface ConstructorClass<T> {
    new(...args): T;
}


export function getter<T>(opts: {
    name: string,
    condition?: string | Function
}) {
    if (!opts.condition) {
        opts.condition = "TRUE = TRUE"
    }
    if (opts.condition == "id") {
        opts.name = `${opts.name}/:${opts.name}`
    }
    return function (target: ConstructorClass<T>) {
        resources.push({
            path: `auto/${target.name.toLowerCase()}/${opts.name}`,
            type: "get",
            target: target,
            callback: async (req: HttpRequest, res) => {
                const params = []
                let condition = opts.condition;
                if (opts.condition == "id") {
                    condition = (o) => o[getDBConfig(target).modelPrimary] = req.params[opts.name]
                }
                if (opts.condition && typeof opts.condition !== "string") {
                    const condtionFnc = opts.condition as Function;
                    condition = (obj) => condtionFnc(obj, req)
                }
                const response = await load<any>(target, condition as any);
                if (!response || response.length == 0) {
                    res.status(404).send()
                }
                res.send(response);

            }
        })
    }
}


export function autosaveable(target) {
    resources.push({
        path: `auto/${target.name.toLowerCase()}`,
        target: target,
        type: 'put',
        callback: async (req, res) => {
            if (!req.body.itemRef) {
                return res.status(400).send("missing 'itemRef' id key")
            }
            const obj = await load(target, +req.body.itemRef);
            if (!obj) {
                return res.status(404).send("didnt find oject with itemRef as id")
            }
            const errors = await assign(obj, req.body);
            if (errors) {
                res.status(400)
                    .send(errors);
                return;
            }

            await queries(obj);
            res.send(obj);
        }
    })

    resources.push({
        path: `auto/${target.name.toLowerCase()}`,
        target: target,
        type: 'delete',
        callback: async (req, res) => {
            if (!req.query.itemRef) {
                return res.status(400).send("missing 'itemRef' id key")
            }
            const obj = await remove(target, +req.query.itemRef);
            await queries(obj);
            res.status(200).send(`${obj}`);
        }
    })

    resources.push({
        path: `auto/${target.name.toLowerCase()}`,
        target: target,
        type: 'post',
        callback: async (req, res) => {
            const obj = new target();
            await assign(obj, req.body)
            await save(obj);
            res.send(obj);
        }
    })
}

export async function loadOne<T>(
    findClass: ConstructorClass<T>,
    primaryKEyOrFilter: any,
    params: any,
    opts: any = {}): Promise<T> {
    const obj = await load(findClass, primaryKEyOrFilter, params, { ...opts, first: true })
    if (!obj) {
        logKibana("DEBUG", `${primaryKEyOrFilter}`)
        throw new ResponseCodeError(404, `${findClass.name} not found`)
    }
    return obj;
}