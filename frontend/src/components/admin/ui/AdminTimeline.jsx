import { FiCheck } from 'react-icons/fi'
import { cx } from '../adminTheme'

/**
 * Vertical progress timeline used by the order and trade-in detail pages.
 * `steps` is ordered oldest → newest; anything with `done: true` renders filled,
 * the current step is highlighted, and the rest stay hollow.
 */
export default function AdminTimeline({ steps = [], className = '' }) {
  return (
    <ol className={cx('space-y-0', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const state = step.done ? 'done' : step.current ? 'current' : 'todo'

        return (
          <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cx('absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5', step.done ? 'bg-indigo-200' : 'bg-slate-200')}
                aria-hidden="true"
              />
            )}

            <span
              className={cx(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-white',
                state === 'done' && 'border-indigo-600 bg-indigo-600',
                state === 'current' && 'border-indigo-600 bg-white',
                state === 'todo' && 'border-slate-200 bg-white'
              )}
            >
              {state === 'done' ? (
                <FiCheck className="h-3 w-3" aria-hidden="true" />
              ) : (
                <span
                  className={cx('h-1.5 w-1.5 rounded-full', state === 'current' ? 'bg-indigo-600' : 'bg-slate-200')}
                  aria-hidden="true"
                />
              )}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cx(
                  'text-[13px] font-semibold',
                  state === 'todo' ? 'text-slate-400' : state === 'current' ? 'text-indigo-700' : 'text-slate-800'
                )}
              >
                {step.label}
              </p>
              {step.meta && <p className="mt-0.5 text-[12px] text-slate-500">{step.meta}</p>}
            </div>

            {step.time && <time className="shrink-0 pt-0.5 text-[11px] text-slate-400">{step.time}</time>}
          </li>
        )
      })}
    </ol>
  )
}
