import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAActionSheetComponent } from './actionSheet.component';
import { IDEAActionSheetController } from './actionSheetController.service';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEAActionSheetComponent],
  entryComponents: [IDEAActionSheetComponent],
  exports: [IDEAActionSheetComponent, IDEAActionSheetController],
  providers: [IDEAActionSheetController]
})
export class IDEAActionSheetModule {}
