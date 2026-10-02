import { ChangeDetectionStrategy, Component, WritableSignal, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import {
  alertCircleOutline,
  checkmark,
  checkmarkCircleOutline,
  close,
  copyOutline,
  informationCircleOutline,
  warningOutline
} from 'ionicons/icons';

import { IDEATranslatePipe } from '../translations/translate.pipe';

/**
 * How many notices can be on screen together: a new one closes the oldest.
 */
const MAX_NOTICES = 3;
/**
 * How long a notice takes to leave the screen (its animation).
 */
const LEAVE_DURATION_MS = 160;

/**
 * The notices of `IDEAMessageService`: created and filled by the service, not to use directly.
 */
@Component({
  selector: 'idea-notices',
  imports: [IonIcon, IDEATranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (notice of notices(); track notice.id) {
      <section
        class="notice"
        [attr.data-kind]="notice.kind"
        [attr.role]="notice.kind === 'error' || notice.kind === 'warning' ? 'alert' : 'status'"
        [class.compact]="!notice.detail && !notice.requestId"
        [class.withCode]="!!notice.requestId"
        [class.paused]="notice.paused()"
        [class.leaving]="notice.leaving()"
        (pointerenter)="hold(notice, 'pointer')"
        (pointerleave)="release(notice, 'pointer')"
        (focusin)="hold(notice, 'focus')"
        (focusout)="release(notice, 'focus')"
      >
        <div class="row">
          <ion-icon class="icon" aria-hidden="true" [icon]="icons[notice.kind]" />
          <div class="text">
            <p class="message">{{ notice.message }}</p>
            @if (notice.detail) {
              <p class="detail">{{ notice.detail }}</p>
            }
            @if (notice.requestId) {
              <p class="hint">{{ 'IDEA_COMMON.MESSAGE.CODE_HINT' | translate }}</p>
            }
          </div>
          <button
            type="button"
            class="close"
            [attr.aria-label]="'IDEA_COMMON.MESSAGE.CLOSE' | translate"
            (click)="dismiss(notice)"
          >
            <ion-icon aria-hidden="true" [icon]="icons.close" />
          </button>
        </div>
        @if (notice.requestId) {
          <div class="code" [class.copied]="notice.copied()">
            <code>
              @for (group of notice.codeGroups; track $index) {
                <span>{{ group }}</span>
              }
            </code>
            <button
              type="button"
              class="copy"
              [attr.aria-label]="
                (notice.copied() ? 'IDEA_COMMON.MESSAGE.CODE_COPIED' : 'IDEA_COMMON.MESSAGE.COPY_CODE') | translate
              "
              (click)="copy(notice)"
            >
              <ion-icon aria-hidden="true" [icon]="notice.copied() ? icons.copied : icons.copy" />
              <span>{{
                (notice.copied() ? 'IDEA_COMMON.MESSAGE.COPIED' : 'IDEA_COMMON.MESSAGE.COPY') | translate
              }}</span>
            </button>
          </div>
        }
        @if (!notice.copied()) {
          <div class="timer" [style.animation-duration.ms]="notice.duration"></div>
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        z-index: 60000;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 calc(12px + var(--ion-safe-area-right, 0px)) calc(12px + var(--ion-safe-area-bottom, 0px))
          calc(12px + var(--ion-safe-area-left, 0px));
        pointer-events: none;
      }
      @media (min-width: 768px) {
        :host {
          left: auto;
          right: calc(24px + var(--ion-safe-area-right, 0px));
          bottom: calc(24px + var(--ion-safe-area-bottom, 0px));
          width: var(--idea-notice-width, 400px);
          padding: 0;
        }
      }
      .notice {
        --notice-text: var(--ion-text-color, #000);
        --notice-muted: color-mix(in srgb, var(--notice-text) 64%, transparent);
        --notice-action: color-mix(in srgb, var(--ion-color-primary, #0054e9) 82%, var(--notice-text));
        --notice-success: color-mix(in srgb, var(--ion-color-success, #2dd55b) 82%, var(--notice-text));
        --notice-kind: var(--ion-color-danger, #c5000f);
        position: relative;
        box-sizing: border-box;
        width: 100%;
        overflow: hidden;
        pointer-events: auto;
        background: var(--idea-notice-background, var(--ion-card-background, var(--ion-background-color, #fff)));
        color: var(--notice-text);
        border: 1px solid color-mix(in srgb, var(--notice-text) 12%, transparent);
        border-radius: var(--idea-notice-border-radius, 12px);
        box-shadow:
          0 12px 32px rgba(16, 18, 27, 0.16),
          0 2px 6px rgba(16, 18, 27, 0.06);
        animation: idea-notice-enter 180ms ease-out;
      }
      .notice[data-kind='success'] {
        --notice-kind: var(--notice-success);
      }
      .notice[data-kind='info'] {
        --notice-kind: var(--notice-action);
      }
      .notice[data-kind='warning'] {
        --notice-kind: color-mix(in srgb, var(--ion-color-warning, #ffc409) 62%, var(--notice-text));
      }
      .notice.leaving {
        animation: idea-notice-leave ${LEAVE_DURATION_MS}ms ease-in forwards;
      }
      .row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 4px 18px 16px;
      }
      .compact .row {
        align-items: center;
        padding: 6px 4px 6px 16px;
      }
      .withCode .row {
        padding-bottom: 12px;
      }
      .icon {
        flex: none;
        font-size: 22px;
        margin-top: 1px;
        color: var(--notice-kind);
      }
      .compact .icon {
        margin-top: 0;
      }
      .text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      p {
        margin: 0;
      }
      .message {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.35;
      }
      .compact .message {
        font-weight: 500;
      }
      .detail,
      .hint {
        font-size: 13.5px;
        line-height: 1.45;
        color: var(--notice-muted);
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
        outline: 2px solid var(--notice-action);
        outline-offset: -2px;
      }
      .close {
        flex: none;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        margin-top: -11px;
        border-radius: 50%;
        color: var(--notice-muted);
      }
      .compact .close {
        margin-top: 0;
      }
      .close ion-icon {
        font-size: 20px;
      }
      .code {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        margin: 0 16px 18px;
        padding: 6px 0 6px 14px;
        box-sizing: border-box;
        border: 1px solid transparent;
        border-radius: calc(var(--idea-notice-border-radius, 12px) - 3px);
        background: color-mix(in srgb, var(--notice-text) 5%, transparent);
      }
      .code.copied {
        border-color: var(--notice-success);
      }
      /* the whole id, in groups for whoever reads it from a screenshot: selecting or copying it gives it as it is */
      code {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        column-gap: 0.45em;
        row-gap: 2px;
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace;
        font-size: 16px;
        line-height: 1.4;
        -webkit-user-select: all;
        user-select: all;
      }
      code span {
        white-space: nowrap;
      }
      .copy {
        flex: none;
        display: flex;
        align-items: center;
        gap: 6px;
        height: 44px;
        padding: 0 14px 0 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--notice-action);
      }
      .copied .copy {
        color: var(--notice-success);
      }
      .copy ion-icon {
        font-size: 18px;
      }
      /* the time left before the notice closes by itself */
      .timer {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 3px;
        background: var(--notice-kind);
        opacity: 0.6;
        transform-origin: left;
        animation: idea-notice-timer linear forwards;
      }
      .paused .timer {
        animation-play-state: paused;
      }
      @keyframes idea-notice-enter {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
      }
      @keyframes idea-notice-leave {
        to {
          opacity: 0;
          transform: translateY(8px);
        }
      }
      @keyframes idea-notice-timer {
        to {
          transform: scaleX(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .notice,
        .notice.leaving {
          animation: none;
        }
        .timer {
          display: none;
        }
      }
    `
  ]
})
export class IDEANoticesComponent {
  /**
   * The notices on screen, the newest last.
   */
  readonly notices = signal<Notice[]>([]);

  readonly icons = {
    success: checkmarkCircleOutline,
    info: informationCircleOutline,
    warning: warningOutline,
    error: alertCircleOutline,
    close,
    copy: copyOutline,
    copied: checkmark
  };

  private lastId = 0;

  /**
   * Show a new notice. With a `requestId`, the server's message is the generic one of an error the back-end didn't
   * handle: the notice shows the code instead, for longer, and stays once the user has copied it.
   */
  add(options: { kind: IDEANoticeKind; message: string; serverMessage?: string; requestId?: string }): void {
    const { kind, message, serverMessage, requestId } = options;
    const notice: Notice = {
      id: ++this.lastId,
      kind,
      message,
      detail: requestId ? undefined : serverMessage,
      requestId,
      codeGroups: requestId ? groupCode(requestId) : undefined,
      duration: requestId ? 10000 : kind === 'error' || kind === 'warning' ? 5000 : 3000,
      remaining: 0,
      holds: new Set(),
      copied: signal(false),
      paused: signal(false),
      leaving: signal(false)
    };
    notice.remaining = notice.duration;

    // the same message again (e.g. from a loop) doesn't stack: it takes the place of the one on screen, with its time
    // anew (unless the user is on it)
    if (!requestId) {
      const same = this.notices().find(
        x => !x.leaving() && !x.requestId && x.kind === kind && x.message === message && x.detail === serverMessage
      );
      if (same?.holds.size) return;
      if (same) {
        clearTimeout(same.timeout);
        this.notices.update(notices => notices.filter(x => x !== same));
      }
    }

    const onScreen = this.notices().filter(x => !x.leaving());
    if (onScreen.length >= MAX_NOTICES) this.dismiss(onScreen[0]);

    this.notices.update(notices => [...notices, notice]);
    this.schedule(notice);
  }

  dismiss(notice: Notice): void {
    if (notice.leaving()) return;
    clearTimeout(notice.timeout);
    notice.leaving.set(true);
    setTimeout((): void => this.notices.update(notices => notices.filter(x => x !== notice)), LEAVE_DURATION_MS);
  }

  /**
   * While the pointer or the focus is on a notice, its time stops.
   */
  hold(notice: Notice, reason: 'pointer' | 'focus'): void {
    notice.holds.add(reason);
    if (!notice.timeout) return;
    clearTimeout(notice.timeout);
    notice.timeout = null;
    notice.remaining -= Date.now() - notice.startedAt;
    notice.paused.set(true);
  }
  release(notice: Notice, reason: 'pointer' | 'focus'): void {
    notice.holds.delete(reason);
    if (notice.holds.size || notice.timeout || notice.copied() || notice.leaving()) return;
    notice.paused.set(false);
    this.schedule(notice);
  }
  private schedule(notice: Notice): void {
    notice.startedAt = Date.now();
    notice.timeout = setTimeout((): void => this.dismiss(notice), notice.remaining);
  }

  /**
   * Copy the code of the notice; once copied, the notice stays until the user closes it.
   */
  async copy(notice: Notice): Promise<void> {
    let copied: boolean;
    try {
      await navigator.clipboard.writeText(notice.requestId);
      copied = true;
    } catch (error) {
      // e.g. a non-secure context, or a webview inside another app
      copied = copyBySelection(notice.requestId);
    }
    if (!copied) return;
    clearTimeout(notice.timeout);
    notice.timeout = null;
    notice.copied.set(true);
  }
}

/**
 * The kind of a notice: it sets its icon and colour.
 */
export type IDEANoticeKind = 'success' | 'info' | 'warning' | 'error';

interface Notice {
  id: number;
  kind: IDEANoticeKind;
  message: string;
  detail?: string;
  requestId?: string;
  codeGroups?: string[];
  /**
   * How long the notice stays on screen by itself, and how much of it is left.
   */
  duration: number;
  remaining: number;
  startedAt?: number;
  timeout?: ReturnType<typeof setTimeout>;
  /**
   * What is keeping the notice on screen (the pointer, the focus).
   */
  holds: Set<'pointer' | 'focus'>;
  copied: WritableSignal<boolean>;
  paused: WritableSignal<boolean>;
  leaving: WritableSignal<boolean>;
}

/**
 * Split a request id into groups that are easy to read back: the parts of a UUID (REST APIs), keeping their hyphens,
 * or blocks of 4 characters (HTTP APIs).
 */
const groupCode = (code: string): string[] => {
  if (!code.includes('-')) return code.match(/.{1,4}/g);
  const parts = code.split('-');
  return parts.map((part, index) => (index < parts.length - 1 ? part.concat('-') : part));
};

/**
 * Copy by selecting the text in a field kept out of sight, and asking the document to copy the selection.
 */
const copyBySelection = (text: string): boolean => {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  try {
    field.select();
    field.setSelectionRange(0, field.value.length);
    return document.execCommand('copy');
  } catch (error) {
    return false;
  } finally {
    field.remove();
  }
};
