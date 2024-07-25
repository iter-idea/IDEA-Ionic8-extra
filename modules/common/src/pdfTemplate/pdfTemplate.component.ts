import { Component, Input, OnInit } from '@angular/core';
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
export class IDEAPDFTemplateComponent implements OnInit {
  /**
   * The blueprint to define the allowed sections and fields for this PDF template.
   */
  @Input() blueprint: PDFTemplateBlueprint;
  /**
   * The PDF template to manage, as list of sections.
   */
  @Input() template: PDFTemplateSection[];
  /**
   * Language preferences.
   */
  @Input() languages: Languages;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled = false;

  /**
   * The working copy of the PDF template to manage, to avoid touching the original until changes are saved.
   */
  _template: PDFTemplateSection[];
  /**
   * A stack of inner layers of the main template, to navigate and modify the inner sections, following a path.
   */
  stack: PDFTemplateLayer[] = [];

  ST = PDFTemplateSectionTypes;
  editSections = false;
  moveMode: MoveModeData = null;
  errors = new Set<string>();

  constructor(
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: IDEAActionSheetController,
    private message: IDEAMessageService,
    private t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    // work on a copy
    this._template = (this.template || []).map(section => new PDFTemplateSection(section, this.languages));
    // prepare the stack (base level, i.e. the main template), to view and manage inner sections
    this.stack = [{ blueprint: this.blueprint, template: this._template }];
  }

  getCurrentLayer(): PDFTemplateLayer {
    return this.stack[this.stack.length - 1];
  }
  getCurrentTemplate(): PDFTemplateSection[] {
    return this.getCurrentLayer().template;
  }
  getCurrentVariables(): string[] {
    return this.getCurrentLayer().blueprint.variables.map(v => v.code);
  }
  openInnerSection(section: PDFTemplateSection): void {
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
  getBreadcrumb(): string[] {
    return this.stack.map(c => c.blueprint.description);
  }
  isInnerLayer(): boolean {
    return this.stack.length > 1;
  }
  prevLayer(howMany?: number): void {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    howMany = howMany === undefined ? 1 : Number(howMany);
    while (howMany-- > 0 && this.stack.length > 1) this.stack.pop();
    // check for errors, to highlight them right away
    this.checkErrorsOnCurrentLayer();
  }

  async addSection(): Promise<void> {
    const buttons = [];
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.NORMAL_ROW'),
      icon: 'apps',
      handler: (): void => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.ROW }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.HEADER'),
      icon: 'bookmark',
      handler: (): void => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.HEADER }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.BLANK_ROW'),
      icon: 'code',
      handler: (): void => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.BLANK_ROW }, this.languages))
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.PAGE_BREAK'),
      icon: 'code-slash',
      handler: (): void => this.addSectionHelper(new PDFTemplateSection({ type: this.ST.PAGE_BREAK }, this.languages))
    });

    // add the inner and repeated sections, based on the blueprint
    if (this.getCurrentLayer().blueprint.innerBlueprints)
      // identify each possible internal section by the inner blueprints
      this.getCurrentLayer().blueprint.innerBlueprints.forEach(ib => {
        buttons.push({
          text: ib.description,
          icon: ib.icon,
          handler: (): void =>
            this.addSectionHelper(
              new PDFTemplateSection(
                { type: ib.type, description: ib.description, context: ib.context },
                this.languages
              )
            )
        });
      });

    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });

    const header = this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_INSERT');
    const actions = await this.actionSheetCtrl.create({ header, buttons });
    actions.present();
  }
  private addSectionHelper(section: PDFTemplateSection): void {
    // complete the section, based on its type
    switch (section.type) {
      case this.ST.HEADER:
        section.title[this.languages.default] = this.t._('IDEA_COMMON.PDF_TEMPLATE.NEW_HEADER');
        break;
    }
    // add the new section to the current template
    this.getCurrentTemplate().push(section);
  }
  async deleteSection(section: PDFTemplateSection): Promise<void> {
    const header = this.t._('IDEA_COMMON.PDF_TEMPLATE.REMOVE_SECTION');
    const subHeader = this.t._('COMMON.ARE_YOU_SURE');
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      {
        text: this.t._('COMMON.CONFIRM'),
        handler: (): PDFTemplateSection[] =>
          this.getCurrentTemplate().splice(this.getCurrentTemplate().indexOf(section), 1)
      }
    ];

    const alert = await this.alertCtrl.create({ header, subHeader, buttons });
    await alert.present();
  }
  moveSectionUpInTemplate(section: PDFTemplateSection): void {
    this.moveSectionInTemplateByNumPositions(section, -1);
  }
  moveSectionDownInTemplate(section: PDFTemplateSection): void {
    this.moveSectionInTemplateByNumPositions(section, 1);
  }
  private moveSectionInTemplateByNumPositions(section: PDFTemplateSection, numPositions: number): void {
    const fromIndex = this.getCurrentTemplate().indexOf(section);
    const toIndex = fromIndex + numPositions;
    if (toIndex >= 0 && toIndex <= this.getCurrentTemplate().length)
      this.getCurrentTemplate().splice(toIndex, 0, this.getCurrentTemplate().splice(fromIndex, 1)[0]);
  }
  getInnerSectionIcon(section: PDFTemplateSection): string {
    const bp = this.getCurrentLayer().blueprint.innerBlueprints.find(ib => ib.context === section.context);
    return bp ? bp.icon : 'help';
  }

  async editHeaderLabel(label: Label): Promise<void> {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;

    const componentProps = {
      label,
      title: this.t._('IDEA_COMMON.PDF_TEMPLATE.HEADER'),
      obligatory: true,
      variables: this.getCurrentLayer().blueprint.variables,
      disabled: this.disabled
    };
    const modal = await this.modalCtrl.create({
      component: IDEALabelerComponent,
      componentProps,
      cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
    });
    await modal.present();
  }

  async editSectionTitleLabel(label: Label): Promise<void> {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;

    const componentProps = {
      label,
      title: this.t._('IDEA_COMMON.PDF_TEMPLATE.INNER_SECTION_TITLE'),
      obligatory: false,
      disabled: this.disabled
    };
    const modal = await this.modalCtrl.create({
      component: IDEALabelerComponent,
      componentProps,
      cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
    });
    await modal.present();
  }

  async addField(section: PDFTemplateSection, indexCol: number): Promise<void> {
    // skip in case the section isn't of type ROW
    if (section.type !== this.ST.ROW) return;
    // skip in case the column is already occupied
    if (!section.isColumnEmpty(indexCol)) return;
    // let the user choose between simple and complex field
    const buttons = [];
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.SIMPLE_FIELD'),
      icon: 'at',
      handler: (): void => this.addSimpleField(section, indexCol)
    });
    buttons.push({
      text: this.t._('IDEA_COMMON.PDF_TEMPLATE.COMPLEX_FIELD'),
      icon: 'shapes',
      handler: (): void => this.addComplexField(section, indexCol)
    });

    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });

    const header = this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_INSERT');
    const actions = await this.actionSheetCtrl.create({ header, buttons });
    await actions.present();
  }
  private addSimpleField(section: PDFTemplateSection, colIndex: number): void {
    // let the user pick a variable from the list available on this layer, and add a simple field to the desired column
    this.pickVariableFromList(
      variable => (section.columns[colIndex] = new PDFTemplateSimpleField(variable, this.languages))
    );
  }
  private addComplexField(section: PDFTemplateSection, colIndex: number): void {
    // init the content of a new complex field
    const content = new Label(null, this.languages);
    content[this.languages.default] = '--';
    // set the field in the chosen column of the section
    section.columns[colIndex] = new PDFTemplateComplexField({ content }, this.languages);
    // directly open the field
    this.openField(section, colIndex);
  }
  private async pickVariableFromList(callback: (variable: LabelVariable) => void): Promise<void> {
    const suggestions = this.getCurrentLayer().blueprint.variables.map(
      v => new Suggestion({ value: v.code, name: this.t._label(v.label) })
    );
    const modal = await this.modalCtrl.create({
      component: IDEASuggestionsComponent,
      componentProps: { data: suggestions, hideClearButton: true },
      cssClass: 'forceBackdrop' // needed, since this component is also fullscreen
    });
    modal.onDidDismiss().then(({ data }): void => {
      if (!data) return;
      // if a suggestion was selected, find the original variable and return it
      const variable = this.getCurrentLayer().blueprint.variables.find(v => v.code === data.value);
      if (variable) callback(variable);
    });
    await modal.present();
  }

  displayField(section: PDFTemplateSection, colIndex: number, forceLabel?: boolean): string {
    // skip in case the column doesn't contain a field
    if (!section.doesColumnContainAField(colIndex)) return;
    const field = section.columns[colIndex] as PDFTemplateComplexField | PDFTemplateSimpleField;
    // recognize whether we are dealing with a complex or a simple field
    if (field.isComplex()) return this.t._label((field as PDFTemplateComplexField).content);
    else
      return forceLabel
        ? this.t._label((field as PDFTemplateSimpleField).label)
        : (field as PDFTemplateSimpleField).code.slice(1);
  }

  async manageField(section: PDFTemplateSection, colIndex: number, event?: any): Promise<void> {
    // skip if we are handling other operations
    if (this.isViewLocked()) return;
    // skip in case the column doesn't contain a field
    if (!section.doesColumnContainAField(colIndex)) return;
    // if in view mode, directly open the field
    if (this.disabled) return this.openField(section, colIndex);

    const buttons = [];
    buttons.push({
      text: this.t._('COMMON.EDIT'),
      icon: 'pencil',
      handler: (): Promise<void> => this.openField(section, colIndex)
    });
    buttons.push({
      text: this.t._('COMMON.MOVE'),
      icon: 'move',
      handler: (): Promise<void> => this.moveField(section, colIndex)
    });
    buttons.push({
      text: this.t._('COMMON.RESIZE'),
      icon: 'resize',
      handler: (): Promise<void> => this.resizeField(section, colIndex, event)
    });
    buttons.push({
      text: this.t._('COMMON.DELETE'),
      icon: 'trash',
      role: 'destructive',
      handler: (): Promise<void> => this.deleteField(section, colIndex)
    });

    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel', icon: 'arrow-undo' });

    const header = this.t._('IDEA_COMMON.PDF_TEMPLATE.WHAT_DO_YOU_WANT_TO_DO_WITH_FIELD');
    const actions = await this.actionSheetCtrl.create({ header, buttons });
    await actions.present();
  }
  private async openField(section: PDFTemplateSection, colIndex: number): Promise<void> {
    // identify the field
    const field = section.columns[colIndex] as PDFTemplateComplexField | PDFTemplateSimpleField;
    // open the labeler with different parameters, based on the type of field
    const modal = await this.modalCtrl.create({
      component: IDEALabelerComponent,
      componentProps: {
        label: field.isComplex() ? (field as PDFTemplateComplexField).content : (field as PDFTemplateSimpleField).label,
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
    });
    await modal.present();
  }
  private moveField(section: PDFTemplateSection, colIndex: number): Promise<void> {
    // check whether the field has an empty column which it could move on this layer
    if (!this.canFieldMoveAnywhere())
      return this.message.error('IDEA_COMMON.PDF_TEMPLATE.NO_EMPTY_SLOT_WHERE_TO_MOVE_FIELD');
    // hint the user that the field can now be moved and save the original position; the UI enter in "move mode"
    this.message.info('IDEA_COMMON.PDF_TEMPLATE.CHOOSE_WHERE_TO_MOVE_FIELD');
    this.disabled = true;
    this.moveMode = { section, colIndex } as MoveModeData;
  }
  private canFieldMoveAnywhere(): boolean {
    return (
      this.getCurrentLayer()
        // filter the sections containing fields
        .template.filter(s => s.type === this.ST.ROW)
        // search for at least one that contains at least a column which is empty
        .some(s => s.columns.some((_, index): boolean => s.isColumnEmpty(index)))
    );
  }
  completeMove(newSection: PDFTemplateSection, newColIndex: number): void {
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
  private async resizeField(section: PDFTemplateSection, colIndex: number, event?: any): Promise<void> {
    // calculate how much the field can grow
    const fieldSize = section.getColumnFieldSize(colIndex);
    let howMuchCanGrow = 0;
    // search for the first occupied column after the field: until there, the field can grow
    section.columns.slice(colIndex + fieldSize).some((_, index): boolean => {
      if (section.isColumnEmpty(colIndex + fieldSize + index)) {
        howMuchCanGrow++;
        return false;
      } else return true;
    });
    // open the popover to let the user grow or shrink the field
    const popover = await this.popoverCtrl.create({
      component: IDEAPDFTemplateFieldResizeComponent,
      componentProps: {
        columns: section.columns,
        colIndex,
        size: fieldSize,
        max: fieldSize + howMuchCanGrow
      },
      event
    });
    popover.present();
  }
  private async deleteField(section: PDFTemplateSection, colIndex: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.t._('COMMON.ARE_YOU_SURE'),
      buttons: [
        { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.t._('COMMON.DELETE'),
          handler: (): void => section.removeFieldFromOccupiedColumns(colIndex)
        }
      ]
    });
    await alert.present();
  }

  isViewLocked(): boolean {
    return this.editSections || !!this.moveMode;
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }
  private checkErrorsOnCurrentLayer(): void {
    this.errors = new Set<string>();
    this.getCurrentLayer().template.forEach((s, i): void => {
      s.validate(this.languages, this.getCurrentLayer().blueprint.variables).forEach(e => {
        // highlight a specific column of a section of type ROW
        if (e.startsWith('columns[')) this.errors.add(`s[${i}].${e}`);
        // highlight the entire section
        else this.errors.add(`s[${i}]`);
      });
    });
  }

  save(): Promise<void> {
    // check for errors (on top layer, but recursively on inner layers as well)
    this.checkErrorsOnCurrentLayer();
    if (this.errors.size) return this.message.error('IDEA_COMMON.PDF_TEMPLATE.ONE_OR_MORE_SECTIONS_HAVE_ERRORS');
    // save changes (without losing reference of the original array) and close
    this.template.splice(0, this.template.length);
    this._template.forEach(section => this.template.push(new PDFTemplateSection(section, this.languages)));
    this.close();
  }
  close(): void {
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
              <ion-icon name="remove" slot="icon-only" />
            </ion-button>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-label>
              {{ 'IDEA_COMMON.PDF_TEMPLATE.SIZE' | translate }}: <b>{{ size }}</b>
            </ion-label>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-button size="small" [disabled]="size === max" (click)="grow()">
              <ion-icon name="add" slot="icon-only" />
            </ion-button>
          </ion-col>
        </ion-row>
        <ion-row class="ion-align-items-center">
          <ion-col class="ion-text-center">
            <ion-button size="small" color="secondary" [disabled]="size === 1" (click)="shrinkToMin()">
              <ion-icon name="contract" slot="icon-only" />
            </ion-button>
          </ion-col>
          <ion-col class="ion-text-center">
            <ion-button size="small" color="secondary" [disabled]="size === max" (click)="growToMax()">
              <ion-icon name="expand" slot="icon-only" />
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
  @Input() columns: string[];
  /**
   * The current position of the field.
   */
  @Input() colIndex: number;
  /**
   * The current size of the field.
   */
  @Input() size: number;
  /**
   * The max size to which the field can grow.
   */
  @Input() max: number;

  constructor() {}

  grow(): void {
    if (this.size < this.max && !this.columns[this.colIndex + this.size]) {
      this.columns[this.colIndex + this.size] = '-';
      this.size++;
    }
  }
  growToMax(): void {
    while (this.size < this.max) this.grow();
  }
  shrink(): void {
    if (this.size > 1 && this.columns[this.colIndex + this.size - 1] === '-') {
      this.columns[this.colIndex + this.size - 1] = null;
      this.size--;
    }
  }
  shrinkToMin(): void {
    while (this.size > 1) this.shrink();
  }
}
