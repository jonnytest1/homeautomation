
import { createHash } from "crypto"


export function sha256(data: Buffer) {
    const hash = createHash("sha256");
    hash.update(data)
    return hash.digest("hex");
}