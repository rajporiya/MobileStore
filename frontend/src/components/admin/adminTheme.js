/**
 * VoltCart admin design tokens.
 *
 * The customer storefront uses large radii, gradients and indigo→violet washes.
 * The admin panel deliberately does not: it is a data tool, so it uses flatter
 * surfaces, tighter radii, hairline borders and a single accent that only shows
 * up where something is interactive or active.
 *
 * Every admin component reads its colours from here, so the panel can never
 * drift back toward the storefront look page by page.
 */

// Page + surface
export const ADMIN_THEME = {
  // Layout
  sidebar: 'bg-[#0f172a]',
  sidebarBorder: 'border-slate-800',
  sidebarWidth: 'w-60', // 240px
  sidebarWidthCollapsed: 'w-[72px]',
  topbarHeight: 'h-16',
  page: 'bg-[#f8fafc]',

  // Surfaces
  card: 'bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  cardFlat: 'bg-white rounded-xl border border-slate-200',
  panel: 'bg-white rounded-xl border border-slate-200',
  sunken: 'bg-slate-50 rounded-lg border border-slate-200',

  // Type
  pageTitle: 'text-[22px] sm:text-[26px] font-bold tracking-tight text-slate-900',
  sectionTitle: 'text-[15px] font-bold text-slate-900',
  label: 'text-[11px] font-semibold uppercase tracking-wider text-slate-500',
  body: 'text-sm text-slate-600',
  tableHead: 'text-[11px] font-semibold uppercase tracking-wider text-slate-500',
  tableCell: 'text-[13px] text-slate-600',
  numeric: 'text-[13px] font-semibold text-slate-900 tabular-nums',
  muted: 'text-xs text-slate-500',

  // Accent — VoltCart purple, used only for active/selected/interactive state
  accent: 'bg-indigo-600',
  accentHover: 'hover:bg-indigo-700',
  accentText: 'text-indigo-600',
  accentRing: 'focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500',
  activeNav: 'bg-indigo-600 text-white shadow-sm',
  idleNav: 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
}

// Buttons — flat, 1px borders, no gradients anywhere in the admin panel.
export const ADMIN_BUTTONS = {
  primary:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] ' +
    'font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 ' +
    'text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-400 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ' +
    'text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40',
  danger:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-[13px] ' +
    'font-semibold text-white shadow-sm transition-colors hover:bg-red-700 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
  dangerGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ' +
    'text-red-600 transition-colors hover:bg-red-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
}

// Form controls
export const ADMIN_INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 shadow-xs ' +
  'placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none ' +
  'focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500'

export const ADMIN_LABEL = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500'

// Table chrome
export const ADMIN_TABLE_WRAPPER =
  'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'

export const ADMIN_TABLE_HEAD = 'bg-slate-50/80 border-b border-slate-200'

export const ADMIN_TABLE_ROW = 'border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70'

export const ADMIN_TABLE_TH = `${ADMIN_TABLE_HEAD} ${ADMIN_TH} px-4 py-2.5 text-left whitespace-nowrap`

export const ADMIN_TABLE_TD = `${ADMIN_TABLE_CELL} px-4 py-3 align-middle`

// Status → accent colour, used by badges, stat cards and chart segments.
export const ADMIN_STATUS_COLORS = {
  success: { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-600/20', hex: '#059669' },
  warning: { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-600/20', hex: '#d97706' },
  danger: { text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-600/20', hex: '#dc2626' },
  info: { text: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-600/20', hex: '#0284c7' },
  accent: { text: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-600/20', hex: '#4f46e5' },
  neutral: { text: 'text-slate-600', bg: 'bg-slate-100', ring: 'ring-slate-500/20', hex: '#64748b' },
}

export const cx = (...parts) => parts.filter(Boolean).join(' ')
