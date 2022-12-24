import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAAnnouncementComponent } from './announcement.component';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
    declarations: [IDEAAnnouncementComponent],
    exports: [IDEAAnnouncementComponent]
})
export class IDEAAnnouncementModule {}
