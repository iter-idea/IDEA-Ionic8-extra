import { Component, Input, inject } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Label, LabelVariable, Languages, StringVariable } from 'idea-toolbox';

import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

/**
 * A component for filling in an Label.
 */
@Component({
  selector: 'idea-labeler',
  templateUrl: 'labeler.component.html',
  styleUrls: ['labeler.component.scss']
})
export class IDEALabelerComponent {
  /**
   * The detail to highlight.
   */
  @Input() label: Label;
  /**
   * The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
   */
  @Input() languages: Languages;
  /**
   * The optional title for the component.
   */
  @Input() title: string;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  @Input() textarea: boolean;
  /**
   * Whether the label supports markdown.
   */
  @Input() markdown: boolean;
  /**
   * The variables the user can use for the label content.
   */
  @Input() variables: (StringVariable | LabelVariable)[];
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the label is validated on save.
   */
  @Input() obligatory: boolean;

  _label: Label;
  errors = new Set<string>();

  private _platform = inject(Platform);
  private _modal = inject(ModalController);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);

  ionViewDidEnter(): void {
    this.title = this.title || this._translate._('IDEA_COMMON.LABELER.MANAGE_LABEL');
    this.languages = this.languages || this._translate.languages();
    this._label = new Label(this.label, this.languages);
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  getFlagURL(lang: string): string {
    return `assets/flags/${lang}.png`;
  }

  getVariableDescription(v: StringVariable | LabelVariable): string {
    const isLabel = Boolean((v as any).label);
    if (isLabel) {
      v = v as LabelVariable;
      return v.label.translate(this.languages.default, this.languages);
    } else {
      v = v as StringVariable;
      return v.description;
    }
  }

  save(): Promise<void> {
    if (this.obligatory) {
      this.errors = new Set(this._label.validate(this.languages));
      if (this.errors.size) return this._message.error('IDEA_COMMON.LABELER.FILL_IN_DEFAULT_LANGUAGE');
    }
    this.label.load(this._label, this.languages);
    this._modal.dismiss(true);
  }

  close(): void {
    this._modal.dismiss();
  }

  isLargeScreen(): boolean {
    return this._platform.width() > 500;
  }
}
