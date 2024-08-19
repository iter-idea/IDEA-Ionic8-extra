import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmailData, StringVariable } from 'idea-toolbox';

import { IDEAEmailDataConfigurationComponent } from './emailDataConfiguration.component';

/**
 * Configurator of EmailData.
 */
@Component({
  selector: 'idea-email-data',
  templateUrl: 'emailData.component.html',
  styleUrls: ['emailData.component.scss']
})
export class IDEAEmailDataComponent implements OnInit {
  private _modal = inject(ModalController);

  /**
   * The email data to manage.
   */
  @Input() emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
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
   * On change event.
   */
  @Output() change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();
  /**
   * The list of variables codes to use for substitutions.
   */
  variablesPlain: string[];

  ngOnInit(): void {
    // create a plain list of variable codes
    this.variablesPlain = (this.variables || []).map(x => x.code);
  }

  async openEmailDataConfiguration(): Promise<void> {
    const modal = await this._modal.create({
      component: IDEAEmailDataConfigurationComponent,
      componentProps: {
        emailData: this.emailData,
        variables: this.variables,
        title: this.label,
        disabled: this.disabled,
        lines: this.lines
      }
    });
    modal.onDidDismiss().then(res => (res && res.data ? this.change.emit() : null));
    modal.present();
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
