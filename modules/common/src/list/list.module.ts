import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEALabelerComponent } from '../labeler/labeler.component';

import { IDEAListComponent } from './list.component';
import { IDEAListElementsComponent } from './listElements.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEALabelerComponent],
  declarations: [IDEAListComponent, IDEAListElementsComponent],
  exports: [IDEAListComponent, IDEAListElementsComponent]
})
export class IDEAListModule {}
