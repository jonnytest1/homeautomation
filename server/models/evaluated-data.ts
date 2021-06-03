import type { ConnectionResponse, SenderResponse } from './connection-response';

export class EvaluatedData {


    constructor(public data: SenderResponse<string>, private originalData: ConnectionResponse) {

    }
}