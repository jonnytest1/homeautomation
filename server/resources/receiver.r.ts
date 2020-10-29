import { load, queries, save } from 'hibernatets';
import { Body } from 'node-fetch';
import { GET, HttpRequest, HttpResponse, Path, POST, PUT } from '../express-wrapper';
import { Receiver } from '../models/receiver';
import { assign } from '../util/settable';

@Path('receiver')
class ReceiverResource {

    @POST({
        path: ''
    })
    async register(req, res) {
        const receiver = new Receiver();
        if (req.body.type === 'ip' || req.body.type === 'wss') {
            receiver.ip = req.headers.http_x_forwarded_for;
            if (req.body.port) {
                receiver.ip += `:${req.body.port}`;
            }
        }
        await assign(receiver, req.body);
        await save(receiver);
        res.send(receiver);
    }

    @GET({
        path: ''
    })
    async getReceivers(req, res: HttpResponse) {
        const receivers = await load(Receiver, 'true = true');
        res.send(receivers);
    }

    /*@PUT({ path: '' })
    async update(req, res) {
        const receiver = await load(Receiver, s => s.deviceKey = req.body.itemRef, [], { first: true });
        if (!receiver) {
            return res.status(404)
                .send();

        }
        await assign(receiver, req.body);
        await queries(receiver);
        res.send(receiver);
    }*/

}