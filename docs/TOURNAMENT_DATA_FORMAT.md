# Tournament data format

The app consumes exactly **one** tournament shape. Kickertool exports come in two
shapes, so everything is normalised at a single point on the way in.

## Where conversion happens

```
Kickertool export (old OR new shape)
        │
        ▼  POST /api/tournaments
backend/src/utils/format-converter.js   ← the only converter in the codebase
        │
        ▼  stored as Tournament.rawData
frontend / stats-calculator / trueskill  ← consume the normalised shape only
```

`convertNewFormatToOld()` runs in `processTournamentData()` before anything is
stored, so `rawData` in the database is always normalised. The frontend does not
convert anything — do not reintroduce a second converter there. A frontend copy
existed until it drifted from this one and quietly produced different rankings.

## The two input shapes

| | old shape | new shape |
|---|---|---|
| structure | `qualifying[] / eliminations[]` → `rounds[] / levels[]` → `matches[]` | `disciplines[]` → `stages[]` → `groups[]` → `rounds[]` → `matches[]` |
| players | `participants[]` | `entries[]`, typed `player` or `team` |
| standings | one row **per player** | one row per **entry** (a team in doubles/Monster-DYP) |
| dropped out | `deactivated: true`, row kept | `paused: true` |
| match result | `result: [a, b]` | `points: [a, b]` |

Old-shape input passes through untouched (verified against all 47 files in
`dummy_data/`); only elimination level names are filled in when missing.

## Invariants the converter must preserve

These are the ones that have broken before, and they are what
`verify:conversion` checks:

- **Standings are per player, never per team.** A team's stats are copied onto
  each member, as the old shape does. Emitting `"A / B"` rows loses one partner's
  knockout stats downstream (`getPlayerFinalPlacements` only credits the first
  name) and creates junk `Player` rows named after a pair.
- **Paused players are kept**, flagged `deactivated: true`. They played real
  matches; dropping them removes those matches and their season points.
- **Every non-team entry is a person.** Kickertool has more than one
  single-player entry type: `player` (picked from the registered player list,
  id `player-XXXX`) and `player_name` (typed in by name on the night, id is a
  hash). Matching on `type === 'player'` alone silently drops the walk-ins —
  their standings vanish and their matches are dropped or, worse, kept with one
  side a player short. Treat anything that is not a `team` and carries a name as
  one person, so a future entry type degrades gracefully.
- **Names stay paired with their own id.** A team entry's `name` array order does
  not always match the order of ids in `player-AAAA_player-BBBB`, so members are
  resolved by id, not by position.
- **Monster-DYP knockout entries may not be registered as entries.** Composite
  ids like `player-AAAA_player-BBBB` are split and resolved member by member.
- **Elimination places are bracket places**: 1–4 as-is, then everyone knocked out
  in the same round shares a place (5–8 → 5, 9–16 → 9, …).
- **Third-place match** goes to `elimination.third` and sets
  `elimination.thirdPlace = true`, which `StatsCards` uses for match counts.

## Importing from the Tournament.app API

Kickertool V3 exposes a public API (https://docs.api.tournament.io/), which is a
better source than an export file: no browser extension, no file handling, and
entries come back as `{id, name, entries[]}` uniformly, so there is no `type`
field to misread.

```bash
cd backend
npm run import:api -- --list                     # what the token can see
node src/scripts/import-from-api.js tio:XXXX     # one or more tournaments
node src/scripts/import-from-api.js --all --state finished
node src/scripts/import-from-api.js --all --dry-run
```

Needs `TIO_API_TOKEN` (Kickertool → Settings → API). Use `node` directly rather
than `npm run` when passing several ids; npm collapses them into one argument.

The API returns standings with **only the columns that tournament is configured
to display**, so `src/utils/tournament-io-mapper.js` derives every stat from the
match results instead. Points depend on the group's scoring rules, which the API
does not expose — they live in `SCORING` in that file and match the club setup:

- qualifying: 3 per win, 1 per draw, and `useCloseMatchRating` — a win by ≤2
  goals scores 2, a loss by ≤2 still scores 1
- elimination: a flat 3 per win, no close-match rating

Because those rules are assumed rather than fetched, every import cross-checks
the derived numbers against whichever fields the API *did* return (`matches`,
`goalsDiff`, `points`, `pointsPerMatch`/`correctedPointsPerMatch`) and refuses to
write a tournament that disagrees, unless `--force` is passed. A tournament with
different scoring settings fails loudly on the first import instead of quietly
storing wrong points. Note that Kickertool lowers points-per-match for players
who missed rounds (`hasCorrectedValue`), so only players who played every round
are compared against `correctedPointsPerMatch`.

## Verifying an import

Point the script at a raw export; expectations are re-derived from that file, so
it works for any tournament:

```bash
cd backend
npm run verify:conversion -- ../tmp/new.json
```

It checks every played match survives conversion with the right roster and score,
that every standing becomes one row per player with its stats intact, that
qualifying places run 1..N with no gaps, and that the bracket resolves to the
right finalists. Non-zero exit on any failure.

Run it against a fresh export whenever Kickertool changes its export shape.
