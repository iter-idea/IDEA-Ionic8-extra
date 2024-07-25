import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmailData, mdToHtml, StringVariable } from 'idea-toolbox';

@Component({
  selector: 'idea-email-data-configuration',
  templateUrl: 'emailDataConfiguration.component.html',
  styleUrls: ['emailDataConfiguration.component.scss']
})
export class IDEAEmailDataConfigurationComponent implements OnInit {
  /**
   * The emailData to configure.
   */
  @Input() emailData: EmailData;
  /**
   * The variables the user can use for subject and content.
   */
  @Input() variables: StringVariable[];
  /**
   * The title for the component.
   */
  @Input() title: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  emailDataWC: EmailData;
  variablesPlain: string[];

  private _modal = inject(ModalController);

  ngOnInit(): void {
    this.emailDataWC = new EmailData(this.emailData);
    this.variablesPlain = (this.variables || []).map(x => x.code);
  }

  mdToHtml(content: string): string {
    return mdToHtml(content);
  }

  save(): void {
    this.emailData.load(this.emailDataWC);
    this.close();
  }

  close(): void {
    this._modal.dismiss();
  }
}
