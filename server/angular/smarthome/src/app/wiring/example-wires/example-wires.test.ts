
import { promises } from "fs"
import { join } from 'path'
import { LocalStorageSerialization } from '../storage'
describe("example wires", () => {


    it("relay temaplte", async () => {
        expect(1).toBe(2)
        const jsonFile = await promises.readFile(join(__dirname, "relay.template"), { encoding: "utf8" })
        const json = JSON.parse(jsonFile)
        debugger;
        const serializer = new LocalStorageSerialization(null, null)
        debugger;
        expect(serializer).toBeDefined()



    })
})