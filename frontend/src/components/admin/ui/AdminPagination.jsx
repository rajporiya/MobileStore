/** Windowed pager shared by every admin list, with a live result count. */
export default function AdminPagination({ page, pages, total, onChange, itemLabel = 'records' }) {
  if (!pages || pages < 1) return null

  const window = 2
  const from = Math.max(1, page - window)
  const to = Math.min(pages, page + window)
  const numbers = []
  for (let i = from; i <= to; i += 1) numbers.push(i)

  const buttonBase =
    'w-8 h-8 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of {pages}
        {total > 0 && (
          <>
            {' '}
            · <span className="font-semibold text-slate-700">{total}</span> {itemLabel}
          </>
        )}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className={`${buttonBase} px-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200`}
          >
            Prev
          </button>

          {from > 1 && (
            <>
              <button onClick={() => onChange(1)} className={`${buttonBase} bg-slate-100 text-slate-600 hover:bg-slate-200`}>
                1
              </button>
              {from > 2 && <span className="px-1 text-slate-400 text-xs">…</span>}
            </>
          )}

          {numbers.map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`${buttonBase} ${
                n === page ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          ))}

          {to < pages && (
            <>
              {to < pages - 1 && <span className="px-1 text-slate-400 text-xs">…</span>}
              <button onClick={() => onChange(pages)} className={`${buttonBase} bg-slate-100 text-slate-600 hover:bg-slate-200`}>
                {pages}
              </button>
            </>
          )}

          <button
            onClick={() => onChange(page + 1)}
            disabled={page >= pages}
            className={`${buttonBase} px-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
