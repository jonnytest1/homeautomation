import { assign, HttpRequest, HttpResponse, Path, POST } from 'express-hibernate-wrapper';
import { load, queries, save, SqlCondition } from 'hibernatets';
import { FrontendOrder, Item } from '../models/inventory/item';
import { Order } from '../models/inventory/order';
import websocketmessaging from '../services/websocketmessaging';
import { FrontendWebsocket } from './frontend-update';



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
            deep: ["order"]
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
            if (order.orderStatus) {
                existing.orderStatus = order.orderStatus
            }
            if (!order.items) {
                continue
            }

            for (const item of order.items) {

                let storedItem = productLinkMap[item.productLink]

                if (storedItem) {
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
}