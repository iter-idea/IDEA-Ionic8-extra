import { Injectable } from '@angular/core';

import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class IDEAStorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async set(key: string, value: any): Promise<void> {
    return await this._storage?.set(key, value);
  }
  async get(key: string): Promise<any> {
    return await this._storage?.get(key);
  }
  async remove(key: string): Promise<void> {
    return await this._storage?.remove(key);
  }
  async clear(): Promise<void> {
    return await this._storage?.clear();
  }
  async keys(): Promise<string[]> {
    return await this._storage?.keys();
  }
  async length(): Promise<number> {
    return await this._storage?.length();
  }
}
