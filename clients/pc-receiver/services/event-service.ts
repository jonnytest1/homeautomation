import { execSync } from "child_process"
import { XMLParser } from "fast-xml-parser"


interface Event {
    EventData: unknown

    System: {
        EventID: number
        Provider: {
            "_attr_Name": string
        }
        TimeCreated: {
            _attr_SystemTime: string
        }
    }
}

type EventType = "INFORMATION" | "ERROR"
export function getEvents() {
    const output = execSync("wevtutil qe System", { maxBuffer: (1024 * 1024 * 1024), encoding: "utf-8" });

    const entries = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "_attr_" }).parse(output) as {
        Event: Array<Event>
    };
    return entries.Event
}

export function createEvent(description: string, type: EventType = "INFORMATION", id = 1) {
    const source = "PC-Receiver"
    description = description.replace(/"/g, '\\"');
    const output = execSync(`eventcreate.exe /T ${type} /D "${description}" /L APPLICATION /ID ${id} /SO "${source}"`, {
        maxBuffer: (1024 * 1024 * 1024), encoding: "utf-8"
    });
}

export function getLatestPowerOnEvent() {
    const events = getEvents();
    const powerOnEventS = events.filter(ev => ev.System.Provider._attr_Name == "Microsoft-Windows-Kernel-Boot" && ev.System.EventID == 30)
    const sorted = powerOnEventS
        .map(ev => ({ d: new Date(ev.System.TimeCreated._attr_SystemTime), ev }))
        .sort((a, b) => b.d.valueOf() - a.d.valueOf())
    const latest = sorted[0]

    return latest.ev;
}