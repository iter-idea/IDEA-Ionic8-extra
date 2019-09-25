import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEAttachmentsComponent } from './attachments.component';
import { IDEADownloaderModule } from '../downloader/downloader.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild(), IDEADownloaderModule],
  declarations: [IDEAttachmentsComponent],
  entryComponents: [IDEAttachmentsComponent],
  exports: [IDEAttachmentsComponent]
})
export class IDEAAttachmentsModule {}
