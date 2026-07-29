/**
 * Client for the Tournament.app public API (Kickertool V3).
 * Docs: https://docs.api.tournament.io/
 *
 * Auth is the raw token in the Authorization header - no "Bearer" prefix.
 */

const DEFAULT_BASE_URL = 'https://api.tournament.io/v1/public';

export function createTournamentIoClient({ token, baseUrl, fetchImpl } = {}) {
  const apiToken = token || process.env.TIO_API_TOKEN;
  const base = (baseUrl || process.env.TIO_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const doFetch = fetchImpl || fetch;

  if (!apiToken) {
    throw new Error('No API token. Set TIO_API_TOKEN (generate one in Kickertool under Settings -> API).');
  }

  async function get(path, params = {}) {
    const url = new URL(`${base}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });

    const response = await doFetch(url.toString(), {
      headers: { Authorization: apiToken }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`GET ${path} failed: HTTP ${response.status} ${body.slice(0, 200)}`);
    }

    return response.json();
  }

  return {
    /** Auth check: returns { sport, sub } for the token's user. */
    hello: () => get('/hello'),

    /** Tournaments for the token's user, newest first. state is optional. */
    listTournaments: ({ limit = 100, offset = 0, state } = {}) =>
      get('/tournaments', { limit, offset, state }),

    getTournament: (id) => get(`/tournaments/${id}`),

    /** All participants: players or teams, depending on the discipline's entryType. */
    getEntries: (id) => get(`/tournaments/${id}/entries`),

    /** Every match in a group, including byes and unplayed ones. */
    getGroupMatches: (id, groupId) => get(`/tournaments/${id}/groups/${groupId}/matches`),

    /**
     * Standings for a group. Only the columns configured for display in the
     * tournament come back, so treat every field except id/entry as optional.
     */
    getGroupStandings: (id, groupId) => get(`/tournaments/${id}/groups/${groupId}/standings`)
  };
}

/** Fetches everything needed to build one tournament: detail, entries, and per-group matches + standings. */
export async function fetchTournamentBundle(client, tournamentId) {
  const [tournament, entries] = await Promise.all([
    client.getTournament(tournamentId),
    client.getEntries(tournamentId)
  ]);

  const groups = [];
  for (const discipline of tournament.disciplines || []) {
    for (const stage of discipline.stages || []) {
      for (const group of stage.groups || []) {
        const [matches, standings] = await Promise.all([
          client.getGroupMatches(tournamentId, group.id),
          client.getGroupStandings(tournamentId, group.id)
        ]);
        groups.push({ discipline, stage, group, matches, standings });
      }
    }
  }

  return { tournament, entries, groups };
}
