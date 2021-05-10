import { Component, Input } from '@angular/core';
import { AlertController, ModalController, PopoverController } from '@ionic/angular';
import {
  Label,
  LabelVariable,
  Languages,
  PDFTemplateBlueprint,
  PDFTemplateComplexField,
  PDFTemplateSection,
  PDFTemplateSectionBlueprint,
  PDFTemplateSectionTypes,
  PDFTemplateSimpleField,
  Suggestion
} from 'idea-toolbox';

import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEAMessageService } from '../message.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAActionSheetController } from '../actionSheet/actionSheetController.service';

import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEASuggestionsComponent } from '../select/suggestions.component';

@Component({
  selector: 'idea-pdf-template',
  templateUrl: 'pdfTemplate.component.html',
  styleUrls: ['pdfTemplate.component.scss']
})
export class IDEAPDFTemplateComponent {
  /**
   * The blueprint to define the allowed sections and fields for this PDF template.
   */
  @Input() public blueprint: PDFTemplateBlueprint;
  /**
   * The PDF template to manage, as list of sections.
   */
  @Input() public template: PDFTemplateSection[];
  /**
   * Language preferences.
   */
  @Input() public languages: Languages;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * The working copy of the PDF template to manage, to avoid touching the original until changes are saved.
   */
  public _template: PDFTemplateSection[];
  /**
   * A stack of inner layers of the main template, to navigate and modify the inner sections, following a path.
   */
  public stack: PDFTemplateLayer[] = [];
  /**
   * Helper to use the enum in the UI.
   */
  public ST = PDFTemplateSectionTypes;
  /**
   * Whether we are editing the sections.
   */
  public editSections = false;
  /**
   * Helper structure to move a field to another position.
   */
  public moveMode: MoveModeData = null;
  /**
   * The errors to show in the UI.
   */
  public errors: Set<string> = new Set<string>();

  constructor(
    public tc: IDEATinCanService,
    public popoverCtrl: PopoverController,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: IDEAActionSheetController,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    // work on a copy
    this._template = (this.template || []).map(section => new PDFTemplateSection(section, this.languages));
    // prepare the stack (base level, i.e. the main template), to view and manage inner sections
    this.stack = [{ blueprint: this.blueprint, template: this._template }];
  }

  /**
   * Get the top layer of the stack.
   */
  public getCurrentLayer(): PDFTemplateLayer {
    return this.stack[this.stack.length - 1];
  }
  /**
   * Get the template of the top layer of the stack.
   */
  public getCurrentTemplate(): PDFTemplateSection[] {
    return this.getCurrentLayer().template;
  }
  /**
   * Map as an array of strings the variables available in this stack.
   */
  public getCurrentVariables(): string[] {
    return this.getCurrentLayer().blueprint.variables.map(v => v.code);
  }
  /**
   * Open an inner section (pushing into the stack), to manage its template.
   */
  public openInnerSection(section: PDFTemplateSection) {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    // get the blueprint of the desired section
    const blueprint = this.getCurrentLayer().blueprint.innerBlueprints.find(ib => ib.context === section.context);
    // if a blueprint wasn't found, we can't go on
    if (!blueprint) return;
    this.stack.push({ blueprint, template: section.innerTemplate, title: section.title });
    // check for errors, to highlight them right away
    this.checkErrorsOnCurrentLayer();
  }
  /**
   * Calculate the breadcrumb based on the stack.
   */
  public getBreadcrumb(): string[] {
    return this.stack.map(c => c.blueprint.description);
  }
  /**
   * Whether it's the main (base) layer or an inner one.
   */
  public isInnerLayer(): boolean {
    return this.stack.length > 1;
  }
  /**
   * Go back to previous layers of the stack.
   */
  public prevLayer(howMany?: number) {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    howMany = howMany === undefined ? 1 : Number(howMany);
    while (howMany-- > 0 && this.stack.length > 1) this.stack.pop();
    // check for errors, to highlight them right away
    this.checkErrorsOnCurrentLayer();
  }

  /**
   * Open the picker to choose the type of section to add.
   */
  public addSection() {
    const buttons = [];
    // add the standard sections
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.NORMAL_ROW'),
      icon: 'apps',
      handler: () => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.ROW }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.HEADER'),
      icon: 'bookmark',
      handler: () => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.HEADER }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.BLANK_ROW'),
      icon: 'code',
      handler: () => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.BLANK_ROW }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.PAGE_BREAK'),
      icon: 'code-slash',
      handler: () => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.PAGE_BREAK }, this.languages))
    });
    // add the inner and repeated sections, based on the blueprint
    if (this.getCurrentLayer().blueprint.innerBlueprints)
      // identify each possible internal section by the inner blueprints
      this.getCurrentLayer().blueprint.innerBlueprints.forEach(ib => {
        buttons.push({
          text: ib.description,
          icon: ib.icon,
          handler: () =>
            this.addSectionHelper(
              new PDFTemplateSection(
                { type: ib.type, description: ib.description, context: ib.context },
                this.languages
              )
            )
        });
      });
    // add the cancel button and show the action sheet
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_INSERT'), buttons })
      .then(actions => actions.present());
  }
  /**
   * Complete and add the section to the current template.
   */
  private addSectionHelper(section: PDFTemplateSection) {
    // complete the section, based on its type
    switch (section.type) {
      case this.ST.HEADER:
        section.title[this.languages.default] = this.t._('IDEA_COMMON.PDF_TEMPLATE.NEW_HEADER');
        break;
    }
    // add the new section to the current template
    this.getCurrentTemplate().push(section);
  }
  /**
   * Ask and delete a section from the template.
   */
  public deleteSection(section: PDFTemplateSection) {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_COMMON.PDF_TEMPLATE.REMOVE_SECTION'),
        subHeader: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: () => this.getCurrentTemplate().splice(this.getCurrentTemplate().indexOf(section), 1)
          }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Move the section up of one position in the template.
   */
  public moveSectionUpInTemplate(section: PDFTemplateSection) {
    this.moveSectionInTemplateByNumPositions(section, -1);
  }
  /**
   * Move the section down of one position in the template.
   */
  public moveSectionDownInTemplate(section: PDFTemplateSection) {
    this.moveSectionInTemplateByNumPositions(section, 1);
  }
  /**
   * Move the section up (negative) / down (positive) of `numPosition` in the template's array.
   */
  protected moveSectionInTemplateByNumPositions(section: PDFTemplateSection, numPositions: number) {
    const fromIndex = this.getCurrentTemplate().indexOf(section);
    const toIndex = fromIndex + numPositions;
    if (toIndex >= 0 && toIndex <= this.getCurrentTemplate().length)
      this.getCurrentTemplate().splice(toIndex, 0, this.getCurrentTemplate().splice(fromIndex, 1)[0]);
  }
  /**
   * Get the icon of an inner (repated) section, based on its blueprint.
   */
  public getInnerSectionIcon(section: PDFTemplateSection): string {
    const bp = this.getCurrentLayer().blueprint.innerBlueprints.find(ib => ib.context === section.context);
    return bp ? bp.icon : 'help';
  }

  /**
   * Display a label content, based on the language settings.
   */
  public label(label: Label): string {
    return label.translate(this.t.getCurrentLang(), this.t.languages());
  }

  /**
   * Edit the label of an header row.
   */
  public editHeaderLabel(label: Label) {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    // open the labeler
    this.modalCtrl
      .create({
        component: IDEALabelerComponent,
        componentProps: {
          label,
          title: this.t._('IDEA_COMMON.PDF_TEMPLATE.HEADER'),
          obligatory: true,
          variables: this.getCurrentLayer().blueprint.variables,
          disabled: this.disabled
        },
        cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
      })
      .then(modal => modal.present());
  }

  /**
   * Edit the title of an inner section.
   */
  public editSectionTitleLabel(label: Label) {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    // open the labeler
    this.modalCtrl
      .create({
        component: IDEALabelerComponent,
        componentProps: {
          label,
          title: this.t._('IDEA_COMMON.PDF_TEMPLATE.INNER_SECTION_TITLE'),
          obligatory: false,
          disabled: this.disabled
        },
        cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
      })
      .then(modal => modal.present());
  }

  /**
   * Open the picker to choose the type of field to add.
   */
  public addField(section: PDFTemplateSection, indexCol: number) {
    // skip in case the section isn't of type ROW
    if (section.type !== this.ST.ROW) return;
    // skip in case the column is already occupied
    if (!section.isColumnEmpty(indexCol)) return;
    // let the user choose between simple and complex field
    const buttons = [];
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.SIMPLE_FIELD'),
      icon: 'at',
      handler: () => this.addSimpleField(section, indexCol)
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.COMPLEX_FIELD'),
      icon: 'shapes',
      handler: () => this.addComplexField(section, indexCol)
    });
    // add the cancel button and show the action sheet
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_INSERT'), buttons })
      .then(actions => actions.present());
  }
  /**
   * Add a simple field to the selected section of type ROW.
   */
  private addSimpleField(section: PDFTemplateSection, colIndex: number) {
    // let the user pick a variable from the list available on this layer, and add a simple field to the desired column
    this.pickVariableFromList(
      variable => (section.columns[colIndex] = new PDFTemplateSimpleField(variable, this.languages))
    );
  }
  /**
   * Add a complex field to the selected section of type ROW.
   */
  private addComplexField(section: PDFTemplateSection, colIndex: number) {
    // init the content of a new complex field
    const content = new Label(null, this.languages);
    content[this.languages.default] = '--';
    // set the field in the chosen column of the section
    section.columns[colIndex] = new PDFTemplateComplexField({ content }, this.languages);
    // directly open the field
    this.openField(section, colIndex);
  }
  /**
   * Allow the user to pick a variable from the list available in this layer.
   */
  private pickVariableFromList(callback: (variable: LabelVariable) => void) {
    // prepare the list of suggestions for the picker
    const suggestions = this.getCurrentLayer().blueprint.variables.map(
      v => new Suggestion({ value: v.code, name: this.label(v.label) })
    );
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: { data: suggestions, hideClearButton: true },
        cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
      })
      .then(modal => {
        modal.onDidDismiss().then(res => {
          if (res && res.data) {
            // if a suggestion was selected, find the original variable and return it
            const variable = this.getCurrentLayer().blueprint.variables.find(v => v.code === res.data.value);
            if (variable) callback(variable);
          }
        });
        modal.present();
      });
  }

  /**
   * Display the field contained in a section's (ROW) column.
   */
  public displayField(section: PDFTemplateSection, colIndex: number, forceLabel?: boolean): string {
    // skip in case the column doesn't contain a field
    if (!section.doesColumnContainAField(colIndex)) return;
    const field = section.columns[colIndex] as PDFTemplateComplexField | PDFTemplateSimpleField;
    // recognize whether we are dealing with a complex or a simple field
    if (field.isComplex()) return this.label((field as PDFTemplateComplexField).content);
    else
      return forceLabel
        ? this.label((field as PDFTemplateSimpleField).label)
        : (field as PDFTemplateSimpleField).code.slice(1);
  }

  /**
   * Manage a field (ask what to do).
   */
  public manageField(section: PDFTemplateSection, colIndex: number, event?: any) {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    // skip in case the column doesn't contain a field
    if (!section.doesColumnContainAField(colIndex)) return;
    // if in view mode, directly open the field
    if (this.disabled) return this.openField(section, colIndex);
    // let the user choose what to do with the field
    const buttons = [];
    buttons.push({ text: this.t._('COMMON.EDIT'), icon: 'pencil', handler: () => this.openField(section, colIndex) });
    buttons.push({ text: this.t._('COMMON.MOVE'), icon: 'move', handler: () => this.moveField(section, colIndex) });
    buttons.push({
      text: this.t._('COMMON.RESIZE'),
      icon: 'resize',
      handler: () => this.resizeField(section, colIndex, event)
    });
    buttons.push({
      text: this.t._('COMMON.DELETE'),
      icon: 'trash',
      role: 'destructive',
      handler: () => this.deleteField(section, colIndex)
    });
    // add the cancel button and show the action sheet
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });
    this.actionSheetCtrl
      .create({ header: this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_DO_WITH_FIELD'), buttons })
      .then(actions => actions.present());
  }
  /**
   * Open the field to see or manage it (based on the UXmode).
   */
  private openField(section: PDFTemplateSection, colIndex: number) {
    // identify the field
    const field = section.columns[colIndex] as PDFTemplateComplexField | PDFTemplateSimpleField;
    // open the labeler with different parameters, based on the type of field
    this.modalCtrl
      .create({
        component: IDEALabelerComponent,
        componentProps: {
          label: field.isComplex()
            ? (field as PDFTemplateComplexField).content
            : (field as PDFTemplateSimpleField).label,
          title: field.isComplex()
            ? this.t._('IDEA_COMMON.PDF_TEMPLATE.COMPLEX_FIELD')
            : this.t._('IDEA_COMMON.PDF_TEMPLATE.SIMPLE_FIELD'),
          obligatory: field.isComplex(),
          markdown: field.isComplex(),
          textarea: field.isComplex(),
          disabled: this.disabled,
          variables: field.isComplex() ? this.getCurrentLayer().blueprint.variables : []
        },
        cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
      })
      .then(modal => modal.present());
  }
  /**
   * Check whether a field can move and enter in "move mode".
   */
  private moveField(section: PDFTemplateSection, colIndex: number) {
    // check whether the field has an empty column which it could move on this layer
    if (!this.canFieldMoveAnywhere())
      return this.message.error('IDEA_COMMON.PDF_TEMPLATE.NO_EMPTY_SLOT_WHERE_TO_MOVE_FIELD');
    // hint the user that the field can now be moved and save the original position; the UI enter in "move mode"
    this.message.info('IDEA_COMMON.PDF_TEMPLATE.CHOOSE_WHERE_TO_MOVE_FIELD');
    this.disabled = true;
    this.moveMode = { section, colIndex } as MoveModeData;
  }
  /**
   * Check whether in this layer there is at least an empty spot where the field could move.
   */
  private canFieldMoveAnywhere(): boolean {
    return (
      this.getCurrentLayer()
        // filter the sections containing fields
        .template.filter(s => s.type === this.ST.ROW)
        // search for at least one that contains at least a column which is empty
        .some(s => s.columns.some((_, index) => s.isColumnEmpty(index)))
    );
  }
  /**
   * Move the field to the new location (if changed) and exit the move mode.
   */
  public completeMove(newSection: PDFTemplateSection, newColIndex: number) {
    const prev = this.moveMode;
    // check whether we are moving at all
    if (newSection !== prev.section || newColIndex !== prev.colIndex) {
      // get the current size of the field
      let size = prev.section.getColumnFieldSize(prev.colIndex);
      // get the field
      const field = prev.section.columns[prev.colIndex];
      // insert the field in the new position (try to fill all the empty slots up to its space)
      newSection.columns[newColIndex] = field;
      let i = 1;
      while (--size > 0 && newColIndex + i < 12 && !newSection.columns[newColIndex + i]) {
        newSection.columns[newColIndex + i] = '-';
        i++;
      }
      // remove the field from the previous position
      prev.section.removeFieldFromOccupiedColumns(prev.colIndex);
    }
    // exit move mode
    this.moveMode = null;
    this.disabled = false;
  }
  /**
   * Allow the user to resize the field up to the maximum allowed by the current position of the field itself.
   */
  private resizeField(section: PDFTemplateSection, colIndex: number, event?: any) {
    // calculate how much the field can grow
    const fieldSize = section.getColumnFieldSize(colIndex);
    let howMuchCanGrow = 0;
    // search for the first occupied column after the field: until there, the field can grow
    section.columns.slice(colIndex + fieldSize).some((_, index) => {
      if (section.isColumnEmpty(colIndex + fieldSize + index)) {
        howMuchCanGrow++;
        return false;
      } else return true;
    });
    // open the popover to let the user grow or shrink the field
    this.popoverCtrl
      .create({
        component: IDEAPDFTemplateFieldResizeComponent,
        componentProps: {
          columns: section.columns,
          colIndex,
          size: fieldSize,
          max: fieldSize + howMuchCanGrow
        },
        event
      })
      .then(popover => popover.present());
  }
  /**
   * Delete a field and remove it from any of the occupied columns.
   */
  private deleteField(section: PDFTemplateSection, colIndex: number) {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
            handler: () => section.removeFieldFromOccupiedColumns(colIndex)
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Whether I can do normal actions or the view is locked on some stage.
   */
  public isViewLocked(): boolean {
    return this.editSections || Boolean(this.moveMode);
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }
  /**
   * Check and highlight the errors on the current layer.
   */
  private checkErrorsOnCurrentLayer() {
    this.errors = new Set<string>();
    this.getCurrentLayer().template.forEach((s, i) => {
      s.validate(this.languages, this.getCurrentLayer().blueprint.variables).forEach(e => {
        // highlight a specific column of a section of type ROW
        if (e.startsWith('columns[')) this.errors.add(`s[${i}].${e}`);
        // highlight the entire section
        else this.errors.add(`s[${i}]`);
      });
    });
  }

  /**
   * Save the changes and close.
   */
  public save() {
    // check for errors (on top layer, but recursively on inner layers as well)
    this.checkErrorsOnCurrentLayer();
    if (this.errors.size) return this.message.error('IDEA_COMMON.PDF_TEMPLATE.ONE_OR_MORE_SECTIONS_HAVE_ERRORS');
    // save changes (without losing reference of the original array) and close
    this.template.splice(0, this.template.length);
    this._template.forEach(section => this.template.push(new PDFTemplateSection(section, this.languages)));
    this.close();
  }
  /**
   * Close without saving changes.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}

/**
 * It represents the layer (inner level) of a template.
 */
export interface PDFTemplateLayer {
  /**
   * The blueprint that the define the layer.
   */
  blueprint: PDFTemplateBlueprint | PDFTemplateSectionBlueprint;
  /**
   * The actual template, based on the blueprint.
   */
  template: PDFTemplateSection[];
  /**
   * The title of the level, in case of INNER_SECTION or REPEATED_INNER_SECTION.
   */
  title?: Label;
}

/**
 * Helper structure to move a field to another position.
 */
export interface MoveModeData {
  /**
   * The section (ROW) containing the field to move.
   */
  section: PDFTemplateSection;
  /**
   * The position of the field in the columns (index).
   */
  colIndex: number;
}

/**
 * Helper component to resize a field in the template.
 */
@Component({
  selector: 'idea-pdf-template-field-resize',
  template: `
    <ion-content>
      <ion-grid>
        <ion-row class="ion-align-items-center">
          <ion-col class="ion-text-center">
            <ion-button size="small" [disabled]="size === 1" (click)="shrink()">
              <ion-icon name="remove" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-label>
              {{ 'IDEA_COMMON.PDF_TEMPLATE.SIZE' | translate }}: <b>{{ size }}</b>
            </ion-label>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-button size="small" [disabled]="size === max" (click)="grow()">
              <ion-icon name="add" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
        <ion-row class="ion-align-items-center">
          <ion-col class="ion-text-center">
            <ion-button size="small" color="secondary" [disabled]="size === 1" (click)="shrinkToMin()">
              <ion-icon name="contract" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-button size="small" color="secondary" [disabled]="size === max" (click)="growToMax()">
              <ion-icon name="expand" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-white);
      }
    `
  ]
})
export class IDEAPDFTemplateFieldResizeComponent {
  /**
   * The columns of the section containing the field.
   */
  @Input() public columns: string[];
  /**
   * The current position of the field.
   */
  @Input() public colIndex: number;
  /**
   * The current size of the field.
   */
  @Input() public size: number;
  /**
   * The max size to which the field can grow.
   */
  @Input() public max: number;

  constructor() {}

  /**
   * Increase the size of the field by one.
   */
  public grow() {
    if (this.size < this.max && !this.columns[this.colIndex + this.size]) {
      this.columns[this.colIndex + this.size] = '-';
      this.size++;
    }
  }
  /**
   * Increase the size of the field till the maximum allowed.
   */
  public growToMax() {
    while (this.size < this.max) this.grow();
  }
  /**
   * Decrease the size of the field by one.
   */
  public shrink() {
    if (this.size > 1 && this.columns[this.colIndex + this.size - 1] === '-') {
      this.columns[this.colIndex + this.size - 1] = null;
      this.size--;
    }
  }
  /**
   * Decrease the size of the field till the minimum allowed.
   */
  public shrinkToMin() {
    while (this.size > 1) this.shrink();
  }
}
