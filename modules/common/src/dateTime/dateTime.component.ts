import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { epochDateTime } from 'idea-toolbox';

import { IDEACalendarPickerComponent } from './calendarPicker.component';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-date-time',
  templateUrl: 'dateTime.component.html',
  styleUrls: ['dateTime.component.scss']
})
export class IDEADateTimeComponent {
  /**
   * The date to show.
   */
  @Input() public date: epochDateTime;
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
    // when the language changes, set the locale
    this.langChangeSubscription = this.t.onLangChange.subscribe(() => {
      this.valueToDisplay = this.getValueToDisplay(this.date);
    }) as any;
  }
  public ngOnDestroy() {
    if (this.langChangeSubscription) this.langChangeSubscription.unsubscribe();
  }
  public ngOnChanges(changes: SimpleChanges) {
    if (changes.date || changes.timePicker) this.valueToDisplay = this.getValueToDisplay(this.date);
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
  protected getValueToDisplay(date: epochDateTime): string {
    return !date ? '' : this.t.formatDate(date, this.timePicker ? 'MMM d, y, h:mm a' : 'medium');
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
