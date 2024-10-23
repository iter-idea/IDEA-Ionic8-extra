import { Injectable, EventEmitter, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { getStringEnumKeyByValue, Label, Languages, LanguagesISO639, mdToHtml } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';

/**
 * Translations service.
 */
@Injectable({ providedIn: 'root' })
export class IDEATranslationsService {
  protected _env = inject(IDEAEnvironment);

  /**
   * Base folder containing the translations.
   */
  protected basePath = 'assets/i18n/';
  /**
   * The modules for which to load the translations.
   */
  protected modulesPath: string[];

  /**
   * Template matcher to interpolate complex strings (e.g. `{{user}}`).
   */
  private templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
  /**
   * The available languages.
   */
  private langs: string[];
  /**
   * The current language.
   */
  private currentLang: string;
  /**
   * The fallback language.
   */
  private defaultLang: string;
  /**
   * The translations.
   */
  private translations: any = {};
  /**
   * Some default interpolation parameters to add to istant translations.
   */
  private defaultInterpolations: Record<string, string> = {};
  /**
   * To subscribe to language changes.
   */
  onLangChange = new EventEmitter<string>();

  constructor() {
    this.modulesPath = [''].concat(this._env.idea.ionicExtraModules || []);
  }

  /**
   * Initialize the service.
   */
  async init(languages: string[] = ['en'], defaultLang = 'en'): Promise<void> {
    this.setLangs(languages);
    this.setDefaultLang(defaultLang);
    let lang = this.getBrowserLang();
    if (!languages.includes(lang)) lang = this.getDefaultLang();
    await this.use(lang, true);
  }

  /**
   * Set the available languages.
   */
  setLangs(langs: string[]): void {
    this.langs = langs.slice();
  }
  /**
   * Returns an array of currently available languages.
   */
  getLangs(): string[] {
    return this.langs;
  }

  /**
   * Get the fallback language.
   */
  getDefaultLang(): string {
    return this.defaultLang;
  }
  /**
   * Sets the default language to use as a fallback.
   */
  setDefaultLang(lang: string): void {
    if (this.langs.includes(lang)) this.defaultLang = lang;
    else this.defaultLang = this.langs[0];
  }

  /**
   * Get the languages in IdeaX format.
   */
  languages(): Languages {
    return new Languages({ available: this.langs, default: this.defaultLang });
  }

  /**
   * Returns the language code name from the browser, e.g. "it"
   */
  getBrowserLang(): string {
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') return undefined;
    let browserLang: any = window.navigator.languages ? window.navigator.languages[0] : null;
    browserLang =
      browserLang ||
      window.navigator.language ||
      (window.navigator as any).browserLanguage ||
      (window.navigator as any).userLanguage;
    if (typeof browserLang === 'undefined') return undefined;
    if (browserLang.indexOf('-') !== -1) browserLang = browserLang.split('-')[0];
    if (browserLang.indexOf('_') !== -1) browserLang = browserLang.split('_')[0];
    return browserLang;
  }

  /**
   * The lang currently used.
   */
  getCurrentLang(): string {
    return this.currentLang;
  }
  /**
   * Set a language to use.
   */
  use(lang: string, force?: boolean): Promise<void> {
    return new Promise(resolve => {
      const changed = lang !== this.currentLang;
      if (!changed && !force) return;
      // check whether the language is among the available ones; otherwise, fallback to default
      if (!this.langs.includes(lang)) lang = this.defaultLang;
      // load translations
      this.loadTranlations(lang).then((): void => {
        // set the lang
        this.currentLang = lang;
        // emit the change
        if (changed) this.onLangChange.emit(lang);
        // resolve
        resolve();
      });
    });
  }

  /**
   * Set some parameters to automatically provide to translation actions.
   */
  setDefaultInterpolations(defaultParams: Record<string, string>): void {
    this.defaultInterpolations = defaultParams || {};
  }

  /**
   * Get a translated term by key in the current language, optionally interpolating variables (e.g. `{{user}}`).
   * If the term doesn't exist in the current language, it is searched in the default language.
   */
  instant(key: string, interpolateParams?: any): string {
    return this.instantInLanguage(this.currentLang, key, interpolateParams);
  }
  /**
   * Get a translated term by key in the selected language, optionally interpolating variables (e.g. `{{user}}`).
   * If the term doesn't exist in the current language, it is searched in the default language.
   */
  instantInLanguage(language: string, key: string, interpolateParams?: any): string {
    const params = { ...this.defaultInterpolations, ...(interpolateParams || {}) };
    if (!this.isDefined(key) || !key.length) return;
    let res = this.interpolate(this.getValue(this.translations[language], key), params);
    if (res === undefined && this.defaultLang !== null && this.defaultLang !== language)
      res = this.interpolate(this.getValue(this.translations[this.defaultLang], key), params);
    return res;
  }
  /**
   * Shortcut to instant.
   */
  _(key: string, interpolateParams?: any): string {
    return this.instant(key, interpolateParams);
  }
  /**
   * Translate (instant) and transform an expected markdown string into HTML.
   */
  _md(key: string, interpolateParams?: any): string {
    return mdToHtml(this._(key, interpolateParams));
  }

  /**
   * Return a Label containing all the available translations of a key.
   */
  getLabelByKey(key: string, interpolateParams?: any): Label {
    const label = new Label(null, this.languages());
    this.langs.forEach(lang => (label[lang] = this.instantInLanguage(lang, key, interpolateParams)));
    return label;
  }
  /**
   * Return the translation in the current language of a label.
   */
  translateLabel(label: Label): string {
    return label.translate(this.getCurrentLang(), this.languages());
  }
  /**
   * Shortcut to translateLabel.
   */
  _label(label: Label): string {
    return this.translateLabel(label);
  }

  /**
   * Load the translations from the files.
   */
  private loadTranlations(lang: string): Promise<void> {
    return new Promise(resolve => {
      this.translations = {};
      this.translations[this.defaultLang] = {};
      let promises = this.modulesPath.map(m =>
        this.loadTranslationFileHelper(this.basePath.concat(m), this.defaultLang)
      );
      if (lang !== this.defaultLang) {
        this.translations[lang] = {};
        promises = promises.concat(
          this.modulesPath.map(m => this.loadTranslationFileHelper(this.basePath.concat(m), lang))
        );
      }
      Promise.all(promises).then((): void => resolve());
    });
  }
  /**
   * Load a file into the translations.
   */
  private async loadTranslationFileHelper(path: string, lang: string): Promise<void> {
    const res = await fetch(`${path.slice(-1) === '/' ? path : path.concat('/')}${lang}.json`, {
      method: 'GET',
      cache: 'no-cache' // to avoid issues upon releases
    });
    if (res.status !== 200) return;

    const obj = await res.json();
    for (const key in obj) if (obj[key]) this.translations[lang][key] = obj[key];
  }

  /**
   * Interpolates a string to replace parameters.
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   */
  private interpolate(expr: string, params?: any): string {
    if (!params || !expr) return expr;
    return expr.replace(this.templateMatcher, (substring: string, b: string): any => {
      const r = this.getValue(params, b);
      return this.isDefined(r) ? r : substring;
    });
  }
  /**
   * Gets a value from an object by composed key.
   * getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
   */
  private getValue(target: any, key: string): any {
    const keys = typeof key === 'string' ? key.split('.') : [key];
    key = '';
    do {
      key += keys.shift();
      if (this.isDefined(target) && this.isDefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
        target = target[key];
        key = '';
      } else if (!keys.length) target = undefined;
      else key += '.';
    } while (keys.length);
    return target;
  }

  /**
   * Helper to quicly check if the value is defined.
   */
  private isDefined(value: any): boolean {
    return value !== undefined && value !== null;
  }

  /**
   * Format a date in the current locale.
   */
  formatDate(value: any, pattern: string = 'mediumDate'): string {
    const datePipe: DatePipe = new DatePipe(this.getCurrentLang());
    return datePipe.transform(value, pattern);
  }

  /**
   * Get a readable string to represent the current language (standard ISO639).
   */
  getLanguageNameByKey(lang?: string): string {
    return getStringEnumKeyByValue(LanguagesISO639, lang || this.getCurrentLang());
  }
}
