#!/usr/bin/env node
/**
 * Imports tournaments straight from the Tournament.app API, no export file and
 * no browser extension involved.
 *
 *   npm run import:api -- tio:8N4iLiJ5Mgrai            # one or more tournaments
 *   npm run import:api -- --all                        # every tournament the token can see
 *   npm run import:api -- --all --state finished       # only finished ones
 *   npm run import:api -- --all --dry-run              # show what would happen, write nothing
 *   npm run import:api -- --list                       # just list what is available
 *
 *   # every 2026 Monster-DYP except one event:
 *   node src/scripts/import-from-api.js --all --year 2026 --mode monster_dyp --exclude "SOS Kinder"
 *
 * Needs TIO_API_TOKEN (Kickertool -> Settings -> API).
 *
 * Stats are derived from match results and cross-checked against the fields the
 * API returns; a tournament that fails those checks is skipped unless --force
 * is passed. See docs/TOURNAMENT_DATA_FORMAT.md.
 */
import { createTournamentIoClient, fetchTournamentBundle } from '../utils/tournament-io-client.js';
import { mapTournamentBundle } from '../utils/tournament-io-mapper.js';
import { processTournamentData } from '../services/tournament-processor.js';

function parseArgs(argv) {
  const options = {
    ids: [], all: false, dryRun: false, force: false, list: false,
    state: undefined, limit: 100, year: undefined, mode: undefined, exclude: []
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--state') options.state = argv[++i];
    else if (arg === '--limit') options.limit = Number(argv[++i]);
    else if (arg === '--year') options.year = String(argv[++i]);
    else if (arg === '--mode') options.mode = argv[++i];
    else if (arg === '--exclude') options.exclude.push(argv[++i]);
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else options.ids.push(arg);
  }

  return options;
}

/** Filters the tournament list by year, discipline entry type, and id/name exclusions. */
function selectTournaments(tournaments, options) {
  const kept = [];
  const dropped = [];

  tournaments.forEach(tournament => {
    const modes = (tournament.disciplines || []).map(d => d.entryType);
    const year = String(tournament.date || '').slice(0, 4);

    let reason = null;
    if (options.year && year !== options.year) reason = `year ${year}`;
    else if (options.mode && !modes.includes(options.mode)) reason = `mode ${modes.join(',') || 'unknown'}`;
    else {
      const match = options.exclude.find(term =>
        tournament.id === term || tournament.name.toLowerCase().includes(term.toLowerCase()));
      if (match) reason = `excluded by "${match}"`;
    }

    (reason ? dropped : kept).push(reason ? { ...tournament, reason } : tournament);
  });

  return { kept, dropped };
}

function summarise(report) {
  return report.groups
    .map(g => `${g.name} [${g.mode}] ${g.matches} matches, ${g.standings} standings`)
    .join(' | ');
}

async function importOne(client, id, options) {
  const bundle = await fetchTournamentBundle(client, id);
  const { data, report } = mapTournamentBundle(bundle);

  const checked = [...new Set(report.groups.flatMap(g => g.checkedAgainst))];
  console.log(`\n${report.name}  (${id})`);
  console.log(`  ${summarise(report)}`);
  console.log(`  cross-checked against API fields: ${checked.length ? checked.join(', ') : 'none available'}`);

  report.unresolved.forEach(name => console.log(`  WARNING unresolved standing entry: ${name}`));

  // Importing replaces a tournament's matches and standings, so an empty
  // result would prune a good one. A finished tournament always has matches.
  const totalMatches = report.groups.reduce((sum, g) => sum + g.matches, 0);
  if (totalMatches === 0) {
    console.log('  no matches returned - refusing to overwrite what is already stored');
    if (!options.force) {
      console.log('  SKIPPED (pass --force to import anyway)');
      return { id, status: 'skipped', problems: 1 };
    }
  }

  if (report.problems.length > 0) {
    console.log(`  ${report.problems.length} check failure(s) - the scoring rules in tournament-io-mapper.js`);
    console.log('  may no longer match this tournament\'s Kickertool settings:');
    report.problems.slice(0, 8).forEach(p => console.log(`    - ${p}`));
    if (report.problems.length > 8) console.log(`    ... and ${report.problems.length - 8} more`);

    if (!options.force) {
      console.log('  SKIPPED (pass --force to import anyway)');
      return { id, status: 'skipped', problems: report.problems.length };
    }
  }

  if (options.dryRun) {
    console.log('  dry run - nothing written');
    return { id, status: 'dry-run' };
  }

  const saved = await processTournamentData(data);
  console.log(`  imported -> ${saved.id}`);
  return { id, status: 'imported' };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const client = createTournamentIoClient();

  const who = await client.hello();
  console.log(`Authenticated (sport: ${who.sport})`);

  let ids = options.ids;

  if (options.all || options.list) {
    const tournaments = await client.listTournaments({ limit: options.limit, state: options.state });
    const { kept, dropped } = selectTournaments(tournaments, options);

    console.log(`${tournaments.length} tournament(s) available${options.state ? ` in state "${options.state}"` : ''}, ${kept.length} selected:`);
    kept.forEach(t => console.log(`  ${t.id}  ${String(t.date).slice(0, 10)}  ${t.state.padEnd(9)} ${t.name}`));

    if (dropped.length > 0) {
      console.log(`\n${dropped.length} not selected:`);
      dropped.forEach(t => console.log(`  ${t.id}  ${String(t.date).slice(0, 10)}  ${t.name}  (${t.reason})`));
    }

    if (options.list) return;
    ids = kept.map(t => t.id);
  }

  if (ids.length === 0) {
    console.error('Nothing to do. Pass tournament ids, --all, or --list.');
    process.exitCode = 2;
    return;
  }

  const results = [];
  for (const id of ids) {
    try {
      results.push(await importOne(client, id, options));
    } catch (error) {
      console.error(`\n${id}: FAILED - ${error.message}`);
      results.push({ id, status: 'failed' });
    }
  }

  const count = status => results.filter(r => r.status === status).length;
  console.log(`\nimported ${count('imported')}, skipped ${count('skipped')}, failed ${count('failed')}, dry-run ${count('dry-run')}`);
  if (count('failed') > 0 || count('skipped') > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
