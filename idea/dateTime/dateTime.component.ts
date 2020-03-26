import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEACalendarPickerComponent } from './calendarPicker.component';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-date-time',
  templateUrl: 'dateTime.component.html',
  styleUrls: ['dateTime.component.scss']
})
export class IDEADateTimeComponent {
  @Input() public date: IdeaX.epochDateTime;
  @Input() public timePicker: boolean;
  @Input() public label: string;
  @Input() public icon: string;
  @Input() public lines: string;
  @Input() public placeholder: string;
  @Input() public disabled: boolean;
  @Input() public obligatory: boolean;
  @Output() public select = new EventEmitter<number>();
  public valueToDisplay: string;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    Moment.locale(this.t.getCurrentLang());
    // when the language changes, set the locale
    this.t.onLangChange.subscribe(() => {
      Moment.locale(this.t.getCurrentLang());
      this.valueToDisplay = this.getValueToDisplay(this.date);
    });
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
}
