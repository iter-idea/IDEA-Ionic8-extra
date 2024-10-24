import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAOfflineManagerComponent } from './offlineManager.component';
import { IDEAOfflineIndicatorComponent } from './offlineIndicator.component';
import { IDEACacheableResourceComponent } from './cacheableResource.component';

@NgModule({
  imports: [CommonModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent, IDEACacheableResourceComponent],
  exports: [IDEAOfflineManagerComponent, IDEAOfflineIndicatorComponent, IDEACacheableResourceComponent]
})
export class IDEAOfflineModule {}
