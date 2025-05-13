
import { sharedPool } from '../models/db-state';
import { GET, HttpRequest, HttpResponse, Path } from 'express-hibernate-wrapper';


@Path("transformation")
export class TransformationResource {
  @GET({
    path: "keys/:senderid"
  })
  async getTransofrmations(req: HttpRequest, res: HttpResponse) {

    const tranformations = await sharedPool.selectQuery<{ evkey: string }>(
      `SELECT evkey
            FROM (SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(\`data\`,'message":"',-1),'"',1) as evkey,sender 
                FROM eventhistory 
                WHERE sender= ? ) ev
            WHERE ev.evkey NOT IN (
                SELECT transformation.transformationKey 
                FROM transformation 
                WHERE sender = ?
            )`, [req.params.senderid, req.params.senderid])
    res.send(tranformations.map(t => t.evkey));
  }
}