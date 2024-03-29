/* eslint-disable import/order */
import { mockRepsonse, mockRequest } from './util/http';
import { mockedLogging } from './util/mock-logging';
import { dbwrapper } from "./util/mock-db-wrapper"

//jest.mock('../models/receiver')
// Sender Resource needs to be imported after mocks have been registered
import { SenderResource } from '../src/resources/sender.r';
import { getSenderObject } from './util/object/sender-object';
import { TimerFactory } from '../src/services/event/timer-factory';
import { ReceiverData } from '../src/models/receiver-data';
import { ResponseCodeError } from 'express-hibernate-wrapper';

describe("triggertest", () => {

  mockedLogging.logKibana;
  dbwrapper.autosaveable


  test("with should get 404 with sender not found", async () => {

    const error = new ResponseCodeError(404, 'test')
    dbwrapper.loadOne.mockRejectedValue(error);
    const sender = new SenderResource()
    const response = mockRepsonse();

    await expect(sender.trigger(mockRequest({ deviceKey: "test" }), response)).rejects.toEqual(error)

  })


  test("should call receiver", async () => {
    const sender = new SenderResource()
    const response = mockRepsonse();

    const senderObject = getSenderObject(`{
            notification: {
                body: "test"
            }
        }`, `({
            response: {
                tag: data.usedTransformation.name
            },
            withRequest: true 
         })`
    )

    dbwrapper.loadOne.mockReturnValue(Promise.resolve(senderObject));

    await sender.trigger(mockRequest({ deviceKey: "test", tKey: "transformValue" }), response)

    expect(senderObject.connections[0].receiver.send).toHaveBeenCalledWith(new ReceiverData({ "response": { "tag": "transformatonName" }, "withRequest": true }))
    expect(response.values.status).toBe(200)
  })


  test("should-call-timer", async () => {
    const sender = new SenderResource()
    const response = mockRepsonse();

    const senderObject = getSenderObject(`({
            response:{
                time:1234
            },
            promise:delay(1234,{
                notification:{
                    body:"testBody"
                }
            })
        })`)
    const mockFnc = TimerFactory.create = jest.fn()
    dbwrapper.loadOne.mockReturnValue(Promise.resolve(senderObject));

    await sender.trigger(mockRequest({ deviceKey: "test", tKey: "transformValue" }), response)

    expect(response.values.status).toBe(200)

    const timerCall = mockFnc.mock.calls[0];
    expect(timerCall[1]).toBe("checkPromise")
    expect(timerCall[2].nestedObject.notification.body).toBe("testBody")
    expect(timerCall[2].time).toBe(1234000)
  })

})