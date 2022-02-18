


import { GET, HttpRequest, HttpResponse, Path } from 'express-hibernate-wrapper'
import { readdir, readFile } from "fs/promises"
import { join } from "path"

const bakcendRootFolder = join(__dirname, "../..")
const gitRootFodler = join(bakcendRootFolder, "..")


async function findTemplates(dir = gitRootFodler) {
    const entries = await readdir(dir, { withFileTypes: true });
    const entryEntries: Array<Array<{ name: string, content: string }>> = await Promise.all(entries.map(async entry => {
        const next = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith(".") && !next.endsWith("node_modules") && !next.endsWith(".angular") && !next.endsWith("__pycache__")) {
            return findTemplates(next)
        } else if (entry.name.endsWith(".template")) {
            return [{
                name: next,
                content: await readFile(next, { encoding: "utf8" })
            }]
        }
        return []
    }))

    return entryEntries.flat()

}

const templates = findTemplates();
@Path("wiring")
export class TransformationResource {
    @GET("")
    async getTemplates(req: HttpRequest, res: HttpResponse) {
        const templateList = await templates
        res.send(templateList)
    }
}