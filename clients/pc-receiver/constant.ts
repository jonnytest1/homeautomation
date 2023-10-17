import { join } from "path"

export const root = __dirname
export const pythonExe = 'C:\\Python39\\python.exe'
export const dataDir = join(root, "data")
export const lastRun = join(dataDir, "last.json")