import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Contacts } from 'idea-toolbox';

@Component({
  selector: 'idea-contacts',
  templateUrl: 'contacts.component.html',
  styleUrls: ['contacts.component.scss']
})
export class IDEAContactsComponent {
  /**
   * The contacts to manage.
   */
  @Input() public contacts: Contacts;
  /**
   * If true, show the field `name`.
   */
  @Input() public showName: boolean;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;

  constructor(public t: TranslateService) {
    this.contacts = new Contacts();
    this.showName = false;
    this.editMode = true;
    this.lines = 'inset';
  }
}
