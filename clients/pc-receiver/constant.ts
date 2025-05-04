import { join } from "path"

export const root = __dirname
export const pythonExe = 'C:\\Python39\\python.exe'
export const dataDir = join(root, "data")
export const lastRun = join(dataDir, "last.json")



export const phoneName = "Z-Fold5"
export const SECOND = 1000
export const MINUTE = SECOND * 60

export const HOUR = MINUTE * 60
export const DAY = HOUR * 24