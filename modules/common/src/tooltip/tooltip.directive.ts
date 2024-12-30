import {
  Directive,
  ElementRef,
  Input,
  ComponentRef,
  ViewContainerRef,
  Injector,
  HostListener,
  inject,
  OnDestroy
} from '@angular/core';

import { IDEATooltipComponent } from './tooltip.component';

import { IDEATranslationsService } from '../translations/translations.service';

@Directive({ standalone: true, selector: '[tooltip]' })
export class IDEATooltipDirective implements OnDestroy {
  private _injector = inject(Injector);
  private _elementRef = inject(ElementRef);
  private _viewContainerRef = inject(ViewContainerRef);
  private _translate = inject(IDEATranslationsService);

  /**
   * The key in the translations for the tooltip.
   * From this keys we also get the link ("_L") and title ("_T"), if any.
   */
  @Input('tooltip') hint = '';
  /**
   * The delay before showing the tooltip.
   */
  @Input() tooltipDelay = 1000;

  private tooltipRef: ComponentRef<IDEATooltipComponent> | null = null;
  private showTimeout: any;

  @HostListener('mouseover') onMouseOver(): void {
    this.showTooltip(this.tooltipDelay);
  }
  @HostListener('mouseout') onMouseOut(): void {
    clearTimeout(this.showTimeout);
  }

  private showTooltip(delay: number): void {
    this.clearTooltip();
    this.showTimeout = setTimeout((): void => {
      this.createTooltip();
    }, delay);
  }

  private createTooltip(): void {
    if (this.tooltipRef) return;

    this.tooltipRef = this._viewContainerRef.createComponent(IDEATooltipComponent, { injector: this._injector });

    const instance = this.tooltipRef.instance;
    instance.title = this._translate._(`${this.hint}_T`);
    instance.text = this._translate._(this.hint);
    instance.link = this._translate._(`${this.hint}_L`);
    instance.closed.subscribe((): void => {
      this.hideTooltip();
    });

    const rect = this._elementRef.nativeElement.getBoundingClientRect();
    const tooltipElement = this.tooltipRef.location.nativeElement;

    const tooltipWidth = 300;
    const viewportWidth = window.innerWidth;

    let top = rect.top - 50;
    let left = rect.left;
    if (top < 0) top = rect.bottom + 10;
    if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth - 10;
    if (left < 0) left = 10;

    tooltipElement.style.position = 'absolute';
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.width = `${tooltipWidth}px`;
    tooltipElement.style['max-height'] = `${tooltipWidth}px`;

    document.body.appendChild(tooltipElement);
  }

  private clearTooltip(): void {
    clearTimeout(this.showTimeout);
    this.hideTooltip();
  }

  private hideTooltip(): void {
    if (this.tooltipRef) {
      this.tooltipRef.destroy();
      this.tooltipRef = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTooltip();
  }
}
