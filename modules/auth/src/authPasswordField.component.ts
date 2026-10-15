import { ChangeDetectionStrategy, Component, input, model, output, signal, viewChild } from '@angular/core';
import { IonIcon, IonInput } from '@ionic/angular/standalone';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { IDEATranslatePipe } from '@idea-ionic/common';

/**
 * A password field of the pages of `IDEAAuthRoutes`, with the button to show or hide what's typed.
 * Its label is the page's own, tied through `labelledBy`.
 */
@Component({
  selector: 'idea-auth-password-field',
  imports: [IDEATranslatePipe, IonInput, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-input
      class="idea-auth-input idea-auth-password"
      spellcheck="false"
      autocapitalize="off"
      [type]="visible() ? 'text' : 'password'"
      [autocomplete]="autocomplete()"
      [clearOnEdit]="false"
      [value]="value()"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="invalid() || null"
      (ionInput)="value.set($event.detail.value)"
      (keyup.enter)="enter.emit()"
    >
      <button
        slot="end"
        type="button"
        class="idea-auth-password-toggle"
        [attr.aria-label]="(visible() ? 'IDEA_AUTH.HIDE_PASSWORD' : 'IDEA_AUTH.SHOW_PASSWORD') | translate"
        [attr.aria-pressed]="visible()"
        (click)="visible.set(!visible())"
      >
        <ion-icon aria-hidden="true" [icon]="visible() ? icons.hide : icons.show" />
      </button>
    </ion-input>
  `
})
export class IDEAAuthPasswordFieldComponent {
  /**
   * The id of the element labelling the field.
   */
  readonly labelledBy = input.required<string>();
  /**
   * The ids of the elements describing the field (e.g. its requirements), if any.
   */
  readonly describedBy = input<string>();
  /**
   * Whether the browser should suggest the saved password, or a new one.
   */
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  /**
   * Whether to mark the field as invalid.
   */
  readonly invalid = input(false);
  /**
   * The password typed.
   */
  readonly value = model<string>('');
  /**
   * Trigger when the user presses Enter in the field.
   */
  readonly enter = output<void>();

  visible = signal(false);
  icons = { show: eyeOutline, hide: eyeOffOutline };

  private input = viewChild(IonInput);

  /**
   * Move the focus to the field, once it's ready (e.g. just shown).
   */
  async focus(): Promise<void> {
    const input = this.input();
    if (!input) return;
    await input.getInputElement();
    await input.setFocus();
  }
}
