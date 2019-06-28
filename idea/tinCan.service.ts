import { Injectable } from '@angular/core';

@Injectable()
export class IDEATinCan {
  protected data: any;

  constructor() {
    this.clear();
  }

  /**
   * Set a variable with the given value.
   * @param variable variable to set
   * @param value value to assign to the variable
   */
  public set(variable: string, value: any) {
    this.data[variable] = value;
  }
  /**
   * Get the content of a variable.
   * @param variable variable to acquire
   * @param getAndDelete if set, delete the variable after the acquisition
   */
  public get(variable: string, getAndDelete?: boolean): any {
    const ret = this.data[variable];
    if (getAndDelete) this.remove(variable);
    return ret;
  }
  /**
   * Remove a variable.
   * @param variable variable to remove
   */
  public remove(variable: string) {
    delete this.data[variable];
  }
  /**
   * Clear all the variables.
   */
  public clear() {
    this.data = {};
  }
}
