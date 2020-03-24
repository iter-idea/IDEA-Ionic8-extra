import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import Moment = require('moment-timezone');

import { IDEACalendarPickerComponent } from './calendarPicker.component';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-date-time',
  templateUrl: 'dateTime.component.html',
  styleUrls: ['dateTime.component.scss']
})
export class IDEADateTimeComponent {
  @Input() public date: Date;
  @Input() public timePicker: boolean;
  @Input() public label: string;
  @Input() public icon: string;
  @Input() public lines: string;
  @Input() public placeholder: string;
  @Input() public disabled: boolean;
  @Input() public obligatory: boolean;
  @Output() public select = new EventEmitter<number>();

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    Moment.locale(this.t.getCurrentLang());
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
  public getValue(): string {
    return !this.date ? '' : Moment(this.date).format('ddd D MMMM YYYY'.concat(this.timePicker ? ', H:mm' : ''));
  }
}
