import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Label } from 'idea-toolbox';

import { IDEAListELementsComponent } from './listElements.component';
import { IDEATranslationsService } from '../translations/translations.service';

/**
 * Show and manage a list of elements.
 */
@Component({
  selector: 'idea-list',
  templateUrl: 'list.component.html',
  styleUrls: ['list.component.scss']
})
export class IDEAListComponent {
  /**
   * The list to manage.
   */
  @Input() public data: Array<Label | string>;
  /**
   * Whether the elements are labels or simple strings.
   */
  @Input() public labelElements: boolean;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() public noElementsFoundText: string;
  /**
   * If true, show the string instead of the preview text.
   */
  @Input() public noPreviewText: string;
  /**
   * A placeholder for the field.
   */
  @Input() public placeholder: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() public obligatory: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() public numMaxElementsInPreview: number;
  /**
   * On change event.
   */
  @Output() public change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {
    this.data = new Array<Label | string>();
    this.numMaxElementsInPreview = 4;
  }

  /**
   * Open the checks modal and later fetch the selection.
   */
  public openList() {
    if (this.disabled) return;
    // open the modal to let the user to manage the list
    this.modalCtrl
      .create({
        component: IDEAListELementsComponent,
        componentProps: {
          data: this.data,
          labelElements: this.labelElements,
          searchPlaceholder: this.searchPlaceholder,
          noElementsFoundText: this.noElementsFoundText
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(res => (res && res.data ? this.change.emit() : null));
        modal.present();
      });
  }

  /**
   * Calculate the preview.
   */
  public getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.data.length <= this.numMaxElementsInPreview)
      return this.data
        .slice(0, this.numMaxElementsInPreview)
        .map(x => this.getElementName(x))
        .join(', ');
    else return this.t._('IDEA_COMMON.LIST.NUM_ELEMENTS_', { num: this.data.length });
  }
  /**
   * Get the value to show based on the type of the element.
   */
  public getElementName(x: Label | string) {
    return this.labelElements ? (x as Label).translate(this.t.getCurrentLang(), this.t.languages()) : x;
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
