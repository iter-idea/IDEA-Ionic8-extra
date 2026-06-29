import { inject, Injectable, PendingTasks } from '@angular/core';
import { Attachment } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEAApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class IDEAAttachmentsService {
  protected _env = inject(IDEAEnvironment);
  protected _api = inject(IDEAApiService);
  private _pendingTasks = inject(PendingTasks);

  /**
   * Upload a new attachment related to an entity and return the `attachmentId`.
   */
  async uploadAndGetId(
    file: File,
    entityPath: string | string[],
    options: { customAction?: string } = {}
  ): Promise<string> {
    // Track the upload as an Angular pending task, so change detection runs after the awaited result
    // (the raw S3 `fetch` PUT settles outside the Angular zone on Zone-based apps).
    const removePendingTask = this._pendingTasks.add();
    try {
      const { maxFileUploadSizeMB } = this._env.idea.app;
      if (maxFileUploadSizeMB && bytesToMegaBytes(file.size) > maxFileUploadSizeMB) throw new Error('File is too big');
      const body = { action: options.customAction || 'GET_ATTACHMENT_UPLOAD_URL' };
      const { url, id } = await this._api.patchResource(entityPath, { body });
      await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      return id;
    } finally {
      removePendingTask();
    }
  }

  /**
   * Get the URL to download an attachment related to an entity.
   */
  async getDownloadURL(
    attachment: Attachment | string,
    entityPath: string | string[],
    options: { customAction?: string } = {}
  ): Promise<string> {
    const body = {
      action: options.customAction || 'GET_ATTACHMENT_DOWNLOAD_URL',
      attachmentId: typeof attachment === 'string' ? attachment : attachment.attachmentId
    };
    const { url } = await this._api.patchResource(entityPath, { body });
    return url;
  }
}

/**
 * Approximate conversion of bytes in MB.
 */
export const bytesToMegaBytes = (bytes: number): number => bytes / 1024 ** 2;
