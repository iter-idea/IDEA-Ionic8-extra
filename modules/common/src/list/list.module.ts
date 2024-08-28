import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAListComponent } from './list.component';
import { IDEAListElementsComponent } from './listElements.component';
import { IDEALabelerModule } from '../labeler/labeler.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEALabelerModule],
  declarations: [IDEAListComponent, IDEAListElementsComponent],
  exports: [IDEAListComponent, IDEAListElementsComponent]
})
export class IDEAListModule {}
