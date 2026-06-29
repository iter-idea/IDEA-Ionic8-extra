/**
 * The change-detection "bridge".
 *
 * WHAT IT IS
 *   A best-effort helper that forces change detection on the currently visible Ionic page after
 *   library async work that, by itself, does NOT trigger Angular change detection.
 *
 * THE PROBLEM IT SOLVES
 *   Several library code paths settle their async work outside Angular's change-detection triggers:
 *     - a native `fetch` (IDEAApiService, IDEAAttachmentsService S3 upload, IDEAAppStatusService,
 *       IDEATranslationsService) resolves OUTSIDE the Angular zone;
 *     - an Ionic overlay dismiss callback (alert/modal/popover/action-sheet) runs outside the
 *       template event flow;
 *     - a WebSocket message arrives from the native/socket layer.
 *   After such work, the value a component/page assigns is not rendered:
 *     - on a ZONE-based app, the native `fetch` settled outside the zone, so no tick is scheduled;
 *     - on a ZONELESS app, nothing but a signal / markForCheck / DOM event schedules CD, so a plain
 *       field assigned after `await` never renders.
 *   `ApplicationRef.tick()` cannot fix it: Ionic's `StackController` detaches pages from the root
 *   change-detection tree, so a global tick never reaches the page's view (verified empirically).
 *   The result is the classic symptom: a list/detail page stays on its skeletons until the next user
 *   interaction.
 *
 * WHAT IT DOES
 *   Finds the visible Ionic page(s) in the DOM and runs a LOCAL `detectChanges()` on each page's own
 *   component view (which a global tick can't reach). This makes the library render correctly on BOTH
 *   Zone and zoneless consumer apps WITHOUT any fix code in the apps themselves.
 *
 * WHO CALLS IT (the bridge surface)
 *   - the 4 native-fetch services, in a `finally`: api.service / attachments.service /
 *     appStatus.service / translations.service;
 *   - webSocketApi.service, after each `onMessage` (opt out per connection with `refreshOnMessage:false`);
 *   - the global Ionic `didDismiss` overlay listener installed lazily below.
 *
 * IF / WHEN IT CAN BE REMOVED
 *   This is a TRANSITIONAL bridge for consumer apps whose page state is not (yet) signal-based. The
 *   library's OWN components are signal-based and do not depend on it. It becomes dead weight — and can
 *   be deleted — once EVERY consumer app is zoneless + signals, i.e. every template-read page state is
 *   a signal that self-renders. Removal = delete this file, the `refreshVisibleIonicPages()` calls in
 *   the 4 services + webSocketApi, and the `didDismiss` listener. (Keep it as long as any consumer is
 *   Zone-based, or has non-signal page state populated by an async library call.)
 *
 * IMPLEMENTATION NOTE
 *   Uses the published-but-internal `ɵViewRef`/`ɵgetLContext` plus numeric LView indexes (stable under
 *   minification). This couples the bridge to the Angular major the library targets — acceptable for an
 *   internal library, and it is the only way to reach a detached Ionic page view from outside it.
 */
import { ɵViewRef as ViewRef, ɵgetLContext as getLContext } from '@angular/core';

// LView layout indexes (stable array positions, safe under minification).
const HOST = 0;
const TYPE = 1;

const isLView = (v: any): boolean => Array.isArray(v) && v[TYPE] != null && typeof v[TYPE] === 'object';

let overlayListenerInstalled = false;

/**
 * Force change detection on the currently visible Ionic page(s). See the file header for the why.
 * Best-effort: never throws.
 */
export function refreshVisibleIonicPages(): void {
  installOverlayDismissListener();
  try {
    const pages = document.querySelectorAll('ion-app .ion-page:not(.ion-page-hidden)');
    pages.forEach(page => {
      const ctx: any = getLContext(page);
      let lView = ctx?.lView;
      // `getLContext().lView` is the host view that declares the page element; descend into the page's
      // own component view (where its template/bindings live), which is the slot at `nodeIndex`.
      if (lView && ctx.nodeIndex != null) {
        const slot = lView[ctx.nodeIndex];
        const own = isLView(slot) ? slot : isLView(slot?.[HOST]) ? slot[HOST] : null;
        if (own) lView = own;
      }
      if (lView) {
        const ref = new (ViewRef as any)(lView);
        ref.markForCheck();
        ref.detectChanges();
      }
    });
  } catch {
    // best-effort: a CD nudge must never break the request flow
  }
}

/**
 * Ionic overlay (modal/popover/alert/action-sheet/picker) dismiss callbacks change page state
 * outside the template event flow, so they never mark the page for check. Every overlay emits a
 * bubbling `didDismiss` shorthand event; on it, refresh the visible page on the next macrotask (after
 * the dismiss handler has run). Installed once, lazily, the first time the bridge runs.
 */
function installOverlayDismissListener(): void {
  if (overlayListenerInstalled || typeof document === 'undefined') return;
  overlayListenerInstalled = true;
  document.addEventListener('didDismiss', () => setTimeout(refreshVisibleIonicPages), false);
}
