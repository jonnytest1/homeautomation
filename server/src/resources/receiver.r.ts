import { FrontendWebsocket } from './frontend-update';
import { Receiver } from '../models/receiver';
import { logKibana } from '../util/log';
import { ReceiverEvent } from '../models/receiver-event';
import { ReceiverData } from '../models/receiver-data';
import { emitEvent } from '../services/generic-node/generic-node-service';
import { sharedPool } from '../models/db-state';
import { HttpRequest, assign } from 'express-hibernate-wrapper';
import { SqlCondition, load, save, } from 'hibernatets';
import { Path, POST, GET, HttpResponse } from 'express-hibernate-wrapper';


const pool = sharedPool

@Path('receiver')
export class ReceiverResource {

  @POST({
    path: ''
  })
  async register(req, res) {
    const existingReceiver = await load(Receiver, s => s.deviceKey = req.body.deviceKey, [], { first: true, db: pool });
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
      const prevToken = existingReceiver.firebaseToken
      await assign(existingReceiver, req.body);
      if (prevToken !== existingReceiver.firebaseToken) {
        existingReceiver.send(new ReceiverData({ notification: { title: "firebase token", body: "updated" } }))
      }
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
    const receivers = await load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions"],
      db: sharedPool
    });
    res.send(receivers);
  }

  @POST({ path: ':receiverId/action/:actionName*/confirm' })
  async triggerActionConfirm(req: HttpRequest, res: HttpResponse) {
    if (!req.params.receiverId || !req.params.actionName) {
      return res.status(400)
        .send();
    }
    const actionName = req.params.actionName + req.params[0]
    const receiver = await load(Receiver, new SqlCondition("deviceKey").equals(req.params.receiverId), [], {
      first: true,
      db: pool,
      interceptArrayFunctions: true,
      deep: {
        actions: {
          filter: new SqlCondition("name").equals(actionName),
          depths: 1
        }
      },
    })

    if (!receiver) {
      return res.status(404)
        .send();
    }

    const action = (receiver.actions ?? []).find(action => action.name == actionName);
    if (!action) {

      return res.status(404)
        .send();
    }

    receiver.events.push(new ReceiverEvent({
      name: actionName
    }))
    const url = new URL("action/confirm", `http://${receiver.ip}`).href;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        name: action.name
      })
    })
    res.status(200).send();
  }
  @POST({ path: ':receiverId/action/:actionName*/trigger' })
  async trigger(req: HttpRequest, res: HttpResponse) {
    if (!req.params.receiverId || !req.params.actionName) {
      return res.status(400)
        .send();
    }

    if (req.params.receiverId === "generic-node") {

      emitEvent("action-trigger", {
        payload: {
          node: req.params.actionName
        },
        context: {
          initialNode: req.params.actionName
        }
      })
      return res.status(200).send();

    }

    const actionName = req.params.actionName + req.params[0]
    const receiver = await load(Receiver, new SqlCondition("deviceKey").equals(req.params.receiverId), [], {
      first: true,
      interceptArrayFunctions: true,
      db: pool,
      deep: {
        actions: {
          filter: new SqlCondition("name").equals(actionName),
          depths: 1
        }
      }
    })

    if (!receiver) {
      return res.status(404)
        .send();
    }

    const action = (receiver.actions ?? []).find(action => action.name == actionName);
    if (!action) {

      return res.status(404)
        .send();
    }

    receiver.events.push(new ReceiverEvent({
      name: actionName
    }))



    const url = new URL("action", `http://${receiver.ip}`).href;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        type: "trigger-action",
        name: action.name
      })
    })
    const responseTxt = await response.text();
    if (responseTxt == "pending_confirmation") {
      res.status(200).send("pending_confirmation");
    }
    res.status(200).send();
  }


  @POST({ path: '/state' })
  async state(req: HttpRequest, res: HttpResponse) {
    if (!req.body.deviceKey) {
      return res.status(400)
        .send("missing device key");
    }
    if (req.body.state == undefined) {
      return res.status(400)
        .send("missing state");
    }
    const receiver = await load(Receiver, s => s.deviceKey = req.body.deviceKey, [], {
      first: true,
      db: pool,
      deep: true,
      interceptArrayFunctions: true,
    });

    if (typeof req.body.state == "number" || typeof req.body.state == "boolean" || typeof req.body.state == "string") {
      receiver.currentState = req.body.state;
    }
    receiver.events.push(new ReceiverEvent({ ...req.body, type: "state" }))
    FrontendWebsocket.updateState(receiver);

    res.status(200).send();

  }



  @POST({ path: '/notification' })
  async notification(req: HttpRequest, res: HttpResponse) {
    if (!req.body.tag) {
      return res.status(400)
        .send("missing tag");
    }

    // dismiss for others

    res.status(200).send();

  }
}