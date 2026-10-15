import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { alertCircleOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthNotice } from './authFlow.service';

/**
 * A notice in a page of `IDEAAuthRoutes`, next to what it refers to. An error is announced at once (`alert`); the
 * others through a live region always in the page, since screen readers announce what changes in one, not a new one.
 */
@Component({
  selector: 'idea-auth-notice',
  imports: [IDEATranslatePipe, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notice(); as notice) {
      <div
        class="idea-auth-notice"
        [attr.data-kind]="notice.kind"
        [attr.role]="notice.kind === 'error' ? 'alert' : null"
      >
        <ion-icon aria-hidden="true" [icon]="icons[notice.kind]" />
        <div>
          <p>{{ notice.message | translate }}</p>
          @if (notice.detail) {
            <p class="idea-auth-notice-detail">{{ notice.detail }}</p>
          }
        </div>
      </div>
    }
    <div class="idea-auth-visually-hidden" role="status">
      @if (announced(); as announced) {
        {{ announced.message | translate }} {{ announced.detail }}
      }
    </div>
  `
})
export class IDEAAuthNoticeComponent {
  /**
   * The notice to show, if any.
   */
  readonly notice = input<IDEAAuthNotice>();

  icons = { error: alertCircleOutline, info: informationCircleOutline, success: checkmarkCircleOutline };
  // the notice that isn't an error, written in the live region once the region is in the page
  announced = signal<IDEAAuthNotice>(null);

  constructor() {
    effect(onCleanup => {
      const notice = this.notice();
      const timer = setTimeout(() => this.announced.set(notice && notice.kind !== 'error' ? notice : null), 150);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
