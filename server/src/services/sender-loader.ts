import { Sender } from '../models/sender';
import { Sound } from '../models/sound';
import { TscCompiler } from '../util/tsc-compiler';
import { load } from 'hibernatets';

class SenderLoader {


    async loadSenders() {
        const [senders, sounds] = await Promise.all([
            load(Sender, 'true = true', undefined, {
                deep: {
                    connections: "TRUE = TRUE",
                    events: "`timestamp` > UNIX_TIMESTAMP(DATE_ADD(NOW(),INTERVAL -60 DAY))",
                    batteryEntries: "TRUE = TRUE",
                    transformation: "TRUE = TRUE",
                    receiver: "TRUE = TRUE",
                }
            }),
            load(Sound, 'true=true')
        ])


        const definitionFile = TscCompiler.responseINterface
            .replace(
                "type soundListRuntime = string",
                `type soundListRuntime = ${sounds.map(s => `'${s.key}'`).join(' | ')}`)


        await Promise.all(senders.map(async sender => {
            sender.transformation.forEach(tr => tr.definitionFile = definitionFile)
        }))

        return senders
    }
}

export const senderLoader = new SenderLoader();