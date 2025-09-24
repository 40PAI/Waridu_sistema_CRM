export function computeRank(left?: number | null, right?: number | null): bigint {
  const STEP = 1_000_000n; // saltos grandes na inicialização
  if (left == null && right == null) return STEP;       // primeira posição
  if (left == null)            return BigInt(right!) - STEP;
  if (right == null)           return BigInt(left!) + STEP;
  return (BigInt(left) + BigInt(right)) / 2n;           // média entre vizinhos
}