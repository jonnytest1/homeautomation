import { Sender } from '../models/sender';
import { Sound } from '../models/sound';
import { TscCompiler } from '../util/tsc-compiler';
import { load } from 'hibernatets';

class SenderLoader {


    async loadSenders() {
        const twoMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 60);
        const [senders, sounds] = await Promise.all([
            load(Sender, 'true = true', [twoMonthsAgo], {
                deep: {
                    connections: "TRUE = TRUE",
                    events: "`timestamp` > " + twoMonthsAgo,
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