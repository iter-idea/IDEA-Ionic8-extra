import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IDEATranslatePipe } from '../translations/translate.pipe';

@Component({
  selector: 'app-tooltip',
  imports: [IDEATranslatePipe],
  template: `
    <div class="tooltipContainer" (mouseleave)="onTooltipMouseLeave()">
      <span class="closeButton" (click)="onClose()">×</span>
      @if (title) {
        <div class="tooltipTitle">{{ title }}</div>
      }
      <div class="tooltipText">{{ text }}</div>
      @if (link) {
        <a [href]="link" target="_blank" class="tooltipLink">{{ 'IDEA_COMMON.TOOLTIP.LEARN_MORE' | translate }}</a>
      }
    </div>
  `,
  styles: [
    `
      .tooltipContainer {
        position: absolute;
        background-color: #333;
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        white-space: normal;
        overflow-y: auto;
      }
      .tooltipTitle {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .tooltipLink {
        display: block;
        margin-top: 10px;
        text-align: center;
        background-color: var(--ion-color-primary);
        color: #fff;
        padding: 5px 10px;
        border-radius: 3px;
        text-decoration: none;
      }
      .closeButton {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        font-weight: bold;
        color: #fff;
        font-size: 14px;
      }
    `
  ]
})
export class IDEATooltipComponent {
  /**
   * The tooltip title.
   */
  @Input() title = '';
  /**
   * The tooltip text.
   */
  @Input() text = '';
  /**
   * The tooltip link.
   */
  @Input() link = '';
  /**
   * The tooltip close event.
   */
  @Output() closed = new EventEmitter<void>();

  onTooltipMouseLeave(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }
}
