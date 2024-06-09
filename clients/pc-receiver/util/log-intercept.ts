import { createWriteStream, mkdirSync } from "fs"
import { format } from "util"
import { join, dirname } from "path"
import { environment } from '../environment';

export function interceptLogs() {
  const now = new Date();
  const start = now.toISOString().split("T")[0]
  const file = `${join(__dirname, "../logs")}/${environment.logfileprefix}_${start}_${+now}.log`;
  mkdirSync(dirname(file), { recursive: true })
  var log_file = createWriteStream(file, { flags: 'w' });
  var log_stdout = process.stdout;

  console.log = function (...args) { //
    const str = args.map(a => format(a)).join(", ")
    log_file.write(str + '\n');
    log_stdout.write(str + '\n');
  };
}