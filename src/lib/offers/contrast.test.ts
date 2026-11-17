import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const offerPalette = css.match(/\.kulha-offers-page\s*\{([^}]+)\}/)?.[1] ?? "";

function paletteColor(token: string): string {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = offerPalette.match(new RegExp(`${escaped}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`Missing CSS colour token ${token}`);
  return value;
}

function luminance(hex: string): number {
  const rgb = [0, 2, 4].map((offset) => parseInt(hex.slice(offset + 1, offset + 3), 16) / 255);
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) as [number, number, number];
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string): number {
  const sorted = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const lighter = sorted[0] ?? 0;
  const darker = sorted[1] ?? 0;
  return (lighter + 0.05) / (darker + 0.05);
}

describe("offers palette contrast", () => {
  it("keeps core text pairs at WCAG AA normal-text contrast", () => {
    const forest = paletteColor("--offer-forest");
    const green = paletteColor("--offer-green");
    const cream = paletteColor("--offer-cream");
    const paper = paletteColor("--offer-paper");
    const saffron = paletteColor("--offer-saffron");
    const softGreen = paletteColor("--offer-soft-green");
    const muted = paletteColor("--offer-muted");

    for (const [foreground, background] of [
      [forest, cream],
      [forest, paper],
      [forest, saffron],
      [green, paper],
      [muted, paper],
      [muted, softGreen],
      ["#ffffff", "#b42318"],
      ["#5e1914", "#fff7f4"],
      ["#6b2923", "#fff7f4"],
    ]) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps keyboard focus indicators at 3:1 and filter placeholders at AA contrast", () => {
    expect(contrast("#b77924", "#fffaf1")).toBeGreaterThanOrEqual(3);
    expect(contrast("#fdbe2e", "#104631")).toBeGreaterThanOrEqual(3);
    expect(contrast("#073324", "#fcf4e7")).toBeGreaterThanOrEqual(3);
    expect(contrast("#52685a", "#fffefa")).toBeGreaterThanOrEqual(4.5);
    expect(css).toMatch(/\.kulha-filter-fields input::placeholder\s*\{[^}]*color:\s*#52685a;[^}]*opacity:\s*1;/);
  });
});
