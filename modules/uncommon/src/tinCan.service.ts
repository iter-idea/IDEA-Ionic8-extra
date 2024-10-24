import { Injectable } from '@angular/core';

/**
 * @deprecated use a specific App service instead.
 */
@Injectable({ providedIn: 'root' })
export class IDEATinCanService {
  protected data: any;

  constructor() {
    this.clear();
  }

  /**
   * Set a variable with the given value.
   * @param variable variable to set
   * @param value value to assign to the variable
   */
  set(variable: string, value: any): void {
    this.data[variable] = value;
  }
  /**
   * Get the content of a variable.
   * @param variable variable to acquire
   * @param getAndDelete if set, delete the variable after the acquisition
   */
  get(variable: string, getAndDelete?: boolean): any {
    const ret = this.data[variable];
    if (getAndDelete) this.remove(variable);
    return ret;
  }
  /**
   * Remove a variable.
   * @param variable variable to remove
   */
  remove(variable: string): void {
    delete this.data[variable];
  }
  /**
   * Clear all the variables.
   */
  clear(): void {
    this.data = {};
  }
}
