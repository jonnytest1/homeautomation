
const fetch = require('node-fetch');
export async function imageLaoder(url: string | HTMLImageElement) {

  if (typeof url == "object" && "tagName" in url) {

    url = url.src

  }

  const reqUrl = new URL(url)
  const resp = await fetch(url, {
    headers: {
      Referer: reqUrl.origin
    }
  })
  if (resp.status !== 200) {
    throw new Error("couldnt get image for " + url)
  }
  const buffer = await resp.arrayBuffer();

  let type = "image/png"
  if (url.endsWith(".jpg")) {
    type = "image/jpeg"
  }

  const b64Buffer = Buffer.from(buffer, "binary").toString("base64")

  return `data:${type};base64,${b64Buffer}`
}