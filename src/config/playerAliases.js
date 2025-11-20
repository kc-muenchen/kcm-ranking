/**
 * Player name aliases - now loaded from backend API
 * This file provides a fallback and utility functions
 */

import { API_ENDPOINTS, apiFetch } from './api.js'

// Cache for aliases loaded from API
let aliasesCache = null
let aliasesMap = null

/**
 * Loads aliases from the backend API
 * @returns {Promise<Map<string, string>>} Map of alias -> canonical name
 */
export async function loadAliasesFromAPI() {
  try {
    const aliases = await apiFetch(API_ENDPOINTS.aliases)
    
    // Build a map: alias -> canonicalName
    const map = new Map()
    aliases.forEach(alias => {
      map.set(alias.alias, alias.canonicalName)
    })
    
    aliasesCache = aliases
    aliasesMap = map
    
    return map
  } catch (error) {
    console.warn('Failed to load aliases from API, using empty map:', error)
    aliasesMap = new Map()
    return aliasesMap
  }
}

/**
 * Gets the aliases map, loading from API if needed
 * @returns {Promise<Map<string, string>>}
 */
export async function getAliasesMap() {
  if (aliasesMap) {
    return aliasesMap
  }
  return await loadAliasesFromAPI()
}

/**
 * Normalizes a player name to its canonical form
 * @param {string} name - The player name to normalize
 * @returns {Promise<string>} - The canonical name
 */
export async function normalizePlayerName(name) {
  if (!name) return name
  
  const map = await getAliasesMap()
  
  // Check if there's an alias mapping
  if (map.has(name)) {
    return map.get(name)
  }
  
  // Return the original name if no mapping exists
  return name
}

/**
 * Synchronous version - uses cached aliases
 * @param {string} name - The player name to normalize
 * @returns {string} - The canonical name
 */
export function normalizePlayerNameSync(name) {
  if (!name) return name
  
  // Use cached map if available
  if (aliasesMap && aliasesMap.has(name)) {
    return aliasesMap.get(name)
  }
  
  // Return original if no cache or no mapping
  return name
}

/**
 * Gets all known aliases for a canonical player name
 * @param {string} canonicalName - The canonical player name
 * @returns {Promise<string[]>} - Array of all aliases including the canonical name
 */
export async function getPlayerAliases(canonicalName) {
  if (!aliasesCache) {
    await loadAliasesFromAPI()
  }
  
  const aliases = [canonicalName]
  
  if (aliasesCache) {
    aliasesCache.forEach(alias => {
      if (alias.canonicalName === canonicalName && alias.alias !== canonicalName) {
        aliases.push(alias.alias)
      }
    })
  }
  
  return aliases
}

/**
 * Preloads aliases from API (call this on app startup)
 */
export async function preloadAliases() {
  await loadAliasesFromAPI()
}
