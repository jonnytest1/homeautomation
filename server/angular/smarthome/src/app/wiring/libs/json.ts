import { instantiate, newClassBound, stringTypeLiteral, type JscppInclude } from 'electronics-lib'

export function jsonLib() {

  return {
    "ArduinoJson.h": {
      load(rt) {

        const jsonDoc = newClassBound(rt)("JsonDocument", [])
        rt.regFunc((rt, self, doc, text) => {
          const jsonString = rt.getStringFromCharArray(text)
          const obj = JSON.parse(jsonString);
          (doc.v as any)["_data"] = obj
        }, "global", "deserializeJson", [jsonDoc, stringTypeLiteral(rt)], rt.voidTypeLiteral)


        rt.regFunc((rt, self, keyV) => {
          const key = rt.getStringFromCharArray(keyV)

          const jsonObj = self.v._data[key];
          if (typeof jsonObj == "number") {
            if (jsonObj > rt.config.limits.long.max) {
              return rt.val(rt.primitiveType("long long"), jsonObj)
            }
            return rt.val(rt.longTypeLiteral, jsonObj)
          }
          const obj = instantiate(rt, jsonDoc, [])
          debugger

        }, jsonDoc, "o([])", [stringTypeLiteral(rt)], jsonDoc)
      },
    }
  } satisfies JscppInclude

}