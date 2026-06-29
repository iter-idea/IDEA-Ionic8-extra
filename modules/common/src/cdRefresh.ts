/**
 * The change-detection "bridge".
 *
 * WHAT IT IS
 *   A best-effort helper that forces change detection on the currently visible Ionic page after
 *   library async work that, by itself, does NOT trigger Angular change detection.
 *
 * THE PROBLEM IT SOLVES
 *   On Angular 22, Ionic's `StackController` detaches a page/overlay from the root change-detection
 *   tree, so `ApplicationRef.tick()` never reaches its view (verified empirically). A page/overlay is
 *   then only rendered when its OWN view is marked dirty — by a template event or a signal. So any
 *   state assigned to it from a non-template context stays unrendered until the next user interaction:
 *     - a native `fetch` (IDEAApiService, IDEAAttachmentsService S3 upload, IDEAAppStatusService,
 *       IDEATranslationsService) resolves OUTSIDE the Angular zone — no tick at all on a Zone app;
 *     - **data read from a CACHE / storage / any non-fetch async** (e.g. a service `getList()` that
 *       returns an already-loaded list, a `Promise.resolve`, a `setTimeout`) — even when a Zone tick
 *       DOES fire, it cannot reach the detached view, so the page/overlay still stays stale;
 *     - an Ionic overlay dismiss callback runs outside the template event flow;
 *     - a WebSocket message arrives from the native/socket layer.
 *   On a ZONELESS app the same holds for an even wider set (only a signal / markForCheck / DOM event
 *   schedules CD). The classic symptom: a page/modal stays on its skeletons — or a chained form does
 *   not advance — until you touch a control (whose event finally ticks the view).
 *
 *   Because the gap is the DETACHED VIEW, not the data source, the bridge is wired to two kinds of
 *   trigger: (a) the moment a view ENTERS / an overlay PRESENTS — which catches state populated around
 *   open time regardless of source (fetch, cache, storage); and (b) the late async events (fetch
 *   finally / websocket / overlay dismiss) — which catch data that lands well after open.
 *
 * WHAT IT DOES
 *   Finds the visible Ionic page(s) in the DOM and runs a LOCAL `detectChanges()` on each page's own
 *   component view (which a global tick can't reach). It ALSO refreshes the content of open Ionic
 *   popovers (whose projected component is NOT wrapped in an `.ion-page`, so the page selector misses
 *   it) — this covers an overlay that loads its own data via a native-fetch service in `ngOnInit`.
 *   Modals are already covered by the page pass: Ionic wraps modal content in an `.ion-page`.
 *   This makes the library render correctly on BOTH Zone and zoneless consumer apps WITHOUT any fix
 *   code in the apps themselves.
 *
 * WHAT IT DOES NOT (and structurally cannot) COVER
 *   The bridge runs a correct `detectChanges()` on a visible page/overlay view; it cannot cross two
 *   boundaries that are normal OnPush semantics, so these still need app-side care:
 *     - an object/array MUTATED IN PLACE and passed as `@Input` to an OnPush CHILD — the child is
 *       legitimately skipped because its input reference is unchanged (`Object.is`); rebuild the
 *       reference instead;
 *     - external/third-party mutable state read DIRECTLY in a template (e.g. a Swiper's `activeIndex`)
 *       — there is no view state to detect a change on; capture it into a field on the event.
 *   These bite a fully-migrated zoneless app identically; they are not bridge gaps.
 *
 * WHO CALLS IT (the bridge surface)
 *   - the global enter/present/dismiss Ionic listeners installed lazily below: `ionViewDidEnter` (a
 *     page entered), `didPresent` (an overlay opened), `didDismiss` (an overlay closed). These cover
 *     state populated around navigation/open time from ANY source, cache included;
 *   - the 4 native-fetch services, in a `finally`: api.service / attachments.service /
 *     appStatus.service / translations.service (for data that lands well after open);
 *   - webSocketApi.service, after each `onMessage` (opt out per connection with `refreshOnMessage:false`).
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
import {
  ɵViewRef as ViewRef,
  ɵgetLContext as getLContext,
  NgZone,
  EnvironmentProviders,
  makeEnvironmentProviders,
  ENVIRONMENT_INITIALIZER,
  inject
} from '@angular/core';

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
  installBridgeEventListeners();
  try {
    // 1) Visible pages — and modal content, which Ionic also wraps in an `.ion-page`.
    document.querySelectorAll('ion-app .ion-page:not(.ion-page-hidden)').forEach(refreshElementOwnView);
    // 2) Open popovers — their projected component is NOT an `.ion-page`, so the selector above misses
    //    it. Refresh the rendered component's own view (covers a popover that self-loads data on open).
    document.querySelectorAll('ion-popover:not(.overlay-hidden)').forEach(popover => {
      const host = findRenderedComponentHost(popover);
      if (host) refreshElementOwnView(host);
    });
  } catch {
    // best-effort: a CD nudge must never break the request flow
  }
}

/**
 * Run a local `detectChanges()` on the OWN component view of an element. `getLContext().lView` is the
 * host view that declares the element; descend into the element's own component view (where its
 * template/bindings live), which is the slot at `nodeIndex`.
 */
function refreshElementOwnView(el: Element): void {
  const ctx: any = getLContext(el);
  let lView = ctx?.lView;
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
}

/**
 * Find the Angular component host element rendered inside an Ionic overlay — the element Ionic's
 * framework delegate appended. It is the first descendant that carries an Angular context
 * (`__ngContext__`) and is an app/library custom element (a dashed tag that is not an `ion-*` element).
 */
function findRenderedComponentHost(overlay: Element): Element | null {
  for (const el of Array.from(overlay.querySelectorAll('*'))) {
    if ((el as any).__ngContext__ !== undefined && el.localName.includes('-') && !el.localName.startsWith('ion-'))
      return el;
  }
  return null;
}

/**
 * Install the global Ionic lifecycle listeners that drive the bridge. Installed once, lazily, the
 * first time the bridge runs.
 *   - `ionViewDidEnter` (a page finished entering) and `didPresent` (an overlay finished presenting):
 *     these fire AFTER the component's `ngOnInit`/`ionViewWillEnter` have run, so by then any state
 *     loaded synchronously or microtask-after — crucially, data read from a service CACHE that issues
 *     no `fetch` — is already set; a refresh on the next macrotask renders it. This is the trigger that
 *     covers the non-fetch / cached-load case a data-source hook can never see.
 *   - `didDismiss` (an overlay closed): its callback mutates page state outside the template event flow.
 * Listeners use the capture phase so they fire even if a given Ionic event does not bubble to document.
 */
function installBridgeEventListeners(): void {
  if (overlayListenerInstalled || typeof document === 'undefined') return;
  overlayListenerInstalled = true;
  const refreshNextTick = (): void => void setTimeout(refreshVisibleIonicPages);
  document.addEventListener('ionViewDidEnter', refreshNextTick, true);
  document.addEventListener('didPresent', refreshNextTick, true);
  document.addEventListener('didDismiss', refreshNextTick, true);
}

// Install the enter/present/dismiss listeners as soon as the library loads — NOT lazily on the first
// fetch. A page/overlay that populates purely from a service cache never calls a fetch service, so it
// would otherwise never install them and the cached-load case (its whole point) would stay broken.
installBridgeEventListeners();

let cdPumpStarted = false;

/**
 * The change-detection PUMP — the complete, source-agnostic form of the bridge for ZONE consumers.
 *
 * Angular 20 rendered every Ionic page because the zone, on going stable after each async turn, ran
 * `ApplicationRef.tick()`, which reached every attached view. Angular 22 still goes stable after each
 * turn, but `tick()` no longer reaches the views Ionic's `StackController` detaches — so ANY state
 * assigned off the template-event path (a cached read, a fetch, a dynamic `import()`, a chained await)
 * stays unrendered until the next interaction. This is independent of the component's strategy: it bites
 * a plain CheckAlways page just as much as an OnPush one, and a simple page just as much as a complex one.
 *
 * The pump restores the old behavior: on `NgZone.onStable` — the SAME moment Angular 20 ticked — it runs
 * the bridge's LOCAL `detectChanges()` (which DOES reach detached views). Net effect: Angular 22 + Zone
 * renders like Angular 20 + Zone, for data from ANY source, on EVERY page, with no per-page work. Because
 * it is global and uniform, page complexity is irrelevant — Shifts/Planning/Sequencer are covered by the
 * same restoration as a trivial list, not case by case.
 *
 * Cost equals the CheckAlways these apps already run: one local CD of the visible page(s) per async turn,
 * coalesced to a single pass per animation frame, executed outside the Angular zone so it can never loop.
 * It is a NO-OP on a zoneless app (`onStable` does not fire there — zoneless consumers render via signals),
 * so it is dual-mode safe.
 */
export function startIonicCDPump(zone: NgZone): void {
  if (cdPumpStarted || typeof requestAnimationFrame === 'undefined') return;
  cdPumpStarted = true;
  let scheduled = false;
  zone.runOutsideAngular(() =>
    zone.onStable.subscribe(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refreshVisibleIonicPages();
      });
    })
  );
}

/**
 * Starts the change-detection pump. Add ONE line to a Zone-based app's bootstrap providers:
 *   bootstrapApplication(AppComponent, { providers: [ ..., provideIDEAChangeDetectionBridge() ] });
 * Uniform across every project, no signals knowledge required, and a harmless no-op on a zoneless app.
 */
export function provideIDEAChangeDetectionBridge(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ENVIRONMENT_INITIALIZER, multi: true, useValue: () => startIonicCDPump(inject(NgZone)) }
  ]);
}
