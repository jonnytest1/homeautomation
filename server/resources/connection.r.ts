import { GET, HttpRequest, HttpResponse, Path, POST } from '../express-wrapper';
import { Connection } from '../models/connection';
import { Receiver } from '../models/receiver';
import { Sender } from '../models/sender';
import { load, queries } from 'hibernatets';

@Path('connection')
export class ConnectionResource {

    @POST({ path: '' })
    async add(req, res) {
        if (!req.body.senderId || !req.body.receiverId) {
            return res.status(400)
                .send();
        }
        const [sender, receiver] = await Promise.all([
            load(Sender, s => s.deviceKey = req.body.senderId, [], { first: true }),
            load(Receiver, req.body.receiverId, [], { first: true })]);
        const connection = new Connection(receiver);
        sender.connections.push(connection);
        await queries(sender);
        res.send(connection);
    }

    @GET({
        path: 'key'
    })

    async getKeys(req: HttpRequest, res: HttpResponse) {
        const connection = await load(Connection, +req.query.itemRef, [], { deep: ["transformer"] });
        res.send(connection.getContextKeys());
    }
}