import { load, queries, remove } from 'hibernatets';
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
        path: target.name.toLowerCase(),
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
}