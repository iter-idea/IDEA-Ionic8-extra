import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { TimeInterval } from 'idea-toolbox';
import { IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-from-time-to-time',
  templateUrl: 'fromTimeToTime.component.html',
  styleUrls: ['fromTimeToTime.component.scss']
})
export class IDEAFromTimeToTimeComponent implements OnInit {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The time interval to set.
   */
  @Input() timeInterval: TimeInterval;
  /**
   * Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
   */
  @Input() period: Periods = Periods.AM;
  /**
   * A time to use as lower limit for the possible choices.
   */
  @Input() notEarlierThan: number;
  /**
   * A time to use as upper limit for the possible choices.
   */
  @Input() notLaterThan: number;
  /**
   * The title of the component.
   */
  @Input() title: string;

  segment: Segments;
  Segments = Segments;
  Periods = Periods;
  timeIntervalWC: TimeInterval;
  minutes: number;

  ngOnInit(): void {
    this.segment = Segments.FROM;
    this.minutes = 30;
    this.timeIntervalWC = new TimeInterval(this.timeInterval);
  }

  setInterval(hours: number, minutes?: number): void {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // convert the hours and minutes in milliseconds
    const timeMs = this.timeToMs(hours, minutes);
    // set the correct part of the interval, based on the current segment
    if (this.segment === Segments.FROM) {
      // set the start of the interval (from) and change the segment so that the end (to) will be picked
      this.timeIntervalWC.from = timeMs;
      this.segment = Segments.TO;
    } else {
      // can't proceed if from and to are equal
      if (timeMs === this.timeIntervalWC.from) return;
      // set the end of the interval (to)
      this.timeIntervalWC.to = timeMs;
      // save the changes and notify the parent component
      this.save();
    }
  }
  private timeToMs(hours: number, minutes?: number): number {
    return (hours * 60 * 60 + (minutes || 0) * 60) * 1000;
  }

  getClockButtonContent(hours: number, minutes?: number): string {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // convert the calculated time into a readable string; we need to format it to distinguish 0-24 vs 0-12 am/pm
    const refDate = new Date();
    refDate.setHours(hours, minutes || 0, 0);
    const str = this._translate.formatDate(refDate, 'shortTime');
    // remove the extra part (e.g. am/pm), based on the type of button we have to show
    const strArr = str.split(':');
    return String(Number(strArr[0])).concat(minutes ? ':'.concat(strArr[1].slice(0, 2)) : '');
  }
  private contextualizeHour(hours: number, minutes?: number): number {
    // adjust the content to the afternoon hours, if needed
    if (this.period === Periods.PM) hours += 12;
    // if we already selected the start of the interval, check whether we need to adjust the time: the center of the
    // clock will be moved to the selected hour (from), to have a reasonable set of choices for the end (to)
    if (this.segment === Segments.TO && this.timeToMs(hours, minutes) < this.timeIntervalWC.from)
      hours += this.period === Periods.PM ? -12 : 12;
    // set midnight to 00
    if (hours === 24) hours = 0;
    return hours;
  }

  equalsFrom(hours: number, minutes?: number): boolean {
    // if the start of the interval hasn't been selected yet, skip it
    if (this.segment === Segments.FROM) return false;
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // compare the two strings based on the timestamps in ms
    return this.msToTimeString(this.timeIntervalWC.from) === this.msToTimeString(this.timeToMs(hours, minutes));
  }

  isAllowed(hours: number, minutes?: number): boolean {
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // check whether the selected time is inside the given boundaries
    return (
      (!this.notEarlierThan ||
        this.timeToMs(hours, minutes) >= this.notEarlierThan ||
        this.timeToMs(hours, minutes) === 0) &&
      (!this.notLaterThan || this.timeToMs(hours, minutes) <= this.notLaterThan)
    );
  }

  isHourOfOppositeMeridian(hours: number, minutes?: number): boolean {
    // if the start of the interval hasn't been selected yet, skip it
    if (this.segment === Segments.FROM) return false;
    // adjust the hour based on the start of the interval and the settings of am/pm
    hours = this.contextualizeHour(hours, minutes);
    // calculate the ms of the selected time and of "noon" time (to determ the meridian)
    const timeMs = this.timeToMs(hours, minutes);
    const noonMs = this.timeToMs(12);
    // return true in case the hour doesn't belong to the current meridian
    return (this.period === Periods.AM && timeMs > noonMs) || (this.period === Periods.PM && timeMs < noonMs);
  }

  msToTimeString(time: number): string {
    if (!time) return '';
    // note: the time must be always considered without any timezone (UTC)
    const refDate = new Date();
    refDate.setTime(time);
    const dateOpts = { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' } as const;
    return refDate.toLocaleTimeString(this._translate.getCurrentLang(), dateOpts);
  }

  save(): void {
    this.timeInterval.load(this.timeIntervalWC);
    this._modal.dismiss(true);
  }

  reset(): void {
    this.timeInterval.reset();
    this._modal.dismiss(false);
  }

  close(): void {
    this._modal.dismiss();
  }
}

/**
 * The two stages of the component, to pick the start and the end of the interval.
 */
enum Segments {
  FROM = 'FROM',
  TO = 'TO'
}

/**
 * The two possible periods of the component, to interpret the clock the right way.
 */
export enum Periods {
  AM = 'AM',
  PM = 'PM'
}
