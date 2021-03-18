import { Connection } from '../../../models/connection';
import { Receiver } from '../../../models/receiver';
import { Sender } from '../../../models/sender';
import { Transformation } from '../../../models/transformation';

export function getSenderObject(transformationJs: string, connectiontransform?: string, options: {
    errors?: number
} = {}) {
    const sender = new Sender();
    sender.deviceKey = "test"

    const transformation = new Transformation()
    transformation.transformationKey = "transformValue";
    transformation.transformation = transformationJs
    transformation.name = "transformatonName"
    sender.transformationAttribute = "tKey"

    const receiver = new Receiver()
    receiver.send = jest.fn(() => {
        if (options.errors) {
            return Promise.resolve(options.errors)
        }
        return Promise.resolve(0)
    })



    const connectionTransfornation = new Transformation()
    connectionTransfornation.transformation = connectiontransform ? connectiontransform : undefined
    const connection = new Connection(receiver)
    connection.transformation = connectionTransfornation
    sender.connections = [connection];

    sender.transformation = [transformation]
    return sender;
}