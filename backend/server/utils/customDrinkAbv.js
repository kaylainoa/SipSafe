const ABV_MAP = {
  vodka: { light: 7.0, medium: 10.0, strong: 13.0 },
  rum: { light: 7.0, medium: 10.0, strong: 13.0 },
  tequila: { light: 8.0, medium: 12.0, strong: 16.0 },
  gin: { light: 8.0, medium: 12.0, strong: 16.0 },
  whiskey: { light: 10.0, medium: 14.0, strong: 18.0 },
  bourbon: { light: 10.0, medium: 14.0, strong: 18.0 },
  scotch: { light: 10.0, medium: 14.0, strong: 18.0 },
  brandy: { light: 8.0, medium: 12.0, strong: 16.0 },
  wine: { light: 9.0, medium: 12.0, strong: 14.5 },
  beer: { light: 3.5, medium: 5.0, strong: 7.0 },
};

/**
 * Estimate ABV for a custom drink based on spirit type and perceived strength
 * @param {string} spirit - e.g. 'vodka', 'rum', 'tequila'
 * @param {string} strength - 'light', 'medium', or 'strong'
 * @returns {number} estimated ABV
 */
function estimateCustomABV(spirit, strength) {
  const spiritData = ABV_MAP[spirit?.toLowerCase()];
  if (!spiritData) return 10.0; // safe fallback default
  return spiritData[strength?.toLowerCase()] ?? 10.0;
}

module.exports = { estimateCustomABV, ABV_MAP };
