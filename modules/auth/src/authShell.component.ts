import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { IDEAEnvironment, IDEATranslationsService, IDEATranslatePipe } from '@idea-ionic/common';

/**
 * The frame of the pages of `IDEAAuthRoutes`: the app's logo and name, the page's column, the footer's links. It sits
 * in the page's `<ion-content class="idea-auth">`, the page's root as Ionic's transitions expect, and carries the
 * pages' styles and tokens (see the module's README).
 */
@Component({
  selector: 'idea-auth-shell',
  imports: [IDEATranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['authPages.scss'],
  template: `
    <div class="idea-auth-page">
      <header class="idea-auth-header">
        <picture>
          @if (logo.dark) {
            <source media="(prefers-color-scheme: dark)" [attr.srcset]="logo.dark" />
          }
          <img class="idea-auth-logo" [src]="logo.light" [alt]="'IDEA_AUTH.SERVICE_LOGO' | translate" />
        </picture>
        @if (title || translationExists('IDEA_VARIABLES.TAGLINE')) {
          <div class="idea-auth-app-name">
            @if (title) {
              <span>{{ title }}</span>
            }
            @if (translationExists('IDEA_VARIABLES.TAGLINE')) {
              <span class="idea-auth-tagline">{{ 'IDEA_VARIABLES.TAGLINE' | translate }}</span>
            }
          </div>
        }
      </header>
      <main class="idea-auth-main">
        <div class="idea-auth-column">
          <ng-content />
        </div>
      </main>
      <footer class="idea-auth-footer">
        @if (website) {
          <button
            type="button"
            class="idea-auth-product"
            [title]="'IDEA_AUTH.IDEA_TAGLINE' | translate"
            (click)="openLink(website)"
          >
            <span>{{ 'IDEA_AUTH.PRODUCT_BY' | translate }}</span>
            <picture>
              <source media="(prefers-color-scheme: dark)" srcset="assets/icons/idea-alt.png" />
              <img src="assets/icons/idea.png" alt="ITER IDEA" />
            </picture>
          </button>
        }
        <nav class="idea-auth-footer-links">
          @if (translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL')) {
            <a target="_blank" rel="noopener" [href]="'IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL' | translate">
              {{ 'IDEA_AUTH.TERMS_AND_CONDITIONS' | translate }}
            </a>
          }
          @if (translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL')) {
            <a target="_blank" rel="noopener" [href]="'IDEA_VARIABLES.PRIVACY_POLICY_URL' | translate">
              {{ 'IDEA_AUTH.PRIVACY_POLICY' | translate }}
            </a>
          }
          @if (hasIntroPage) {
            <button type="button" (click)="goToIntro()">{{ 'IDEA_AUTH.BACK_TO_INTRO' | translate }}</button>
          }
        </nav>
      </footer>
    </div>
  `
})
export class IDEAAuthShellComponent {
  private _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _translate = inject(IDEATranslationsService);

  logo: { light: string; dark?: string } = this._env.idea.auth.logo || {
    light: 'assets/icons/icon-auth.svg',
    dark: 'assets/icons/icon-auth-alt.svg'
  };
  title: string = this._env.idea.auth.title;
  website: string = this._env.idea.auth.website;
  hasIntroPage: boolean = this._env.idea.auth.hasIntroPage;

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }

  goToIntro(): void {
    this._nav.navigateBack(['intro']);
  }
  async openLink(url: string): Promise<void> {
    await Browser.open({ url });
  }
}
