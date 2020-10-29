import { load, queries } from 'hibernatets';
import { resources } from "./express-wrapper"
import { assign } from './util/settable';

export function autosaveable(target) {
    resources.push({
        path: target.name.toLowerCase(),
        target: target,
        type: 'put',
        callback: async (req, res) => {
            if (!req.body.itemRef) {
                return res.status(400).send("missing 'itemRef' id key")
            }
            const obj = await load(target, +req.body.itemRef);

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
}