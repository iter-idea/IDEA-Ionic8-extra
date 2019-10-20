import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEASendEmailComponent } from './sendEmail.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEASendEmailComponent],
  entryComponents: [IDEASendEmailComponent],
  exports: [IDEASendEmailComponent]
})
export class IDEASendEmailModule {}
