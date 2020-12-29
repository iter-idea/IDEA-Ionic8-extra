import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-from-time-to-time',
  templateUrl: 'fromTimeToTime.component.html',
  styleUrls: ['fromTimeToTime.component.scss']
})
export class IDEAFromTimeToTimeComponent {
  /**
   * The time interval to set.
   */
  @Input() public timeInterval: IdeaX.TimeInterval;
  /**
   * Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
   */
  @Input() public pm: boolean;
  /**
   * A time to use as lower limit for the possible choices.
   */
  @Input() public notEarlierThan: number;
  /**
   * A time to use as upper limit for the possible choices.
   */
  @Input() public notLaterThan: number;
  /**
   * The title of the component.
   */
  @Input() public title: string;
  /**
   * The current segment, to understand if we are picking the "from" or the "to" part of the interval.
   */
  public segment: Segments;
  /**
   * Helper to use the enum in the UI.
   */
  public Segments = Segments;
  /**
   * A copy of the timeInterval, to use until the changes are confirmed.
   */
  public _timeInterval: IdeaX.TimeInterval;
  /**
   * The preference, in terms of granularity, for the minutes displayed in the clock.
   */
  public minutes: number;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.segment = Segments.FROM;
    this.minutes = 30;
    // work on a copy until the changes are confirmed
    this._timeInterval = new IdeaX.TimeInterval(this.timeInterval);
  }

  /**
   * Based on the segment, set a part of the interval. If both parts are set, save and notify the parent component.
   */
  public setInterval(hours: number, minutes?: number) {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // convert the hours and minutes in milliseconds
    const timeMs = this.timeToMs(hours, minutes);
    // set the correct part of the interval, based on the current segment
    if (this.segment === Segments.FROM) {
      // set the start of the interval (from) and change the segment so that the end (to) will be picked
      this._timeInterval.from = timeMs;
      this.segment = Segments.TO;
    } else {
      // can't proceed if from and to are equal
      if (timeMs === this._timeInterval.from) return;
      // set the end of the interval (to)
      this._timeInterval.to = timeMs;
      // save the changes and notify the parent component
      this.save();
    }
  }
  /**
   * Convert hours and minutes (optional) in ms.
   */
  private timeToMs(hours: number, minutes?: number): number {
    return (hours * 60 * 60 + (minutes || 0) * 60) * 1000;
  }

  /**
   * Get the content of the clock's button based on the time (hours, minutes) specified and on previous selections.
   */
  public getClockButtonContent(hours: number, minutes?: number): string {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // convert the calculated time into a readable string; we need to format it to distinguish 0-24 vs 0-12 am/pm
    const refDate = new Date();
    refDate.setHours(hours, minutes || 0, 0);
    const str = this.t.formatDate(refDate, 'shortTime');
    // remove the extra part (e.g. am/pm), based on the type of button we have to show
    const strArr = str.split(':');
    return String(Number(strArr[0])).concat(minutes ? ':'.concat(strArr[1].slice(0, 2)) : '');
  }
  /**
   * Adjust the hour based on the start of the interval and the settings of am/pm.
   */
  private contextualizeHour(hours: number, minutes?: number) {
    // adjust the content to the afternoon hours, if needed
    if (this.pm) hours += 12;
    // if we already selected the start of the interval, check whether we need to adjust the time: the center of the
    // clock will be moved to the selected hour (from), to have a reasonable set of choices for the end (to)
    if (this.segment === Segments.TO && this.timeToMs(hours, minutes) < this._timeInterval.from)
      hours += this.pm ? -12 : 12;
    // set midnight to 00
    if (hours === 24) hours = 0;
    return hours;
  }

  /**
   * Whether the selected time (hours, minutes) equals the start of the interval (from).
   */
  public equalsFrom(hours: number, minutes?: number): boolean {
    // if the start of the interval hasn't been selected yet, skip it
    if (this.segment === Segments.FROM) return false;
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // compare the two strings based on the timestamps in ms
    return this.msToTimeString(this._timeInterval.from) === this.msToTimeString(this.timeToMs(hours, minutes));
  }

  /**
   * Whether the selected time (hours, minutes) is allowed, based on the constraints inputed.
   */
  public isAllowed(hours: number, minutes?: number): boolean {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // check whether the selected time is inside the given boundaries
    return (
      (!this.notEarlierThan || this.timeToMs(hours, minutes) >= this.notEarlierThan) &&
      (!this.notLaterThan || this.timeToMs(hours, minutes) <= this.notLaterThan)
    );
  }

  /**
   * Based on the AM/PM, whether the current hour belongs to the opposite meridian.
   */
  public isHourOfOppositeMeridian(hours: number, minutes?: number): boolean {
    // if the start of the interval hasn't been selected yet, skip it
    if (this.segment === Segments.FROM) return false;
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // calculate the ms of the selected time and of "noon" time (to determ the meridian)
    const timeMs = this.timeToMs(hours, minutes);
    const noonMs = this.timeToMs(12);
    // return true in case the hour doesn't belong to the current meridian
    return (!this.pm && timeMs > noonMs) || (this.pm && timeMs < noonMs);
  }

  /**
   * Get the selected time (ms) as hours string.
   */
  public msToTimeString(time: number): string {
    if (!time) return '';
    // note: the time is always considered without any timezone (UTC)
    const refDate = new Date();
    refDate.setTime(time);
    return this.t.formatDate(refDate, 'shortTime');
  }

  /**
   * Save the changes and notify the parent component that the interval has been picked.
   */
  private save() {
    this.timeInterval.load(this._timeInterval);
    this.modalCtrl.dismiss(true);
  }

  /**
   * Reset the time interval and close.
   */
  public reset() {
    this.timeInterval.reset();
    this.modalCtrl.dismiss(false);
  }

  /**
   * Close without saving.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}

/**
 * The two stages of the component, to pick the start and the end of the interval.
 */
enum Segments {
  FROM = 'FROM',
  TO = 'TO'
}
