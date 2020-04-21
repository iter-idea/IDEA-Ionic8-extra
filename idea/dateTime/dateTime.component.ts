import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEACalendarPickerComponent } from './calendarPicker.component';
import { IDEATranslationsService } from '../translations/translations.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'idea-date-time',
  templateUrl: 'dateTime.component.html',
  styleUrls: ['dateTime.component.scss']
})
export class IDEADateTimeComponent {
  /**
   * The date to show.
   */
  @Input() public date: IdeaX.epochDateTime;
  /**
   * Whether to show the time picker (datetime) or not (date).
   */
  @Input() public timePicker: boolean;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * A placeholder for the field.
   */
  @Input() public placeholder: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() public obligatory: boolean;
  /**
   * On select event.
   */
  @Output() public select = new EventEmitter<number>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();
  /**
   * The value to display in the field preview.
   */
  public valueToDisplay: string;
  /**
   * Language change subscription
   */
  protected langChangeSubscription: Subscription;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    Moment.locale(this.t.getCurrentLang());
    // when the language changes, set the locale
    this.langChangeSubscription = this.t.onLangChange.subscribe(() => {
      Moment.locale(this.t.getCurrentLang());
      this.valueToDisplay = this.getValueToDisplay(this.date);
    });
  }
  public ngOnDestroy() {
    if (this.langChangeSubscription) this.langChangeSubscription.unsubscribe();
  }
  public ngOnChanges(changes: SimpleChanges) {
    if (changes.date) this.valueToDisplay = this.getValueToDisplay(changes.date.currentValue);
  }

  /**
   * Open the calendar picker to select a date.
   */
  public openCalendarPicker() {
    if (this.disabled) return;
    this.modalCtrl
      .create({
        component: IDEACalendarPickerComponent,
        componentProps: { inputDate: this.date, title: this.label, timePicker: this.timePicker }
      })
      .then(modal => {
        modal.onDidDismiss().then((selection: OverlayEventDetail) => {
          const date = selection.data;
          if (date !== undefined && date !== null) {
            if (date === '') this.select.emit(null);
            else this.select.emit(date.valueOf());
          }
        });
        modal.present();
      });
  }

  /**
   * Calculate the value to show.
   */
  protected getValueToDisplay(date: IdeaX.epochDateTime): string {
    return !date ? '' : Moment(date).format(this.timePicker ? 'LLL' : 'LL');
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
