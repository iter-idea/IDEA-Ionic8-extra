import { Component, Input } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Announcement, mdToHtml } from 'idea-toolbox';

import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

// from idea-config.js
declare const IDEA_PROJECT: string;

/**
 * The storage key to save th last announcement read on this device.
 */
export const ANNOUNCEMENT_STORAGE_KEY = IDEA_PROJECT.concat('_LAST_ANNOUNCEMENT');

/**
 * Announcement card that can be set in any interface to show the alert for this project.
 */
@Component({
  selector: 'idea-announcement',
  templateUrl: 'announcement.component.html',
  styleUrls: ['announcement.component.scss']
})
export class IDEAAnnouncementComponent {
  /**
   * The color for the announcement card.
   */
  @Input() public color: string;
  /**
   * The announcement, automatically read through TinCan from the Init Guard of the project.
   */
  public announcement: Announcement;
  /**
   * The content to show (converted from MD).
   * The announcement card is shown only if this content has a value.
   */
  public htmlContent: string;

  constructor(public t: IDEATranslationsService, public tc: IDEATinCanService, public storage: Storage) {
    this.color = 'dark';
  }
  public ngOnInit() {
    // standard IDEA: the announcement is read in the Init Guard
    this.announcement = this.tc.get('idea-announcement');
    // if there is any announcment, check if has to be shown
    if (this.announcement && this.announcement.content) {
      // get from the local storage the last announcement read
      this.storage.get(ANNOUNCEMENT_STORAGE_KEY).then((lastRead: string) => {
        // if the announcment is new or not read on this device, show the card
        if (!lastRead || this.announcement.content !== lastRead) this.htmlContent = mdToHtml(this.announcement.content);
      });
    }
  }

  /**
   * Mark the current announcement as read (on this device).
   */
  public markAsRead() {
    this.storage.set(ANNOUNCEMENT_STORAGE_KEY, this.announcement.content).then(() => (this.htmlContent = null));
  }
}