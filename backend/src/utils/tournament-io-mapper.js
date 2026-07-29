/**
 * Maps a Tournament.app API bundle into the normalised tournament shape the app
 * consumes (qualifying / eliminations), i.e. the same contract that
 * format-converter.js produces from a Kickertool export file.
 * See docs/TOURNAMENT_DATA_FORMAT.md.
 *
 * The API returns standings with only the columns a tournament is configured to
 * display, so every stat is derived from the match results instead. The fields
 * the API does return are then used to cross-check that derivation - see
 * crossCheckStandings(). Points depend on the group's scoring rules, which the
 * API does not expose, so they live in SCORING below.
 */
import { rankToBracketPlace } from './format-converter.js';

/**
 * Scoring rules per group, since the API omits group.options scoring fields.
 * These match the club's Kickertool setup: a qualifying win by <= 2 goals
 * scores 2 instead of 3, and such a loss still scores 1. Elimination groups
 * score a flat 3 per win.
 */
export const SCORING = {
  default: {
    pointsForWin: 3,
    pointsForDraw: 1,
    useCloseMatchRating: true,
    closeMatchDifference: 2,
    closeMatchPointsWin: 2,
    closeMatchPointsLoose: 1
  },
  elimination: {
    pointsForWin: 3,
    pointsForDraw: 1,
    useCloseMatchRating: false
  }
};

function pointsFor(scored, conceded, rules) {
  const diff = scored - conceded;
  if (diff === 0) return rules.pointsForDraw;
  if (diff > 0) {
    return rules.useCloseMatchRating && diff <= rules.closeMatchDifference
      ? rules.closeMatchPointsWin
      : rules.pointsForWin;
  }
  return rules.useCloseMatchRating && -diff <= rules.closeMatchDifference
    ? rules.closeMatchPointsLoose
    : 0;
}

/** An API entry is either one person or a team carrying its members in `entries`. */
function membersOf(entry) {
  if (!entry) return [];
  const members = Array.isArray(entry.entries) && entry.entries.length > 0 ? entry.entries : [entry];
  return members.filter(m => m && m.id && m.name).map(m => ({ _id: m.id, name: m.name }));
}

function toPlayers(entry) {
  return membersOf(entry).map(m => ({ _id: m._id, name: m.name, guest: false, external: null }));
}

function toMillis(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Sets won/lost across all encounters of a match, from the API's nested encounters array. */
function setTally(encounters, side) {
  let won = 0;
  let lost = 0;
  (encounters || []).forEach(encounter => {
    (encounter || []).forEach(set => {
      if (!Array.isArray(set) || set.length < 2) return;
      const mine = set[side];
      const theirs = set[1 - side];
      if (mine > theirs) won += 1;
      else if (mine < theirs) lost += 1;
    });
  });
  return { won, lost };
}

/**
 * Rounds come back newest-first and mixed, so order them explicitly:
 * "Round 3" by its number, "FINALS-1-4" by bracket size descending (quarters
 * before semis before the final), anything else by when it started.
 */
function roundSequence(name) {
  const round = /^round\s+(\d+)$/i.exec(String(name || ''));
  if (round) return Number(round[1]);

  const finals = /finals-\d+-(\d+)/i.exec(String(name || ''));
  if (finals) return 1_000_000 - Number(finals[1]);

  return Number.POSITIVE_INFINITY;
}

function isThirdPlaceRound(name) {
  return String(name || '').toUpperCase().includes('THIRD');
}

/** Groups played matches into ordered rounds. */
function toRounds(matches, groupId) {
  const byRound = new Map();

  matches
    .filter(match => match.state === 'played' && Array.isArray(match.displayScore))
    .forEach(match => {
      const key = match.roundId || match.roundName || 'round';
      if (!byRound.has(key)) {
        byRound.set(key, { _id: match.roundId || null, name: match.roundName || null, matches: [] });
      }

      const [entry1, entry2] = match.entries || [];
      const team1Players = toPlayers(entry1);
      const team2Players = toPlayers(entry2);
      if (team1Players.length === 0 || team2Players.length === 0) return;

      byRound.get(key).matches.push({
        _id: match.id,
        valid: true,
        skipped: false,
        timeStart: toMillis(match.startTime),
        timeEnd: toMillis(match.endTime),
        roundId: match.roundId || null,
        groupId: match.groupId || groupId || null,
        result: match.displayScore,
        team1: { players: team1Players, name: team1Players.map(p => p.name).join(' / ') },
        team2: { players: team2Players, name: team2Players.map(p => p.name).join(' / ') },
        // consumed by deriveStats, then dropped so the stored shape stays clean
        sets: [setTally(match.encounters, 0), setTally(match.encounters, 1)]
      });
    });

  return [...byRound.values()]
    .filter(round => round.matches.length > 0)
    .sort((a, b) => {
      const seq = roundSequence(a.name) - roundSequence(b.name);
      if (seq !== 0 && Number.isFinite(seq)) return seq;
      const aStart = Math.min(...a.matches.map(m => m.timeStart ?? Infinity));
      const bStart = Math.min(...b.matches.map(m => m.timeStart ?? Infinity));
      return aStart - bStart;
    });
}

/** Per-player totals derived from the played matches of one group. */
function deriveStats(rounds, rules) {
  const stats = new Map();
  const blank = () => ({
    matches: 0, points: 0, won: 0, lost: 0, draws: 0,
    goals: 0, goalsIn: 0, setsWon: 0, setsLost: 0
  });

  rounds.forEach(round => {
    round.matches.forEach(match => {
      [match.team1, match.team2].forEach((team, side) => {
        const scored = match.result[side];
        const conceded = match.result[1 - side];
        const sets = match.sets?.[side] || { won: 0, lost: 0 };

        team.players.forEach(player => {
          if (!stats.has(player._id)) stats.set(player._id, blank());
          const entry = stats.get(player._id);
          entry.matches += 1;
          entry.points += pointsFor(scored, conceded, rules);
          entry.goals += scored;
          entry.goalsIn += conceded;
          entry.setsWon += sets.won;
          entry.setsLost += sets.lost;
          if (scored > conceded) entry.won += 1;
          else if (scored < conceded) entry.lost += 1;
          else entry.draws += 1;
        });
      });
    });
  });

  return stats;
}

/**
 * Old-format standings: one row per player, carrying that player's derived
 * totals. A team's row is expanded into one row per member, as the old format
 * has always done.
 */
function buildStandings(apiStandings, entryMembers, derived, { isElimination }) {
  const rows = [];
  const unresolved = [];

  apiStandings.forEach((standing, index) => {
    const entry = standing.entry || {};
    const members = entryMembers.get(entry.id) || membersOf(entry);
    if (members.length === 0) {
      unresolved.push(entry.name || entry.id);
      return;
    }

    const rank = Number.isFinite(standing.rank) && standing.rank > 0 ? standing.rank : index + 1;
    const place = isElimination ? rankToBracketPlace(rank) : rank;
    const standingId = standing.id || `${entry.id}`;

    members.forEach(member => {
      const totals = derived.get(member._id) || {
        matches: 0, points: 0, won: 0, lost: 0, draws: 0,
        goals: 0, goalsIn: 0, setsWon: 0, setsLost: 0
      };
      const perMatch = totals.matches > 0 ? Number((totals.points / totals.matches).toFixed(2)) : 0;

      rows.push({
        _id: members.length > 1 ? `${standingId}_${member._id}` : standingId,
        name: member.name,
        deactivated: false,
        removed: false,
        stats: {
          place,
          finalResult: standing.finalResult ?? isElimination,
          matches: totals.matches,
          points: totals.points,
          won: totals.won,
          lost: totals.lost,
          draws: totals.draws,
          goals: totals.goals,
          goals_in: totals.goalsIn,
          goal_diff: totals.goals - totals.goalsIn,
          points_per_game: perMatch,
          corrected_points_per_game: standing.correctedPointsPerMatch ?? perMatch,
          bh1: standing.bh1 ?? standing.averageBh1 ?? 0,
          bh2: standing.bh2 ?? 0,
          sb: standing.sb ?? 0,
          lives: standing.lives ?? 0,
          lastRound: standing.lastRound ?? -1,
          sets_won: totals.setsWon,
          sets_lost: totals.setsLost,
          sets_diff: totals.setsWon - totals.setsLost,
          dis_won: standing.encounterWon ?? 0,
          dis_lost: standing.encounterLost ?? 0,
          dis_draw: standing.encounterDraw ?? 0,
          dis_diff: standing.encounterDiff ?? 0
        },
        guest: false,
        external: null
      });
    });
  });

  return { rows, unresolved };
}

/**
 * Compares the derived totals against whichever fields the API did return.
 * This is what catches a scoring-rule change: the rules are not in the API, so
 * without this the points would drift silently.
 */
function crossCheckStandings(apiStandings, entryMembers, derived, label) {
  const problems = [];
  const compared = new Set();
  const maxMatches = Math.max(0, ...apiStandings.map(s => s.matches ?? 0));

  apiStandings.forEach(standing => {
    const entry = standing.entry || {};
    const members = entryMembers.get(entry.id) || membersOf(entry);
    const totals = members.length > 0 ? derived.get(members[0]._id) : null;
    if (!totals) return;

    const note = (field, expected, actual) =>
      problems.push(`${label}: ${entry.name} ${field} derived ${actual}, API says ${expected}`);

    if (Number.isFinite(standing.matches)) {
      compared.add('matches');
      if (standing.matches !== totals.matches) note('matches', standing.matches, totals.matches);
    }

    if (Number.isFinite(standing.goalsDiff)) {
      compared.add('goalsDiff');
      const diff = totals.goals - totals.goalsIn;
      if (standing.goalsDiff !== diff) note('goal difference', standing.goalsDiff, diff);
    }

    if (Number.isFinite(standing.points)) {
      compared.add('points');
      if (standing.points !== totals.points) note('points', standing.points, totals.points);
    }

    const perMatch = totals.matches > 0 ? Number((totals.points / totals.matches).toFixed(2)) : 0;
    if (Number.isFinite(standing.pointsPerMatch)) {
      compared.add('pointsPerMatch');
      if (Math.abs(standing.pointsPerMatch - perMatch) > 0.011) {
        note('points per match', standing.pointsPerMatch, perMatch);
      }
    } else if (Number.isFinite(standing.correctedPointsPerMatch) && (standing.matches ?? 0) === maxMatches) {
      // Kickertool lowers points-per-match for players who missed rounds, so
      // only players who played every round can be compared against it.
      compared.add('correctedPointsPerMatch');
      if (Math.abs(standing.correctedPointsPerMatch - perMatch) > 0.011) {
        note('points per match', standing.correctedPointsPerMatch, perMatch);
      }
    }
  });

  return { problems, comparedFields: [...compared] };
}

/**
 * Builds the normalised tournament from an API bundle.
 * @returns {{ data: Object, report: Object }}
 */
export function mapTournamentBundle(bundle, { sport = 'table_soccer', scoring = SCORING } = {}) {
  const { tournament, entries, groups } = bundle;

  // entry id -> its member players, for expanding team standings
  const entryMembers = new Map();
  (entries || []).forEach(entry => entryMembers.set(entry.id, membersOf(entry)));

  const entryType = tournament.disciplines?.[0]?.entryType || null;
  const data = {
    _id: tournament.id,
    name: tournament.name,
    description: tournament.description || '',
    sport,
    state: tournament.state,
    startTime: tournament.startTime,
    endTime: tournament.endTime,
    createdAt: tournament.startTime,
    mode: entryType,
    nameType: entryType,
    version: 20,
    qualifying: [],
    eliminations: []
  };

  const report = {
    tournamentId: tournament.id,
    name: tournament.name,
    groups: [],
    problems: [],
    unresolved: []
  };

  groups.forEach(({ stage, group, matches, standings }) => {
    const isElimination = group.tournamentMode === 'elimination';
    const rules = isElimination ? { ...scoring.default, ...scoring.elimination } : scoring.default;
    const rounds = toRounds(matches || [], group.id);
    const derived = deriveStats(rounds, rules);
    rounds.forEach(round => round.matches.forEach(match => { delete match.sets; }));

    const { rows, unresolved } = buildStandings(standings || [], entryMembers, derived, { isElimination });
    const { problems, comparedFields } = crossCheckStandings(
      standings || [], entryMembers, derived, group.name || group.id
    );

    report.groups.push({
      name: group.name,
      mode: group.tournamentMode,
      rounds: rounds.length,
      matches: rounds.reduce((sum, r) => sum + r.matches.length, 0),
      standings: rows.length,
      checkedAgainst: comparedFields
    });
    report.problems.push(...problems);
    report.unresolved.push(...unresolved);

    if (isElimination) {
      const elimination = {
        _id: group.id,
        name: group.name || 'Knockout Stage',
        stageId: stage?.id || null,
        levels: [],
        standings: rows
      };

      rounds.forEach(round => {
        if (isThirdPlaceRound(round.name)) {
          elimination.third = { matches: round.matches, name: 'Third Place' };
          elimination.thirdPlace = true;
        } else {
          elimination.levels.push({
            matches: round.matches,
            name: round.name || group.name || null,
            groupName: group.name || null
          });
        }
      });

      data.eliminations.push(elimination);
    } else {
      data.qualifying.push({
        _id: group.id,
        name: group.name || 'Qualification',
        stageId: stage?.id || null,
        rounds: rounds.map(round => ({ _id: round._id, name: round.name, matches: round.matches })),
        standings: rows
      });
    }
  });

  return { data, report };
}
