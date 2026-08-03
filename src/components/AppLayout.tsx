import type { ReactNode } from 'react'
import logo from '../Logo-kcm.png'
import ScrollToTop from './ScrollToTop'
import { ThemeToggle } from './ThemeToggle'

/**
 * App shell: a compact sticky command bar over a full-bleed content column.
 *
 * The bar is deliberately short - this is a standings board, and vertical space
 * belongs to data. Brand sits hard left, context hard right, nothing centred.
 */
export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 shadow-[inset_0_-1px_0_var(--hairline)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-7 w-auto object-contain" />
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[0.9375rem] font-semibold uppercase tracking-[0.14em] text-fg">
                KCM Ranking
              </span>
              <span className="hidden text-[0.875rem] text-fg-faint sm:inline">Table Soccer</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="eyebrow hidden items-center gap-2 sm:inline-flex">
              <span className="breathe inline-block h-1.5 w-1.5 rounded-full bg-up" aria-hidden="true" />
              KC München
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      <ScrollToTop />

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="text-[0.875rem] text-fg-faint">
            <a
              href="https://kc-muenchen.de/"
              className="tactile text-fg-dim underline-offset-4 hover:text-accent hover:underline"
            >
              KC München
            </a>{' '}
            Table Soccer Rankings
          </p>
          <p className="eyebrow">Ratings by TrueSkill</p>
        </div>
      </footer>
    </div>
  )
}
