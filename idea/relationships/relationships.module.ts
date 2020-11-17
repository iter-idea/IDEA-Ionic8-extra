import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEARelationshipsComponent, RelationshipsNotesComponent } from './relationships.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEARelationshipsComponent, RelationshipsNotesComponent],
  entryComponents: [IDEARelationshipsComponent, RelationshipsNotesComponent],
  exports: [IDEARelationshipsComponent, RelationshipsNotesComponent]
})
export class IDEARelationshipsModule {}
