import { TypeFormatFlags } from 'typescript';
import { CallExpression, ClassDeclaration, Node, Project, PropertyDeclaration } from 'ts-morph';
import { readdirSync, writeFileSync } from 'fs';
import { basename, parse, resolve, sep } from 'path';
import { format, Options, resolveConfig } from 'prettier';

const MODULES_FOLDER = 'modules';

//
// MAIN
//

// TODO add services (as of today we only have components)
main()
  .then(() => console.log('Docs generated'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

async function main(): Promise<void> {
  console.log('Generating docs...');

  const rootFolder = resolve(__dirname, '..');
  const workingFolder = rootFolder.concat('/', MODULES_FOLDER, '/');
  const outputFolder = rootFolder.concat('/');

  // resolve the repo's Prettier config so the generated markdown matches `npm run format` (no back-and-forth churn)
  const prettierOptions = (await resolveConfig(rootFolder.concat(sep, MODULES_FOLDER, '.md'))) ?? {};

  const modules = readdirSync(workingFolder).filter(x => !x.startsWith('.'));

  let readmeContent = `# Modules\n\n`;
  for (const module of modules) {
    const componentsInfo = await createModuleDocsAndGetComponentsInfo(workingFolder.concat(module), prettierOptions);
    if (!componentsInfo.length) continue;
    readmeContent += `## ${module}\n\n`;
    componentsInfo.forEach(
      x => (readmeContent += `- [${x.selector || x.name}](${x.readmePath})${x.comment ? '. '.concat(x.comment) : ''}\n`)
    );
    readmeContent += `\n`;
  }

  const readmePath = outputFolder.concat(sep, MODULES_FOLDER, '.md');
  await writeMarkdown(readmePath, readmeContent, prettierOptions);
}

//
// HELPERS
//

async function createModuleDocsAndGetComponentsInfo(
  modulePath: string,
  prettierOptions: Options
): Promise<ComponentInfo[]> {
  const componentsInfoForReadme: ComponentInfo[] = [];

  const moduleName = basename(modulePath);
  const componentsFiles = new Project().addSourceFilesAtPaths(`${modulePath}/**/*component.ts`);

  for (const file of componentsFiles) {
    const mainClass = file.getClasses()[0];
    if (!mainClass) continue;

    const name = mainClass.getName() ?? '';
    const comment = mainClass.getJsDocs()[0]?.getComment()?.toString();
    const selector = getSelectorOfComponentClass(mainClass);

    const { inputs, outputs } = getAttributesInfoOfComponentClass(mainClass);
    const inputAttributesMD = getMDListOfComponentAttributeInfo(inputs);
    const outputAttributesMD = getMDListOfComponentAttributeInfo(outputs);

    let readmeContent = `# ${name}\n\n`;
    if (comment) readmeContent += `${comment}\n\n`;
    if (selector) readmeContent += `## Selector\n\n${selector}\n\n`;
    if (inputAttributesMD) readmeContent += `## Inputs\n\n${inputAttributesMD}\n\n`;
    if (outputAttributesMD) readmeContent += `## Outputs\n\n${outputAttributesMD}\n`;

    const { name: readmeName, dir: readmeDir } = parse(file.getFilePath());
    await writeMarkdown(readmeDir.concat(sep, readmeName, '.md'), readmeContent, prettierOptions);

    const readmeFolder = MODULES_FOLDER.concat(sep, moduleName, readmeDir.slice(modulePath.length));
    const readmePath = readmeFolder.concat(sep, readmeName, '.md');
    componentsInfoForReadme.push({ name, comment, selector, readmePath });
  }

  return componentsInfoForReadme;
}

function getSelectorOfComponentClass(mainClass: ClassDeclaration): string {
  const componentDecorator = mainClass.getDecorator('Component');
  if (!componentDecorator) return '';
  const pattern = /@Component\s*\(\s*{[^}]*selector\s*:\s*'([^']*)'[^}]*}/;
  const match = pattern.exec(componentDecorator.getText());
  return match ? match[1] : '';
}

/**
 * Collect the component's public API, supporting both the legacy decorators (`@Input()`/`@Output()`)
 * and the signal-based APIs introduced with the Angular migration (`input()`, `output()`, `model()`).
 * A `model()` is a two-way binding, listed under Inputs (the settable side).
 */
function getAttributesInfoOfComponentClass(mainClass: ClassDeclaration): {
  inputs: ComponentAttributeInfo[];
  outputs: ComponentAttributeInfo[];
} {
  const inputs: ComponentAttributeInfo[] = [];
  const outputs: ComponentAttributeInfo[] = [];

  for (const prop of mainClass.getProperties()) {
    const name = prop.getName();
    const comment = prop.getJsDocs()[0]?.getComment()?.toString() ?? '';
    const decorators = prop.getDecorators().map(d => d.getName());

    if (decorators.includes('Input')) {
      inputs.push({ name, type: getDeclaredTypeText(prop), comment });
      continue;
    }
    if (decorators.includes('Output')) {
      outputs.push({ name, type: getDeclaredTypeText(prop), comment });
      continue;
    }

    const signal = getSignalInfo(prop);
    if (signal?.kind === 'input') inputs.push({ name, type: signal.type, comment });
    else if (signal?.kind === 'output') outputs.push({ name, type: signal.type, comment });
  }

  return { inputs, outputs };
}

function getDeclaredTypeText(prop: PropertyDeclaration): string {
  return prop.getType().getText(undefined, TypeFormatFlags.InTypeAlias);
}

/** Recognise a property declared as `input()`, `input.required()`, `model()`, `model.required()` or `output()`. */
function getSignalInfo(prop: PropertyDeclaration): { kind: 'input' | 'output'; type: string } | null {
  const init = prop.getInitializer();
  if (!init || !Node.isCallExpression(init)) return null;

  const callee = init.getExpression().getText().split(/[.<(]/)[0];
  let kind: 'input' | 'output';
  if (callee === 'input' || callee === 'model') kind = 'input';
  else if (callee === 'output') kind = 'output';
  else return null;

  return { kind, type: getSignalType(init, kind) };
}

function getSignalType(call: CallExpression, kind: 'input' | 'output'): string {
  // prefer the explicit generic argument, e.g. input<string>(), output<MyEvent>()
  const typeArgs = call.getTypeArguments();
  if (typeArgs.length) return typeArgs[0].getText();

  if (kind === 'output') return 'void';

  // no generic argument: infer from the default value, e.g. input(4) -> number
  const firstArg = call.getArguments()[0];
  if (firstArg) {
    try {
      const baseType = firstArg.getType().getBaseTypeOfLiteralType().getText();
      if (baseType && baseType !== 'undefined' && !baseType.includes('import(')) return baseType;
    } catch {
      // fall through to the default below
    }
  }
  return 'unknown';
}

function getMDListOfComponentAttributeInfo(attributes: ComponentAttributeInfo[]): string {
  return attributes
    .map(prop => `- \`${prop.name}\` (*${prop.type}*) ${prop.comment ? '- '.concat(prop.comment) : ''}`)
    .join('\n');
}

async function writeMarkdown(filePath: string, content: string, prettierOptions: Options): Promise<void> {
  const formatted = await format(content, { ...prettierOptions, parser: 'markdown' });
  writeFileSync(filePath, formatted);
}

//
// INTERFACES
//

interface ComponentInfo {
  name: string;
  comment?: string;
  selector?: string;
  readmePath: string;
}

interface ComponentAttributeInfo {
  name: string;
  type: string;
  comment: string;
}
