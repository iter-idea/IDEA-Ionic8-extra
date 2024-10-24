import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IDEASelectModule, IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAContactsComponent } from './contacts.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectModule],
  declarations: [IDEAContactsComponent],
  exports: [IDEAContactsComponent]
})
export class IDEAContactsModule {}
