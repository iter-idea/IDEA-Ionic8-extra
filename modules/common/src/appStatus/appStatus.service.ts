import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppStatus, markdown, mdToHtml } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAApiService } from '../api.service';
import { IDEAMessageService } from '../message.service';
import { IDEAStorageService } from '../storage.service';
import { refreshVisibleIonicPages } from '../cdRefresh';
import { compareVersions } from '../versions';

/**
 * How often the status is read again while the app is visible.
 */
const WATCH_INTERVAL_MS = 5 * 60 * 1000;
/**
 * The minimum time between two readings caused by an event (the app visible again, a failed request): a back-end in
 * maintenance fails every request, and each one must not turn into a download of the status.
 */
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;
/**
 * The path of the status page, as every app registers it.
 */
const STATUS_PAGE_PATH = 'app-status';

/**
 * Check whether the app has some status message or update to handle.
 *
 * The status is read when the app starts, and then kept current — when the app becomes visible again, every few
 * minutes while it's visible, and when a request to the back-end fails — so that a maintenance or a forced update
 * reaches whoever is already inside, not only whoever opens the app; and so that it lets them go when it's over.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAppStatusService {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _router = inject(Router);
  private _translate = inject(IDEATranslationsService);
  private _api = inject(IDEAApiService);
  private _storage = inject(IDEAStorageService);
  private _message = inject(IDEAMessageService);
  private _appRef = inject(ApplicationRef);

  /**
   * The last status known; `undefined` until the first reading.
   */
  readonly status = signal<AppStatus>(undefined);
  /**
   * The last status known (same as `status()`).
   */
  get appStatus(): AppStatus {
    return this.status();
  }
  set appStatus(appStatus: AppStatus) {
    this.status.set(appStatus);
  }
  /**
   * The status file as last read — including the keys an app adds for its own purposes, so that the app doesn't need
   * to download it a second time. `undefined` with the API method, or while the file couldn't be read.
   */
  statusFile: IDEAAppStatusFile;

  storageKey: string;
  statusFileURL: string;

  /**
   * Where the user was going when a blocking status took them to its page: where they return when it's over.
   */
  returnURL: string;

  private viaApi = false;
  private reading: Promise<AppStatus>;
  private lastReadAt = 0;
  private watching = false;

  constructor() {
    this.storageKey = (this._env.idea.project || 'app').concat('_LAST_MESSAGE');
    this.statusFileURL =
      this._env.idea.app?.statusFileURL ??
      `${window.location.hostname === 'localhost' ? '' : window.location.origin}/assets/status.json`;

    // the status is often read before the user's language is known (it's read at start-up): the message follows it
    this._translate.onLangChange.subscribe((): void => {
      if (this.statusFile && !this.viaApi) this.status.set(this.statusFromFile(this.statusFile));
    });
  }

  /**
   * Check the app's status and take according actions: the status page when the status is blocking, otherwise the
   * message for the user, if any. Then keep the status current, unless `watch` is `false`.
   * `toastColor` and `toastPosition` are deprecated and ignored: the message is a notice of `IDEAMessageService`.
   */
  async check(
    options: { viaApi?: boolean; toastColor?: string; toastPosition?: string; watch?: boolean } = {}
  ): Promise<AppStatus> {
    this.viaApi = !!options.viaApi;

    const appStatus = await this.load();

    // not awaited: `check` usually runs inside the app's start-up guard, and the status page is usually guarded by the
    // same start-up — waiting here for the navigation would mean waiting for ourselves, and the app would never start
    if (this.isBlocking(appStatus)) this.goToStatusPage();
    else await this.presentMessage(appStatus);

    if (options.watch !== false) this.watch();

    return appStatus;
  }

  /**
   * The app's status, read once and then kept; `refresh` reads it again. It never fails: if the status can't be read,
   * the last one known stays (or, the first time, a status that blocks nothing), since an unreachable status file
   * must not lock anybody out of the app.
   */
  async load(options: { refresh?: boolean } = {}): Promise<AppStatus> {
    if (this.status() && !options.refresh) return this.status();
    if (this.reading) return await this.reading;

    this.reading = this.read().finally((): void => {
      this.reading = null;
    });
    return await this.reading;
  }

  /**
   * Whether the status keeps the user out of the app.
   */
  isBlocking(appStatus: AppStatus = this.status()): boolean {
    return !!appStatus && (appStatus.inMaintenance || appStatus.mustUpdate);
  }

  /**
   * Read the status again and act on what changed: to the status page if it became blocking, back into the app if it
   * stopped being so, the message for the user otherwise. Without `force`, a reading too close to the last one is
   * skipped.
   */
  async refresh(options: { force?: boolean } = {}): Promise<AppStatus> {
    if (!options.force && Date.now() - this.lastReadAt < MIN_REFRESH_INTERVAL_MS) return this.status();

    const wasBlocking = this.isBlocking();
    const appStatus = await this.load({ refresh: true });

    if (this.isBlocking(appStatus)) {
      if (!this.isOnStatusPage()) this.goToStatusPage();
    } else if (wasBlocking && this.isOnStatusPage()) this.leaveStatusPage();
    else await this.presentMessage(appStatus);

    return appStatus;
  }

  /**
   * Leave the status page for where the user was going. On the web the app is loaded again, so that it also picks up
   * any version published in the meantime: a maintenance often comes with a release.
   */
  leaveStatusPage(): void {
    const url = this.returnURL && !isStatusPageURL(this.returnURL) ? this.returnURL : '/';
    this.returnURL = null;
    if (Capacitor.isNativePlatform()) this._nav.navigateRoot(url);
    else window.location.assign(url);
  }

  private goToStatusPage(): void {
    this.returnURL ??= window.location.pathname.concat(window.location.search);
    this._nav.navigateRoot([STATUS_PAGE_PATH]);
  }
  private isOnStatusPage(): boolean {
    return isStatusPageURL(this._router.url) || isStatusPageURL(window.location.pathname);
  }

  private watch(): void {
    if (this.watching) return;
    this.watching = true;

    document.addEventListener('visibilitychange', (): void => {
      if (document.visibilityState === 'visible') this.refresh();
    });
    setInterval((): void => {
      if (document.visibilityState === 'visible') this.refresh({ force: true });
    }, WATCH_INTERVAL_MS);
    // a back-end that fails may be a back-end in maintenance (an app with its own API service may lack the hook)
    this._api.onServerError?.((): void => {
      this.refresh();
    });
  }

  private async read(): Promise<AppStatus> {
    try {
      this.status.set(await (this.viaApi ? this.readFromApi() : this.readFromAsset()));
    } catch (error) {
      const version = this._env.idea.app.version;
      if (!this.status()) this.status.set(new AppStatus({ version, latestVersion: version }));
    }
    this.lastReadAt = Date.now();
    return this.status();
  }
  private async readFromApi(): Promise<AppStatus> {
    return new AppStatus(await this._api.getResource(['status']));
  }
  private async readFromAsset(): Promise<AppStatus> {
    try {
      const res = await fetch(this.statusFileURL, { method: 'GET', cache: 'no-cache' });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      const statusFile: IDEAAppStatusFile = await res.json();

      const errors = validateStatusFile(statusFile);
      if (errors.length) console.error(`[IDEA app status] ${this.statusFileURL} is invalid:`, errors.join('; '));

      this.statusFile = statusFile;
      return this.statusFromFile(statusFile);
    } catch (error) {
      console.error(`[IDEA app status] ${this.statusFileURL} couldn't be read:`, error);
      throw error;
    } finally {
      // The native `fetch` settles outside the Angular zone; on the next macrotask refresh the visible
      // Ionic page(s) and tick the app shell so the caller's post-`await` state change renders on
      // Zone-based apps. See IDEAApiService.
      setTimeout(() => {
        refreshVisibleIonicPages();
        this._appRef.tick();
      });
    }
  }
  /**
   * What the file means for the installed version. Each value counts only when it has the expected type: a file
   * written wrong must not lock anybody out — and `"maintenance": "false"` would be `true` to a plain cast.
   */
  private statusFromFile(file: IDEAAppStatusFile): AppStatus {
    const version = this._env.idea.app.version;
    const messageOrNull = (message: any): MultiLanguageMarkdown => (isMessage(message) ? message : null);
    const versionMessage = messageOrNull(file.messages?.[version]);

    const inMaintenance = file.maintenance === true;
    const minVersion = typeof file.minVersion === 'string' ? file.minVersion : null;
    const mustUpdate = !!minVersion && compareVersions(minVersion, version) > 0;

    // the maintenance has a message of its own, never shown outside of it: left in the file once it's over, it greets
    // nobody; the version's message remains its fallback, as it was the only one there was
    let content: MultiLanguageMarkdown;
    if (inMaintenance) content = messageOrNull(file.maintenanceMessage) ?? versionMessage;
    else if (mustUpdate) content = versionMessage;
    else content = versionMessage ?? messageOrNull(file.announcement);

    return new AppStatus({
      version,
      inMaintenance,
      mustUpdate,
      content: this.pickMessageLanguage(content),
      latestVersion: typeof file.latestVersion === 'string' ? file.latestVersion : version
    });
  }
  /**
   * The message of a version, in the user's language.
   *
   * A message has always been a single string, and it stays valid: the multi-language form is a map of language to
   * message (`{ "en": "…", "it": "…" }`), resolved on the current language, then on the default one, and finally on
   * whatever the file does carry — for an announcement, the wrong language is still better than silence.
   */
  private pickMessageLanguage(message: MultiLanguageMarkdown): markdown {
    if (!message || typeof message === 'string') return message as markdown;

    return (
      message[this._translate.getCurrentLang()] ??
      message[this._translate.getDefaultLang()] ??
      Object.values(message)[0] ??
      ''
    );
  }

  private async presentMessage(appStatus: AppStatus): Promise<void> {
    let message = appStatus.content ? markdownToPlainText(appStatus.content) : '';
    if (!message && compareVersions(this._env.idea.app.version, appStatus.latestVersion) < 0)
      message = this._translate._('IDEA_COMMON.APP_STATUS.NEW_VERSION', { newVersion: appStatus.latestVersion });
    if (!message) return;

    const messageAlreadyRead = await this._storage.get(this.storageKey);
    if (messageAlreadyRead === message) return; // user already saw this message

    // it stays until the user says they read it; the status is read again while the app is open, and the same message
    // still on screen doesn't pile up on itself
    this._message.info(message, {
      dontTranslate: true,
      persistent: true,
      closeText: 'IDEA_COMMON.APP_STATUS.GOT_IT',
      onClose: (): Promise<void> => this._storage.set(this.storageKey, message)
    });
  }
}

/**
 * A message: a single string, in whatever language the app was written for, or a map of language to message —
 * `{ "en": "…", "it": "…" }` — shown in the user's own language. Messages are Markdown.
 */
type MultiLanguageMarkdown = markdown | { [language: string]: markdown };

/**
 * The status file of an app: `idea.app.statusFileURL`, by default `assets/status.json`.
 */
export interface IDEAAppStatusFile {
  /**
   * Whether the app is in maintenance mode. Only a real `true` counts.
   */
  maintenance: boolean;
  /**
   * The message on the status page during a maintenance, for every version; it's never shown outside of one.
   * When it's missing, the message of the installed version is shown instead.
   */
  maintenanceMessage?: MultiLanguageMarkdown;
  /**
   * The latest version of the app.
   */
  latestVersion: string;
  /**
   * The minimum required version to access the app.
   */
  minVersion: string;
  /**
   * The optional messages for each of the app's versions: on the status page when the status is blocking, otherwise
   * as a notice, once per distinct message.
   */
  messages: { [version: string]: MultiLanguageMarkdown };
  /**
   * A notice for every version, when the installed one has no message of its own; once per distinct message.
   */
  announcement?: MultiLanguageMarkdown;
  /**
   * Any other key is the app's own, readable from `IDEAAppStatusService.statusFile`.
   */
  [appKey: string]: any;
}

/**
 * What's wrong in a status file, if anything. The app still uses what it can of an invalid file — and never takes a
 * malformed value as a reason to block — but whoever wrote it should hear about it.
 */
export const validateStatusFile = (file: any): string[] => {
  if (!file || typeof file !== 'object' || Array.isArray(file)) return ['the file is not a JSON object'];

  const errors: string[] = [];
  if (file.maintenance !== undefined && typeof file.maintenance !== 'boolean')
    errors.push('`maintenance` must be `true` or `false`, without quotes');
  for (const key of ['latestVersion', 'minVersion'])
    if (file[key] !== undefined && file[key] !== null && typeof file[key] !== 'string')
      errors.push(`\`${key}\` must be a version string (e.g. "1.2.3") or null`);
  for (const key of ['maintenanceMessage', 'announcement'])
    if (file[key] !== undefined && file[key] !== null && !isMessage(file[key]))
      errors.push(`\`${key}\` must be a string or a map of language to string`);
  if (file.messages !== undefined && file.messages !== null) {
    if (typeof file.messages !== 'object' || Array.isArray(file.messages))
      errors.push('`messages` must be a map of version to message');
    else
      for (const version of Object.keys(file.messages))
        if (!isMessage(file.messages[version]))
          errors.push(`\`messages["${version}"]\` must be a string or a map of language to string`);
  }
  return errors;
};

const isMessage = (x: any): boolean =>
  typeof x === 'string' ||
  (!!x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).every(m => typeof m === 'string'));

const isStatusPageURL = (url: string): boolean => (url ?? '').split(/[?#]/)[0].endsWith(`/${STATUS_PAGE_PATH}`);

/**
 * A message shows plain text: `**bold**` would reach the user as asterisks. The message is parsed into an inert
 * document, so nothing in it (an image, a handler) is loaded or run.
 */
const markdownToPlainText = (message: markdown): string =>
  new DOMParser().parseFromString(mdToHtml(message), 'text/html').body.textContent?.trim() ?? '';
