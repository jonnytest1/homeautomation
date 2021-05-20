import { HttpRequest, HttpResponse } from 'express-hibernate-wrapper';



jest.mock('../../util/settable');

const settableImport = require('../../util/settable');
settableImport.settable.mockImplementation(() => undefined)
export function mockRequest(body): HttpRequest {
    return {
        body: body
    } as HttpRequest
}
interface MockResponseValues {
    status?: number
}
export function mockRepsonse(): HttpResponse & { values: MockResponseValues } {

    const res: any = {};
    const values: MockResponseValues = {}
    res.values = values
    res.status = (data) => {
        res.values.status = data;
        return res;
    };
    res.json = (data) => {
        res.values.json = data;
        return res;
    };
    res.send = (data) => {
        res.values.data = data;
        return res;
    }
    return res;

}


