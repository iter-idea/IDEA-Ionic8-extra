import { Component, HostListener, Input, ViewChild } from '@angular/core';
import { ModalController, IonSearchbar } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'idea-suggestions',
  templateUrl: 'suggestions.component.html',
  styleUrls: ['suggestions.component.scss'],
})
export class IDEASuggestionsComponent {
  @Input() protected data: Array<Suggestion>;
  @Input() protected sortData: boolean;
  @Input() protected searchPlaceholder: string;
  @Input() protected noElementsFoundText: string;
  @Input() protected allowUnlistedValues: boolean;
  @Input() protected hideIdFromUI: boolean;
  @Input() protected hideClearButton: boolean;

  protected suggestions: Array<Suggestion>;
  @ViewChild(IonSearchbar) protected searchbar: IonSearchbar;

  constructor(
    protected modalCtrl: ModalController,
    protected t: TranslateService
  ) {}
  protected ngOnInit() {
    this.data = this.data || new Array<Suggestion>();
    this.suggestions = new Array<any>();
    // sort the data, if requested
    if (this.sortData)
      this.data = this.data.sort((a, b) =>
        a.name && b.name ? a.name.localeCompare(b.name) : a.value.localeCompare(b.value));
    // show the suggestions based on the data
    this.getSuggestions();
  }
  protected ionViewDidEnter() {
    // focus on the searchbar
    this.searchbar.setFocus();
  }

  /**
   * Get suggestions while typing into the input.
   */
  protected getSuggestions(ev?: any) {
    // acquire and clean the searchTerm
    let searchTerm = ev && ev.target ? (ev.target.value || '') : '';
    if (searchTerm.trim() === '') searchTerm = '';
    // load the suggestions
    this.suggestions = this.data
      .filter((x: Suggestion) => x.value.concat(x.name || '').toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
  }

  /**
   * Close the component propagating the choice:
   *    - selection === undefined -> cancel
   *    - selection === null -> clear
   *    - otherwise, a suggestion was selected
   */
  protected select(selection?: Suggestion) {
    this.modalCtrl.dismiss(selection);
  }

  /**
   * Manage the component with the keyboard.
   */
  @HostListener('window:keydown', ['$event'])
  protected navigateComponent(event: KeyboardEvent) {
    // identify the suggestions list
    let suggestionsList: any;
    if (document.getElementsByClassName('suggestionsList').length)
      suggestionsList = document.getElementsByClassName('suggestionsList')[0];
    // identify the action to execute based on the key pressed
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        // quick confirm of the selection, based on what is on in the component
        if (suggestionsList && suggestionsList.getElementsByClassName('selected').length) {
          if (
            suggestionsList
            .getElementsByClassName('selected')[0]
            .getElementsByClassName('key').length
          )
            this.select(this.data.find(x => x.value ===
              suggestionsList
              .getElementsByClassName('selected')[0]
              .getElementsByClassName('key')[0].innerHTML.trim()
            ));                                                               // selected || loose value
        } else if (this.suggestions.length === 0) this.select();                // cancel
        else this.select(this.suggestions[0]);                                // first element
      break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (!suggestionsList) return;
        // identify the currently selected suggestion or select the first one
        let selected = null;
        let elements = suggestionsList.getElementsByClassName('selected');
        if (elements.length) {
          // a suggestion was already selected: go to the next/previous one
          selected = elements[0];
          if (selected) {
            selected.classList.remove('selected');
            if (event.key === 'ArrowDown') selected = selected.nextElementSibling;
            else selected = selected.previousElementSibling;
          }
        } else {
          // no suggestions selected yet: select the first one
          elements = suggestionsList.getElementsByClassName('suggestion');
          if (elements.length) selected = elements[0];
        }
        // execute the selection
        if (selected) selected.classList.add('selected');
      break;
    }
  }
}

/**
 * A suggestion made to appear as value to select.
 */
export class Suggestion {
  public value: any;
  public name: any;

  constructor(value?: any, name?: any) {
    this.value = value || null;
    this.name = name || null;
  }

  /**
   * Clear the suggestion.
   */
  public clear(): void {
    this.value = null;
    this.name = null;
  }
  /**
   * Set the suggestion with new values.
   */
  public set(value: any, name?: any) {
    this.value = value;
    this.name = name || null;
  }
  /**
   * Copy the attributes from another suggestion.
   */
  public copy(suggestion: Suggestion) {
    this.value = suggestion.value;
    this.name = suggestion.name;
  }
}