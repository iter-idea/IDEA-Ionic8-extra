import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Calendar } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEACalendarsService } from './calendars.service';
import { IDEACalendarComponent } from './calendar.component';

@Component({
  selector: 'idea-calendar-item',
  templateUrl: 'calendarItem.component.html',
  styleUrls: ['calendarItem.component.scss']
})
export class IDEACalendarItemComponent {
  /**
   * The calendar to show.
   */
  @Input() public calendar: Calendar;
  /**
   * Whether the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * Whether we want to enable advanced permissions (based on the memberships) on the calendar.
   */
  @Input() public advancedPermissions: boolean;
  /**
   * Whether the calendar color is an important detail or it shouldn't be shown.
   */
  @Input() public hideColor: boolean;
  /**
   * Report to parent components a change.
   */
  @Output() public somethingChanged = new EventEmitter<Calendar>();

  constructor(
    public calendars: IDEACalendarsService,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public t: IDEATranslationsService
  ) {}

  /**
   * Open the modal to manage the calendar.
   */
  public manageCalendar() {
    if (this.disabled) return;
    this.modalCtrl
      .create({
        component: IDEACalendarComponent,
        componentProps: {
          calendar: this.calendar,
          advancedPermissions: this.advancedPermissions,
          hideColor: this.hideColor
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(res => {
          const cal = res.data;
          // nothing changed
          if (cal === undefined) return;
          // the calendar was deleted
          else if (cal === null) this.calendar = null;
          // the calendar was updated
          else this.calendar.load(cal);
          // report changes to parent components
          this.somethingChanged.emit();
        });
        modal.present();
      });
  }

  /**
   * Continue the auth flow to link an external service and set an external calendar;
   * otherwise, the calendar can be deleted.
   */
  public linkExtCalendarOrDelete() {
    if (this.disabled) return;
    // let the user pick an external calendar, in case the external service is linked
    this.calendars
      .chooseAndSetExternalCalendar(this.calendar)
      .then(async cal => {
        if (!cal) return new Error('NO_EXTERNAL_CALENDAR_CHOSEN');
        this.calendar.load(cal);
        this.message.success('IDEA_AGENDA.CALENDARS.CALENDAR_LINKED');
        // run a first sync for the linked external calendar
        await this.loading.show(this.t._('IDEA_AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
        this.calendars
          .syncCalendar(this.calendar)
          .then(() => this.message.success('IDEA_AGENDA.CALENDARS.FIRST_SYNC_COMPLETED'))
          .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
          .finally(() => {
            this.loading.hide();
            // report changes to parent components
            this.somethingChanged.emit();
          });
      })
      .catch(() => {
        // the external service isn't linked yet (we don't have a token): link or delete
        this.alertCtrl
          .create({
            header: this.t._('IDEA_AGENDA.CALENDARS.CALENDAR_NOT_YET_LINKED'),
            message: this.t._('IDEA_AGENDA.CALENDARS.DO_YOU_WANT_PROCEED_LINKING_OR_DELETE'),
            buttons: [
              {
                text: this.t._('COMMON.DELETE'),
                handler: async () => {
                  // request the calendar deletion
                  await this.loading.show();
                  this.calendars
                    .deleteCalendar(this.calendar)
                    .then(() => {
                      this.message.success('COMMON.OPERATION_COMPLETED');
                      // report changes to parent components
                      this.somethingChanged.emit();
                    })
                    .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                    .finally(() => this.loading.hide());
                }
              },
              {
                text: this.t._('IDEA_AGENDA.CALENDARS.LINK'),
                handler: () =>
                  // try again to link the service
                  this.calendars
                    .linkExtService(this.calendar)
                    // if the service was successfully linked, go recursive to choose and set the external calendar
                    .then(() => this.linkExtCalendarOrDelete())
                    .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
              }
            ]
          })
          .then(alert => alert.present());
      });
  }
}
