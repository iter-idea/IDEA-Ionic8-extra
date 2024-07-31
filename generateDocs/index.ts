import { TypeFormatFlags } from 'typescript';
import { ClassDeclaration, Project } from 'ts-morph';
import { readdirSync, writeFileSync } from 'fs';
import { basename, parse, resolve, sep } from 'path';

const MODULES_FOLDER = 'modules';

//
// MAIN
//

// @todo add services (as of today we only have components)
console.log('Generating docs...');
main();
console.log('Docs generated');

function main(): void {
  const workingFolder = resolve(__dirname, '..').concat('/', MODULES_FOLDER, '/');
  const outputFolder = resolve(__dirname, '..').concat('/');

  const modules = readdirSync(workingFolder).filter(x => !x.startsWith('.'));

  let readmeContent = `# Modules\n\n`;
  modules.forEach(module => {
    const componentsInfo = createModuleDocsAndGetComponentsInfo(workingFolder.concat(module));
    if (!componentsInfo.length) return;
    readmeContent += `## ${module}\n\n`;
    componentsInfo.forEach(
      x => (readmeContent += `- [${x.selector || x.name}](${x.readmePath})${x.comment ? '. '.concat(x.comment) : ''}\n`)
    );
    readmeContent += `\n`;
  });

  const readmePath = outputFolder.concat(sep, MODULES_FOLDER, '.md');
  writeFileSync(readmePath, readmeContent);
}

//
// HELPERS
//

function createModuleDocsAndGetComponentsInfo(modulePath: string): ComponentInfo[] {
  const componentsInfoForReadme: ComponentInfo[] = [];

  const moduleName = basename(modulePath);
  const componentsFiles = new Project().addSourceFilesAtPaths(`${modulePath}/**/*component.ts`);

  componentsFiles.forEach(file => {
    const mainClass = file.getClasses()[0];
    if (!mainClass) return;

    const name = mainClass.getName();
    const comment = mainClass.getJsDocs()[0]?.getComment()?.toString();
    const selector = getSelectorOfComponentClass(mainClass);
    const inputAttributes = getAttributesInfoOfComponentClassForDecoratorType(mainClass, 'Input');
    const outputAttributes = getAttributesInfoOfComponentClassForDecoratorType(mainClass, 'Output');

    const inputAttributesMD = getMDListOfComponentAttributeInfo(inputAttributes);
    const outputAttributesMD = getMDListOfComponentAttributeInfo(outputAttributes);

    let readmeContent = `# ${name}\n\n`;
    if (comment) readmeContent += `${comment}\n\n`;
    if (selector) readmeContent += `## Selector\n\n${selector}\n\n`;
    if (inputAttributesMD) readmeContent += `## Inputs\n\n${inputAttributesMD}\n\n`;
    if (outputAttributesMD) readmeContent += `## Outputs\n\n${outputAttributesMD}\n`;

    const { name: readmeName, dir: readmeDir } = parse(file.getFilePath());
    writeFileSync(readmeDir.concat(sep, readmeName, '.md'), readmeContent);

    const readmeFolder = MODULES_FOLDER.concat(sep, moduleName, readmeDir.slice(modulePath.length));
    const readmePath = readmeFolder.concat(sep, readmeName, '.md');
    componentsInfoForReadme.push({ name, comment, selector, readmePath });
  });

  return componentsInfoForReadme;
}

function getSelectorOfComponentClass(mainClass: ClassDeclaration): string {
  const componentDecorator = mainClass.getDecorator('Component');
  const pattern = /@Component\s*\(\s*{[^}]*selector\s*:\s*'([^']*)'[^}]*}/;
  const [_, selector] = pattern.exec(componentDecorator.getText());
  return selector;
}

function getAttributesInfoOfComponentClassForDecoratorType(
  mainClass: ClassDeclaration,
  decoratorType: 'Input' | 'Output'
): ComponentAttributeInfo[] {
  return mainClass
    .getProperties()
    .filter(prop => prop.getDecorators().some(decorator => decorator.getName() === decoratorType))
    .map(prop => ({
      name: prop.getName(),
      type: prop.getType().getText(null, TypeFormatFlags.InTypeAlias),
      comment: prop.getJsDocs()[0]?.getComment()?.toString()
    }));
}
function getMDListOfComponentAttributeInfo(attributes: ComponentAttributeInfo[]): string {
  return attributes
    .map(prop => `- \`${prop.name}\` (*${prop.type}*) ${prop.comment ? '- '.concat(prop.comment) : ''}`)
    .join('\n');
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
