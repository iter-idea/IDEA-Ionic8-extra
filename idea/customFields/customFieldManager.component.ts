import { Component, Input } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');
import { IDEAListComponent } from '../list/list.component';

@Component({
  selector: 'idea-custom-field-manager',
  templateUrl: 'customFieldManager.component.html',
  styleUrls: ['customFieldManager.component.scss']
})
export class IDEACustomFieldManagerComponent {
  /**
   * The CustomField to manage (the component will work on a copy and return the updated object).
   */
  @Input() public field: IdeaX.CustomFieldMeta;
  /**
   * Languages preferences (default, available) for the context.
   */
  @Input() public languages: IdeaX.Languages;
  /**
   * Current language to display for Label fields.
   */
  @Input() public currentLanguage: string;

  /**
   * The working copy of the field; if returned, it means that the original field has been modified.
   */
  public theField: IdeaX.CustomFieldMeta;

  public errors: Array<string>;
  public FIELD_TYPES: Array<string> = Object.keys(IdeaX.CustomFieldTypes);

  constructor(public modalCtrl: ModalController, public alertCtrl: AlertController, public t: TranslateService) {
    this.errors = Array<string>();
  }
  public ngOnInit() {
    if (!this.theField) this.close();
    this.theField = new IdeaX.CustomFieldMeta(this.field, this.languages);
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.some(e => e === field);
  }

  /**
   * Return the modified field and close.
   */
  public save() {
    // clean the enum (reset the enum if the type isn't correct)
    if (this.theField.type !== IdeaX.CustomFieldTypes.ENUM || !this.theField.enum.length) this.theField.enum = null;
    // reset obligatory if field is boolean
    if (this.theField.type === IdeaX.CustomFieldTypes.BOOLEAN) {
      this.theField.obligatory = false;
      this.theField.default = null;
    }
    // reset min/max if field isn't number
    if (this.theField.type !== IdeaX.CustomFieldTypes.NUMBER) {
      this.theField.min = null;
      this.theField.max = null;
    }
    // checkings
    this.errors = this.theField.validate(this.languages);
    if (this.errors.length) return;
    // return the cleaned field
    this.close(this.theField);
  }

  /**
   * Open a modal to manage the enum as a list.
   */
  public openEnumList() {
    this.modalCtrl
      .create({
        component: IDEAListComponent,
        componentProps: { list: this.theField.enum, title: this.t.instant('IDEA.CUSTOM_FIELDS.ENUM') }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data) this.theField.enum = res.data;
        });
        modal.present();
      });
  }
  /**
   * Show the enum as a string;
   */
  public getEnumAsString(): string {
    return (this.theField.enum || []).join(', ');
  }

  /**
   * Close the modal, optionally returning the updated field.
   */
  public close(updatedField?: IdeaX.CustomFieldMeta) {
    this.modalCtrl.dismiss(updatedField);
  }
}
