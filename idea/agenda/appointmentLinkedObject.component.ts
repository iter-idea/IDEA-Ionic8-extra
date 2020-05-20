import { Component, Input, Output, EventEmitter } from '@angular/core';
import IdeaX = require('idea-toolbox');

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATinCanService } from '../tinCan.service';
import { NavController, ModalController } from '@ionic/angular';
import { IDEAExtBrowserService } from '../extBrowser.service';

// from idea-config.js
declare const IDEA_APP_URL: string;
declare const IDEA_SCARLETT_API_ID: string;
declare const IDEA_SCARLETT_APP_URL: string;
declare const IDEA_ARTHUR_API_ID: string;
declare const IDEA_ARTHUR_APP_URL: string;

@Component({
  selector: 'idea-appointment-linked-object',
  templateUrl: 'appointmentLinkedObject.component.html',
  styleUrls: ['appointmentLinkedObject.component.scss']
})
export class IDEAAppointmentLinkedObjectComponent {
  /**
   * The linked object to show.
   */
  @Input() public object: IdeaX.AppointmentLinkedObject;
  /**
   * Enable/disable the mode in which you can remove the linked object.
   */
  @Input() public removeMode: boolean;
  /**
   * Trigger for when an element is removed.
   */
  @Output() public remove = new EventEmitter<Event>();
  /**
   * The logo to show at the beginning of the component.
   */
  public logo: string;
  /**
   * The title to show in the component.
   */
  public title: string;
  /**
   * The description to show in the component.
   */
  public description: string;
  /**
   * The distinctive color of the component.
   */
  public color: string;
  /**
   * The set of avatars to show at the end of the component.
   */
  public avatars: Array<string>;
  /**
   * The set of icons to show at the end of the component.
   */
  public icons: Array<string>;
  /**
   * Whether the component refer to an object of the current service.
   */
  public isThisService: boolean;
  /**
   * The external link to visit when the component is selected (`!isThisService`).
   */
  public href: string;
  /**
   * The internal route to to visit when the component is selected (`isThisService`).
   */
  public route: Array<string>;
  /**
   * The current state of the component.
   */
  public state: ObjectStates;
  /**
   * Helper to use the enum in the UI.
   */
  public ObjectStates = ObjectStates;
  /**
   * The path where to find the minimal icons.
   */
  public minimalIconsPath = 'assets/icons/minimal/';

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public extBrowswer: IDEAExtBrowserService,
    public loading: IDEALoadingService,
    public tc: IDEATinCanService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    if (!this.object) return (this.state = ObjectStates.UNSET);
    else {
      this.state = ObjectStates.LOADING;
      // based on the service/type of the linked object, set the component's data
      switch (this.object.type) {
        case IdeaX.AppointmentLinkedObjectTypes.SCARLETT_ACTIVITY:
          this.logo = this.minimalIconsPath.concat('scarlett.svg');
          this.API.getResource(`teams/${this.tc.get('membership').teamId}/activities`, {
            resourceId: this.object.id,
            alternativeAPI: IDEA_SCARLETT_API_ID
          })
            .then((activity: any) => {
              this.title = activity.description;
              this.description = `${activity.target.name} - ${activity.target.office}`;
              this.color = activity.color;
              this.avatars = activity.usersIds.map(
                x =>
                  `https://s3.eu-west-2.amazonaws.com/scarlett-media/thumbnails/avatars/` +
                  `${this.tc.get('membership').teamId}/${x}.png`
              );
              this.icons = [];
              if (activity.numDays) this.icons.push('document');
              else if (activity.completedAt) this.icons.push('checkmark-done');
              if (activity.hasBeenSent) this.icons.push('send');
              this.isThisService = IDEA_APP_URL === IDEA_SCARLETT_APP_URL;
              this.route = ['teams', this.tc.get('membership').teamId, 'activities', this.object.id];
              this.href = IDEA_SCARLETT_APP_URL.concat('/').concat(this.route.join('/'));
              this.state = ObjectStates.ACTIVE;
            })
            .catch(() => (this.state = ObjectStates.ERROR));
          break;
        case IdeaX.AppointmentLinkedObjectTypes.ARTHUR_ACTIVITY:
          this.logo = this.minimalIconsPath.concat('arthur.svg');
          this.API.getResource(`teams/${this.tc.get('membership').teamId}/activities`, {
            resourceId: this.object.id,
            alternativeAPI: IDEA_ARTHUR_API_ID
          })
            .then((activity: any) => {
              this.title = activity.name;
              this.description = `${activity.model.name} - ${activity.subject.name}`;
              this.color = null;
              this.avatars = [activity.updatedBy.userId].map(
                x =>
                  `https://s3.eu-west-2.amazonaws.com/arthur-app-media/thumbnails/teams/` +
                  `${this.tc.get('membership').teamId}/avatars/${x}.png`
              );
              this.icons = [];
              this.isThisService = IDEA_APP_URL === IDEA_ARTHUR_APP_URL;
              this.route = ['teams', this.tc.get('membership').teamId, 'activities', this.object.id];
              this.href = IDEA_ARTHUR_APP_URL.concat('/').concat(this.route.join('/'));
              this.state = ObjectStates.ACTIVE;
            })
            .catch(() => (this.state = ObjectStates.ERROR));
          break;
        default:
          this.state = ObjectStates.ERROR;
      }
    }
  }

  /**
   * Manage the internal or external navigation to the object.
   */
  public goToObject() {
    if (this.removeMode) return;
    if (this.isThisService) this.navCtrl.navigateForward(this.route).then(() => this.modalCtrl.dismiss());
    else this.extBrowswer.openLink(this.href);
  }
}

/**
 * The possible states of the component.
 */
enum ObjectStates {
  ERROR = -1,
  UNSET = 0,
  LOADING,
  ACTIVE
}
