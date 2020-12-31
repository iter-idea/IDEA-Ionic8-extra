import { Component, Input } from '@angular/core';

import { Contacts } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

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

  constructor(public t: IDEATranslationsService) {
    this.contacts = new Contacts();
    this.showName = false;
    this.editMode = true;
    this.lines = 'inset';
  }
}
