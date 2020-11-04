var mkdirp = require('mkdirp');
var fs = require('fs');
const path = require('path');
export async function writeFileDir(filePath, contents) {
    return new Promise(async res => {
        const OSPath = convertToOS(filePath);
        const dir = path.dirname(OSPath)
        const response = await mkdirp(dir,);
        // if (response) return res(err);

        fs.writeFile(OSPath, contents, res);
    })
}

export function convertToOS(filePath: string) {
    let OSPath = filePath.split(/[\/\\\\]/g).join(path.sep)
    if (path.sep == "\\") {
        OSPath = "D:" + OSPath
    }
    return OSPath;
}
