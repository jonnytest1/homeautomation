import { log } from 'console';
import { Request, Response } from 'express';
import { GET, Path, POST } from '../express-wrapper';
import { logKibana } from '../util/log';
import { firebasemessageing } from './firebasemessaging';

const timers: { [key: string]: { name: string, duration: number } } = {
    '4100060012329': {
        name: 'ACE',
        duration: 6
    }
};

let token = 'cDE5YKnedYwerc-5ODDYxY:APA91bF2g4xDrd5TxYGUUY0Z9xyzzUKHBrFrXfDfUibuoC8SfRTRUDJ2rQUIRINmjVrP4KDBxXBN9zsPDTa6q-scRU8UcPPoh1PBao6dr31s_fF0WW3Lxt0On_3KmUQJcnqkJRtfeqxM';
@Path('timer')
export class Timer {

    @POST({
        path: 'token'
    })
    async setToken(req, res) {
        token = req.body;
        res.send(token);
    }

    @POST({
        path: 'timer'
    })
    async timerFnc(req: Request, res: Response) {
        if (typeof req.body !== 'string') {
            console.error('wrong type');
            res.status(400)
                .send();
            return;
        }
        const timer = timers[req.body];
        if (!timer) {
            logKibana('ERROR', {
                message: 'missing TIMER',
                timer: req.body
            });
            res.status(404)
                .send();
            return;
        }
        res.send(`set ${timer.duration} minutes \nfor ${timer.name}`);
    }

    @GET({
        path: ''
    })
    async timers(req: Request, res: Response) {
        console.log('sending message');
        const response = await firebasemessageing.sendTestNotification(token);
        console.log(req.body);
        console.log(req.method);
        res.send('hi\n' + JSON.stringify(response));
    }
}