import { HttpRequest, HttpResponse, POST, Path } from 'express-hibernate-wrapper';

@Path('log')
export class Log {


    @POST({
        path: ""
    })
    async log(req: HttpRequest, res: HttpResponse) {
        console.log(req.body);
        res.send()
    }
}