import { Component, Input, ViewChild } from '@angular/core';
import { IonTextarea, PopoverController } from '@ionic/angular';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { RelationshipCategories, RelationshipSummary } from '../../../../../api/_shared/relationship.model';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-relationships',
  templateUrl: 'relationships.component.html',
  styleUrls: ['relationships.component.scss']
})
export class IDEARelationshipsComponent {
  /**
   * The relationships to show.
   */
  @Input() public relationships: Array<RelationshipSummary>;
  /**
   * The categories withiin the relationships; useful for creating dividers.
   */
  @Input() public categories: Array<string>;
  /**
   * Shortcut of the enum, to use in the UI.
   */
  public RelationshipCategories = RelationshipCategories;

  constructor(public popoverCtrl: PopoverController) {
    this.relationships = new Array<RelationshipSummary>();
  }

  public ngOnInit() {
    // order the categories to aid viewing; note
    this.categories = Array.from(new Set(this.relationships.map((r: RelationshipSummary) => r.category))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  /**
   * Helper to get the relationships by category.
   */
  public getRelationshipsByCategory(category: string) {
    return this.relationships.filter(r => r.category === category);
  }

  /**
   * Humanize the updatedAt time, compared to Now.
   */
  public humanizeDateTime(updatedAt: IdeaX.epochDateTime): string {
    return Moment.duration(updatedAt - Moment().valueOf()).humanize(true);
  }

  /**
   * Open the popover to edit the relations notes.
   */
  public openNotes(event: any, relationshipNote: string) {
    this.popoverCtrl
      .create({
        component: RelationshipsNotesComponent,
        componentProps: { relationshipNote },
        event
      })
      .then(popover => popover.present());
  }
}

/**
 * Component to open in a popover for displaying an ItemUsed notes.
 */
@Component({
  selector: 'relationships-notes',
  template: `
    <ion-content>
      <ion-textarea [rows]="8" [disabled]="true" [(ngModel)]="relationshipNote"></ion-textarea>
    </ion-content>
  `,
  styles: [
    `
      ion-textarea {
        padding: 10px 15px;
        background-color: var(--ion-color-white);
      }
    `
  ]
})
export class RelationshipsNotesComponent {
  /**
   * The notes area.
   */
  @ViewChild(IonTextarea, { static: true }) public notesArea: IonTextarea;
  /**
   * The note of show.
   */
  @Input() public relationshipNote: string;

  constructor(public t: IDEATranslationsService) {}
}
