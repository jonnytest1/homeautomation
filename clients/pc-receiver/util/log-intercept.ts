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

  console.log = function (d) { //
    log_file.write(format(d) + '\n');
    log_stdout.write(format(d) + '\n');
  };
}