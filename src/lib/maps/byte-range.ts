export type ParsedByteRange = { start: number; end: number };
export type ByteRangeResult = ParsedByteRange | { invalid: true };

export function parseSingleByteRange(header: string | null, size: number): ByteRangeResult | null {
  if (!header) return null;
  if (!Number.isSafeInteger(size) || size <= 0) return { invalid: true };

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return { invalid: true };

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { invalid: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return { invalid: true };
  }
  return { start, end };
}
