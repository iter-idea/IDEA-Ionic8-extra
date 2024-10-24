import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IDEASelectComponent, IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAContactsComponent } from './contacts.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectComponent],
  declarations: [IDEAContactsComponent],
  exports: [IDEAContactsComponent]
})
export class IDEAContactsModule {}
