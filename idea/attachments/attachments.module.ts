import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAttachmentsComponent } from './attachments.component';
import { IDEADownloaderModule } from '../downloader/downloader.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEADownloaderModule],
  declarations: [IDEAttachmentsComponent],
  entryComponents: [IDEAttachmentsComponent],
  exports: [IDEAttachmentsComponent]
})
export class IDEAAttachmentsModule {}
