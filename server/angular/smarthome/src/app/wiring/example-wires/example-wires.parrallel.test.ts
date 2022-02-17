
import { promises } from "fs"
import { join } from 'path'
import { LocalStorageSerialization } from '../storage'
import { Battery } from '../wirings/battery'
describe("example wires", () => {
  global.Image = (function () {}) as any

  function flatten(ar: Array<any>) {
    return ar.map(el => {
      if (el instanceof Array) {
        return flatten(el)
      }
      return el.constructor.name
    })

  }

  it("parrallel temaplte", async () => {
    const jsonFile = await promises.readFile(join(__dirname, "parrallel.template"), { encoding: "utf8" })
    const json = JSON.parse(jsonFile)
    const nodes = []

    const serializer = new LocalStorageSerialization(null, null)

    expect(serializer).toBeDefined()
    const obj: Array<Battery> = serializer.parseJson(json, {
      displayNodes: nodes
    })
    expect(obj).toBeDefined()

    expect(obj.length).toBe(1)
    const battery1 = obj[0]
    const structure1 = battery1.getStructure()
    expect(flatten(structure1)).toEqual(
      [
        'Battery', 'Connection',
        'ParrallelWire',
        [
          ['Connection', 'LED', 'Connection', 'Wire', 'Connection', 'Resistor', 'Connection'],
          ['Connection', 'LED', 'Connection', 'Wire', 'Connection', 'Resistor', 'Connection']
        ],
        'ParrallelWire',
        'Connection', 'Battery'
      ])
  })
})