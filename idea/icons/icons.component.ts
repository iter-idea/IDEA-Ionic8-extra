import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-icons',
  templateUrl: 'icons.component.html',
  styleUrls: ['icons.component.scss']
})
export class IDEAIconsComponent {
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * The Ionicons in form of array.
   */
  public icons: Array<IdeaX.Ionicons>;
  /**
   * Which icons to show, based on the current search. Note: this method is used instead of the usual, because the
   * icons take a lot to redraw (so it's better to just hide them when not needed).
   */
  public shouldShowIcon: { [icon: string]: boolean };

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {
    this.shouldShowIcon = {};
  }
  public ionViewDidEnter() {
    // note: it will take a while for the icons to draw in the UI; @idea to improve
    this.icons = IdeaX.loopStringEnumValues(IdeaX.Ionicons) as Array<IdeaX.Ionicons>;
    this.search();
  }

  /**
   * Set icons' visibility while typing into the input.
   */
  public search(toSearch?: string) {
    // acquire and clean the searchTerm
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // set visibility based on the search terms
    this.shouldShowIcon = {};
    this.icons.forEach(i => (this.shouldShowIcon[i] = i.toLowerCase().includes(toSearch)));
  }

  /**
   * Select and close.
   */
  public select(selection: IdeaX.Ionicons) {
    this.modalCtrl.dismiss(selection);
  }

  /**
   * Close without selecting.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
