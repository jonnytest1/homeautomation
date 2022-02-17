
import { promises } from "fs"
import { join } from 'path'
import { LocalStorageSerialization } from '../storage'
import { Battery } from '../wirings/battery'
import { Relay } from '../wirings/relay'
import { ToggleSwitch } from '../wirings/toggle-switch'
describe("example wires", () => {
  global.Image = (function () {

  }) as any

  it("relay temaplte", async () => {
    const jsonFile = await promises.readFile(join(__dirname, "relay.template"), { encoding: "utf8" })
    const json = JSON.parse(jsonFile)
    const nodes = []

    const serializer = new LocalStorageSerialization(null, null)

    expect(serializer).toBeDefined()
    const obj: Array<Battery> = serializer.parseJson(json, {
      displayNodes: nodes
    })
    expect(obj).toBeDefined()

    expect(obj.length).toBe(2)
    const battery1 = obj[0]
    const structure1 = battery1.getStructure()

    expect(structure1.map(c => c.constructor.name)).toEqual([
      'Battery', 'Connection', 'Wire',
      'Connection', 'Relay', 'Connection',
      'Wire',
      'Connection', 'Switch', 'Connection',
      'Wire',
      'Connection', 'Battery'])
    const battery2 = obj[1]
    const structure2 = battery2.getStructure()
    expect(structure2.map(c => c.constructor.name)).toEqual([
      'Battery', 'Connection',
      'Wire',
      'Connection', 'LED', 'Connection',
      'Wire',
      'Connection', 'Resistor', 'Connection',
      'Wire',
      'Connection', 'ToggleSwitch', 'Connection',
      'Wire',
      'Connection', 'Battery'])
    const relay = structure1[4] as Relay
    const tSwitch = structure2[12] as ToggleSwitch

    expect(relay.switch1).toBe(tSwitch)

  })
})