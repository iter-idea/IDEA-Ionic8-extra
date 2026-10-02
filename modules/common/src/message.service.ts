import { ApplicationRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';

import { IDEATranslationsService } from './translations/translations.service';
import { IDEANoticeKind, IDEANoticesComponent } from './notices/notices.component';

/**
 * Show a message to the user, as a notice at the bottom of the screen (at the bottom-right corner on a wide one) that
 * closes by itself. Its look follows the app's Ionic tokens.
 */
@Injectable({ providedIn: 'root' })
export class IDEAMessageService {
  private _translate = inject(IDEATranslationsService);
  private _appRef = inject(ApplicationRef);
  private _injector = inject(EnvironmentInjector);

  /**
   * The notices on screen: created with the first message, outside the app's pages so that they stay above them.
   */
  private notices: IDEANoticesComponent;

  /**
   * Show a message.
   * @param message message to show (i18n key to translate, if `dontTranslate === false`)
   * @param kind the kind of message, which sets its icon and colour
   * @param options the options of the message
   */
  private show(message: string, kind: IDEANoticeKind, options: IDEAMessageOptions = {}): void {
    const { dontTranslate, serverMessage, requestId } = options;
    message = message || '';
    if (!dontTranslate) message = this._translate._(message);
    this.getNotices().add({ kind, message, serverMessage, requestId });
  }
  private getNotices(): IDEANoticesComponent {
    if (!this.notices) {
      const ref = createComponent(IDEANoticesComponent, { environmentInjector: this._injector });
      this._appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement);
      this.notices = ref.instance;
    }
    return this.notices;
  }

  /**
   * Show an info message.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async info(message: string, options?: IDEAMessageOptions): Promise<void> {
    this.show(message, 'info', options);
  }
  /**
   * Show a success message.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async success(message: string, options?: IDEAMessageOptions): Promise<void> {
    this.show(message, 'success', options);
  }
  /**
   * Show an error message.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async error(message: string, options?: IDEAMessageOptions): Promise<void> {
    this.show(message, 'error', options);
  }
  /**
   * Show a warning message.
   * @param message message to show
   * @param options for translations and additional text to show
   */
  async warning(message: string, options?: IDEAMessageOptions): Promise<void> {
    this.show(message, 'warning', options);
  }
}

/**
 * The options of a message.
 */
export interface IDEAMessageOptions {
  /**
   * Whether the message is already a translated text.
   */
  dontTranslate?: boolean;
  /**
   * Some untranslatable text from the back-end, to add as detail after the message.
   */
  serverMessage?: string;
  /**
   * The id of the request of an error the back-end didn't handle (`IDEAApiError.requestId`): the message shows it as a
   * code to report, which the user can copy, and stays longer. Pass `requestId: error.requestId` whenever you show an
   * error of an API request: the back-end sets it only on the errors it didn't handle, and the others look as usual.
   * With it, `serverMessage` isn't shown: it would be the back-end's generic message.
   */
  requestId?: string;
}
