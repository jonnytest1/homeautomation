
export function btoa(str) {
  return Buffer.from(str)
    .toString('base64');
}


type Primitive = string | number | boolean

const fetch = require('node-fetch');
export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG' | "WARN", message: string | { message: string, [key: string]: Primitive }, error?) {
  let jsonData: { [key: string]: Primitive } = {
    Severity: level,
    application: `SmartHomePC_Receiver${process.env.DEBUG ? '_debug' : ''}`,
  };
  if (!message && error) {
    jsonData.message = error.message;
  } else if (typeof message === "object") {
    if (message['message']) {
      jsonData.message = message['message'];
      delete message['message'];
      for (const i in message) {
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
  fetch(process.env.log_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: btoa(JSON.stringify(jsonData))
  });
}