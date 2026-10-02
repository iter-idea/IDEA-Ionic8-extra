import { filter } from 'rxjs';
import { ApplicationRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

import { IDEATranslationsService } from './translations/translations.service';
import { IDEALoadingComponent, IDEALoadingPanel } from './loading/loading.component';

/**
 * How long a wait blocks the app before it shows: a faster task shows nothing.
 */
const APPEAR_AFTER_MS = 250;
/**
 * How long a wait stays on screen, at least, once it shows: it doesn't flash.
 */
const MIN_ON_SCREEN_MS = 500;
/**
 * After how long a wait says it's taking longer than usual.
 */
const SLOW_AFTER_MS = 8000;
/**
 * How long the panel of a task stays once its last step is ticked, so that the ticks are seen.
 */
const TICKS_ON_SCREEN_MS = 700;
/**
 * Ionic's overlays take the back button with this priority (`OVERLAY_BACK_BUTTON_PRIORITY`, not exported).
 */
const OVERLAY_BACK_BUTTON_PRIORITY = 100;
const IONIC_OVERLAYS = 'ion-alert,ion-action-sheet,ion-modal,ion-picker-legacy,ion-popover';

/**
 * Show a wait while the app does something, blocking it: a pill at the bottom of the screen (at the bottom-right corner
 * on a wide one), where the notices of `IDEAMessageService` are, with the look of the app's Ionic tokens.
 * The app is blocked from the call to `show()`, but the wait shows only if it lasts; nested waits close with the last
 * `hide()`. For a long task, `show(options)` shows a panel with its steps, progress, error and a button to cancel it.
 */
@Injectable({ providedIn: 'root' })
export class IDEALoadingService {
  private _translate = inject(IDEATranslationsService);
  private _router = inject(Router, { optional: true });
  private _appRef = inject(ApplicationRef);
  private _injector = inject(EnvironmentInjector);

  /**
   * The wait: created with the first one, outside the app's pages so that it stays above them.
   */
  private view: IDEALoadingComponent;
  /**
   * The texts of the waits open, the latest last (`null` for the default one): their count is the count of the waits.
   */
  private texts: string[] = [];
  /**
   * The task of the panel on screen, if any.
   */
  private task: LoadingTask | null = null;
  private shownAt: number;
  private appearTimeout: ReturnType<typeof setTimeout>;
  private slowTimeout: ReturnType<typeof setTimeout>;
  private closeTimeout: ReturnType<typeof setTimeout>;
  /**
   * Whether a notice came while the waits were open: the notice has taken their place, so they leave the screen at the
   * last `hide()`, without staying for their minimum time.
   */
  private noticeDuringWait = false;
  /**
   * While blocking: the app made inert, and the element that had the focus before (the element itself, and the one
   * of the page that contains it, e.g. an `ion-button` and its button).
   */
  private blockedApp: HTMLElement | null = null;
  private appWasInert = false;
  private focusBefore: { element: HTMLElement; inPage: HTMLElement } | null = null;

  constructor() {
    this.closeOnPageChange();
  }

  /**
   * Show a wait, blocking the app.
   * @param content the message (already translated); the default one ("Please wait...") if not set
   */
  show(content?: string): Promise<void>;
  /**
   * Show the panel of a task, blocking the app: its steps, its progress, its error and a button to cancel it.
   * @param options the options of the task
   * @returns the task, to tell the panel where the task is
   */
  show(options: IDEALoadingOptions): Promise<IDEALoadingTask>;
  async show(contentOrOptions?: string | IDEALoadingOptions): Promise<void | IDEALoadingTask> {
    if (contentOrOptions !== null && typeof contentOrOptions === 'object') return this.startTask(contentOrOptions);
    this.open((contentOrOptions as string) || null);
  }
  /**
   * Change the message of the wait, while it's already on. With the panel of a task on screen, it changes the message of
   * the wait under it: the panel shows the task's title.
   * @param content new message (already translated)
   */
  setContent(content: string): void {
    if (!this.texts.length) return;
    this.texts[this.texts.length - 1] = content;
    this.render();
    if (this.view.shown() && !this.task) this.view.announce(this.currentText());
  }
  /**
   * Close a wait: the app is free again when the last one opened is closed.
   * @returns whether there was a wait to close
   */
  async hide(): Promise<boolean> {
    if (!this.texts.length) return false;
    this.texts.pop();
    if (!this.texts.length) this.end();
    else {
      // a task inside another wait ends with its own hide(): the other wait is back
      if (this.task && !this.task.error && this.texts.length < this.task.depth) this.task = null;
      this.render();
    }
    return true;
  }

  /**
   * A notice takes the place of a wait that would stay only to be seen: the minimum time on screen is there against a
   * flash, and a notice in the same spot is none. After the last `hide()`, the wait leaves at once; before it, as in the
   * usual `try { …; success() } finally { hide() }`, the wait stays open, and leaves at once at its last `hide()`. The
   * panel of a task stays: its ticks are there to be seen. Called by `IDEAMessageService`.
   */
  yieldToNotice(): void {
    if (this.task) return;
    if (this.isActive()) this.noticeDuringWait = true;
    else if (this.closeTimeout) this.close(false);
  }

  private open(text: string | null): void {
    this.getView();
    // the first wait open: the time before it says it's taking longer starts now, and no notice has come yet
    if (!this.texts.length) {
      clearTimeout(this.slowTimeout);
      this.view.slow.set(false);
      this.slowTimeout = setTimeout((): void => this.view.slow.set(true), SLOW_AFTER_MS);
      this.noticeDuringWait = false;
    }
    this.texts.push(text);
    // still on screen after the last one was closed: it stays, for the new one (a task that ended gives way)
    clearTimeout(this.closeTimeout);
    this.closeTimeout = null;
    if (this.task?.ended) this.task = null;
    if (!this.view.blocking()) this.block();
    // leaving the screen: it comes back at once; not on screen yet: it shows if it lasts
    if (this.view.leaving()) this.appear();
    else if (!this.view.shown() && !this.appearTimeout)
      this.appearTimeout = setTimeout((): void => this.appear(), APPEAR_AFTER_MS);
    else if (this.view.shown() && text && !this.task) this.view.announce(text);
    this.render();
  }
  private appear(): void {
    clearTimeout(this.appearTimeout);
    this.appearTimeout = null;
    if (!this.isActive()) return;
    this.shownAt = Date.now();
    this.view.appear();
    this.view.announce(this.task?.title ?? this.currentText());
  }
  /**
   * The last wait was closed: the app is free at once, and the wait leaves the screen once it has been seen; unless the
   * panel shows an error (the user closes it).
   */
  private end(): void {
    if (this.task?.error) return;
    if (this.appearTimeout) return this.close();
    this.unblock(true);
    clearTimeout(this.slowTimeout);
    let left = this.noticeDuringWait ? 0 : Math.max(0, MIN_ON_SCREEN_MS - (Date.now() - this.shownAt));
    if (this.task) {
      this.task.ended = true;
      // a cancelled task isn't done: no ticks
      if (this.task.steps && !this.task.abort.signal.aborted) {
        this.tickSteps(this.task, this.task.steps.length);
        left = Math.max(left, TICKS_ON_SCREEN_MS);
      }
      this.render();
    }
    if (left) this.closeTimeout = setTimeout((): void => this.close(), left);
    else this.close();
  }
  private close(restoreFocus = true): void {
    clearTimeout(this.appearTimeout);
    clearTimeout(this.slowTimeout);
    clearTimeout(this.closeTimeout);
    this.appearTimeout = null;
    this.closeTimeout = null;
    this.texts = [];
    this.task = null;
    this.view.slow.set(false);
    this.view.disappear();
    this.unblock(restoreFocus);
  }
  private isActive(): boolean {
    return this.texts.length > 0 || !!this.task?.error;
  }

  private startTask(options: IDEALoadingOptions): IDEALoadingTask {
    const translate = (text: string): string => (options.dontTranslate ? text : this._translate._(text));
    const title = options.message ? translate(options.message) : null;
    const task: LoadingTask = {
      title: title ?? this._translate._('IDEA_COMMON.LOADING.PLEASE_WAIT'),
      steps: options.steps?.map(step => ({ label: translate(step), status: 'todo' })),
      cancelable: !!options.cancelable,
      abort: new AbortController()
    };
    // one task at a time: the new one takes the place of the one on screen
    const wasOnScreen = this.view?.shown() && !this.view.leaving();
    this.task = task;
    this.open(title);
    task.depth = this.texts.length;
    if (wasOnScreen) this.view.announce(task.title);

    // once its wait is closed, or another task takes its place, the task no longer acts on the screen
    const isOnScreen = (): boolean => this.task === task && !task.ended;
    return {
      step: (index: number): void => {
        // already in progress: it keeps the time it started at
        if (!isOnScreen() || !task.steps || task.steps[index]?.status === 'active') return;
        this.tickSteps(task, index);
        task.steps.slice(index + 1).forEach(step => {
          if (step.status !== 'active') return;
          step.status = 'todo';
          step.startedAt = undefined;
        });
        if (task.steps[index]) {
          task.steps[index].status = 'active';
          task.steps[index].startedAt = Date.now();
        }
        this.render();
      },
      progress: (done: number, total: number): void => {
        if (!isOnScreen()) return;
        task.progress = { done, total };
        this.render();
      },
      fail: (message: string, failOptions: IDEALoadingFailOptions = {}): void => {
        if (!isOnScreen()) return;
        const { dontTranslate, serverMessage, requestId } = failOptions;
        message = dontTranslate ? message : this._translate._(message);
        task.error = { message, detail: requestId ? undefined : serverMessage, requestId };
        this.view.copiedCode.set(null);
        task.steps?.filter(step => step.status === 'active').forEach(step => (step.status = 'error'));
        clearTimeout(this.closeTimeout);
        if (!this.view.shown() || this.view.leaving()) this.appear();
        this.render();
        const hint = requestId ? this._translate._('IDEA_COMMON.MESSAGE.CODE_HINT') : undefined;
        this.view.announce([message, task.error.detail, hint].filter(x => x).join(' '), true);
      },
      cancelled: task.abort.signal
    };
  }
  /**
   * The steps before `index` are done: the one in progress takes its duration.
   */
  private tickSteps(task: LoadingTask, index: number): void {
    task.steps?.slice(0, index).forEach(step => {
      if (step.status === 'done') return;
      if (step.startedAt) step.duration = this.formatDuration(Date.now() - step.startedAt);
      step.status = 'done';
    });
  }
  private formatDuration(ms: number): string {
    const seconds = new Intl.NumberFormat(this._translate.getCurrentLang(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(ms / 1000);
    return seconds.concat(' s');
  }
  private cancelTask(): void {
    if (!this.task || this.task.ended || this.task.abort.signal.aborted) return;
    this.task.abort.abort();
    this.render();
  }
  private closeError(): void {
    this.task = null;
    if (!this.texts.length) return this.close();
    this.render();
    this.view.announce(this.currentText());
  }

  private render(): void {
    const task = this.task;
    this.view.message.set(this.currentText());
    this.view.panel.set(
      task
        ? {
            title: task.title,
            steps: task.steps?.map(({ label, status, duration }) => ({ label, status, duration })),
            progress: task.progress ? { ...task.progress } : undefined,
            error: task.error,
            cancelable: task.cancelable && !task.error && !task.ended && !task.abort.signal.aborted
          }
        : null
    );
  }
  private currentText(): string {
    return [...this.texts].reverse().find(x => x) ?? this._translate._('IDEA_COMMON.LOADING.PLEASE_WAIT');
  }

  private getView(): IDEALoadingComponent {
    if (!this.view) {
      const ref = createComponent(IDEALoadingComponent, { environmentInjector: this._injector });
      this._appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement);
      this.view = ref.instance;
      this.view.onCancel = (): void => this.cancelTask();
      this.view.onClose = (): void => this.closeError();
    }
    return this.view;
  }

  /**
   * Block the app, as an Ionic overlay above everything would: taps (the wait's shield), keyboard (the app is inert),
   * back button and Escape, also on the modals, popovers and alerts open, or opened during the wait.
   */
  private block(): void {
    this.view.blocking.set(true);
    const app = document.querySelector<HTMLElement>('ion-app');
    if (app) {
      // the element itself can be inside the shadow DOM of a component (e.g. the button of an `ion-button`)
      const inPage = document.activeElement as HTMLElement;
      let element = inPage;
      while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement as HTMLElement;
      this.focusBefore = inPage && app.contains(inPage) ? { element, inPage } : null;
      this.appWasInert = app.inert;
      app.inert = true;
      app.setAttribute('aria-busy', 'true');
      this.blockedApp = app;
    }
    document.addEventListener('ionBackButton', this.onBackButton);
    window.addEventListener('keydown', this.onKeyDown, true);
  }
  private unblock(restoreFocus: boolean): void {
    if (!this.view.blocking()) return;
    this.view.blocking.set(false);
    if (this.blockedApp) {
      this.blockedApp.inert = this.appWasInert;
      this.blockedApp.removeAttribute('aria-busy');
      this.blockedApp = null;
    }
    if (restoreFocus) this.restoreFocus();
    this.focusBefore = null;
    document.removeEventListener('ionBackButton', this.onBackButton);
    window.removeEventListener('keydown', this.onKeyDown, true);
  }
  /**
   * The focus goes back where it was, unless something else has it (as Ionic's overlays do). An Ionic overlay opened
   * during the wait couldn't take it (the app was inert): it takes it now, instead of the page behind it.
   */
  private restoreFocus(): void {
    const focused = document.activeElement;
    if (focused && focused !== document.body && !focused.closest('idea-loading')) return;
    const overlay = topIonicOverlayOnScreen() as HTMLElement;
    if (overlay && !(this.focusBefore && overlay.contains(this.focusBefore.inPage))) return overlay.focus();
    if (this.focusBefore?.element.isConnected) this.focusBefore.element.focus({ preventScroll: true });
  }
  /**
   * An Ionic overlay open under the wait would take the back button and close: the wait takes it first and does
   * nothing, as `ion-loading` did. With no overlay, the back button changes page, and the change of page closes the wait.
   */
  private onBackButton = (event: Event): void => {
    if (!hasIonicOverlayOnScreen()) return;
    (event as CustomEvent).detail.register(OVERLAY_BACK_BUTTON_PRIORITY + 1, (): void => {});
  };
  /**
   * The keys don't reach the app (e.g. its shortcuts, Escape for an Ionic overlay that would close), only the wait and
   * the notices; on an error, Escape closes it.
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      // no close request either (e.g. for an Ionic overlay, in a browser with the CloseWatcher)
      event.preventDefault();
      event.stopPropagation();
      if (this.task?.error) this.closeError();
      return;
    }
    const target = event.target as Element;
    if (!target?.closest?.('idea-loading, idea-notices')) event.stopPropagation();
  };

  /**
   * Close the wait when the page changes, to avoid leaving it (blocking the app) forever.
   */
  private closeOnPageChange(): void {
    this._router?.events.pipe(filter(e => e instanceof NavigationStart)).subscribe((): void => {
      // also a wait still on screen after its last hide(); no focus back: it belongs to the page just left
      if (!this.view || (!this.isActive() && !this.closeTimeout)) return;
      // a task that the user can cancel is cancelled, as if they had: its result would reach a page that isn't there
      if (this.task?.cancelable && !this.task.ended) this.task.abort.abort();
      this.close(false);
    });
  }
}

const ionicOverlaysOnScreen = (): Element[] =>
  Array.from(document.querySelectorAll(IONIC_OVERLAYS)).filter(
    overlay => (overlay as any).overlayIndex > 0 && !overlay.classList.contains('overlay-hidden')
  );
const hasIonicOverlayOnScreen = (): boolean => ionicOverlaysOnScreen().length > 0;
const topIonicOverlayOnScreen = (): Element | undefined =>
  ionicOverlaysOnScreen()
    .sort((a: any, b: any) => a.overlayIndex - b.overlayIndex)
    .pop();

/**
 * The options of the panel of a task.
 */
export interface IDEALoadingOptions {
  /**
   * The title of the panel (i18n key to translate, if `dontTranslate === false`).
   */
  message?: string;
  /**
   * Whether the message and the steps are already translated texts.
   */
  dontTranslate?: boolean;
  /**
   * The steps of the task (i18n keys), shown in order: the task says which one is in progress with `step()`.
   */
  steps?: string[];
  /**
   * Whether the user can cancel the task: a button triggers `cancelled`.
   */
  cancelable?: boolean;
}

/**
 * A task shown by the panel of `IDEALoadingService`: it tells the panel where the task is.
 * Once another task takes its place, or its wait is closed, it no longer acts on the screen.
 * The waits are counted, not matched: each `hide()` closes the latest one open. With two tasks, close them in the
 * reverse order: if the replaced one closes first, it closes the new one too.
 */
export interface IDEALoadingTask {
  /**
   * The step in progress (index of `steps`): the ones before it are ticked, with their duration. `hide()` ticks them all.
   */
  step(index: number): void;
  /**
   * The progress of the task: a bar and e.g. "3 of 12".
   */
  progress(done: number, total: number): void;
  /**
   * Show an error in the panel, as `IDEAMessageService.error` would: with a `requestId`, the code to report. The panel
   * (and the block of the app) stays until the user closes it, even after `hide()`.
   * @param message the error to show (i18n key to translate, if `dontTranslate === false`)
   */
  fail(message: string, options?: IDEALoadingFailOptions): void;
  /**
   * Triggered when the user cancels the task (with `cancelable`), or leaves the page: pass it to the requests of the
   * task, e.g. `IDEAApiService.getResource(path, { signal: task.cancelled })`, to interrupt them. The panel closes at
   * `hide()`.
   */
  readonly cancelled: AbortSignal;
}

/**
 * The options of the error of a task: as the ones of `IDEAMessageService.error`.
 */
export interface IDEALoadingFailOptions {
  /**
   * Whether the message is already a translated text.
   */
  dontTranslate?: boolean;
  /**
   * Some untranslatable text from the back-end, to add as detail after the message.
   */
  serverMessage?: string;
  /**
   * The id of the request of an error the back-end didn't handle (`IDEAApiError.requestId`), or another reference of
   * the failed job: the panel shows it as a code to report, which the user can copy. With it, `serverMessage` isn't
   * shown.
   */
  requestId?: string;
}

interface LoadingTask {
  title: string;
  /**
   * Whether its wait was closed: the panel may still be leaving the screen, but the task is over.
   */
  ended?: boolean;
  /**
   * How many waits were open with its own: when fewer are, the task is over.
   */
  depth?: number;
  steps?: { label: string; status: 'todo' | 'active' | 'done' | 'error'; startedAt?: number; duration?: string }[];
  progress?: { done: number; total: number };
  error?: IDEALoadingPanel['error'];
  cancelable: boolean;
  abort: AbortController;
}
