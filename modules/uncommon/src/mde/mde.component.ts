import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'idea-mde',
  templateUrl: 'mde.component.html',
  styleUrls: ['mde.component.scss']
})
export class IDEAMDEComponent implements OnInit {
  private _modal = inject(ModalController);

  /**
   * Id to identify this specific Markdown Editor (default: 'mde').
   */
  @Input() id: string;
  /**
   * The title of the modal.
   */
  @Input() title: string;
  /**
   * The header text content.
   */
  @Input() header: string;
  /**
   * The sub-header description.
   */
  @Input() description: string;
  /**
   * A series of text variables to substitute with values.
   */
  @Input() variables: string[];
  /**
   * If set, will customize the initial value of the editor.
   */
  @Input() initialValue: string;
  /**
   * Custom placeholder that should be displayed.
   */
  @Input() placeholder: string;

  value: string;

  ngOnInit(): void {
    this.id = this.id || 'mde';
    this.variables = this.variables || new Array<string>();
    this.value = this.initialValue;
  }

  close(): void {
    this._modal.dismiss();
  }
  confirm(): void {
    this._modal.dismiss(this.value);
  }
}
