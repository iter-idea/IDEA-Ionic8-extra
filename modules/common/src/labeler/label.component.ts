import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  output,
  input
} from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { Label, Languages, mdToHtml, StringVariable } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';

import { IDEALabelerComponent } from './labeler.component';

/**
 * Manage the content of a Label.
 */
@Component({
  selector: 'idea-label',

  imports: [IDEAHiglightedVariablesPipe, IonItem, IonLabel, IonButton, IonIcon, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-item
      class="labelItem"
      button
      [disabled]="isOpening"
      [color]="color()"
      [lines]="lines()"
      [title]="placeholder() || ''"
      [class.withLabel]="label"
      (click)="edit()"
    >
      @if (icon) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor()"
          [class.marginTop]="label"
          (click)="doIconSelect($event)"
        >
          <ion-icon [icon]="icon" slot="icon-only" />
        </ion-button>
      }
      @if (label) {
        <ion-label position="stacked">
          {{ label }}
          @if (!disabled() && obligatory()) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <div class="description">
        @if (!htmlContent) {
          <div class="placeholder">{{ placeholder() }}</div>
        }
        @if (htmlContent) {
          <div class="innerContent" [class.md]="markdown()" [innerHTML]="htmlContent | highlight: variableCodes"></div>
        }
      </div>
      <ion-icon slot="end" icon="chevron-forward" class="selectIcon" />
    </ion-item>
  `,
  styles: [
    `
      .labelItem {
        min-height: 48px;
        height: auto;
        .description {
          min-height: 20px;
          height: auto;
          line-height: 20px;
          width: 100%;
        }
        .placeholder {
          color: var(--ion-color-medium);
          padding-bottom: 6px;
        }
        .selectIcon {
          color: var(--ion-text-color-step-500);
          font-size: 1.3em;
        }
      }
      .labelItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 4px;
        }
        ion-button[slot='start'] {
          margin-top: 16px;
        }
      }
    `
  ]
})
export class IDEALabelComponent implements OnInit {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);
  private _cd = inject(ChangeDetectorRef);

  /**
   * The label to manage.
   * Note: the name is set to not overlap with IDEA's components typical use of the attribute `label`.
   */
  readonly content = input<Label>();
  /**
   * The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() languages: Languages;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  readonly textarea = input<boolean>();
  /**
   * Whether the label supports markdown.
   */
  readonly markdown = input<boolean>();
  /**
   * The variables the user can use in the label.
   */
  readonly variables = input<StringVariable[]>();
  /**
   * The title (label) for the field.
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
  @Input() label: string;
  /**
   * The icon for the field.
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  readonly iconColor = input<string>();
  /**
   * A placeholder for the field.
   */
  readonly placeholder = input<string>();
  /**
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * If true, the component is disabled.
   */
  readonly disabled = input<boolean>();
  /**
   * If true, the label is validated on save.
   */
  readonly obligatory = input<boolean>();

  readonly change = output<void>();
  readonly iconSelect = output<void>();

  variableCodes: string[];
  htmlContent: string;

  isOpening = false;

  ngOnInit(): void {
    this.languages = this.languages || this._translate.languages();
    this.variableCodes = (this.variables() || []).map(x => x.code);
    this.calcHTMLContent();
  }

  async edit(): Promise<void> {
    if (this.isOpening) return;
    this.isOpening = true;
    const componentProps = {
      label: this.content(),
      languages: this.languages,
      textarea: this.textarea(),
      markdown: this.markdown(),
      variables: this.variables(),
      title: this.label,
      obligatory: this.obligatory(),
      disabled: this.disabled(),
      lines: this.lines()
    };
    const modal = await this._modal.create({ component: IDEALabelerComponent, componentProps });
    modal.onDidDismiss().then(({ data }): void => {
      if (!data) return;
      this.calcHTMLContent();
      this.change.emit();
      this._cd.markForCheck(); // zoneless: re-check so the updated content is rendered
    });
    modal.present();
    this.isOpening = false;
  }

  private calcHTMLContent(): void {
    const str = this.content().translate(this.languages.default, this.languages);
    this.htmlContent = str && this.markdown() ? mdToHtml(str) : str;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
