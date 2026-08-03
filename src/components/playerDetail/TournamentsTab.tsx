import { CalendarBlank } from '@phosphor-icons/react'
import { EmptyState } from '../ui/States'

/** Rows past this index appear immediately. */
const ROW_STAGGER_LIMIT = 14

/**
 * Tournament participation.
 *
 * One row per tournament rather than a grid of cards: the interesting data is
 * the placement columns, and columns want a table.
 */
export const TournamentsTab = ({ tournamentList }: { tournamentList: any }) => {
  if (tournamentList.length === 0) {
    return (
      <EmptyState
        icon={<CalendarBlank size={18} weight="bold" />}
        title="No tournaments yet"
        hint="This player has not appeared in an imported tournament."
      />
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Participation</span>
          <h2 className="text-base font-semibold tracking-tight text-fg">Tournaments played</h2>
        </div>
        <span className="tnum text-[0.875rem] text-fg-faint">{tournamentList.length} total</span>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[34rem] border-collapse">
          <thead>
            <tr className="border-b border-line-strong">
              {['Date', 'Tournament', 'Qual', 'KO', 'Final', 'Points'].map((label, index) => (
                <th
                  key={label}
                  scope="col"
                  className={`colhead whitespace-nowrap px-3 py-3 ${
                    index >= 2 ? 'text-right' : 'text-left'
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tournamentList.map((tournament: any, index: number) => {
              const isPodium = tournament.finalPlace && tournament.finalPlace <= 3
              return (
                <tr
                  key={index}
                  className="row-in border-b border-line transition-colors hover:bg-surface"
                  style={
                    index < ROW_STAGGER_LIMIT
                      ? ({ '--row-index': index } as React.CSSProperties)
                      : { animation: 'none' }
                  }
                >
                  <td className="tnum whitespace-nowrap px-3 py-3.5 text-[0.875rem] text-fg-faint">
                    {new Date(tournament.date).toLocaleDateString('de-DE', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </td>
                  <td
                    className={`max-w-[18rem] truncate border-l-2 px-3 py-3.5 text-[0.9375rem] ${
                      isPodium ? 'border-l-accent font-medium text-fg' : 'border-l-transparent text-fg-dim'
                    }`}
                  >
                    {tournament.name}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-[0.9375rem] text-fg-dim">
                    {tournament.qualifyingPlace ?? <span className="text-fg-faint">--</span>}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-[0.9375rem] text-fg-dim">
                    {tournament.eliminationPlace ?? <span className="text-fg-faint">--</span>}
                  </td>
                  <td
                    className={`tnum px-3 py-2.5 text-right text-[0.9375rem] ${
                      isPodium ? 'font-semibold text-fg' : 'text-fg-dim'
                    }`}
                  >
                    {tournament.finalPlace ?? <span className="text-fg-faint">--</span>}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-[0.9375rem] text-accent">
                    {tournament.seasonPoints !== undefined ? (
                      `+${tournament.seasonPoints}`
                    ) : (
                      <span className="text-fg-faint">--</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
