import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { IonIcon, IonProgressBar, IonSpinner } from '@ionic/angular/standalone';
import { alertCircleOutline, checkmark, close, copyOutline } from 'ionicons/icons';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEATranslationsService } from '../translations/translations.service';
import { copyText, groupCode } from '../notices/notices.component';

/**
 * How long the wait takes to leave the screen (its animation).
 */
const LEAVE_DURATION_MS = 160;
/**
 * The room the wait takes at the bottom of the screen: the notices of `IDEAMessageService` stack above it.
 */
const OFFSET_PROPERTY = '--idea-loading-offset';

/**
 * The wait of `IDEALoadingService`: created and driven by the service, not to use directly.
 */
@Component({
  selector: 'idea-loading',
  imports: [IonIcon, IonProgressBar, IonSpinner, IDEATranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="announcer" aria-live="polite">{{ announcements.polite() }}</div>
    <div class="announcer" aria-live="assertive">{{ announcements.assertive() }}</div>
    @if (blocking()) {
      <div class="shield" [class.veiled]="shown() && !leaving()" (pointerdown)="tapped()"></div>
    }
    @if (shown()) {
      @if (!panel()?.error) {
        <div class="bar" aria-hidden="true"><ion-progress-bar type="indeterminate" /></div>
      }
      <div #wait class="wait" [class.leaving]="leaving()" [class.passive]="!blocking()">
        @if (panel(); as panel) {
          <section
            class="surface panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="idea-loading-title"
            [class.shake]="shaking()"
            (animationend)="stopShaking($event)"
          >
            <div class="head">
              @if (panel.error) {
                <ion-icon class="failed" aria-hidden="true" [icon]="icons.error" />
              } @else {
                <ion-spinner name="crescent" color="primary" />
              }
              <p class="title" id="idea-loading-title">{{ panel.title }}</p>
            </div>
            @if (panel.steps) {
              <ol>
                @for (step of panel.steps; track $index) {
                  <li
                    class="step"
                    [attr.data-status]="step.status"
                    [attr.aria-current]="step.status === 'active' ? 'step' : null"
                  >
                    <span class="mark" aria-hidden="true">
                      @switch (step.status) {
                        @case ('done') {
                          <ion-icon [icon]="icons.done" />
                        }
                        @case ('error') {
                          <ion-icon [icon]="icons.failed" />
                        }
                        @case ('active') {
                          <ion-spinner name="crescent" color="primary" />
                        }
                      }
                    </span>
                    <span class="label">{{ step.label }}</span>
                    @if (step.duration) {
                      <span class="time">{{ step.duration }}</span>
                    }
                  </li>
                }
              </ol>
            }
            @if (panel.progress; as progress) {
              <div class="progress">
                <ion-progress-bar [value]="progress.total ? progress.done / progress.total : 0" />
                <span class="count">
                  {{ 'IDEA_COMMON.LOADING.PROGRESS' | translate: { done: progress.done, total: progress.total } }}
                </span>
              </div>
            }
            @if (slow() && !panel.steps && !panel.progress && !panel.error) {
              <p class="slow">{{ 'IDEA_COMMON.LOADING.TAKING_LONGER' | translate }}</p>
            }
            @if (panel.error; as error) {
              <div class="error">
                <p class="errorMessage">{{ error.message }}</p>
                @if (error.detail) {
                  <p class="detail">{{ error.detail }}</p>
                }
                @if (error.requestId) {
                  <p class="hint">{{ 'IDEA_COMMON.MESSAGE.CODE_HINT' | translate }}</p>
                }
              </div>
              @if (error.requestId) {
                <div class="code" [class.copied]="copiedCode() === error.requestId">
                  <code>
                    @for (group of codeGroups(error.requestId); track $index) {
                      <span>{{ group }}</span>
                    }
                  </code>
                  <button
                    type="button"
                    class="copy"
                    [attr.aria-label]="
                      (copiedCode() === error.requestId
                        ? 'IDEA_COMMON.MESSAGE.CODE_COPIED'
                        : 'IDEA_COMMON.MESSAGE.COPY_CODE'
                      ) | translate
                    "
                    (click)="copy(error.requestId)"
                  >
                    <ion-icon
                      aria-hidden="true"
                      [icon]="copiedCode() === error.requestId ? icons.copied : icons.copy"
                    />
                    <span>{{
                      (copiedCode() === error.requestId ? 'IDEA_COMMON.MESSAGE.COPIED' : 'IDEA_COMMON.MESSAGE.COPY')
                        | translate
                    }}</span>
                  </button>
                </div>
              }
            }
            @if (panel.error) {
              <div class="actions">
                <button #closeButton type="button" class="action" (click)="onClose()">
                  {{ 'IDEA_COMMON.LOADING.CLOSE' | translate }}
                </button>
              </div>
            } @else if (panel.cancelable) {
              <div class="actions">
                <button type="button" class="action" (click)="onCancel()">
                  {{ 'IDEA_COMMON.LOADING.CANCEL' | translate }}
                </button>
              </div>
            }
          </section>
        } @else {
          <section class="surface pill" [class.shake]="shaking()" (animationend)="stopShaking($event)">
            <ion-spinner name="crescent" color="primary" />
            <div class="text">
              <p class="message">{{ message() }}</p>
              @if (slow()) {
                <p class="slow">{{ 'IDEA_COMMON.LOADING.TAKING_LONGER' | translate }}</p>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        z-index: 40000;
        inset: 0;
        pointer-events: none;
      }
      /* read by screen readers, out of sight */
      .announcer {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      /* it takes the taps on the app (the app is also inert, for the keyboard), from the call to show() */
      .shield {
        position: absolute;
        inset: 0;
        pointer-events: auto;
        cursor: progress;
        background: transparent;
        transition: background-color 200ms ease-out;
        -webkit-tap-highlight-color: transparent;
      }
      .shield.veiled {
        background: color-mix(in srgb, var(--ion-backdrop-color, #000) 8%, transparent);
      }
      .bar {
        position: absolute;
        top: var(--ion-safe-area-top, 0px);
        left: 0;
        right: 0;
      }
      .bar ion-progress-bar {
        height: 3px;
      }
      .wait {
        position: absolute;
        left: calc(12px + var(--ion-safe-area-left, 0px));
        right: calc(12px + var(--ion-safe-area-right, 0px));
        bottom: calc(12px + var(--ion-safe-area-bottom, 0px));
        pointer-events: auto;
        animation: idea-loading-enter 180ms ease-out;
      }
      @media (min-width: 768px) {
        .wait {
          left: auto;
          right: calc(24px + var(--ion-safe-area-right, 0px));
          bottom: calc(24px + var(--ion-safe-area-bottom, 0px));
          width: var(--idea-notice-width, 400px);
        }
      }
      .wait.leaving {
        animation: idea-loading-leave ${LEAVE_DURATION_MS}ms ease-in forwards;
      }
      /* the app is free again (the last hide() came) while the wait leaves the screen: the taps go through */
      .wait.passive {
        pointer-events: none;
      }
      /* a long panel (many steps, an error) scrolls inside the screen */
      .wait .panel {
        max-height: calc(100vh - 48px - var(--ion-safe-area-top, 0px) - var(--ion-safe-area-bottom, 0px));
        max-height: calc(100dvh - 48px - var(--ion-safe-area-top, 0px) - var(--ion-safe-area-bottom, 0px));
        overflow-y: auto;
      }
      .surface {
        --wait-text: var(--ion-text-color, #000);
        --wait-background: var(--idea-notice-background, var(--ion-card-background, var(--ion-background-color, #fff)));
        --wait-muted: color-mix(in srgb, var(--wait-text) 64%, transparent);
        --wait-action: color-mix(in srgb, var(--ion-color-primary, #0054e9) 82%, var(--wait-text));
        --wait-action-text: color-mix(in srgb, var(--ion-color-primary, #0054e9) 62%, var(--wait-text));
        --wait-success: color-mix(in srgb, var(--ion-color-success, #2dd55b) 82%, var(--wait-text));
        --wait-success-text: color-mix(in srgb, var(--ion-color-success, #2dd55b) 62%, var(--wait-text));
        box-sizing: border-box;
        overflow: hidden;
        background: var(--wait-background);
        color: var(--wait-text);
        border: 1px solid color-mix(in srgb, var(--wait-text) 12%, transparent);
        border-radius: var(--idea-notice-border-radius, 12px);
        box-shadow:
          0 12px 32px rgba(16, 18, 27, 0.16),
          0 2px 6px rgba(16, 18, 27, 0.06);
      }
      /* a tap on the app during the wait: it's waiting, not frozen */
      .shake {
        animation: idea-loading-shake 360ms ease;
      }
      p {
        margin: 0;
      }
      ion-spinner {
        flex: none;
        width: 22px;
        height: 22px;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 12px 16px;
      }
      .text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .message,
      .title,
      .errorMessage,
      .detail {
        overflow-wrap: anywhere;
      }
      .message {
        font-size: 0.9375rem;
        font-weight: 500;
        line-height: 1.35;
      }
      .slow,
      .detail,
      .hint {
        font-size: 0.84375rem;
        line-height: 1.45;
        color: var(--wait-muted);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 16px 10px;
      }
      .title {
        flex: 1;
        min-width: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        line-height: 1.35;
      }
      .failed {
        flex: none;
        font-size: 1.375rem;
        color: var(--ion-color-danger, #c5000f);
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0 0 8px;
      }
      .step {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 7px 16px;
      }
      .step + .step::before {
        content: '';
        position: absolute;
        left: 27px;
        top: -6px;
        width: 2px;
        height: 12px;
        background: color-mix(in srgb, var(--wait-text) 14%, transparent);
      }
      .mark {
        position: relative;
        z-index: 1;
        flex: none;
        box-sizing: border-box;
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border: 1.5px solid color-mix(in srgb, var(--wait-text) 20%, transparent);
        border-radius: 50%;
        background: var(--wait-background);
      }
      .mark ion-icon {
        font-size: 0.875rem;
      }
      .mark ion-spinner {
        width: 14px;
        height: 14px;
      }
      .step[data-status='active'] .mark {
        border-color: var(--ion-color-primary, #0054e9);
      }
      .step[data-status='done'] .mark {
        border-color: var(--ion-color-success, #2dd55b);
        background: var(--ion-color-success, #2dd55b);
        color: var(--ion-color-success-contrast, #000);
      }
      .step[data-status='error'] .mark {
        border-color: var(--ion-color-danger, #c5000f);
        background: var(--ion-color-danger, #c5000f);
        color: var(--ion-color-danger-contrast, #fff);
      }
      .label {
        flex: 1;
        min-width: 0;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .step[data-status='todo'] .label {
        color: var(--wait-muted);
      }
      .time,
      .count {
        flex: none;
        font-size: 0.8125rem;
        font-variant-numeric: tabular-nums;
        color: var(--wait-muted);
      }
      .progress {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 2px 16px 16px;
      }
      .progress ion-progress-bar {
        flex: 1;
        height: 6px;
        border-radius: 6px;
      }
      .panel .slow {
        padding: 0 16px 14px;
      }
      .error {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 16px 14px;
      }
      .errorMessage {
        font-size: 0.90625rem;
        font-weight: 600;
        line-height: 1.35;
      }
      /* the server's own words, usually not in the user's language */
      .detail {
        font-style: italic;
      }
      button {
        border: 0;
        background: transparent;
        font-family: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      button:focus-visible {
        outline: 2px solid var(--wait-action);
        outline-offset: -2px;
      }
      .code {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        margin: 0 16px 14px;
        padding: 6px 0 6px 14px;
        box-sizing: border-box;
        border: 1px solid transparent;
        border-radius: calc(var(--idea-notice-border-radius, 12px) - 3px);
        background: color-mix(in srgb, var(--wait-text) 5%, transparent);
      }
      .code.copied {
        border-color: var(--wait-success);
      }
      code {
        flex: 1;
        min-width: 0;
        display: block;
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace;
        font-size: 1rem;
        line-height: 1.4;
        -webkit-user-select: all;
        user-select: all;
      }
      /* inline blocks, not flex items: a block would add a line break to the copied text */
      code span {
        display: inline-block;
        margin-inline-end: 0.45em;
        white-space: nowrap;
      }
      .copy {
        flex: none;
        display: flex;
        align-items: center;
        gap: 6px;
        height: 44px;
        padding: 0 14px 0 10px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--wait-action-text);
      }
      .copied .copy {
        color: var(--wait-success-text);
      }
      .copy ion-icon {
        font-size: 1.125rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        padding: 4px 8px 6px;
        border-top: 1px solid color-mix(in srgb, var(--wait-text) 10%, transparent);
      }
      .action {
        height: 44px;
        padding: 0 14px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--wait-action-text);
      }
      @keyframes idea-loading-enter {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
      }
      @keyframes idea-loading-leave {
        to {
          opacity: 0;
          transform: translateY(8px);
        }
      }
      @keyframes idea-loading-shake {
        0%,
        100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-6px);
        }
        50% {
          transform: translateX(5px);
        }
        75% {
          transform: translateX(-2px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .wait,
        .wait.leaving,
        .shake {
          animation: none;
        }
        .shield {
          transition: none;
        }
      }
    `
  ]
})
export class IDEALoadingComponent {
  private _translate = inject(IDEATranslationsService);

  /**
   * Whether the wait blocks the app: from the call to `show()`, even before it's on screen.
   */
  readonly blocking = signal(false);
  /**
   * Whether the wait is on screen, and whether it's leaving it.
   */
  readonly shown = signal(false);
  readonly leaving = signal(false);
  /**
   * The message of the wait, and whether it's taking longer than usual.
   */
  readonly message = signal('');
  readonly slow = signal(false);
  /**
   * The panel of a task, in place of the pill; `null` for a plain wait.
   */
  readonly panel = signal<IDEALoadingPanel | null>(null);
  readonly shaking = signal(false);
  readonly copiedCode = signal<string | null>(null);
  /**
   * What screen readers announce: regions kept on the page, since one added together with its text is often not read.
   */
  readonly announcements = { polite: signal(''), assertive: signal('') };

  /**
   * What to do when the user cancels the task, or closes its error.
   */
  onCancel: () => void = (): void => {};
  onClose: () => void = (): void => {};

  readonly icons = { error: alertCircleOutline, done: checkmark, failed: close, copy: copyOutline, copied: checkmark };
  readonly codeGroups = groupCode;

  private wait = viewChild<ElementRef<HTMLElement>>('wait');
  private closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private leaveTimeout: ReturnType<typeof setTimeout>;

  constructor() {
    // the notices stack above the wait while it's on screen
    effect(onCleanup => {
      const wait = this.wait()?.nativeElement;
      if (!wait) return;
      const root = document.documentElement;
      const observer = new ResizeObserver((): void =>
        root.style.setProperty(OFFSET_PROPERTY, `${wait.offsetHeight + 8}px`)
      );
      observer.observe(wait);
      onCleanup((): void => {
        observer.disconnect();
        root.style.removeProperty(OFFSET_PROPERTY);
      });
    });
    // the app is inert during the wait: the keyboard goes to what the user has to do, closing the error
    effect(() => this.closeButton()?.nativeElement.focus());
  }

  /**
   * The wait comes on screen (again, if it was leaving).
   */
  appear(): void {
    clearTimeout(this.leaveTimeout);
    this.leaving.set(false);
    this.shaking.set(false);
    this.shown.set(true);
  }
  /**
   * The wait leaves the screen.
   */
  disappear(): void {
    if (!this.shown() || this.leaving()) return;
    this.leaving.set(true);
    this.leaveTimeout = setTimeout((): void => {
      this.shown.set(false);
      this.leaving.set(false);
    }, LEAVE_DURATION_MS);
  }

  tapped(): void {
    if (!this.shown() || this.leaving()) return;
    // removed and added again, so that the animation starts over at every tap
    this.shaking.set(false);
    requestAnimationFrame((): void => this.shaking.set(true));
  }
  /**
   * The shake is over: a pill or panel created later (they're created at every appearance) doesn't start shaking.
   */
  stopShaking(event: AnimationEvent): void {
    if (event.animationName.includes('shake')) this.shaking.set(false);
  }

  async copy(code: string): Promise<void> {
    if (!(await copyText(code))) return;
    this.copiedCode.set(code);
    this.announce(this._translate._('IDEA_COMMON.MESSAGE.CODE_COPIED'));
  }

  /**
   * Have screen readers read a text; emptied first, so that the same text is read again.
   */
  announce(text: string, assertive = false): void {
    const region = assertive ? this.announcements.assertive : this.announcements.polite;
    region.set('');
    setTimeout((): void => region.set(text), 100);
  }
}

/**
 * What the panel of a task shows.
 */
export interface IDEALoadingPanel {
  title: string;
  steps?: { label: string; status: 'todo' | 'active' | 'done' | 'error'; duration?: string }[];
  progress?: { done: number; total: number };
  error?: { message: string; detail?: string; requestId?: string };
  cancelable: boolean;
}
