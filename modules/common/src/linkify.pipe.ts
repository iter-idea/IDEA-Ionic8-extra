import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Checks a string for URLs and if so, makes them clickable and returns the sanitized html.
 */
@Pipe({ name: 'linkify', pure: true, standalone: true })
export class IDEALinkifyPipe implements PipeTransform {
  private _sanitizer = inject(DomSanitizer);

  transform(text: string): string {
    if (!text) return text;

    const urlRegex = /(\b(https?:\/\/|www\.)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    const result = text.replace(urlRegex, url => {
      let href = url;
      if (url.startsWith('www.')) href = 'https://' + url;
      return `<a href="${href}" target="_blank">${url}</a>`;
    });

    return this._sanitizer.sanitize(SecurityContext.HTML, result);
  }
}
