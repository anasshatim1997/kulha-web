const SIZE = 33; // QR version 4
const DATA_CODEWORDS = 80; // version 4-L, one block
const ECC_CODEWORDS = 20;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let value = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < EXP.length; i++) EXP[i] = EXP[i - 255];
}

function multiply(x: number, y: number): number {
  return x === 0 || y === 0 ? 0 : EXP[LOG[x] + LOG[y]];
}

function polynomialMultiply(left: number[], right: number[]): number[] {
  const result = Array(left.length + right.length - 1).fill(0) as number[];
  left.forEach((a, i) => right.forEach((b, j) => { result[i + j] ^= multiply(a, b); }));
  return result;
}

function reedSolomon(data: number[]): number[] {
  let generator = [1];
  for (let i = 0; i < ECC_CODEWORDS; i++) generator = polynomialMultiply(generator, [1, EXP[i]]);
  const remainder = [...data, ...Array(ECC_CODEWORDS).fill(0) as number[]];
  for (let i = 0; i < data.length; i++) {
    const factor = remainder[i];
    if (factor === 0) continue;
    for (let j = 0; j < generator.length; j++) remainder[i + j] ^= multiply(generator[j], factor);
  }
  return remainder.slice(data.length);
}

function dataCodewords(payload: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(payload));
  if (bytes.length > 78) throw new Error("KULHA pickup QR payload exceeds version 4-L capacity.");
  const bits: number[] = [];
  const append = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  append(0b0100, 4); // byte mode
  append(bytes.length, 8);
  for (const byte of bytes) append(byte, 8);
  const capacity = DATA_CODEWORDS * 8;
  for (let i = 0; i < Math.min(4, capacity - bits.length); i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j++) value = (value << 1) | bits[i + j];
    result.push(value);
  }
  let pad = 0xec;
  while (result.length < DATA_CODEWORDS) {
    result.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }
  return result;
}

function cloneMatrix(matrix: (boolean | null)[][]): (boolean | null)[][] {
  return matrix.map((row) => [...row]);
}

function set(matrix: (boolean | null)[][], row: number, col: number, value: boolean): void {
  if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) matrix[row][col] = value;
}

function finder(matrix: (boolean | null)[][], top: number, left: number): void {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const row = top + dy;
      const col = left + dx;
      const inside = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
      const black = inside && (dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4));
      set(matrix, row, col, Boolean(black));
    }
  }
}

function alignment(matrix: (boolean | null)[][], centerRow: number, centerCol: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      set(matrix, centerRow + dy, centerCol + dx,
        Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function formatBits(mask: number): number {
  const data = (0b01 << 3) | mask; // error correction level L
  let remainder = data << 10;
  for (let bit = 14; bit >= 10; bit--) {
    if ((remainder >>> bit) & 1) remainder ^= 0x537 << (bit - 10);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function formatCoordinates(): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 5; i++) points.push([8, i]);
  points.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) points.push([14 - i, 8]);
  for (let i = 0; i < 8; i++) points.push([8, SIZE - 1 - i]);
  for (let i = 8; i < 15; i++) points.push([SIZE - 15 + i, 8]);
  return points;
}

function functionPatterns(): (boolean | null)[][] {
  const matrix = Array.from({ length: SIZE }, () => Array<boolean | null>(SIZE).fill(null));
  finder(matrix, 0, 0);
  finder(matrix, 0, SIZE - 7);
  finder(matrix, SIZE - 7, 0);
  alignment(matrix, 26, 26);
  for (let i = 8; i < SIZE - 8; i++) {
    if (matrix[6][i] === null) set(matrix, 6, i, i % 2 === 0);
    if (matrix[i][6] === null) set(matrix, i, 6, i % 2 === 0);
  }
  for (const [row, col] of formatCoordinates()) set(matrix, row, col, false);
  set(matrix, SIZE - 8, 8, true); // fixed dark module
  return matrix;
}

function maskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return ((row * col) % 2 + (row * col) % 3) === 0;
    case 6: return (((row * col) % 2 + (row * col) % 3) % 2) === 0;
    default: return (((row + col) % 2 + (row * col) % 3) % 2) === 0;
  }
}

function drawCodewords(matrix: (boolean | null)[][], codewords: number[], mask: number): void {
  const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));
  let bitIndex = 0;
  let upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right--;
    for (let step = 0; step < SIZE; step++) {
      const row = upward ? SIZE - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (matrix[row][col] !== null) continue;
        const value = bitIndex < bits.length ? bits[bitIndex++] === 1 : false;
        matrix[row][col] = value !== maskBit(mask, row, col);
      }
    }
    upward = !upward;
  }
}

function applyFormat(matrix: (boolean | null)[][], mask: number): void {
  const bits = formatBits(mask);
  const points = formatCoordinates();
  points.forEach(([row, col], index) => { matrix[row][col] = ((bits >>> index) & 1) !== 0; });
  matrix[SIZE - 8][8] = true;
}

function penalty(matrix: (boolean | null)[][]): number {
  let score = 0;
  const lines: boolean[][] = [...matrix.map((row) => row.map(Boolean))];
  for (let col = 0; col < SIZE; col++) lines.push(matrix.map((row) => Boolean(row[col])));
  for (const line of lines) {
    let runColor = line[0];
    let runLength = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === runColor) runLength++;
      else {
        if (runLength >= 5) score += 3 + runLength - 5;
        runColor = line[i];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += 3 + runLength - 5;
    for (let i = 0; i <= line.length - 11; i++) {
      const pattern = line.slice(i, i + 11).map((bit) => bit ? "1" : "0").join("");
      if (pattern === "10111010000" || pattern === "00001011101") score += 40;
    }
  }
  for (let row = 0; row < SIZE - 1; row++) {
    for (let col = 0; col < SIZE - 1; col++) {
      const value = matrix[row][col];
      if (matrix[row][col + 1] === value && matrix[row + 1][col] === value && matrix[row + 1][col + 1] === value) score += 3;
    }
  }
  const dark = matrix.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 100) / (SIZE * SIZE) - 50) / 5) * 10;
  return score;
}

export function encodePickupQr(payload: string): boolean[][] {
  const data = dataCodewords(payload);
  const codewords = [...data, ...reedSolomon(data)];
  const base = functionPatterns();
  let best: (boolean | null)[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask++) {
    const matrix = cloneMatrix(base);
    drawCodewords(matrix, codewords, mask);
    applyFormat(matrix, mask);
    const score = penalty(matrix);
    if (score < bestScore) {
      best = matrix;
      bestScore = score;
    }
  }
  if (!best) throw new Error("Unable to build pickup QR code.");
  return best.map((row) => row.map(Boolean));
}

export function pickupQrPath(matrix: boolean[][]): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => row.forEach((isDark, x) => {
    if (isDark) parts.push(`M${x + 4} ${y + 4}h1v1h-1z`);
  }));
  return parts.join("");
}
