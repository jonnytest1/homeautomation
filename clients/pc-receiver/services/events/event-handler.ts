import { z } from "zod"
import { execSync } from "child_process"
import { join } from "path"
import { pythonExe } from '../../constant'
import { logKibana } from '../../util/log'


let hibernatePrompted = 0

export const eventHandlerMap = {
    "play/pause": () => {
        execSync(`${pythonExe} ${join(__dirname, "play-pause.py")}`)
    },
    "hibernate": () => {
        hibernatePrompted = Date.now()
        return "pending_confirmation"
    }
} satisfies Record<string, () => ResponseType | void>

export const eventConfirmHandlerMap = {
    "hibernate": () => {
        if (hibernatePrompted > (Date.now() - (1000 * 10))) {
            execSync(`shutdown /h /f`)
        }
    }
} satisfies Record<string, () => void>

export type ResponseType = "pending_confirmation"
export const isEvent = z.object({
    type: z.string()
})



export const isActionEvent = isEvent.extend({
    type: z.literal("trigger-action"),
    name: z.string()
})



export function handleActionEvent(evt: z.infer<typeof isActionEvent>): ResponseType | void {
    console.log("got action " + evt.name)

    if (eventHandlerMap[evt.name]) {
        return eventHandlerMap[evt.name]?.();
    } else {
        logKibana("ERROR", {
            message: "missing action",
            name: evt.name
        })
    }
}

export function handleActionConfirmEvent(evt: z.infer<typeof isActionEvent>): ResponseType | void {
    console.log("got action " + evt.name)

    if (eventConfirmHandlerMap[evt.name]) {
        return eventConfirmHandlerMap[evt.name]?.();
    } else {
        logKibana("ERROR", {
            message: "missing action confirm",
            name: evt.name
        })
    }
}