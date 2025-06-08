import { FrontendWebsocket } from './frontend-update';
import { FrontendOrder, Item } from '../models/inventory/item';
import { Order } from '../models/inventory/order';
import { imageLaoder } from '../services/image-converter';
import { logKibana } from '../util/log';
import { Location } from "../models/inventory/location"
import { sharedPool } from '../models/db-state';
import { ResolvablePromise } from '../util/resolvable-promise';
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


let rootLoc: Location

@Path('inventory')
export class INventoryResource {

  static inventoryLock = ResolvablePromise.delayed(0)


  @POST("")
  async addInventoryItem(req: HttpRequest, res: HttpResponse) {
    const body = req.body

    let orderArray: Array<FrontendOrder> = body
    if (!(orderArray instanceof Array)) {
      orderArray = [orderArray]
    }

    await INventoryResource.inventoryLock.prRef
    INventoryResource.inventoryLock = new ResolvablePromise()

    try {


      const items = await load(Item, SqlCondition.ALL, undefined, {
        deep: ["order"],
        db: pool,
        skipFields: ["orderImageSrc"]
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


      const queriesList: Array<Promise<unknown>> = []

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
            queriesList.push(queries(newItem))
          }
        }
      }
      res.send("done")
      FrontendWebsocket.updateInventory(...FrontendWebsocket.websockets)
      await Promise.all(queriesList)
    } finally {
      INventoryResource.inventoryLock.resolve()
    }
  }



  @GET("/location")
  async getLocations(req: HttpRequest, res: HttpResponse) {
    const locations = await load(Location, SqlCondition.ALL, undefined, {
      db: pool,
      deep: {
        parent: {
          filter: SqlCondition.ALL,
          depths: 1
        }
      }
    });

    if (!locations.some(loc => loc.id === -1)) {
      const rootLoc = new Location()
      rootLoc.description = "root"

      rootLoc.id = -1
      const [id] = await save(rootLoc, { db: sharedPool })
      await sharedPool.sqlquery({} as never, "UPDATE location SET id=-1 WHERE id = ?", [id])
      rootLoc.id = -1


      for (const loc of locations) {
        if (loc.parent === null) {
          loc.parent = rootLoc
        }
      }
      locations.unshift(rootLoc)
    }

    res.send(locations)
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

    if (!req.body.parent || req.body.parent === -1) {
      if (!rootLoc) {
        rootLoc = await load(Location, l => l.id = -1, undefined, {
          db: pool,
          first: true
        });
      }
      location.parent = rootLoc
    } else {
      const parentLoc = await load(Location, l => l.id = req.body.parent, undefined, {
        db: pool,
        first: true
      });

      location.parent = parentLoc
    }
    await assign(location, { ...req.body });
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


  @POST("/location/parent")
  async setLocationParent(req: HttpRequest, res: HttpResponse) {
    const body = req.body
    const [location, parentlocation] = await Promise.all([
      load(Location, {
        filter: l => l.id = +body.locationId,
        options: {
          first: true,
          db: pool,
        }
      }),
      load(Location, {
        filter: l => l.id = +body.parentLocationId,
        options: {
          first: true,
          db: pool,
        }
      }),
    ])
    location.parent = parentlocation
    await queries(location)
    res.send("{}")
  }
}