import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Address, Countries } from 'idea-toolbox';
import { Suggestion } from '../select/suggestions.component';

@Component({
  selector: 'idea-address',
  templateUrl: 'address.component.html',
  styleUrls: ['address.component.scss']
})
export class IDEAAddressComponent {
  /**
   * The address to manage.
   */
  @Input() public address: Address;
  /**
   * If true, show the field `contact`.
   */
  @Input() public showContact: boolean;
  /**
   * If true, show the field `address2`.
   */
  @Input() public showAddress2: boolean;
  /**
   * If true, show the field `phone`.
   */
  @Input() public showPhone: boolean;
  /**
   * If true, show the field `email`.
   */
  @Input() public showEmail: boolean;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;
  /**
   * If true, show obligatory dots.
   */
  @Input() public obligatory: boolean;

  /**
   * The suggestions for the Countries picker.
   */
  public countriesSuggestions: Array<Suggestion>;
  /**
   * Shortcut to Countries enum.
   */
  public Countries = Countries;
  /**
   * To toggle the detailed view.
   */
  public addressCollapsed: boolean;

  constructor(public t: TranslateService) {
    this.address = new Address();
    this.showContact = false;
    this.showAddress2 = false;
    this.showPhone = false;
    this.showEmail = false;
    this.editMode = true;
    this.lines = 'inset';
    this.countriesSuggestions = Object.keys(Countries).map(k => new Suggestion(Countries[k], k));
    this.addressCollapsed = true;
  }

  /**
   * Toggle the detailed/collapsed view.
   */
  public toggleCollapse() {
    this.addressCollapsed = !this.addressCollapsed;
  }
}
