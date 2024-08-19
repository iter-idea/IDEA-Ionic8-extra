import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Label } from 'idea-toolbox';

import { IDEAListELementsComponent } from './listElements.component';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-list',
  templateUrl: 'list.component.html',
  styleUrls: ['list.component.scss']
})
export class IDEAListComponent {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The list to manage.
   */
  @Input() data: (Label | string)[] = [];
  /**
   * Whether the elements are labels or simple strings.
   */
  @Input() labelElements: boolean;
  /**
   * The label for the field.
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
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() noElementsFoundText: string;
  /**
   * If true, show the string instead of the preview text.
   */
  @Input() noPreviewText: string;
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
   * If true, the obligatory dot is shown.
   */
  @Input() obligatory: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() numMaxElementsInPreview = 4;
  /**
   * On change event.
   */
  @Output() change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();

  async openList(): Promise<void> {
    if (this.disabled) return;
    const modal = await this._modal.create({
      component: IDEAListELementsComponent,
      componentProps: {
        data: this.data,
        labelElements: this.labelElements,
        searchPlaceholder: this.searchPlaceholder,
        noElementsFoundText: this.noElementsFoundText
      }
    });
    modal.onDidDismiss().then(({ data }) => (data ? this.change.emit() : null));
    modal.present();
  }

  getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.data.length <= this.numMaxElementsInPreview)
      return this.data
        .slice(0, this.numMaxElementsInPreview)
        .map(x => this.getElementName(x))
        .join(', ');
    else return this._translate._('IDEA_COMMON.LIST.NUM_ELEMENTS_', { num: this.data.length });
  }
  getElementName(x: Label | string): any {
    return this.labelElements
      ? (x as Label).translate(this._translate.getCurrentLang(), this._translate.languages())
      : x;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
