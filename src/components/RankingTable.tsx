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

const COLUMN_LABELS: Record<string, string> = {
  rank: 'Rank',
  name: 'Player',
  seasonPoints: 'Points',
  trueSkill: 'TrueSkill',
  tournaments: 'Events',
  bestPlace: 'Best',
  avgPlace: 'Avg',
  qualifyingPlace: 'Qual',
  eliminationPlace: 'KO',
  buchholz: 'Buchholz',
  sonnebornBerger: 'SB',
  matches: 'MP',
  points: 'Pts',
  won: 'W',
  lost: 'L',
  winRate: 'Win %',
  goalsFor: 'GF',
  goalsAgainst: 'GA',
  goalDiff: 'GD',
  pointsPerGame: 'PPG'
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
      header: viewMode === 'tournament' ? 'Final' : 'Rank',
      cell: ({ row }) => {
        const player: any = row.original
        const place = viewMode === 'tournament' ? player.finalPlace : player.place
        const isPodium = typeof place === 'number' && place <= 3

        return (
          <div className="flex items-center gap-1.5">
            <span className={isPodium ? 'font-semibold text-fg' : 'text-fg-dim'}>
              {typeof place === 'number' ? String(place).padStart(2, '0') : '--'}
            </span>
            {player.finaleStatus === 'qualified' && (
              <span
                title="Qualified for season finale"
                className="rounded-xs border border-up/40 px-1 text-[0.5625rem] font-semibold uppercase tracking-wider text-up"
              >
                Q
              </span>
            )}
            {player.finaleStatus === 'successor' && (
              <span
                title="Potential successor"
                className="rounded-xs border border-warn/40 px-1 text-[0.5625rem] font-semibold uppercase tracking-wider text-warn"
              >
                S
              </span>
            )}
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
              <span className="tnum shrink-0 text-[0.6875rem] text-fg-faint">
                {player.external.nationalLicence}
              </span>
            )}
          </div>
        )
      }
    })

    if (viewMode === 'overall' || viewMode === 'season') {
      cols.push(
        {
          id: 'seasonPoints',
          accessorKey: 'seasonPoints',
          header: viewMode === 'overall' ? 'Total' : 'Points',
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
        { id: 'tournaments', accessorKey: 'tournaments', header: 'Events' },
        {
          id: 'bestPlace',
          accessorKey: 'bestPlace',
          header: 'Best',
          cell: ({ getValue }) => {
            const place = getValue()
            return typeof place === 'number' ? (
              <span className={place <= 3 ? 'text-fg' : 'text-fg-dim'}>{place}</span>
            ) : (
              <span className="text-fg-faint">--</span>
            )
          }
        },
        { id: 'avgPlace', accessorKey: 'avgPlace', header: 'Avg' }
      )
    }

    if (viewMode === 'tournament') {
      cols.push(
        { id: 'qualifyingPlace', accessorKey: 'qualifyingPlace', header: 'Qual' },
        {
          id: 'eliminationPlace',
          accessorKey: 'eliminationPlace',
          header: 'KO',
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
          header: 'SB',
          cell: ({ getValue }) => getValue() || 0
        }
      )
    }

    cols.push(
      { id: 'matches', accessorKey: 'matches', header: 'MP' },
      {
        id: 'points',
        accessorKey: 'points',
        header: 'Pts',
        cell: ({ getValue }) => <span className="font-semibold text-fg">{getValue()}</span>
      },
      {
        id: 'won',
        accessorKey: 'won',
        header: 'W',
        cell: ({ getValue }) => <span className="text-up">{getValue()}</span>
      },
      {
        id: 'lost',
        accessorKey: 'lost',
        header: 'L',
        cell: ({ getValue }) => <span className="text-down">{getValue()}</span>
      },
      {
        id: 'winRate',
        accessorKey: 'winRate',
        header: 'Win %',
        cell: ({ getValue }) => {
          const rate = parseFloat(String(getValue() ?? 0))
          const tone = rate >= 60 ? 'text-up' : rate >= 40 ? 'text-fg-dim' : 'text-down'
          return <span className={tone}>{rate.toFixed(1)}</span>
        }
      },
      { id: 'goalsFor', accessorKey: 'goalsFor', header: 'GF' },
      { id: 'goalsAgainst', accessorKey: 'goalsAgainst', header: 'GA' },
      {
        id: 'goalDiff',
        accessorKey: 'goalDiff',
        header: 'GD',
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
        header: 'PPG',
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
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
          <p className="text-[0.8125rem] text-fg-dim">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 focus-within:border-accent md:w-56 md:flex-none">
            <MagnifyingGlass size={14} weight="bold" className="shrink-0 text-fg-faint" />
            <input
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder="Find player"
              aria-label="Find player"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[0.8125rem] text-fg outline-none placeholder:text-fg-faint"
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
              className="tactile flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[0.8125rem] text-fg-dim hover:border-line-strong hover:text-fg"
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
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[0.8125rem] text-fg-dim hover:bg-surface-3 hover:text-fg"
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

                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`whitespace-nowrap px-3 py-2.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] ${
                      isNumeric ? 'text-right' : 'text-left'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={`inline-flex items-center gap-1 transition-colors ${
                        isNumeric ? 'flex-row-reverse' : ''
                      } ${sortDirection ? 'text-accent' : 'text-fg-faint hover:text-fg-dim'}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="flex w-2.5 justify-center">
                        {sortDirection === 'asc' && <CaretUp size={9} weight="bold" />}
                        {sortDirection === 'desc' && <CaretDown size={9} weight="bold" />}
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
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const isNumeric = NUMERIC.has(cell.column.id)
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-2.5 text-[0.8125rem] ${isNumeric ? 'tnum text-right' : 'text-left'} ${
                          isNumeric ? 'text-fg-dim' : ''
                        } ${
                          /* podium marker: a rule, not a medal or a glow */
                          cellIndex === 0 && isPodium ? 'border-l-2 border-l-accent pl-2.5' : ''
                        } ${cellIndex === 0 && !isPodium ? 'border-l-2 border-l-transparent pl-2.5' : ''}`}
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
                  className="tactile rounded-sm border border-line-strong px-3 py-1.5 text-[0.8125rem] text-fg-dim hover:border-accent hover:text-accent"
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
