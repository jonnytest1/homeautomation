import { Agent } from 'https';

const fetch = require('node-fetch');

export function fetchHttps(url: string, opts = {}, ...args): Promise<Response> {
    const httpsAgent = new Agent({
        rejectUnauthorized: false,
    });

    return fetch(url, { ...opts, agent: url.startsWith("https") ? httpsAgent : undefined }, ...args)
}