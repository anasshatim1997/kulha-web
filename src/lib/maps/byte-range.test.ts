import { describe, expect, it } from "vitest";
import { parseSingleByteRange } from "./byte-range";

describe("PMTiles byte range parsing", () => {
  it("parses a bounded range", () => {
    expect(parseSingleByteRange("bytes=0-15", 100)).toEqual({ start: 0, end: 15 });
  });

  it("parses an open-ended range", () => {
    expect(parseSingleByteRange("bytes=80-", 100)).toEqual({ start: 80, end: 99 });
  });

  it("parses a suffix range", () => {
    expect(parseSingleByteRange("bytes=-12", 100)).toEqual({ start: 88, end: 99 });
  });

  it("clamps ranges that extend beyond the archive", () => {
    expect(parseSingleByteRange("bytes=90-150", 100)).toEqual({ start: 90, end: 99 });
  });

  it("rejects invalid and multiple ranges", () => {
    expect(parseSingleByteRange("bytes=100-120", 100)).toEqual({ invalid: true });
    expect(parseSingleByteRange("bytes=20-10", 100)).toEqual({ invalid: true });
    expect(parseSingleByteRange("bytes=0-2,4-6", 100)).toEqual({ invalid: true });
  });

  it("returns null when no range is requested", () => {
    expect(parseSingleByteRange(null, 100)).toBeNull();
  });
});
