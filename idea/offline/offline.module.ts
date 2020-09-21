import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineIndicatorComponent } from './offlineIndicator.component';
import { IDEACacheableResourceComponent } from './cacheableResource.component';
import { IDEADownloaderModule } from '../downloader/downloader.module';

@NgModule({
  imports: [CommonModule, IonicModule, IDEATranslationsModule, IDEADownloaderModule],
  declarations: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent, IDEACacheableResourceComponent],
  entryComponents: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent, IDEACacheableResourceComponent],
  exports: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent, IDEACacheableResourceComponent]
})
export class IDEAOfflineModule {}
