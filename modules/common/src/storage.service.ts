import { Injectable, inject } from '@angular/core';

import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class IDEAStorageService {
  private _storage = inject(Storage);

  private theStorage: Storage | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    const storage = await this._storage.create();
    this.theStorage = storage;
  }
  async ready(): Promise<void> {
    return new Promise(resolve => this.readyHelper(resolve));
  }
  private readyHelper(resolve: any): void {
    if (this.theStorage) resolve();
    else setTimeout((): void => this.readyHelper(resolve), 100);
  }

  async set(key: string, value: any): Promise<void> {
    return await this.theStorage?.set(key, value);
  }
  async get(key: string): Promise<any> {
    return await this.theStorage?.get(key);
  }
  async remove(key: string): Promise<void> {
    return await this.theStorage?.remove(key);
  }
  async clear(): Promise<void> {
    return await this.theStorage?.clear();
  }
  async keys(): Promise<string[]> {
    return await this.theStorage?.keys();
  }
  async length(): Promise<number> {
    return await this.theStorage?.length();
  }
}
