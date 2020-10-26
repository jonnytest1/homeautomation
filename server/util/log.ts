const fetch = require('node-fetch');
import { btoa } from './btoaatob';
export function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG', message: string | Object, error?) {
    error = { ...error };
    let jsonData: { [key: string]: string } = {
        Severity: level,
        application: 'SmartHome',
    };
    if (!message && error) {
        jsonData.message = error.message;
    } else if (message instanceof Object) {
        if (message['message']) {
            jsonData.message = message['message'];
            delete message['message'];
            for (let i in message) {
                jsonData[i] = message[i];
            }
        } else {
            jsonData.message = JSON.stringify(message);
        }
    } else {
        jsonData.message = message;
    }
    if (error) {
        jsonData.error_message = error.message;
        jsonData.error_stacktrace = error.stack;
        delete error.message;
        delete error.stack;
        jsonData = { ...jsonData, ...error };
    }
    fetch(`https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: btoa(JSON.stringify(jsonData))
    });
}