// Translate the four scenario probabilities into the two dimensions shown by
// the matrix. X is the probability of violence; Y is the probability of
// transformative change.
export function getScenarioCoordinates(probabilities = []) {
  const byScenario = Object.fromEntries(
    probabilities.map(({ sc, v }) => [Number(sc), Number(v) || 0]),
  );

  return {
    x: ((byScenario[2] || 0) + (byScenario[4] || 0)) / 100,
    y: ((byScenario[1] || 0) + (byScenario[2] || 0)) / 100,
  };
}
