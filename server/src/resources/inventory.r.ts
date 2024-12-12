import { FrontendWebsocket } from './frontend-update';
import { FrontendOrder, Item } from '../models/inventory/item';
import { Order } from '../models/inventory/order';
import { imageLaoder } from '../services/image-converter';
import { logKibana } from '../util/log';
import { Location } from "../models/inventory/location"
import { assign, GET, HttpRequest, HttpResponse, Path, POST } from 'express-hibernate-wrapper';
import { load, queries, save, SqlCondition } from 'hibernatets';
import { MariaDbBase } from 'hibernatets/dbs/mariadb-base';


const pool = new MariaDbBase(undefined, {
  connectionLimit: 6,
  // trace: true, 
  logPackets: true,
  keepAliveDelay: 5000,
  idleTimeout: 560,
  maxAllowedPacket: 67108864

})

@Path('inventory')
export class INventoryResource {


  @POST("")
  async addInventoryItem(req: HttpRequest, res: HttpResponse) {
    const body = req.body

    let orderArray: Array<FrontendOrder> = body
    if (!(orderArray instanceof Array)) {
      orderArray = [orderArray]
    }
    const items = await load(Item, SqlCondition.ALL, undefined, {
      deep: ["order"],
      db: pool
    });

    const trackingInfoMap: Record<string, Item> = {}
    const productLinkMap = {}
    items
      .forEach(item => {
        if (item.order?.orderId) {
          trackingInfoMap[item.order.orderId] = item
        }
        if (item.productLink) {
          productLinkMap[item.productLink] = item
        }
      });


    for (const order of orderArray) {
      let existing: Order | undefined = undefined

      if (order.orderId) {
        existing = trackingInfoMap[order.orderId]?.order
      }

      if (!existing) {
        existing = new Order()


      }

      await assign(existing, order, { onlyWhenFalsy: true });
      if (order.type) {
        existing.type = order.type

      }
      if (order.orderStatus) {
        existing.orderStatus = order.orderStatus
      }


      if (!order.items?.length) {
        logKibana("ERROR", {
          message: "no items in order",
          orderid: order.orderId
        })
        continue
      }

      for (const item of order.items) {
        if (item.orderImageSrc) {
          item.orderImageSrc = await imageLaoder(item.orderImageSrc)
        }
        const storedItem = productLinkMap[item.productLink]

        if (item.productLink && storedItem) {
          await assign(storedItem, item, { onlyWhenFalsy: false })
          await queries(storedItem)
        } else {
          const newItem = new Item()
          newItem.order = existing
          await assign(newItem, item);
          await save(newItem)
        }
      }
    }
    res.send("done")
    FrontendWebsocket.updateInventory(...FrontendWebsocket.websockets)
  }



  @GET("/location")
  async getLocations(req: HttpRequest, res: HttpResponse) {
    const locaitons = await load(Location, SqlCondition.ALL, undefined, {
      db: pool
    });
    res.send(locaitons)
  }


  @POST("/location/new")
  async newLocation(req: HttpRequest, res: HttpResponse) {
    const body = req.body

    if (body.id) {
      const location = await load(Location, l => l.id = body.id, undefined, {
        db: pool,
        first: true
      });

      if (location) {
        await assign(location, req.body);

        return
      }
    }

    const location = new Location()
    await assign(location, req.body);
    await save(location)
    await queries(location)

    res.send(location)
  }


  @POST("/location")
  async setLocation(req: HttpRequest, res: HttpResponse) {
    const body = req.body
    const [location, item] = await Promise.all([
      load(Location, {
        filter: l => l.id = +body.locationId,
        options: {
          first: true
        }
      }),
      load(Item, {
        filter: l => l.id = +body.itemid,
        options: {
          first: true,
          db: pool
        },
      })
    ])
    debugger;
    item.location = location
    await queries(item)
    res.send("ok")
  }
}