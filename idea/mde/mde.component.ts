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
   * If set to true, autofocuses the editor. Defaults to false.
   */
  @Input() public autofocus: boolean;
  /**
   * An array of icon names to hide from the toolbar.
   * Can be used to hide specific icons shown by default without completely customizing the toolbar.
   */
  @Input() public hideIcons: Array<string>;
  /**
   * If set, will customize the initial value of the editor.
   */
  @Input() public initialValue: string;
  /**
   * Custom placeholder that should be displayed.
   */
  @Input() public placeholder: string;
  /**
   * An array of icon names to show in the toolbar.
   * Can be used to show specific icons hidden by default without completely customizing the toolbar.
   */
  @Input() public showIcons: Array<string>;
  /**
   * If set to false, disable the spell checker. Defaults to true.
   */
  @Input() public spellChecker: boolean;
  /**
   * If set to false, hide the status bar. Defaults to the array of built-in status bar items.
   * Optionally, you can set an array of status bar items to include, and in what order.
   * You can even define your own custom status bar items.
   */
  @Input() public status: Array<string> | boolean;
  /**
   * If set to false, disable toolbar button tips. Defaults to true.
   */
  @Input() public toolbarTips: boolean;

  public mde: any;

  constructor(
    public modalCtrl: ModalController,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {
    this.mde = null;
  }
  public ngOnInit() {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
  }
  public ionViewDidEnter() {
    this.mde = new SimpleMDE({
      autofocus: this.autofocus, element: document.getElementById(this.id), hideIcons: this.hideIcons,
      initialValue: this.initialValue, placeholder: this.placeholder, showIcons: this.showIcons,
      spellChecker: this.spellChecker, status: this.status, toolbarTips: this.toolbarTips
    });
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
    this.modalCtrl.dismiss(this.mde.value());
  }
}
