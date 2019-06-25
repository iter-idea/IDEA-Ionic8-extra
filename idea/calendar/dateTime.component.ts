import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import Moment = require('moment-timezone');

import { IDEACalendarComponent } from './calendar.component';
import { OverlayEventDetail } from '@ionic/core';

@Component({
  selector: 'idea-date-time',
  templateUrl: 'dateTime.component.html',
  styleUrls: ['dateTime.component.scss']
})
export class IDEADateTimeComponent {
  @Input() protected date: Date;
  @Input() protected timePicker: boolean;
  @Input() protected label: string;
  @Input() protected icon: string;
  @Input() protected lines: string;
  @Input() protected placeholder: string;
  @Input() protected disabled: boolean;
  @Input() protected obligatory: boolean;
  @Output() protected select = new EventEmitter<number>();

  constructor(
    protected modalCtrl: ModalController,
    protected t: TranslateService
  ) {}
  protected ngOnInit() {
    Moment.locale(this.t.currentLang);
  }

  /**
   * Open the calendar picker to select a date.
   */
  protected openCalendarPicker() {
    if (this.disabled) return;
    this.modalCtrl.create({
      component: IDEACalendarComponent,
      componentProps: { inputDate: this.date, title: this.label, timePicker: this.timePicker }
    })
    .then(modal => {
      modal.onDidDismiss()
      .then((selection: OverlayEventDetail) => {
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
  protected getValue(): string {
    return !this.date ? '' : Moment(this.date).format('ddd D MMMM YYYY'.concat(this.timePicker ? ', H:mm' : null));
  }
}
