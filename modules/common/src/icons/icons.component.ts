import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Ionicons, loopStringEnumValues } from 'idea-toolbox';

@Component({
  selector: 'idea-icons',
  templateUrl: 'icons.component.html',
  styleUrls: ['icons.component.scss']
})
export class IDEAIconsComponent {
  private _modal = inject(ModalController);

  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;

  icons: Ionicons[];
  /**
   * Which icons to show, based on the current search. Note: this method is used instead of the usual, because the
   * icons take a lot to redraw (so it's better to just hide them when not needed).
   */
  shouldShowIcon: { [icon: string]: boolean } = {};

  ionViewDidEnter(): void {
    // note: it will take a while for the icons to draw in the UI; @idea to improve
    this.icons = loopStringEnumValues(Ionicons) as Ionicons[];
    this.search();
  }

  search(toSearch?: string): void {
    // acquire and clean the searchTerm
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // set visibility based on the search terms
    this.shouldShowIcon = {};
    this.icons.forEach(i => (this.shouldShowIcon[i] = i.toLowerCase().includes(toSearch)));
  }

  select(selection: Ionicons): void {
    this._modal.dismiss(selection);
  }

  close(): void {
    this._modal.dismiss();
  }
}
