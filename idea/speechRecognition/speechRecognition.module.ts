import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASpeechRecognitionComponent } from './speechRecognition.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEASpeechRecognitionComponent],
  entryComponents: [IDEASpeechRecognitionComponent],
  exports: [IDEASpeechRecognitionComponent],
  providers: [SpeechRecognition]
})
export class IDEASpeechRecognitionModule {}
