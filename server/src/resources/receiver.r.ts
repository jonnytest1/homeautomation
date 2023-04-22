import { FrontendWebsocket } from './frontend-update';
import { Receiver } from '../models/receiver';
import { logKibana } from '../util/log';
import { assign } from 'express-hibernate-wrapper';
import { load, save } from 'hibernatets';
import { Path, POST, GET, HttpResponse } from 'express-hibernate-wrapper';

@Path('receiver')
export class ReceiverResource {

    @POST({
        path: ''
    })
    async register(req, res) {
        const existingReceiver = await load(Receiver, s => s.deviceKey = req.body.deviceKey, [], { first: true });
        if (existingReceiver) {
            if (existingReceiver.type == "ws" || existingReceiver.type == "ip" || existingReceiver.type == "http") {
                let newIp = req.headers.http_x_forwarded_for
                if (req.body.port) {
                    newIp += `:${req.body.port}`;
                }
                if (newIp != existingReceiver.ip) {
                    existingReceiver.ip = newIp
                }
            }
            await assign(existingReceiver, req.body);
            logKibana('INFO', `receiver already exists with id ${req.body.deviceKey}`);
            res.status(409)
                .send(existingReceiver);
            return;
        }
        const receiver = new Receiver();
        if (req.body.type === 'ip' || req.body.type === 'wss' || req.body.type === 'http') {
            receiver.ip = req.headers.http_x_forwarded_for;
            if (req.body.port) {
                receiver.ip += `:${req.body.port}`;
            }
        }
        await assign(receiver, req.body);
        await save(receiver);
        res.send(receiver);
        FrontendWebsocket.updateSenders()
    }

    @GET({
        path: ''
    })
    async getReceivers(req, res: HttpResponse) {
        const receivers = await load(Receiver, 'true = true');
        res.send(receivers);
    }
}