
export function btoa(str) {
  return Buffer.from(str)
    .toString('base64');
}


type Primitive = string | number | boolean

const fetch = require('node-fetch');
export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG' | "WARN", message: string | { message: string, [key: string]: Primitive }, error?, ct = 0) {



  let jsonData: { [key: string]: Primitive } = {
    Severity: level,
    application: `SmartHomePC_Receiver${process.env.DEBUG ? '_debug' : ''}`,
  };
  if (!message && error) {
    jsonData.message = error.message;
  } else if (typeof message === "object") {
    const messageCpy = { ...message } as { message?: string }
    if (message['message']) {
      jsonData.message = message['message'];
      delete messageCpy['message'];
      for (const i in messageCpy) {
        if (typeof messageCpy[i] != "number" && typeof messageCpy[i] !== "string") {
          jsonData[i] = JSON.stringify(messageCpy[i])
        } else {
          jsonData[i] = messageCpy[i];
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
  try {

    await fetch(process.env.log_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: btoa(JSON.stringify(jsonData))
    });

  } catch (e) {
    if (ct < 5) {
      setTimeout(() => {
        logKibana(level, message, error, ct + 1)
      }, 500)
    } else {
      throw e
    }

  }
}