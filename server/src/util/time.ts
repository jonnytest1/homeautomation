import { HOUR, MINUTE, SECOND } from '../constant'

export function convertTimeDiff(opts: {
  millis: number
}) {
  let millis = opts.millis
  const hours = Math.floor(millis / HOUR)
  millis -= HOUR * hours
  const minutes = Math.floor(millis / MINUTE)
  millis -= MINUTE * minutes
  const seconds = Math.floor(millis / SECOND)
  millis -= seconds * SECOND

  let str = ""
  if (hours) {
    str += `${hours}h`
  }

  if (minutes) {
    str += `${minutes}m`
  }

  if (seconds) {
    str += `${seconds}s`
  }
  return str

}

const DAY_NAMES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const DAY_GROUPS: Record<string, Array<number>> = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [1, 2, 3, 4, 5],
  weekends: [0, 6],
};

const TIME_RE = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string) {
  if (!DATE_RE.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: ${value}`);
  }

  return value;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function parseTime(value: string) {
  if (!TIME_RE.test(value)) {
    throw new Error(`Invalid time: ${value}`);
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function parseDays(selector: string) {
  const days = new Set<number>();

  for (const part of selector.toLowerCase().split(",")) {
    if (DAY_GROUPS[part]) {
      DAY_GROUPS[part].forEach(day => days.add(day));
      continue;
    }

    if (DAY_NAMES[part] !== undefined) {
      days.add(DAY_NAMES[part]);
      continue;
    }

    const range = part.split("-");

    if (range.length === 2) {
      const [start, end] = range;

      if (
        DAY_NAMES[start] === undefined ||
        DAY_NAMES[end] === undefined
      ) {
        throw new Error(`Invalid day range: ${part}`);
      }

      let day = DAY_NAMES[start];

      for (let i = 0; i < 7; i++) {
        days.add(day);

        if (day === DAY_NAMES[end]) break;
        day = (day + 1) % 7;
      }

      continue;
    }

    throw new Error(`Invalid day selector: ${part}`);
  }

  return [...days].sort((a, b) => a - b);
}
export type Schedule = {
  kind: string
  scheduledDate: string | undefined
  excludedDates: Array<string>
  days: Array<number>
  windows: Array<{
    start: number, end: number
  }>
  inclusiveEnd: boolean
}

type ParseScheduleOpts = {
  trim?: boolean
  inclusiveEnd?: boolean
}


/**
 * Parses a schedule string into a reusable object.
 *
 * Options:
 *   inclusiveEnd: true  => the end minute is included
 *   trim: false         => reject surrounding whitespace
 */
function parseSchedule(input: string, options: ParseScheduleOpts = {}): Schedule {
  const { inclusiveEnd = true, trim = true } = options;

  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Schedule must be a non-empty string");
  }

  if (!trim && input !== input.trim()) {
    throw new Error("Surrounding whitespace is not allowed");
  }

  const source = trim ? input.trim() : input;
  const sections = source.split(";");

  if (sections.length > 2) {
    throw new Error("Too many schedule options");
  }

  const expression = sections[0].trim();
  let excludedDates: Array<string> = [];

  if (sections.length === 2) {
    const exception = sections[1].trim();
    const match = exception.match(/^except=(.+)$/i);

    if (!match) {
      throw new Error(`Invalid schedule option: ${exception}`);
    }

    excludedDates = match[1].split(",").map(value => {
      const date = value.trim();
      return parseDate(date);
    });

    if (new Set(excludedDates).size !== excludedDates.length) {
      throw new Error("Duplicate excluded dates");
    }
  }

  const at = expression.indexOf("@");
  let selector = "daily";
  let timeExpression = expression;

  if (at !== -1) {
    if (at !== expression.lastIndexOf("@")) {
      throw new Error("Multiple @ separators");
    }

    selector = expression.slice(0, at).trim().toLowerCase();
    timeExpression = expression.slice(at + 1).trim();

    if (!selector || !timeExpression) {
      throw new Error("Missing schedule selector or time range");
    }
  }

  let kind;
  let days: Array<number> = [];
  let scheduledDate: string | undefined;

  if (DATE_RE.test(selector)) {
    kind = "date";
    scheduledDate = parseDate(selector);
  } else {
    kind = "days";
    days = parseDays(selector);
  }

  const windows = timeExpression.split(",").map(part => {
    const match = part.trim().match(/^(\S+)\s*-\s*(\S+)$/);

    if (!match) {
      throw new Error(`Invalid time range: ${part}`);
    }

    const start = parseTime(match[1]);
    const end = parseTime(match[2]);

    if (start === end) {
      //throw new Error("Zero-length time ranges are not allowed");
    }

    return { start, end };
  });

  return {
    kind,
    days,
    scheduledDate,
    windows,
    excludedDates,
    inclusiveEnd,
  };
}

function isExcluded(schedule: Schedule, startDate: Date) {
  return schedule.excludedDates.includes(dateKey(startDate));
}

function matchesStartDate(schedule: Schedule, startDate: Date) {
  if (schedule.kind === "date") {
    return dateKey(startDate) === schedule.scheduledDate;
  }

  return schedule.days.includes(startDate.getDay());
}

/**
 * Returns detailed information rather than only a boolean.
 * Overnight windows belong to the day on which they start.
 */
function explainSchedule(input: string | Schedule, date = new Date(), options = {}) {
  let schedule: Schedule;

  try {
    schedule =
      typeof input === "string"
        ? parseSchedule(input, options)
        : input;

    if (
      !schedule ||
      !Array.isArray(schedule.windows) ||
      !Array.isArray(schedule.excludedDates)
    ) {
      throw new Error("Invalid parsed schedule");
    }

    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
      throw new Error("Invalid date argument");
    }
  } catch (error) {
    return {
      matches: false,
      reason: "invalid_schedule",
      error: (error as Error).message,
    };
  }

  const minute = date.getHours() * 60 + date.getMinutes();
  const today = new Date(date);
  const yesterday = addDays(date, -1);

  for (const window of schedule.windows) {
    const { start, end } = window;
    let startDate = null;

    if (start <= end) {
      const inside = schedule.inclusiveEnd
        ? minute >= start && minute <= end
        : minute >= start && minute < end;

      if (inside) startDate = today;
    } else if (minute >= start) {
      startDate = today;
    } else if (
      schedule.inclusiveEnd ? minute <= end : minute < end
    ) {
      startDate = yesterday;
    }

    if (!startDate) continue;

    if (!matchesStartDate(schedule, startDate)) continue;

    if (isExcluded(schedule, startDate)) {
      return {
        matches: false,
        reason: "excluded_date",
        startDate: dateKey(startDate),
      };
    }

    return {
      matches: true,
      reason: "matched",
      startDate: dateKey(startDate),
      window: { ...window },
    };
  }

  return {
    matches: false,
    reason: "outside_schedule",
  };
}

function matchesSchedule(input: Schedule | string, date = new Date(), options = {}) {
  return explainSchedule(input, date, options).matches;
}

function matchesAny(schedules: Array<Schedule>, date = new Date()) {
  return schedules.some(schedule => matchesSchedule(schedule, date));
}

function matchesAll(schedules: Array<Schedule>, date = new Date()) {
  return schedules.every(schedule => matchesSchedule(schedule, date));
}
interface NExtMAtchOpts {
  maxDays?: number
}
/**
 * Finds the next matching minute, strictly after `from`.
 * Returns a Date, or null if no match is found within maxDays.
 */
function nextMatch(input: string | Schedule, from = new Date(), options: NExtMAtchOpts = {}) {
  const { maxDays = 366 } = options;
  const schedule =
    typeof input === "string" ? parseSchedule(input) : input;

  if (!(from instanceof Date) || !Number.isFinite(from.getTime())) {
    throw new Error("Invalid starting date");
  }

  if (!Number.isInteger(maxDays) || maxDays < 1) {
    throw new Error("maxDays must be a positive integer");
  }

  // Start at the next whole minute, strictly after `from`.
  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const limit = candidate.getTime() + maxDays * 24 * 60 * 60 * 1000;

  while (candidate.getTime() < limit) {
    if (matchesSchedule(schedule, candidate)) {
      return new Date(candidate);
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return null;
}



export const DateTimeUtil = {
  match: matchesSchedule
}