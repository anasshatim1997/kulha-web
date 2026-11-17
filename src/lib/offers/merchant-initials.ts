/** Two-letter shop identity shared by map pins, list cards and the route sheet. */
export function merchantInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) ?? "K").toLocaleUpperCase();
}
