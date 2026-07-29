#!/usr/bin/env node
/**
 * Verifies that convertNewFormatToOld() turns a raw Kickertool export into the
 * shape the rest of the app consumes, without losing or mispairing anything.
 *
 * Expectations are re-derived from the raw export itself, so this works for any
 * new-format file, not just a fixture:
 *
 *   npm run verify:conversion -- ../tmp/new.json [more-exports.json ...]
 *
 * Exits non-zero if any check fails.
 */
import { readFileSync } from 'fs';
import { convertNewFormatToOld } from '../utils/format-converter.js';

/** Old-format elimination standings share a place per knockout round: 1-4 as-is, then 5-8 -> 5, 9-16 -> 9, ... */
function bracketPlace(rank) {
  if (!rank || rank <= 4) return rank || 0;
  let base = 5;
  let groupSize = 4;
  while (base + groupSize <= rank) {
    base += groupSize;
    groupSize *= 2;
  }
  return base;
}

function verify(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));

  if (!raw.disciplines) {
    console.log(`\n${filePath}\n  skipped: not a new-format export (no disciplines)`);
    return { checks: 0, failures: 0 };
  }

  const converted = convertNewFormatToOld(JSON.parse(JSON.stringify(raw)));

  let checks = 0;
  let failures = 0;
  const check = (condition, label, detail) => {
    checks++;
    if (condition) {
      console.log(`  ok    ${label}`);
    } else {
      failures++;
      console.log(`  FAIL  ${label}${detail !== undefined ? ' :: ' + JSON.stringify(detail).slice(0, 500) : ''}`);
    }
  };

  // --- ground truth straight from the raw export ---
  const entryById = new Map((raw.entries || raw.participants || []).map(e => [e._id, e]));
  const nameOf = id => entryById.get(id)?.name?.[0];
  /** Any entry that is not a team and has a name is one person ("player", "player_name", ...). */
  const isPlayer = id => {
    const entry = entryById.get(id);
    return !!entry && entry.type !== 'team' && Array.isArray(entry.name) && !!entry.name[0];
  };
  /** A standing entry is one player, a registered team, or a composite "playerA_playerB" id. */
  const membersOf = id => {
    if (isPlayer(id)) return [id];
    const parts = String(id).split('_');
    return parts.length > 1 && parts.every(isPlayer) ? parts : [];
  };

  const qualGroups = [];
  const elimGroups = [];
  (raw.disciplines || []).forEach(d =>
    (d.stages || []).forEach(s =>
      (s.groups || []).forEach(g =>
        (s.tournamentMode === 'elimination' ? elimGroups : qualGroups).push(g)
      )
    )
  );
  const playedIn = groups =>
    groups.flatMap(g => (g.rounds || []).flatMap(r => (r.matches || []).filter(m => m.state === 'played')));
  const standingsIn = groups => groups.flatMap(g => g.standings || []);

  const rawQualMatches = playedIn(qualGroups);
  const rawElimMatches = playedIn(elimGroups);

  console.log(`\n${filePath}  (${raw.name})`);

  // --- matches ---
  const convQualMatches = (converted.qualifying?.[0]?.rounds || []).flatMap(r => r.matches || []);
  const convElimMatches = [
    ...(converted.eliminations?.[0]?.levels || []).flatMap(l => l.matches || []),
    ...(converted.eliminations?.[0]?.third?.matches || [])
  ];
  check(convQualMatches.length === rawQualMatches.length,
    `every played qualifying match converted (${convQualMatches.length}/${rawQualMatches.length})`);
  check(convElimMatches.length === rawElimMatches.length,
    `every played elimination match converted (${convElimMatches.length}/${rawElimMatches.length})`);

  const rosterErrors = [];
  const pairingErrors = [];
  const scoreErrors = [];
  const rawMatchById = new Map([...rawQualMatches, ...rawElimMatches].map(m => [m._id, m]));
  [...convQualMatches, ...convElimMatches].forEach(match => {
    const src = rawMatchById.get(match._id);
    if (!src) {
      rosterErrors.push({ unknownMatch: match._id });
      return;
    }
    const expected = (src.entries || []).map(side =>
      (Array.isArray(side) ? side : [side]).flatMap(membersOf).sort()
    );
    const got = [match.team1, match.team2].map(t => t.players.map(p => p._id).sort());
    if (JSON.stringify(expected) !== JSON.stringify(got)) {
      rosterErrors.push({ match: match._id, expected, got });
    }
    [...match.team1.players, ...match.team2.players].forEach(p => {
      if (nameOf(p._id) !== p.name) {
        pairingErrors.push({ match: match._id, id: p._id, expected: nameOf(p._id), got: p.name });
      }
    });
    if (JSON.stringify(match.result) !== JSON.stringify(src.points)) {
      scoreErrors.push({ match: match._id, expected: src.points, got: match.result });
    }
  });
  check(rosterErrors.length === 0, 'match rosters match the raw entries', rosterErrors.slice(0, 3));
  check(pairingErrors.length === 0, 'every player name is paired with its own id', pairingErrors.slice(0, 3));
  check(scoreErrors.length === 0, 'match scores match the raw points', scoreErrors.slice(0, 3));

  // --- standings: one row per player, as the old format does ---
  const checkStandings = (rawStandings, convStandings, label, placeOf) => {
    const expectedRows = rawStandings.filter(s => membersOf(s.entryId).length > 0)
      .flatMap(s => membersOf(s.entryId).map(id => ({ standing: s, playerId: id })));
    check(convStandings.length === expectedRows.length,
      `${label}: one standing per player (${convStandings.length}/${expectedRows.length})`);

    const errors = [];
    expectedRows.forEach(({ standing, playerId }) => {
      const row = convStandings.find(c => c.name === nameOf(playerId) && c.stats.points === (standing.points ?? 0));
      if (!row) {
        errors.push({ missing: nameOf(playerId) });
        return;
      }
      if (row.stats.place !== placeOf(standing)) {
        errors.push({ player: row.name, placeExpected: placeOf(standing), got: row.stats.place });
      }
      if (row.stats.matches !== (standing.matches ?? 0)) {
        errors.push({ player: row.name, matchesExpected: standing.matches, got: row.stats.matches });
      }
      if (row.stats.goals !== (standing.goals ?? 0)) {
        errors.push({ player: row.name, goalsExpected: standing.goals, got: row.stats.goals });
      }
      // A player paused mid-tournament keeps their stats, flagged as deactivated
      if (standing.paused && !row.deactivated) {
        errors.push({ player: row.name, pausedButNotDeactivated: true });
      }
    });
    check(errors.length === 0, `${label}: names, places and stats carried over`, errors.slice(0, 5));
    check(convStandings.every(s => !s.name.includes(' / ') && !s.name.includes(' | ')),
      `${label}: no team names left in standings`,
      convStandings.filter(s => s.name.includes(' / ')).map(s => s.name).slice(0, 3));
  };

  const rawQualStandings = standingsIn(qualGroups);
  const convQualStandings = converted.qualifying?.[0]?.standings || [];
  checkStandings(rawQualStandings, convQualStandings, 'qualifying', s => s.rank ?? s.result ?? 0);

  const rawElimStandings = standingsIn(elimGroups);
  const convElimStandings = converted.eliminations?.[0]?.standings || [];
  checkStandings(rawElimStandings, convElimStandings, 'elimination', s => bracketPlace(s.rank ?? s.result ?? 0));

  if (convQualStandings.length > 0) {
    const places = [...new Set(convQualStandings.map(s => s.stats.place))].sort((a, b) => a - b);
    const expected = Array.from({ length: places.length }, (_, i) => i + 1);
    check(JSON.stringify(places) === JSON.stringify(expected),
      'qualifying places run 1..N with no gaps', places);
  }

  // --- every player who played has a standing ---
  const named = matches => new Set(matches.flatMap(m => [...m.team1.players, ...m.team2.players].map(p => p.name)));
  const qualNames = new Set(convQualStandings.map(s => s.name));
  const missingStanding = [...named(convQualMatches)].filter(n => !qualNames.has(n));
  check(missingStanding.length === 0, 'every player in a qualifying match has a standing', missingStanding);
  const missingKo = [...new Set(convElimStandings.map(s => s.name))].filter(n => !qualNames.has(n));
  check(missingKo.length === 0, 'every knockout player also has a qualifying standing', missingKo);

  // --- bracket structure ---
  const elimination = converted.eliminations?.[0];
  if (elimination) {
    const hasThirdRound = elimGroups.some(g =>
      (g.rounds || []).some(r => String(r.name).toUpperCase().includes('THIRD') &&
        (r.matches || []).some(m => m.state === 'played'))
    );
    check(!hasThirdRound || !!elimination.third, 'third-place match routed to .third');
    check(!hasThirdRound || elimination.thirdPlace === true, 'thirdPlace flag set for match counting');
    check((elimination.levels || []).every(l => !String(l.name).toUpperCase().includes('THIRD')),
      'no third-place round left among the bracket levels');
    check((elimination.levels || []).every(l => !!l.name), 'every bracket level has a name');

    const finalMatch = (elimination.levels || []).slice(-1)[0]?.matches?.[0];
    if (finalMatch && convElimStandings.length > 0) {
      const winners = (finalMatch.result[0] > finalMatch.result[1] ? finalMatch.team1 : finalMatch.team2)
        .players.map(p => p.name).sort();
      const firsts = convElimStandings.filter(s => s.stats.place === 1).map(s => s.name).sort();
      check(JSON.stringify(winners) === JSON.stringify(firsts),
        'place 1 is the winner of the final', { winners, firsts });
    }
  }

  // --- top-level fields the app reads ---
  check(!!converted.mode && !!converted.nameType, `mode/nameType set (${converted.mode}/${converted.nameType})`);
  check(!Number.isNaN(Date.parse(converted.createdAt)), `createdAt parseable (${converted.createdAt})`);

  return { checks, failures };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node src/scripts/verify-conversion.js <kickertool-export.json> [...]');
  process.exit(2);
}

let totalChecks = 0;
let totalFailures = 0;
for (const file of files) {
  const { checks, failures } = verify(file);
  totalChecks += checks;
  totalFailures += failures;
}

console.log(`\n${totalChecks - totalFailures}/${totalChecks} checks passed, ${totalFailures} failed`);
process.exit(totalFailures > 0 ? 1 : 0);
