/**
 * @jest-environment node
 */
import { DateTimeUtil } from './time';


describe("DateTimeUtil", () => {

  const matchesSchedule = DateTimeUtil.match

  describe("default schedule", () => {
    it("defaults to daily when no prefix is provided", () => {
      expect(matchesSchedule("09:30-15:20", new Date(2026, 9, 19, 10, 0))).toBe(true);
      expect(matchesSchedule("09:30-15:20", new Date(2026, 9, 18, 10, 0))).toBe(true);
    });

    it("accepts an explicit daily prefix", () => {
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 10, 0))).toBe(true);
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 16, 0))).toBe(false);
    });
  });

  describe("weekday matching", () => {
    it("matches Monday through Friday for weekdays", () => {
      for (let day = 19; day <= 23; day++) {
        expect(
          matchesSchedule("weekdays@09:00-17:00", new Date(2026, 9, day, 12, 0))
        ).toBe(true);
      }
    });

    it("does not match Saturday or Sunday for weekdays", () => {
      expect(matchesSchedule("weekdays@09:00-17:00", new Date(2026, 9, 24, 12, 0))).toBe(false);
      expect(matchesSchedule("weekdays@09:00-17:00", new Date(2026, 9, 25, 12, 0))).toBe(false);
    });

    it.each([
      ["monday", new Date(2026, 9, 19, 12, 0), true],
      ["monday", new Date(2026, 9, 20, 12, 0), false],
      ["friday", new Date(2026, 9, 23, 12, 0), true],
      ["saturday", new Date(2026, 9, 24, 12, 0), true],
      ["sunday", new Date(2026, 9, 25, 12, 0), true],
    ])("matches %s correctly", (schedule, date, expected) => {
      expect(matchesSchedule(`${schedule}@09:00-17:00`, date)).toBe(expected);
    });
  });

  describe("time range matching", () => {
    it("includes the start and end times", () => {
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 9, 30))).toBe(true);
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 15, 20))).toBe(true);
    });

    it("excludes times outside the range", () => {
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 9, 29))).toBe(false);
      expect(matchesSchedule("daily@09:30-15:20", new Date(2026, 9, 19, 15, 21))).toBe(false);
    });

    it("supports single-digit hours", () => {
      expect(matchesSchedule("daily@9:30-15:20", new Date(2026, 9, 19, 10, 0))).toBe(true);
      expect(matchesSchedule("daily@9:30-15:20", new Date(2026, 9, 19, 8, 0))).toBe(false);
    });

    it("supports overnight ranges", () => {
      expect(matchesSchedule("daily@22:00-06:00", new Date(2026, 9, 19, 23, 0))).toBe(true);
      expect(matchesSchedule("daily@22:00-06:00", new Date(2026, 9, 19, 2, 0))).toBe(true);
      expect(matchesSchedule("daily@22:00-06:00", new Date(2026, 9, 19, 12, 0))).toBe(false);
    });

    it("supports a zero-length range", () => {
      expect(matchesSchedule("daily@12:00-12:00", new Date(2026, 9, 19, 12, 0))).toBe(true);
      expect(matchesSchedule("daily@12:00-12:00", new Date(2026, 9, 19, 12, 1))).toBe(false);
    });
  });

  describe("case sensitivity", () => {
    it.each(["DAILY", "Daily", "daily"])("accepts %s", schedule => {
      expect(matchesSchedule(`${schedule}@09:00-17:00`, new Date(2026, 9, 19, 12, 0))).toBe(true);
    });

    it("accepts mixed-case weekday names", () => {
      expect(matchesSchedule("Monday@09:00-17:00", new Date(2026, 9, 19, 12, 0))).toBe(true);
      expect(matchesSchedule("WEEKDAYS@09:00-17:00", new Date(2026, 9, 19, 12, 0))).toBe(true);
    });
  });

  describe("invalid input", () => {
    it.each([
      "",
      "daily",
      "09:00",
      "09:00-",
      "-17:00",
      "daily@",
      "monthly@09:00-17:00",
      "daily@25:00-17:00",
      "daily@09:60-17:00",
      "daily@09:00-17:60",
      "daily@9:5-17:00",
      "daily@09:00-17:00 extra",
    ])("rejects %p", input => {
      expect(matchesSchedule(input, new Date(2026, 9, 19, 12, 0))).toBe(false);
    });
  });
})