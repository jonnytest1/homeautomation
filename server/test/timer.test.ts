/* eslint-disable import/order */
import './util/mock-logging';
import { hibernatetsMock } from './util/mockhibernatets';
import "./util/mock-db-wrapper"
import { getSenderObject } from './util/object/sender-object';

import { EventScheduler } from '../services/event-scheduler';
import { Timer } from '../models/timer';
import type { Transformation } from '../models/transformation';
import { TimerFactory } from '../services/timer-factory';
import { ReceiverData } from '../models/receiver-data';
import type { ConnectionResponse } from '../models/connection-response';

describe("test stuff wroks when calling with timer", () => {
    hibernatetsMock.load.mockReturnValue(null);
    test("TODO", async () => {
        const sender = getSenderObject('')

        const senderArgs = {
            "notification": {
                "body": "NotificationBody",
                "sound": "bell"
            },

        }
        const timerArgs = {
            "promise": {
                "time": 420000,
                "sentData": {
                    "deviceKey": "mobile-device",
                    "message": "4001257159004"
                },
                "nestedObject": {
                    "notification": {
                        "body": "SecondTimerBody",
                        "sound": "bell"
                    }
                }
            }
        }

        const usedTransformation = getUsedTransformationJson()
        hibernatetsMock.queries.mockRestore()
        hibernatetsMock.load.mockImplementation((async (classArg, cond, param, opts) => {
            if (classArg == Timer) {
                const timer = new Timer();
                timer.timerClassName = "Sender";
                timer.timerClassId = 1
                timer.arguments = JSON.stringify([
                    "checkPromise",
                    { ...senderArgs, ...timerArgs },
                    usedTransformation
                ])
                return timer;
            } else {
                return sender
            }

        }) as any)
        const mockFnc = TimerFactory.create = jest.fn()

        const eventScheduler = new EventScheduler();
        await eventScheduler.checkTimers()
        expect(sender.connections[0].receiver.send).toHaveBeenCalledWith(new ReceiverData({
            ...{
                "notification": {
                    "body": "NotificationBody",
                    "sound": "bell",
                    "title": "transformationName",
                }
            },
            usedTransformation
        } as ConnectionResponse))
        const timerCall = mockFnc.mock.calls[0];
        expect(timerCall[1]).toBe("checkPromise")
        expect(timerCall[2].nestedObject.notification.body).toBe("SecondTimerBody")
        expect(timerCall[2].time).toBe(420000)

    })


    function getUsedTransformationJson(): Transformation {
        return {
            "id": 22,
            "transformation": "const time = 60 * 0.1;\r\n({\r\n    response: {\r\n        time\r\n    },\r\n    promise: delay(time, {\r\n        notification: {\r\n            title: \"PreHeated\",\r\n            sound: \"bell\"\r\n        }\r\n    })\r\n});\r\n", "tsTransformation": "const time = 60 * 0.1;\r\n({\r\n    response: {\r\n        time\r\n    },\r\n    promise: delay(time, {\r\n        notification: {\r\n            title: \"PreHeated\",\r\n            sound: \"bell\"\r\n        }\r\n    })\r\n}) as TransformationResponse;\r\n",
            "transformationKey": "spL00Jook21",
            "name": "transformationName",
            // "sender": 20,
            // "___persisted": true
        };
    }

})