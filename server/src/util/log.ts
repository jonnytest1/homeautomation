import { btoa } from './btoaatob';
import { environment } from '../environment';
const fetch = require('node-fetch');

function base64safe(value: string) {
  try {
    btoa(value);
    return value;
  } catch (e) {
    return value.replace(/./g, c => {
      if (c.charCodeAt(0) > 256) {
        return '_';
      }
      return c;
    });
  }
}



function assignb64Safe(data: Record<string, any>, collector: Record<string, string | Element>, shortOnly = false) {

  for (const i in data) {
    let key;
    let dataEl = data[i]
    if (typeof dataEl === "string") {
      dataEl = dataEl.replace(/’/g, "'").replace(/–/g, "-")
    }
    try {
      if (typeof Element !== "undefined" && data[i] instanceof Element) {
        key = 'element_' + i;
        collector[key] = data[i];
      } else {
        btoa(JSON.stringify(dataEl));
        if (i === 'message') {
          key = 'message';
          collector.message = dataEl;
        } else {
          key = 'msg_' + i;
          collector[key] = dataEl;
        }
      }
    } catch (e) {
      try {
        key = 'b64safe_' + i;
        if (i === "message") {
          collector["message"] = "<not b64 safe>"
        }
        collector[key] = base64safe(JSON.stringify(dataEl));
      } catch (e2) {
        key = 'e_' + i;
        collector[key] = 'error parsing for ' + i;
      }
    }

    if (shortOnly && key) {
      const val = collector[key];
      if (typeof val !== 'string' || val.length > 400) {
        delete collector[key];
      }

    }
  }
}


export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG' | "WARN", message: string | {
  message: string,
  [k: string]: any
}, error?) {
  let jsonData: { [key: string]: string } = {
    Severity: level,
    application: `SmartHome${process.env.DEBUG ? '_debug' : ''}`,
  };
  if (!message && error) {
    jsonData.message = error.message;
  } else if (typeof message === "object") {
    if (message['message']) {
      jsonData.message = message['message'];
      for (const i in message) {
        if (i == "message") {
          continue
        }
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
  assignb64Safe(attributes, jsonData, !(jsonData.Severity === 'ERROR' || jsonData.Severity === 'WARN'));
  if (error) {
    if (typeof error == "string") {
      jsonData = {
        ...jsonData,
        error_message: error
      };
    } else {
      jsonData = {
        ...error,
        ...jsonData,
      };
      jsonData.error_message = error.message;
      jsonData.error_stacktrace = error.stack;
    }
  }
  console.log(jsonData);
  fetch(environment.LOG_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: btoa(JSON.stringify(jsonData))
  });
}


export const attributes: Record<string, any> = {}
export async function withAttributes<T>(newAttributes: Record<string, string | undefined>, callback: () => T): Promise<Awaited<T>> {
  Object.assign(attributes, newAttributes);
  try {
    const result = await callback();
    return result;
  } catch (e) {
    Object.keys(newAttributes)
      .forEach(key => {
        e[key] = attributes[key];
      });
    throw e;
  } finally {
    Object.keys(newAttributes)
      .forEach(key => {
        delete attributes[key];
      });
  }
}