import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IDEAUserAvatarComponent } from './userAvatar.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEAUserAvatarComponent],
  exports: [IDEAUserAvatarComponent]
})
export class IDEAUserAvatarModule {}
