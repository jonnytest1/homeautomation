
const fetch = require('node-fetch');

const https = require('https');
class Registration {

    readonly deviceKey = 'pc-receiver';

    async register(): Promise<void> {
        try {
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            });
            const response = await fetch('https://192.168.178.54/nodets/rest/receiver', {
                agent: httpsAgent,
            });
            const receivers = await response.json();
            if (!receivers.some(receiver => receiver.deviceKey === this.deviceKey)) {
                const saveResponse = await fetch('https://192.168.178.54/nodets/rest/receiver', {
                    method: 'POST',
                    agent: httpsAgent,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        deviceKey: this.deviceKey,
                        port: '13579',
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
            await new Promise(res => setTimeout(res, 5000)).then(this.register.bind(this));
        }
    }

}

export default new Registration();