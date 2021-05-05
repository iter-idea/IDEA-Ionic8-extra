import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { IDEAOfflineService, IDEATinCanService } from '@idea-ionic/common';

/**
 * The default language to use if no other preferred one is available.
 */
const DEFAULT_LANGUAGE = 'en_US';

/**
 * Speech recognition widget.
 * On iOS and Android we have different behaviours:
 *   - iOS: to start/stop listening we have physical commands available to the user as buttons.
 *   - Android: once it started, the stop mechanism is automatic;
 *     note: Android uses a modal interface that doesn't allow more than one recognition at the same time.
 */
@Component({
  selector: 'idea-speech-recognition',
  templateUrl: 'speechRecognition.component.html',
  styleUrls: ['speechRecognition.component.scss']
})
export class IDEASpeechRecognitionComponent {
  /**
   * The text elaborated.
   */
  @Input() public text: string;
  /**
   * Whether the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * The result of a speech recognition action, to emit.
   */
  @Output() public result = new EventEmitter<string>();
  /**
   * An event to notify parent components when this component is listening.
   */
  @Output() public listening = new EventEmitter<boolean>();
  /**
   * Keep a copy of the initial text; useful to append the new text detected.
   */
  public initText: string;
  /**
   * The value to display in the field preview.
   */
  public isListening: boolean;
  /**
   * The timer to show the recording process.
   */
  public timer: Timer;
  /**
   * Whether the speech recognition feature is available.
   */
  public isSRAvailable: boolean;
  /**
   * Whether the speech recognition feature has been granted.
   */
  public isSRGranted: boolean;
  /**
   * The language to use for the speech recognition.
   */
  public language: string;

  constructor(
    public platform: Platform,
    public cd: ChangeDetectorRef,
    public speechRecognition: SpeechRecognition,
    public offline: IDEAOfflineService,
    public tc: IDEATinCanService
  ) {}
  public async ngOnInit() {
    // check whether the feature available
    if (!this.platform.is('cordova') || !(this.platform.is('ios') || this.platform.is('android'))) return;
    this.isSRAvailable = await this.speechRecognition.isRecognitionAvailable();
    this.isListening = false;
    this.timer = new Timer();
    this.initText = this.text || '';
    this.isSRGranted = await this.speechRecognition.hasPermission();
    this.language = await this.getLanguageToUse();
  }
  /**
   * Get the language to use, based on the user/team preferences and on the languages available on the device.
   */
  private getLanguageToUse(): Promise<string> {
    return new Promise(resolve => {
      this.getSupportedLanguages().then(languages => {
        // map the languages in a clean standard, to be ready for comparisons
        languages = languages.map(l => l.replace('_', '-').toLowerCase());
        // get the language currently active on the device (cleaned)
        const deviceLanguage = window.navigator.language.replace('_', '-').toLowerCase();
        // search for an exact match (e.g. `es-bo`)
        let langToUse = languages.find(l => l === deviceLanguage);
        if (langToUse) return resolve(langToUse);
        // if an exact match wasn't found, search for a partial one (e.g. `es`); the first match we find, we keep it
        langToUse = languages.find(l => l.slice(0, 2) === deviceLanguage.slice(0, 2));
        if (langToUse) return resolve(langToUse);
        // if no match wasn't found, return the default language
        resolve(DEFAULT_LANGUAGE);
      });
    });
  }
  /**
   * Get the device's supported languages, with a fallback to the team's languages (subset of ServiceLanguages).
   * Note: this wrapper (with the fallback) is needed for some versions of Android that fail to get the supported langs.
   */
  private getSupportedLanguages(): Promise<string[]> {
    return new Promise(resolve => {
      this.speechRecognition.getSupportedLanguages().then(
        languages => resolve(languages),
        () => {
          // try to acquire the team's languages with the standard IDEA
          const teamLanguages: string[] = this.tc.get('team')?.languages?.available;
          if (teamLanguages && Array.isArray(teamLanguages)) resolve(teamLanguages);
          // otherwise, fallback with a list containing only the default language
          else resolve([DEFAULT_LANGUAGE]);
        }
      );
    });
  }

  /**
   * Start the recognition process.
   *
   * SpeechRecognitionListeningOptions:
   *
   *   - language {String} used language for recognition (default "en-US")
   *   - matches {Number} number of return matches (default 5, on iOS: maximum number of matches)
   *   - prompt {String} displayed prompt of listener popup window (default "", Android only)
   *   - showPopup {Boolean} display listener popup window with prompt (default true, Android only)
   *   - showPartial {Boolean} Allow partial results to be returned (default false)
   */
  public startListening() {
    // if we don't have already the permissio to use the speech recognition feature, request it
    this.speechRecognition.requestPermission().then(
      () => {
        this.isSRGranted = true;
        // emit the listening event to prevent other `idea-speech-recognition` to start listening (iOS only);
        // we don't need it on Android, because it creates a modal that makes impossible to activate other recordings
        if (this.platform.is('ios')) {
          this.isListening = true;
          this.listening.emit(this.isListening);
          this.timer.start();
        }
        // save a copy of the current text
        this.initText = this.text || '';
        // start the recognition
        this.speechRecognition.startListening({ language: this.language, matches: 1, showPartial: true }).subscribe(
          (matches: string[]) => {
            // be sure to prevent multiple emit events to occur on iOS
            if (this.isListening || this.platform.is('android')) {
              // concatenate the new text with the previous content (new line) and capitalize the first new letter
              const newContent = this.newLine(this.initText).concat(this.capitalizeFirstLetter(matches[0] || ''));
              // preview the new content
              this.result.emit(newContent);
            }
          },
          error => console.log('Speech Recognition error:', error)
        );
      },
      () => {} // stop
    );
  }
  /**
   * Add a new line to the string, avoiding consecutive new lines.
   */
  private newLine(s: string): string {
    s = (s || '').trim();
    return !s.length || s.slice(-2) === '\n\n' ? s : s.concat('\n\n');
  }
  /**
   * Helper to capitalize the first letter.
   */
  private capitalizeFirstLetter(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Stop the recognition process.
   *
   * There is a difference between Android and iOS platforms.
   * On Android, speech recognition stops when the speaker finishes speaking (at end of sentence).
   * On iOS, the user has to stop manually the recognition process by running stopListening() method.
   */
  public stopListening(cancel?: boolean) {
    // stop the recognition process (iOS only)
    this.speechRecognition.stopListening().then(() => {
      this.isListening = false;
      this.listening.emit(this.isListening);
      this.timer.stop();
      this.timer.clear();
      if (cancel) this.result.emit(this.initText);
      this.initText = '';
    });
  }

  /**
   * Clear the current text.
   */
  public clear() {
    this.text = '';
    this.initText = '';
    this.result.emit(this.initText);
  }
}

/**
 * A utility class to manage a timer.
 */
class Timer {
  /**
   * Reference to timer.
   */
  public timer: any;
  /**
   * Number of seconds.
   */
  public seconds: number;

  constructor() {
    this.seconds = 0;
  }
  public start() {
    this.timer = setInterval(() => {
      ++this.seconds;
    }, 1000);
  }
  public stop() {
    clearInterval(this.timer);
  }
  public clear() {
    this.seconds = 0;
  }
  public showPreview() {
    return this.pad(parseInt((this.seconds / 60).toString(), 10))
      .concat(':')
      .concat(this.pad(this.seconds % 60));
  }
  protected pad(val: number): string {
    return val.toString().length < 2 ? '0'.concat(val.toString()) : val.toString();
  }
}
