export type PasswordChecks = {
  minimum: boolean;
  maximum: boolean;
  letters: boolean;
  number: boolean;
  symbol: boolean;
  longer: boolean;
};

export type PasswordStrength = {
  checks: PasswordChecks;
  score: number;
  percent: number;
  good: boolean;
  excellent: boolean;
};

export function getPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    minimum: password.length >= 10,
    maximum: password.length > 0 && password.length <= 128,
    letters: /\p{L}/u.test(password),
    number: /\d/.test(password),
    symbol: /[\p{P}\p{S}]/u.test(password),
    longer: password.length >= 14,
  };

  const good = checks.minimum && checks.maximum && checks.letters && checks.number && checks.symbol;
  const excellent = good && checks.longer;
  const baseScore = [checks.minimum, checks.letters, checks.number, checks.symbol].filter(Boolean).length;
  const score = !password || !checks.maximum ? 0 : good ? (excellent ? 5 : 4) : Math.min(baseScore, 3);

  return { checks, score, percent: (score / 5) * 100, good, excellent };
}

export function isGoodPassword(password: string): boolean {
  return getPasswordStrength(password).good;
}
