import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonAccordionGroup } from '@ionic/angular';
import { Address, Countries, Suggestion } from 'idea-toolbox';

@Component({
  selector: 'idea-address',
  templateUrl: 'address.component.html',
  styleUrls: ['address.component.scss']
})
export class IDEAAddressComponent implements OnInit {
  /**
   * The address to manage.
   */
  @Input() address: Address;
  /**
   * If true, show the field `contact`.
   */
  @Input() showContact = false;
  /**
   * If true, show the field `address2`.
   */
  @Input() showAddress2 = false;
  /**
   * If true, show the field `phone`.
   */
  @Input() showPhone = false;
  /**
   * If true, show the field `email`.
   */
  @Input() showEmail = false;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() editMode = true;
  /**
   * If true, show obligatory dots.
   */
  @Input() obligatory = false;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * The label to show for the field; if not set, it has a default value.
   */
  @Input() label: string;
  /**
   * The placeholder to show for the field.
   */
  @Input() placeholder: string;
  /**
   * To toggle the detailed view.
   */
  @Input() openByDefault = false;

  countriesSuggestions: Suggestion[];
  Countries = Countries;
  @ViewChild('accordion') accordion: IonAccordionGroup;

  ngOnInit(): void {
    this.countriesSuggestions = Object.keys(Countries).map(
      k => new Suggestion({ value: (Countries as any)[k], name: k })
    );
  }

  isCollapsed(): boolean {
    return this.accordion?.value !== 'open';
  }

  getCountryName(countryCode: Countries): string {
    if (!countryCode) return;
    const country = Object.entries(Countries).find(([_, value]): boolean => value === countryCode);
    return country ? country[0] : null;
  }
}
