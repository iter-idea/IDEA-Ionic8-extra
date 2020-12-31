import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAttachmentsComponent } from './attachments.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAttachmentsComponent],
  entryComponents: [IDEAttachmentsComponent],
  exports: [IDEAttachmentsComponent]
})
export class IDEAAttachmentsModule {}
