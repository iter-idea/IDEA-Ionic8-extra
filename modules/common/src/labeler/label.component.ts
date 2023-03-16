import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Label, Languages, mdToHtml, StringVariable } from 'idea-toolbox';

import { IDEALabelerComponent } from './labeler.component';

import { IDEATranslationsService } from '../translations/translations.service';

/**
 * Manage the content of a Label.
 */
@Component({
  selector: 'idea-label',
  templateUrl: 'label.component.html',
  styleUrls: ['label.component.scss']
})
export class IDEALabelComponent implements OnInit {
  /**
   * The label to manage.
   * Note: the name is set to not overlap with IDEA's components typical use of the attribute `label`.
   */
  @Input() content: Label;
  /**
   * The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
   */
  @Input() languages: Languages;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  @Input() textarea: boolean;
  /**
   * Whether the label supports markdown.
   */
  @Input() markdown: boolean;
  /**
   * The variables the user can use in the label.
   */
  @Input() variables: StringVariable[];
  /**
   * The title (label) for the field.
   */
  @Input() label: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the label is validated on save.
   */
  @Input() obligatory: boolean;

  @Output() change = new EventEmitter<void>();
  @Output() iconSelect = new EventEmitter<void>();

  variableCodes: string[];
  htmlContent: string;

  constructor(private modalCtrl: ModalController, private t: IDEATranslationsService) {}
  ngOnInit(): void {
    this.languages = this.languages ?? this.t.languages();
    this.variableCodes = (this.variables ?? []).map(x => x.code);
    this.calcHTMLContent();
  }

  async edit(): Promise<void> {
    const componentProps = {
      label: this.content,
      languages: this.languages,
      textarea: this.textarea,
      markdown: this.markdown,
      variables: this.variables,
      title: this.label,
      obligatory: this.obligatory,
      disabled: this.disabled,
      lines: this.lines
    };
    const modal = await this.modalCtrl.create({ component: IDEALabelerComponent, componentProps });
    modal.onDidDismiss().then(({ data }): void => {
      if (!data) return;
      this.calcHTMLContent();
      this.change.emit();
    });
    modal.present();
  }

  private calcHTMLContent(): void {
    const str = this.content.translate(this.languages.default, this.languages);
    this.htmlContent = str && this.markdown ? mdToHtml(str) : str;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
