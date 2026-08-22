/**
 * `drag-drop-touch` bridges native HTML5 drag-and-drop to touch so the planner's
 * place/day reordering works on touch input (#1265). It installs document-level touch
 * listeners on import and, on every single-finger touch, records the touchend time and
 * synthesises a `dblclick` when the next touch starts within 500 ms. On the map that
 * dblclick fires the default double-click-zoom, so two quick one-finger pans zoomed
 * instead of panning (#1440).
 *
 * On phones and tablets, only explicit planner drag handles are draggable. That keeps
 * regular rows and map gestures out of the polyfill while making reorder available on
 * touch devices again.
 */
export function maybeInstallTouchDragPolyfill(): Promise<unknown> | void {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(any-pointer: coarse)').matches) return
  return import('drag-drop-touch')
}
