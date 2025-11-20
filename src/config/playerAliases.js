/**
 * Player name aliases configuration
 * Maps different name variations to a single canonical name
 * 
 * Format:
 * 'Name Variation': 'Canonical Full Name'
 * 
 * The canonical name should be the full first and last name when possible.
 */

export const playerAliases = {
  // Example mappings (add actual player name variations here):
  'Phi': 'Phi Nguyen-Thien',
  'Andy': 'Andreas Metzke',
  'Andy M.': 'Andreas Metzke',
  'Jona': 'Jona Steffel',
  'Moe': 'Manuel Butollo',
  'Tombo': 'Thomas Bonfert',
  'Nik': 'Nicki Preisinger',
  'Nikki': 'Nicki Preisinger',
  'Nik Preisinger': 'Nicki Preisinger',
  'David B.': 'David Brügger',
  'David': 'David Brügger',
}

/**
 * Normalizes a player name to its canonical form
 * @param {string} name - The player name to normalize
 * @returns {string} - The canonical name
 */
export function normalizePlayerName(name) {
  if (!name) return name
  
  // Check if there's an alias mapping
  if (playerAliases[name]) {
    return playerAliases[name]
  }
  
  // Return the original name if no mapping exists
  return name
}

/**
 * Gets all known aliases for a canonical player name
 * @param {string} canonicalName - The canonical player name
 * @returns {string[]} - Array of all aliases including the canonical name
 */
export function getPlayerAliases(canonicalName) {
  const aliases = [canonicalName]
  
  for (const [alias, canonical] of Object.entries(playerAliases)) {
    if (canonical === canonicalName && alias !== canonicalName) {
      aliases.push(alias)
    }
  }
  
  return aliases
}

