import { CommonModule } from '@angular/common';
import { NgModule, type InjectionToken } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';

import { WiringModule as ElectronicsModule, templateService, esp32LibraryToken, newClassBound, stringTypeLiteral, instantiate, WiringComponent } from "electronics-lib"
import { files, wiringLayout } from './layout';
import { mqttLib, mqttReplace } from './libs/mqtt';
import { jsonLib } from './libs/json';
import { RouterModule } from '@angular/router';

function provideToken<T extends InjectionToken<unknown>>(token: T, value: T extends InjectionToken<infer U> ? U : never) {
  return {
    provide: token,
    useValue: value
  }
}

@NgModule({
  imports: [
    CommonModule,
    MatSidenavModule,
    MatSortModule, MatIconModule, ElectronicsModule,
    RouterModule.forChild([{
      pathMatch: "prefix",
      path: "",
      component: WiringComponent,
    }])
  ],
  declarations: [],
  exports: [],
  providers: [

    provideToken(templateService, () => Promise.resolve([{
      name: "code",
      content: JSON.stringify(wiringLayout)
    }])),
    provideToken(esp32LibraryToken, {
      includes: {
        "WiFi.h": {
          load(rt) {
            newClassBound<[]>(rt)("WiFiClient", []);


            rt.regFunc((rt, self) => {
              //not needed
              return rt.val(rt.voidTypeLiteral, undefined);
            }, "global", "waitForWifi", [], rt.voidTypeLiteral);
          },
        },
        "string": {
          load(rt) {


            const originalFnc = rt.types.pointer_array["handlers"]["o(+)"].default

            rt.types.pointer_array["handlers"]["o(+)"].default = (rt, l, r) => {
              if (rt.isArrayType(l) && rt.isArrayType(r)) {
                if (rt.castable(l.t.eleType, r.t.eleType)) {
                  return {
                    t: {
                      ...l.t,
                      size: l.t.size + r.t.size
                    },
                    v: {
                      target: [...l.v.target.slice(0, -1), ...r.v.target],
                      position: 0
                    }
                  }
                } else {
                  return originalFnc(rt, l, r)
                }
              } else {
                return originalFnc(rt, l, r)
              }
            }

            /*const StrClass = newClassBound(rt)("String", [])


            rt.regFunc((rt, self, arg) => {
              //not needed
              return instantiate(rt, StrClass, [arg]);
            }, "global", "String", [stringTypeLiteral(rt)], StrClass);


            rt.regFunc((rt, self, arg) => {
              //not needed
              return instantiate(rt, StrClass, [arg]);
            }, StrClass, "o(+)", [stringTypeLiteral(rt)], StrClass);*/
          },
        },
        ...mqttLib(),
        ...jsonLib()
      },
      codemapper(code) {

        code = mqttReplace(code)
        code = code.replace(/#define LED_TYPE WS2812B/g, '')
        code = code.replace(/addLeds<LED_TYPE, DATA_PIN>/g, 'addLeds')


        code = code.replace(/Serial\.print.*/g, '')

        for (const file of files) {
          code = code.replace(new RegExp(`#include "${file.replace(".", "\\.")}"`, "g"), '')
        }
        code = code.replace(new RegExp(`#include "lib/wi_fi.h"`, "g"), '')
        code = code.replace(new RegExp(`std::string`, "g"), 'char*')
        code = code.replace(/([^a-zA-Z])String /g, '$1char* ')
        code = code.replace(/String\(/g, '(')
        code = code.replace(/&([a-zA-Z]+)/g, '$1')
        code = code.replace(/uint8_t/g, 'int')
        code = code.replace(/.c_str\(\)/g, '')



        code = code.replace(/R"\(([\s\S]*?)\)"/gm, (repl, ...args) => {
          return `"` + args[0]
            .replace(/\n/g, "\\n")
            .replace(/"/g, `\\"`) + `"`
        })

        return code.replace(/::/g, 'Static.')
      },
    })
  ]
})
export class WiringModule {}