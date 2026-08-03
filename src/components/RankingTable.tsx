import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, CaretUp, Columns, MagnifyingGlass, X } from '@phosphor-icons/react'
import { PlayerRecord, ViewMode } from '../types/components'
import { EmptyState } from './ui/States'
import { springSnappy } from '../lib/motion'

/** Rows past this index appear immediately - see the .row-in note in index.css. */
const ROW_STAGGER_LIMIT = 14

/** Columns rendered as monospaced tabular figures so they align down the page. */
const NUMERIC = new Set([
  'rank',
  'seasonPoints',
  'trueSkill',
  'tournaments',
  'bestPlace',
  'avgPlace',
  'qualifyingPlace',
  'eliminationPlace',
  'buchholz',
  'sonnebornBerger',
  'matches',
  'points',
  'won',
  'lost',
  'winRate',
  'goalsFor',
  'goalsAgainst',
  'goalDiff',
  'pointsPerGame'
])

/**
 * Column labels, spelled out.
 *
 * These were two-letter codes (MP, GF, GD, SB, PPG). Codes are fine for a board
 * somebody reads every week; members here visit a few times a quarter, so every
 * abbreviation is something they have to decode from scratch each time.
 */
const COLUMN_LABELS: Record<string, string> = {
  rank: 'Rank',
  name: 'Player',
  finaleStatus: 'Finale',
  seasonPoints: 'Season points',
  trueSkill: 'TrueSkill',
  tournaments: 'Tournaments',
  bestPlace: 'Best place',
  avgPlace: 'Average place',
  qualifyingPlace: 'Qualifying',
  eliminationPlace: 'Knockout',
  buchholz: 'Buchholz',
  sonnebornBerger: 'Sonneborn-Berger',
  matches: 'Matches',
  points: 'Points',
  won: 'Won',
  lost: 'Lost',
  winRate: 'Win rate',
  goalsFor: 'Goals for',
  goalsAgainst: 'Goals against',
  goalDiff: 'Goal difference',
  pointsPerGame: 'Points per match'
}

/** Plain-language explanation shown on hover for the less obvious columns. */
const COLUMN_HELP: Record<string, string> = {
  trueSkill:
    'Skill rating from match results. Accounts for how strong your opponents were, not just how often you won. Higher is better.',
  seasonPoints: 'Points earned from tournament placings this season, plus one point per tournament attended.',
  bestPlace: 'Best finishing position achieved in any tournament.',
  avgPlace: 'Average finishing position across all tournaments played.',
  buchholz: 'Tie-breaker: the combined score of everyone this player faced.',
  sonnebornBerger: 'Tie-breaker: weighted by the strength of the opponents actually beaten.',
  pointsPerGame: 'Match points divided by matches played.',
  winRate: 'Share of matches won.',
  finaleStatus:
    'Season finale place. Needs at least 10 tournaments played, so a player can sit high in the table and still not qualify.'
}

/**
 * Standings board.
 *
 * Built directly on TanStack Table rather than material-react-table: the data is
 * dense and every pixel of Material chrome had to be fought off with overrides.
 * Data is separated by 1px rules, never boxed in cards, and all figures are
 * monospaced so columns read as columns.
 */
function RankingTable({
  players,
  viewMode,
  onPlayerSelect,
  selectedSeason
}: {
  players: PlayerRecord[]
  viewMode: ViewMode
  onPlayerSelect?: (playerName: string) => void
  selectedSeason: string | null
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rank', desc: false }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isColumnMenuOpen) return undefined

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsColumnMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isColumnMenuOpen])

  const columns = useMemo<ColumnDef<PlayerRecord, any>[]>(() => {
    const cols: ColumnDef<PlayerRecord, any>[] = []

    cols.push({
      id: 'rank',
      accessorFn: (row: any) => (viewMode === 'tournament' ? row.finalPlace : row.place) ?? 9999,
      header: viewMode === 'tournament' ? 'Final place' : 'Rank',
      cell: ({ row }) => {
        const player: any = row.original
        const place = viewMode === 'tournament' ? player.finalPlace : player.place
        const isPodium = typeof place === 'number' && place <= 3

        return (
          <div className="flex items-center gap-2">
            {/*
              Podium gets a filled chip rather than a 2px edge rule. The rule was
              legible only to someone who already knew to look for it; a chip
              reads as "this one placed" on first sight. No zero padding - "1"
              is a position, "01" looks like a code.
            */}
            <span
              className={
                isPodium
                  ? 'grid h-6 min-w-6 place-items-center rounded-sm bg-accent px-1 font-semibold text-bg'
                  : 'grid h-6 min-w-6 place-items-center px-1 text-fg-dim'
              }
            >
              {typeof place === 'number' ? place : '--'}
            </span>
          </div>
        )
      }
    })

    cols.push({
      id: 'name',
      accessorKey: 'name',
      header: 'Player',
      cell: ({ row }) => {
        const player: any = row.original
        return (
          <div className="flex items-baseline gap-2">
            <a
              href={`?player=${encodeURIComponent(player.name)}`}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault()
                onPlayerSelect?.(player.name)
              }}
              title="Open player detail (right-click to open in a new tab)"
              className="truncate font-medium text-fg decoration-accent/50 underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              {player.name}
            </a>
            {player.external?.nationalLicence && (
              <span className="tnum shrink-0 text-[0.9375rem] text-fg-faint">
                {player.external.nationalLicence}
              </span>
            )}
          </div>
        )
      }
    })

    if (viewMode === 'season') {
      /*
        Finale status is its own column rather than a badge tacked onto the rank
        cell. Two reasons. Repeating a badge down twenty rows inside another
        column reads as decoration, whereas repetition inside a column is just
        what a column is. And qualification is not the top N rows: it is rank
        order filtered by a ten-tournament minimum, so players who fall short sit
        *above* qualified players. Anything positional - a cutoff rule, a
        highlighted block - would state something untrue.
      */
      cols.push({
        id: 'finaleStatus',
        accessorKey: 'finaleStatus',
        header: 'Finale',
        cell: ({ getValue }) => {
          const status = getValue()
          if (status === 'qualified') {
            return (
              <span
                title="Qualified for the season finale"
                className="whitespace-nowrap rounded-sm border border-up/40 px-1.5 py-0.5 text-[0.8125rem] font-medium text-up"
              >
                Qualified
              </span>
            )
          }
          if (status === 'successor') {
            return (
              <span
                title="Next in line if a qualified player drops out"
                className="whitespace-nowrap rounded-sm border border-warn/40 px-1.5 py-0.5 text-[0.8125rem] font-medium text-warn"
              >
                Reserve
              </span>
            )
          }
          return <span className="text-fg-faint">--</span>
        }
      })
    }

    if (viewMode === 'overall' || viewMode === 'season') {
      cols.push(
        {
          id: 'seasonPoints',
          accessorKey: 'seasonPoints',
          header: viewMode === 'overall' ? 'Total points' : 'Season points',
          cell: ({ getValue }) => <span className="font-semibold text-fg">{getValue() ?? 0}</span>
        },
        {
          id: 'trueSkill',
          accessorKey: 'trueSkill',
          header: 'TrueSkill',
          cell: ({ getValue }) => {
            const value = Number(getValue() ?? 0)
            return <span className="text-accent">{value.toFixed(1)}</span>
          }
        },
        { id: 'tournaments', accessorKey: 'tournaments', header: 'Tournaments' },
        {
          id: 'bestPlace',
          accessorKey: 'bestPlace',
          header: 'Best place',
          cell: ({ getValue }) => {
            const place = getValue()
            return typeof place === 'number' ? (
              <span className={place <= 3 ? 'text-fg' : 'text-fg-dim'}>{place}</span>
            ) : (
              <span className="text-fg-faint">--</span>
            )
          }
        },
        { id: 'avgPlace', accessorKey: 'avgPlace', header: 'Average place' }
      )
    }

    if (viewMode === 'tournament') {
      cols.push(
        { id: 'qualifyingPlace', accessorKey: 'qualifyingPlace', header: 'Qualifying' },
        {
          id: 'eliminationPlace',
          accessorKey: 'eliminationPlace',
          header: 'Knockout',
          cell: ({ getValue }) => {
            const value = getValue()
            return value ?? <span className="text-fg-faint">--</span>
          }
        },
        {
          id: 'buchholz',
          accessorKey: 'buchholz',
          header: 'Buchholz',
          cell: ({ getValue }) => getValue() || 0
        },
        {
          id: 'sonnebornBerger',
          accessorKey: 'sonnebornBerger',
          header: 'Sonneborn-Berger',
          cell: ({ getValue }) => getValue() || 0
        }
      )
    }

    cols.push(
      { id: 'matches', accessorKey: 'matches', header: 'Matches' },
      {
        id: 'points',
        accessorKey: 'points',
        header: 'Points',
        cell: ({ getValue }) => <span className="font-semibold text-fg">{getValue()}</span>
      },
      {
        id: 'won',
        accessorKey: 'won',
        header: 'Won',
        cell: ({ getValue }) => <span className="text-up">{getValue()}</span>
      },
      {
        id: 'lost',
        accessorKey: 'lost',
        header: 'Lost',
        cell: ({ getValue }) => <span className="text-down">{getValue()}</span>
      },
      {
        id: 'winRate',
        accessorKey: 'winRate',
        header: 'Win rate',
        cell: ({ getValue }) => {
          const rate = parseFloat(String(getValue() ?? 0))
          const tone = rate >= 60 ? 'text-up' : rate >= 40 ? 'text-fg-dim' : 'text-down'
          // Keep the unit on the value. "77.1" under a "Win rate" heading is only
          // unambiguous to someone who already knows the column.
          return (
            <span className={tone}>
              {rate.toFixed(1)}
              <span className="text-fg-faint">%</span>
            </span>
          )
        }
      },
      { id: 'goalsFor', accessorKey: 'goalsFor', header: 'Goals for' },
      { id: 'goalsAgainst', accessorKey: 'goalsAgainst', header: 'Goals against' },
      {
        id: 'goalDiff',
        accessorKey: 'goalDiff',
        header: 'Goal difference',
        cell: ({ getValue }) => {
          const diff = Number(getValue() ?? 0)
          return (
            <span className={diff >= 0 ? 'text-up' : 'text-down'}>
              {diff >= 0 ? '+' : ''}
              {diff}
            </span>
          )
        }
      },
      {
        id: 'pointsPerGame',
        accessorKey: 'pointsPerGame',
        header: 'Points per match',
        cell: ({ getValue }) => {
          const value = getValue()
          return typeof value === 'number' ? value.toFixed(2) : value
        }
      }
    )

    return cols
  }, [viewMode, onPlayerSelect])

  const initialVisibility = useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {
      rank: true,
      name: true,
      matches: false,
      points: false,
      won: false,
      lost: false,
      winRate: true,
      goalsFor: false,
      goalsAgainst: false,
      goalDiff: false,
      pointsPerGame: false
    }

    if (viewMode === 'overall' || viewMode === 'season') {
      visibility.finaleStatus = viewMode === 'season'
      visibility.seasonPoints = true
      visibility.trueSkill = true
      visibility.tournaments = true
      visibility.bestPlace = true
      visibility.avgPlace = true
    }

    if (viewMode === 'tournament') {
      visibility.qualifyingPlace = true
      visibility.eliminationPlace = false
      visibility.buchholz = true
      visibility.sonnebornBerger = true
      visibility.points = true
      visibility.won = true
      visibility.lost = true
    }

    return visibility
  }, [viewMode])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility)
  useEffect(() => setColumnVisibility(initialVisibility), [initialVisibility])

  const table = useReactTable({
    data: players,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) =>
      String((row.original as any).name ?? '')
        .toLowerCase()
        .includes(String(filterValue).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const rows = table.getRowModel().rows

  const title =
    viewMode === 'overall' ? 'Overall standings' : viewMode === 'season' ? 'Season standings' : 'Tournament standings'

  const subtitle = (() => {
    if (viewMode === 'season') {
      const qualified = players.filter(p => (p as any).finaleStatus === 'qualified').length
      const successors = players.filter(p => (p as any).finaleStatus === 'successor').length
      if (qualified > 0 || successors > 0) {
        return `${qualified} qualified${successors > 0 ? `, ${successors} in reach` : ''} · min. 10 events`
      }
      return `${players.length} players${selectedSeason ? ` · season ${selectedSeason}` : ''}`
    }
    if (viewMode === 'overall') return `${players.length} players · all tournaments`
    return `${players.length} players`
  })()

  return (
    <section className="flex flex-col gap-4">
      {/* Header: title left, controls right. Nothing centred. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-fg">{title}</h2>
          <p className="text-[0.9375rem] text-fg-dim">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 focus-within:border-accent md:w-56 md:flex-none">
            <MagnifyingGlass size={14} weight="bold" className="shrink-0 text-fg-faint" />
            <input
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder="Find player"
              aria-label="Find player"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[0.9375rem] text-fg outline-none placeholder:text-fg-faint"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter('')}
                aria-label="Clear search"
                className="tactile shrink-0 rounded-xs p-0.5 text-fg-faint hover:text-fg"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          <div className="relative" ref={columnMenuRef}>
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen(open => !open)}
              aria-expanded={isColumnMenuOpen}
              aria-haspopup="menu"
              title="Choose columns"
              className="tactile flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[0.9375rem] text-fg-dim hover:border-line-strong hover:text-fg"
            >
              <Columns size={14} weight="bold" />
              <span className="hidden sm:inline">Columns</span>
            </button>

            <AnimatePresence>
              {isColumnMenuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={springSnappy}
                  className="absolute right-0 z-20 mt-1.5 max-h-80 w-52 origin-top-right overflow-y-auto rounded-md border border-line-strong bg-surface-2 py-1 shadow-[var(--shadow-overlay)]"
                >
                  {table
                    .getAllLeafColumns()
                    .filter(column => column.id !== 'rank' && column.id !== 'name')
                    .map(column => (
                      <label
                        key={column.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[0.9375rem] text-fg-dim hover:bg-surface-3 hover:text-fg"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                        />
                        {COLUMN_LABELS[column.id] ?? column.id}
                      </label>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/*
        Stated up front rather than left implicit. Most members open this a few
        times a quarter and will not remember what the ranking is sorted by, let
        alone what TrueSkill measures.
      */}
      <p className="max-w-[76ch] border-l-2 border-line py-1 pl-3 text-[0.9375rem] leading-relaxed text-fg-faint">
        {viewMode === 'tournament'
          ? 'Ordered by final placing in this tournament. Hover any column heading to see what it means.'
          : 'Ordered by season points, then TrueSkill. Season points come from tournament placings plus one point for turning up; TrueSkill is a skill rating that weighs how strong your opponents were, not just how often you won. Hover any column heading to see what it means.'}
      </p>

      {/*
        Wide content scrolls inside its own container so the page never does.
        The scroll container is dropped at md: an overflow container becomes the
        containing block for sticky children, which would pin the header 56px
        below the table's own top and cover the first row. Above md there is no
        horizontal overflow to manage, so sticky can resolve against the viewport
        and sit correctly under the app bar.
      */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-x-visible md:px-0">
        <table className="w-full min-w-[42rem] border-collapse">
          <thead className="bg-bg md:sticky md:top-14 md:z-10">
            <tr className="border-b border-line-strong">
              {table.getHeaderGroups()[0]?.headers.map(header => {
                const isNumeric = NUMERIC.has(header.column.id)
                const sortDirection = header.column.getIsSorted()

                const help = COLUMN_HELP[header.column.id]

                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`whitespace-nowrap px-3 py-3 ${isNumeric ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      title={help ? `${COLUMN_LABELS[header.column.id]} — ${help}` : 'Sort by this column'}
                      className={`colhead inline-flex items-center gap-1 transition-colors ${
                        isNumeric ? 'flex-row-reverse' : ''
                      } ${sortDirection ? '!text-accent' : 'hover:!text-fg'}`}
                    >
                      <span className={help ? 'underline decoration-line-strong decoration-dotted underline-offset-4' : ''}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span className="flex w-3 justify-center">
                        {sortDirection === 'asc' && <CaretUp size={11} weight="bold" />}
                        {sortDirection === 'desc' && <CaretDown size={11} weight="bold" />}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const player: any = row.original
              const place = viewMode === 'tournament' ? player.finalPlace : player.place
              const isPodium = typeof place === 'number' && place <= 3

              return (
                <tr
                  key={row.id}
                  className={`row-in group border-b border-line transition-colors hover:bg-surface ${
                    isPodium ? 'bg-surface/40' : ''
                  }`}
                  style={
                    index < ROW_STAGGER_LIMIT
                      ? ({ '--row-index': index } as React.CSSProperties)
                      : { animation: 'none' }
                  }
                >
                  {row.getVisibleCells().map(cell => {
                    const isNumeric = NUMERIC.has(cell.column.id)
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-3.5 text-[0.9375rem] ${
                          isNumeric ? 'tnum text-right text-fg-dim' : 'text-left'
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <EmptyState
            icon={<MagnifyingGlass size={18} weight="bold" />}
            title={globalFilter ? `No player matches "${globalFilter}"` : 'No players to show'}
            hint={
              globalFilter
                ? 'Check the spelling, or clear the search to see the full standings.'
                : 'Once results are imported the standings will appear here.'
            }
            action={
              globalFilter ? (
                <button
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="tactile rounded-sm border border-line-strong px-3 py-1.5 text-[0.9375rem] text-fg-dim hover:border-accent hover:text-accent"
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </section>
  )
}

export default RankingTable
