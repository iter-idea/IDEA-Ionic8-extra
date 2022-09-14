import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEACheckerComponent } from './checker.component';
import { IDEAChecksComponent } from './checks.component';
import { IDEAUserAvatarModule } from '../userAvatar/userAvatar.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAUserAvatarModule],
  declarations: [IDEACheckerComponent, IDEAChecksComponent],
  exports: [IDEACheckerComponent, IDEAChecksComponent]
})
export class IDEACheckerModule {}
