import { describe, it, expect, afterEach, vi } from 'vitest'
import { maybeInstallTouchDragPolyfill } from './touchDragPolyfill'

// Stub the polyfill so the test exercises only the load gate, not the real
// document-level touch listeners the package installs on import.
vi.mock('drag-drop-touch', () => ({}))

// The polyfill is loaded for every touch-capable device, but only explicit planner
// reorder handles are draggable. This keeps ordinary scrolling and map panning native.
function mockPointer(matching: string[]) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: matching.includes(query), media: query }) as MediaQueryList,
  )
}

describe('maybeInstallTouchDragPolyfill', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads on a hybrid laptop with a touchscreen', async () => {
    mockPointer(['(any-pointer: coarse)'])
    const result = maybeInstallTouchDragPolyfill()
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toBeDefined()
  })

  it('loads on a tablet', async () => {
    mockPointer(['(pointer: coarse)', '(any-pointer: coarse)'])
    await expect(maybeInstallTouchDragPolyfill()).resolves.toBeDefined()
  })

  it('loads on a phone', async () => {
    mockPointer(['(pointer: coarse)', '(any-pointer: coarse)'])
    await expect(maybeInstallTouchDragPolyfill()).resolves.toBeDefined()
  })

  it('does not load on a plain mouse-driven desktop', () => {
    mockPointer(['(pointer: fine)'])
    expect(maybeInstallTouchDragPolyfill()).toBeUndefined()
  })
})
