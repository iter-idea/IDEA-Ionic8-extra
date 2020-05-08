Since it isn't used anywhere, we disabled it so that it won't require `capacitor-data-storage-sqlite`

```
import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import * as CDSSPlugin from 'capacitor-data-storage-sqlite';
const { CapacitorDataStorageSqlite, Device } = Plugins;

/**
 * Manage a DB offline. It works on SQLite on iOS, Android and Electron; web storage otherwise.
 */
@Injectable({
  providedIn: 'root'
})
export class IDEAOfflineDBService {
  /**
   * The provider with which to store the data.
   */
  protected store: CDSSPlugin.CapacitorDataStorageSqliteWeb | CDSSPlugin.CapacitorDataStorageSqlitePluginElectron;
  /**
   * Whether the service is initilized and ready to use.
   */
  protected isService: boolean;

  /**
   * Plugin initialization.
   */
  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      Device.getInfo()
        .then(info => {
          if (info.platform === 'ios' || info.platform === 'android')
            this.store = CapacitorDataStorageSqlite as CDSSPlugin.CapacitorDataStorageSqliteWeb;
          else if (info.platform === 'electron') this.store = CDSSPlugin.CapacitorDataStorageSqliteElectron;
          else this.store = CDSSPlugin.CapacitorDataStorageSqlite;
          this.isService = true;
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Open a database.
   */
  public async openDB(database: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .openStore({ database })
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Delete a database.
   */
  public async deleteStore(database: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .deleteStore({ database })
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Set a table (or create it, if it doesn't exist).
   */
  public async setTable(table: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .setTable({ table })
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Set an object by key in the current table.
   */
  public async setObject(key: string, object: object): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService || !key) return reject();
      this.store
        .set({ key, value: JSON.stringify(object) })
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Get an object by key in the current table.
   */
  public async getObject(key: string): Promise<object> {
    return new Promise((resolve, reject) => {
      if (!this.isService || !key) return reject();
      this.store
        .get({ key })
        .then(res => {
          if (res.result) resolve(JSON.parse(res.value));
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Test the existance of a key in the current table.
   */
  public async isKey(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isService || !key) return reject();
      this.store
        .iskey({ key })
        .then(res => resolve(res.result))
        .catch(err => reject(err));
    });
  }
  /**
   * Get all the keys of the current table.
   */
  public async getAllKeys(): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .keys()
        .then(res => {
          if (res.result) resolve(res.keys);
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Get all the objects of the current table.
   */
  public async getAllObjects(): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .values()
        .then(res => {
          if (res.result) resolve(res.values.map(x => JSON.parse(x)));
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Get all the keys and objects of the current table.
   */
  public async getAllKeysObjects(): Promise<Array<{ key: string; object: object }>> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store.keysvalues().then(res => {
        if (res.result) resolve(res.keysvalues.map(x => ({ key: x.key, object: JSON.parse(x.value) })));
        else reject();
      });
    });
  }
  /**
   * Remove an object by key in the current table.
   */
  public async removeObject(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService || !key) return reject();
      this.store
        .remove({ key })
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Clear the current table.
   */
  public async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isService) return reject();
      this.store
        .clear()
        .then(res => {
          if (res.result) resolve();
          else reject();
        })
        .catch(err => reject(err));
    });
  }
}
```
