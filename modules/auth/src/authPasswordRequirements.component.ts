import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { IDEAEnvironment, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

/**
 * The requirements of the project's password policy, each one ticked as soon as the password typed meets it.
 */
@Component({
  selector: 'idea-auth-password-requirements',
  imports: [IDEATranslatePipe, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="idea-auth-requirements" [id]="listId()">
      @for (requirement of requirements(); track requirement.code) {
        <li class="idea-auth-requirement" [attr.data-met]="requirement.met">
          <ion-icon aria-hidden="true" [icon]="requirement.met ? icons.met : icons.notMet" />
          <span>{{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.' + requirement.code | translate: { n: minLength } }}</span>
          <span class="idea-auth-visually-hidden">
            {{ (requirement.met ? 'IDEA_AUTH.REQUIREMENT_MET' : 'IDEA_AUTH.REQUIREMENT_NOT_MET') | translate }}
          </span>
        </li>
      }
    </ul>
  `
})
export class IDEAAuthPasswordRequirementsComponent {
  private _env = inject(IDEAEnvironment);
  private _auth = inject(IDEAAuthService);

  /**
   * The password typed.
   */
  readonly password = input<string>('');
  /**
   * The id of the list, to describe the password field.
   */
  readonly listId = input<string>();

  private policy = this._env.idea.auth.passwordPolicy;
  minLength: number = this.policy.minLength;
  icons = { met: checkmarkCircle, notMet: ellipseOutline };

  readonly requirements = computed((): { code: string; met: boolean }[] => {
    const unmet = this._auth.validatePasswordAgainstPolicy(this.password() ?? '');
    const codes = ['MIN_LENGTH'];
    if (this.policy.requireLowercase) codes.push('REQUIRE_LOWERCASE');
    if (this.policy.requireUppercase) codes.push('REQUIRE_UPPERCASE');
    if (this.policy.requireDigits) codes.push('REQUIRE_DIGITS');
    if (this.policy.requireSymbols) codes.push('REQUIRE_SYMBOLS');
    return codes.map(code => ({ code, met: !unmet.includes(code) }));
  });
}
