import { ChangeDetectorRef, Injectable, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';

import { IDEATranslationsService } from '../translations/translations.service';

@Injectable()
@Pipe({
  name: 'translate',
  pure: false // required to update the translations when the language change
})
export class IDEATranslatePipe implements PipeTransform, OnDestroy {
  /**
   * The value to display.
   */
  private value = '';
  /**
   * The last key requested.
   */
  private lastKey: string;
  /**
   * The last params requested.
   */
  private lastParams: any[];
  /**
   * Subscription to the (current) language changes.
   */
  private onLangChange: Subscription;

  constructor(private translate: IDEATranslationsService, private _ref: ChangeDetectorRef) {}

  updateValue(key: string, interpolateParams?: any): void {
    const res = this.translate.instant(key, interpolateParams);
    this.value = res !== undefined ? res : key;
    this.lastKey = key;
    this._ref.markForCheck();
  }

  transform(query: string, ...args: any[]): any {
    if (!query || !query.length) return query;
    // if we ask another time for the same key, return the last value
    if (equals(query, this.lastKey) && equals(args, this.lastParams)) return this.value;
    let interpolateParams: any;
    if (args[0] !== undefined && args[0] !== null && args.length) {
      if (typeof args[0] === 'string' && args[0].length) {
        // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
        // which is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
        const validArgs: string = args[0]
          // eslint-disable-next-line no-useless-escape
          .replace(/(\')?([a-zA-Z0-9_]+)(\')?(\s)?:/g, '"$2":')
          // eslint-disable-next-line no-useless-escape
          .replace(/:(\s)?(\')(.*?)(\')/g, ':"$3"');
        try {
          interpolateParams = JSON.parse(validArgs);
        } catch (e) {
          throw new SyntaxError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`);
        }
      } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) interpolateParams = args[0];
    }
    // store the query, in case it changes
    this.lastKey = query;
    // store the params, in case they change
    this.lastParams = args;
    // set the value
    this.updateValue(query, interpolateParams);
    // if there is a subscription to onLangChange, clean it
    this._dispose();
    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChange) {
      this.onLangChange = this.translate.onLangChange.subscribe((): void => {
        if (this.lastKey) {
          this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
          this.updateValue(query, interpolateParams);
        }
      }) as any as Subscription;
    }
    return this.value;
  }

  private _dispose(): void {
    if (this.onLangChange !== undefined) {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}

/**
 * Determines if two objects or two values are equivalent.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties are equal by
 *   comparing them with `equals`.
 *
 * @param o1 Object or value to compare.
 * @param o2 Object or value to compare.
 * @returns true if arguments are equal.
 */
export function equals(o1: any, o2: any): boolean {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  const t1 = typeof o1,
    t2 = typeof o2;
  let length: number, key: any, keySet: any;
  if (t1 === t2 && t1 === 'object') {
    if (Array.isArray(o1)) {
      if (!Array.isArray(o2)) return false;
      if ((length = o1.length) === o2.length) {
        for (key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    } else {
      if (Array.isArray(o2)) {
        return false;
      }
      keySet = Object.create(null);
      for (key in o1) {
        if (o1[key]) {
          if (!equals(o1[key], o2[key])) {
            return false;
          }
          keySet[key] = true;
        }
      }
      for (key in o2) {
        if (o2[key])
          if (!(key in keySet) && typeof o2[key] !== 'undefined') {
            return false;
          }
      }
      return true;
    }
  }
  return false;
}
