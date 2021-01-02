import { Injectable, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Label, Languages, mdToHtml } from 'idea-toolbox';

import { IDEAAWSAPIService } from '../AWSAPI.service';

// from idea-config.js
declare const IDEA_IONIC_MODULES: Array<string>;

/**
 * Base folder containing the translations.
 */
const BASE_PATH = 'assets/i18n/';
/**
 * The modules for which to load the translations.
 */
const MODULES_PATH = [''].concat(IDEA_IONIC_MODULES || []);

/**
 * Translations service.
 */
@Injectable()
export class IDEATranslationsService {
  /**
   * Template matcher to interpolate complex strings (e.g. `{{user}}`).
   */
  protected templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;
  /**
   * The available languages.
   */
  protected langs: Array<string>;
  /**
   * The current language.
   */
  protected currentLang: string;
  /**
   * The fallback language.
   */
  protected defaultLang: string;
  /**
   * The translations.
   */
  protected translations: any;
  /**
   * To subscribe to language changes.
   */
  public onLangChange = new EventEmitter<string>();

  constructor(public API: IDEAAWSAPIService) {
    this.translations = {};
  }

  /**
   * Set the available languages.
   */
  public setLangs(langs: Array<string>) {
    this.langs = langs.slice();
  }
  /**
   * Returns an array of currently available languages.
   */
  public getLangs(): Array<string> {
    return this.langs;
  }

  /**
   * Get the fallback language.
   */
  public getDefaultLang(): string {
    return this.defaultLang;
  }
  /**
   * Sets the default language to use as a fallback.
   */
  public setDefaultLang(lang: string) {
    // check whether the language is among the ServiceLanguages; otherwise, fallback to the first available
    if (this.langs.includes(lang)) this.defaultLang = lang;
    else this.defaultLang = this.langs[0];
  }

  /**
   * Get the languages in IdeaX format.
   */
  public languages(): Languages {
    return new Languages({ available: this.langs, default: this.defaultLang });
  }

  /**
   * Returns the language code name from the browser, e.g. "it"
   */
  public getBrowserLang(): string {
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
  public getCurrentLang(): string {
    return this.currentLang;
  }
  /**
   * Set a language to use.
   */
  public use(lang: string, force?: boolean): Promise<void> {
    return new Promise(resolve => {
      const changed = lang !== this.currentLang;
      if (!changed && !force) return;
      // check whether the language is among the available ones; otherwise, fallback to default
      if (!this.langs.includes(lang)) lang = this.defaultLang;
      // load translations
      this.loadTranlations(lang).then(() => {
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
   * Get a translated term by key in the current language, optionally interpolating variables (e.g. `{{user}}`).
   * If the term doesn't exist in the current language, it is searched in the default language.
   */
  public instant(key: string, interpolateParams?: object): string {
    return this.instantInLanguage(this.currentLang, key, interpolateParams);
  }
  /**
   * Get a translated term by key in the selected language, optionally interpolating variables (e.g. `{{user}}`).
   * If the term doesn't exist in the current language, it is searched in the default language.
   */
  public instantInLanguage(language: string, key: string, interpolateParams?: object): string {
    if (!this.isDefined(key) || !key.length) return;
    let res = this.interpolate(this.getValue(this.translations[language], key), interpolateParams);
    if (res === undefined && this.defaultLang !== null && this.defaultLang !== language)
      res = this.interpolate(this.getValue(this.translations[this.defaultLang], key), interpolateParams);
    return res;
  }
  /**
   * Shortcut to instant.
   */
  public _(key: string, interpolateParams?: object): string {
    return this.instant(key, interpolateParams);
  }
  /**
   * Translate (instant) and transform an expected markdown string into HTML.
   */
  public _md(key: string, interpolateParams?: object): string {
    return mdToHtml(this._(key, interpolateParams));
  }

  /**
   * Return a Label containing all the available translations of a key.
   */
  public getLabelByKey(key: string, interpolateParams?: object): Label {
    const label = new Label(null, this.languages());
    this.langs.forEach(lang => (label[lang] = this.instantInLanguage(lang, key, interpolateParams)));
    return label;
  }

  /**
   * Load the translations from the files.
   */
  protected loadTranlations(lang: string): Promise<void> {
    return new Promise(resolve => {
      this.translations = {};
      this.translations[this.defaultLang] = {};
      let promises = MODULES_PATH.map(m => this.loadTranslationFileHelper(BASE_PATH.concat(m), this.defaultLang));
      if (lang !== this.defaultLang) {
        this.translations[lang] = {};
        promises = promises.concat(MODULES_PATH.map(m => this.loadTranslationFileHelper(BASE_PATH.concat(m), lang)));
      }
      Promise.all(promises).then(() => resolve());
    });
  }
  /**
   * Load a file into the translations.
   */
  protected loadTranslationFileHelper(path: string, lang: string): Promise<void> {
    return new Promise(resolve => {
      this.API.rawRequest()
        .get(`${path.slice(-1) === '/' ? path : path.concat('/')}${lang}.json`)
        .toPromise()
        .then((obj: any) => {
          for (const key in obj) if (obj[key]) this.translations[lang][key] = obj[key];
          resolve();
        })
        .catch(() => resolve());
    });
  }

  /**
   * Interpolates a string to replace parameters.
   * "This is a {{ key }}" ==> "This is a value", with params = { key: "value" }
   */
  protected interpolate(expr: string, params?: any): string {
    if (!params || !expr) return expr;
    return expr.replace(this.templateMatcher, (substring: string, b: string) => {
      const r = this.getValue(params, b);
      return this.isDefined(r) ? r : substring;
    });
  }
  /**
   * Gets a value from an object by composed key.
   * getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'
   */
  protected getValue(target: any, key: string): any {
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
  protected isDefined(value: any): boolean {
    return value !== undefined && value !== null;
  }

  /**
   * Format a date in the current locale.
   */
  public formatDate(value: any, pattern: string = 'mediumDate'): string {
    const datePipe: DatePipe = new DatePipe(this.getCurrentLang());
    return datePipe.transform(value, pattern);
  }
}
