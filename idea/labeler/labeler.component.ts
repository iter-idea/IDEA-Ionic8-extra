import { Component, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';

/**
 * A component for filling in an IdeaX.Label.
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
  @Input() public label: IdeaX.Label;
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
   * Working helper to manage the label, to avoid changing the original label until it's time.
   */
  public _label: IdeaX.Label;
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
    this.title = this.title || this.t._('IDEA.LABELER.MANAGE_LABEL');
    // work on a copy
    this._label = new IdeaX.Label(this.label, this.t.languages());
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
   * Save the changes and close.
   */
  public save() {
    // check for errors
    this.errors = new Set(this._label.validate(this.t.languages()));
    if (this.errors.size) return this.message.error('IDEA.LABELER.FILL_IN_DEFAULT_LANGUAGE');
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
