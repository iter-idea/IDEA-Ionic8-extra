import { Component, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Label, LabelVariable, StringVariable } from 'idea-toolbox';

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
  @Input() public label: Label;
  /**
   * The optional title for the component.
   */
  @Input() public title: string;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  @Input() public textarea: boolean;
  /**
   * Whether the label supports markdown.
   */
  @Input() public markdown: boolean;
  /**
   * The variables the user can use for the label content.
   */
  @Input() public variables: (StringVariable | LabelVariable)[];
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the label is validated on save.
   */
  @Input() public obligatory: boolean;
  /**
   * Working helper to manage the label, to avoid changing the original label until it's time.
   */
  public _label: Label;
  /**
   * The list of variables codes to use for substitutions.
   */
  public _variables: string[];
  /**
   * The errors to show in the UI.
   */
  public errors: Set<string>;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public t: IDEATranslationsService
  ) {
    this.errors = new Set<string>();
  }
  public ionViewDidEnter() {
    this.title = this.title || this.t._('IDEA_COMMON.LABELER.MANAGE_LABEL');
    // work on a copy
    this._label = new Label(this.label, this.t.languages());
    // create a plain list of variable codes
    this._variables = (this.variables || []).map(x => x.code);
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Get the URL to the flag of the current language.
   */
  public getFlagURL(lang: string): string {
    return `assets/flags/${lang}.png`;
  }

  /**
   * Get the description of the variable, based on its type.
   */
  public getVariableDescription(v: StringVariable | LabelVariable): string {
    const isLabel = Boolean((v as any).label);
    if (isLabel) {
      v = v as LabelVariable;
      return v.label.translate(this.t.getCurrentLang(), this.t.languages());
    } else {
      v = v as StringVariable;
      return v.description;
    }
  }

  /**
   * Save the changes and close.
   */
  public save() {
    // check for errors
    if (this.obligatory) {
      this.errors = new Set(this._label.validate(this.t.languages()));
      if (this.errors.size) return this.message.error('IDEA_COMMON.LABELER.FILL_IN_DEFAULT_LANGUAGE');
    }
    // save changes and close
    this.label.load(this._label, this.t.languages());
    this.close();
  }

  /**
   * Close without saving changes.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
