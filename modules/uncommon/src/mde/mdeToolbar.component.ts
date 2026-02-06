import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IDEATranslatePipe } from '@idea-ionic/common';

@Component({
  selector: 'idea-mde-toolbar',
  imports: [CommonModule, IDEATranslatePipe],
  template: `
    <div class="mdeToolbar">
      <b>**{{ 'IDEA_UNCOMMON.MDE.TOOLBAR.BOLD' | translate }}**</b>
      <i>*{{ 'IDEA_UNCOMMON.MDE.TOOLBAR.ITALIC' | translate }}*</i>
      ~{{ 'IDEA_UNCOMMON.MDE.TOOLBAR.STRIKE' | translate }}~
    </div>
  `,
  styles: [
    `
      .mdeToolbar {
        text-align: right;
        color: #aaa;
        padding: 5px 0;
        font-size: 0.9em;
        b,
        i {
          padding-right: 5px;
        }
      }
    `
  ]
})
export class IDEAMDEToolbarComponent {}
