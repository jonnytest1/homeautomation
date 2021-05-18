import { fetchHttps } from '../util/request';
import { FrontendReceiver } from './server-interfaces';
class Registration {

    readonly deviceKey = 'pc-receiver';

    async register(ip, port): Promise<void> {
        try {

            const response = await fetchHttps<Array<FrontendReceiver>>(`${ip}rest/receiver`);
            const receivers = await response.json();
            if (!receivers.some(receiver => receiver.deviceKey === this.deviceKey)) {
                const saveResponse = await fetchHttps(`${ip}rest/receiver`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        deviceKey: this.deviceKey,
                        port,
                        type: 'wss',
                        name: 'PC Receiver',
                        description: 'Receiver located on the local machine for advanced permissions'
                    })
                });
                if (saveResponse.status !== 200) {
                    const responseText = await saveResponse.text();
                    throw responseText;
                }
            }
        } catch (e) {
            console.error(e);
            await new Promise(res => setTimeout(res, 5000)).then(this.register.bind(this, ip, port));
        }
    }

}

export default new Registration();