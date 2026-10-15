import { Injectable, signal } from '@angular/core';

/**
 * What the sign-in flow carries from a step, or a page, to the next one.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAuthFlowService {
  /**
   * The email the user is signing in with: the next page starts from it.
   */
  readonly email = signal<string>(null);

  private pendingNotice: IDEAAuthNotice = null;

  /**
   * Leave a notice for the next page of the flow (e.g. the time to answer a challenge ran out).
   */
  setNotice(notice: IDEAAuthNotice): void {
    this.pendingNotice = notice;
  }
  /**
   * Take the notice left by the previous page, if any: it's shown once.
   */
  takeNotice(): IDEAAuthNotice {
    const notice = this.pendingNotice;
    this.pendingNotice = null;
    return notice;
  }
}

/**
 * A notice shown in the pages of the sign-in flow.
 */
export interface IDEAAuthNotice {
  kind: 'error' | 'info' | 'success';
  /**
   * The term to translate.
   */
  message: string;
  /**
   * A text to show below the message as it is (e.g. Cognito's explanation of an error).
   */
  detail?: string;
}
