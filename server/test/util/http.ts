import type { HttpRequest, HttpResponse } from 'express-hibernate-wrapper';

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


