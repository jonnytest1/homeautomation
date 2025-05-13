
import { FrontendWebsocket } from './frontend-update';
import { Connection } from '../models/connection';
import { Receiver } from '../models/receiver';
import { senderLoader } from '../services/sender-loader';
import { sharedPool } from '../models/db-state';
import { load, queries } from 'hibernatets';
import { Path, POST, GET, HttpRequest, HttpResponse } from 'express-hibernate-wrapper';

@Path('connection')
export class ConnectionResource {

  @POST({ path: '' })
  async add(req, res) {
    if (!req.body.senderId || !req.body.receiverId) {
      return res.status(400)
        .send();
    }
    const pool = sharedPool
    try {
      const [sender, receiver] = await Promise.all([
        senderLoader.loadSender(req.body.deviceKey),
        load(Receiver, +req.body.receiverId, [], { first: true, db: pool })
      ]);
      const connection = new Connection(receiver);
      sender.connections.push(connection);
      await queries(sender);
      res.send(connection);
      FrontendWebsocket.updateSenders()
    } finally {
      pool.end()
    }
  }

  @GET({
    path: 'key'
  })
  async getKeys(req: HttpRequest, res: HttpResponse) {
    if (!req.query.itemRef) {
      return
    }
    const connection = await load(Connection, +req.query.itemRef, [], { deep: ["transformer"] });
    res.send(connection.getContextKeys());
  }
}