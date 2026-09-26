import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no scrolling; ScrollToTop calls window.scrollTo on every navigation.
window.scrollTo = vi.fn()

// Each test starts from a signed-out browser with a pristine registry of mocks.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
