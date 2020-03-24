import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-mde',
  templateUrl: 'mde.component.html',
  styleUrls: ['mde.component.scss']
})
export class IDEAMDEComponent {
  /**
   * Id to identify this specific Markdown Editor (default: 'mde').
   */
  @Input() public id: string;
  /**
   * The title of the modal.
   */
  @Input() public title: string;
  /**
   * The header text content.
   */
  @Input() public header: string;
  /**
   * The sub-header description.
   */
  @Input() public description: string;
  /**
   * A series of text variables to substitute with values.
   */
  @Input() public variables: Array<string>;
  /**
   * If set, will customize the initial value of the editor.
   */
  @Input() public initialValue: string;
  /**
   * Custom placeholder that should be displayed.
   */
  @Input() public placeholder: string;

  /**
   * The value of the editor (textarea).
   */
  public value: string;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}

  public ngOnInit() {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
    this.value = this.initialValue;
  }

  /**
   * Close without saving.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
  /**
   * Save and close.
   */
  public confirm() {
    this.modalCtrl.dismiss(this.value);
  }
}
