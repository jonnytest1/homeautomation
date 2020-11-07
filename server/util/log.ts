const fetch = require('node-fetch');
import { btoa } from './btoaatob';
export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG', message: string | Object, error?) {
    let jsonData: { [key: string]: string } = {
        Severity: level,
        application: `SmartHome${process.env.DEBUG ? '_debug' : ''}`,
    };
    if (!message && error) {
        jsonData.message = error.message;
    } else if (message instanceof Object) {
        if (message['message']) {
            jsonData.message = message['message'];
            delete message['message'];
            for (let i in message) {
                if (typeof message[i] != "number" && typeof message[i] !== "string") {
                    jsonData[i] = JSON.stringify(message[i])
                } else {
                    jsonData[i] = message[i];
                }
            }
        } else {
            jsonData.message = JSON.stringify(message);
        }
    } else {
        jsonData.message = message;
    }
    if (error) {
        jsonData = { ...jsonData, ...error };
        jsonData.error_message = error.message;
        jsonData.error_stacktrace = error.stack;
    }
    console.log(jsonData);
    fetch(`https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: btoa(JSON.stringify(jsonData))
    });
}