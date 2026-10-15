import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { alertCircleOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthNotice } from './authFlow.service';

/**
 * A notice in a page of `IDEAAuthRoutes`, next to what it refers to: an error is announced at once.
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
        [attr.role]="notice.kind === 'error' ? 'alert' : 'status'"
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
  `
})
export class IDEAAuthNoticeComponent {
  /**
   * The notice to show, if any.
   */
  readonly notice = input<IDEAAuthNotice>();

  icons = { error: alertCircleOutline, info: informationCircleOutline, success: checkmarkCircleOutline };
}
