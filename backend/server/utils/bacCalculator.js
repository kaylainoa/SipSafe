/**
 * Calculate ml of pure alcohol in a drink
 */
function calculatePureAlcohol(volumeMl, abv) {
  return volumeMl * (abv / 100);
}

/**
 * Estimate BAC contribution using Widmark formula
 * weightLbs and gender come from the user's profile
 */
function estimateBACContribution(pureAlcoholMl, weightLbs, gender) {
  const pureAlcoholGrams = pureAlcoholMl * 0.789; // convert ml to grams
  const weightKg = weightLbs * 0.453592; // convert lbs to kg
  const r = gender === "female" ? 0.55 : 0.68; // Widmark body water constant

  return (pureAlcoholGrams / (weightKg * 1000 * r)) * 100;
}

module.exports = { calculatePureAlcohol, estimateBACContribution };
