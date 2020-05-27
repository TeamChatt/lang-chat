export const editDistance = (a: string, b: string): number => {
  if (!a || !b) return (a || b).length
  const m = []
  for (let i = 0; i <= b.length; i++) {
    m[i] = [i]
    if (i === 0) continue
    for (let j = 0; j <= a.length; j++) {
      m[0][j] = j
      if (j === 0) continue
      m[i][j] =
        b.charAt(i - 1) == a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(
              m[i - 1][j - 1] + 1, // Substitution
              m[i][j - 1] + 1, // Insertion
              m[i - 1][j] + 1 // Deletion
            )
    }
  }
  return m[b.length][a.length]
}

export const fuzzyScore = (a: string, b: string): number => {
  const fuzzyDistance = editDistance(a, b)
  const cLength = Math.max(a.length, b.length)
  const score = 1.0 - fuzzyDistance / cLength
  return score
}

export const bestMatches = (
  target: string,
  choices: string[],
  { cutoff = 0.5, limit = 3 } = {}
): string[] =>
  choices
    .map((choice) => [fuzzyScore(target, choice), choice] as [number, string])
    .sort(([scoreA], [scoreB]) => scoreB - scoreA)
    .filter(([score]) => score > cutoff)
    .slice(0, limit)
    .map(([score, choice]) => choice)
