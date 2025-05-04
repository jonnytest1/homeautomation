import { Agent } from 'https';

const fetch = require('node-fetch');

interface TypedJsonResponse<T> extends Response {
  json(): Promise<T>

}

export function fetchHttps<T = any>(url: string, opts: import("node-fetch").RequestInit = {}, ...args): Promise<TypedJsonResponse<T>> {
  const httpsAgent = new Agent({
    rejectUnauthorized: false,
  });

  return fetch(url, {
    ...opts,
    agent: url.startsWith("https") ? httpsAgent : undefined
  },
    ...args)
}