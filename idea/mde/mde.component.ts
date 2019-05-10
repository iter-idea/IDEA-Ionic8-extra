import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import SimpleMDE = require('simplemde');

/**
 * Requires to include the following CSS style in index.html:
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css" />
 */

@Component({
  selector: 'idea-mde',
  templateUrl: 'mde.component.html',
  styleUrls: ['mde.component.scss']
})
export class IDEAMDEComponent {
  /**
   * Id to identify this specific Markdown Editor (default: 'mde').
   */
  @Input() protected id: string;
  /**
   * The title of the modal.
   */
  @Input() protected title: string;
  /**
   * The header text content.
   */
  @Input() protected header: string;
  /**
   * The sub-header description.
   */
  @Input() protected description: string;
  /**
   * A series of text variables to substitute with values.
   */
  @Input() protected variables: Array<string>;
  /**
   * If set to true, autofocuses the editor. Defaults to false.
   */
  @Input() protected autofocus: boolean;
  /**
   * An array of icon names to hide from the toolbar.
   * Can be used to hide specific icons shown by default without completely customizing the toolbar.
   */
  @Input() protected hideIcons: Array<string>;
  /**
   * If set, will customize the initial value of the editor.
   */
  @Input() protected initialValue: string;
  /**
   * Custom placeholder that should be displayed.
   */
  @Input() protected placeholder: string;
  /**
   * An array of icon names to show in the toolbar.
   * Can be used to show specific icons hidden by default without completely customizing the toolbar.
   */
  @Input() protected showIcons: Array<string>;
  /**
   * If set to false, disable the spell checker. Defaults to true.
   */
  @Input() protected spellChecker: boolean;
  /**
   * If set to false, hide the status bar. Defaults to the array of built-in status bar items.
   * Optionally, you can set an array of status bar items to include, and in what order.
   * You can even define your own custom status bar items.
   */
  @Input() protected status: Array<string> | boolean;
  /**
   * If set to false, disable toolbar button tips. Defaults to true.
   */
  @Input() protected toolbarTips: boolean;

  protected mde: any;

  constructor(
    protected modalCtrl: ModalController,
    protected API: IDEAAWSAPIService,
    protected t: TranslateService
  ) {
    this.mde = null;
  }
  protected ngOnInit() {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
  }
  protected ionViewDidEnter() {
    this.mde = new SimpleMDE({
      autofocus: this.autofocus, element: document.getElementById(this.id), hideIcons: this.hideIcons,
      initialValue: this.initialValue, placeholder: this.placeholder, showIcons: this.showIcons,
      spellChecker: this.spellChecker, status: this.status, toolbarTips: this.toolbarTips
    });
  }

  /**
   * Close without saving.
   */
  protected close() {
    this.modalCtrl.dismiss();
  }
  /**
   * Save and close.
   */
  protected confirm() {
    this.modalCtrl.dismiss(this.mde.value());
  }
}
