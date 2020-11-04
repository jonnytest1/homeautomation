

const fetch = require('node-fetch');

const https = require('https');
export function fetchHttps(url: string, opts = {}, ...args): Promise<Response> {
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });


    return fetch(url, { ...opts, agent: url.startsWith("https") ? httpsAgent : undefined }, ...args)
}