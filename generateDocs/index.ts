import { TypeFormatFlags } from 'typescript';
import { Project } from 'ts-morph';
import { writeFileSync } from 'fs';

const folderPath = '../modules/common/src';

const project = new Project();
const files = project.addSourceFilesAtPaths(`${folderPath}/**/*component.ts`);

const mdFiles: string[] = [];

// process each TypeScript file
files.forEach(file => {
  const className = file.getClasses()[0]?.getName();
  if (className) {
    // find the selector
    const componentDecorator = file.getClasses()[0].getDecorator('Component');
    const pattern = /@Component\s*\(\s*{[^}]*selector\s*:\s*'([^']*)'[^}]*}/;
    const [_, selector] = pattern.exec(componentDecorator.getText());
    const componentComments = file.getClasses()[0].getJsDocs()[0]?.getComment();

    // find all properties that are decorated with @Input
    const inputProps = file
      .getClasses()[0]
      .getProperties()
      .filter(prop => prop.getDecorators().some(decorator => decorator.getName() === 'Input'));

    // find all properties that are decorated with @Input
    const outputProps = file
      .getClasses()[0]
      .getProperties()
      .filter(prop => prop.getDecorators().some(decorator => decorator.getName() === 'Output'));

    // extract the names, types, and JSDoc comments of the @Input properties
    const inputPropsInfo = inputProps.map(prop => ({
      name: prop.getName(),
      type: prop.getType().getText(null, TypeFormatFlags.InTypeAlias),
      comment: prop.getJsDocs()[0]?.getComment()
    }));

    // extract the names, types, and JSDoc comments of the @Input properties
    const outputPropsInfo = outputProps.map(prop => ({
      name: prop.getName(),
      type: prop.getType().getText(null, TypeFormatFlags.InTypeAlias),
      comment: prop.getJsDocs()[0]?.getComment()
    }));
    // write the results to a Markdown file in the folder

    const readmePath = `${file.getFilePath().slice(0, -3)}.md`;
    const inputPropsMarkdown = inputPropsInfo
      .map(prop => `* \`${prop.name}\` (*${prop.type}*) - ${prop.comment || 'No description'}`)
      .join('\n');
    const outPutsPropsMarkdown = outputPropsInfo
      .map(prop => `* \`${prop.name}\` (*${prop.type}*) - ${prop.comment || 'No description'}`)
      .join('\n');
    const readmeContent = `# ${className}\n\n${componentComments}\n\n## Selector\n\n\`${selector}\` \n\n## Inputs\n\n${inputPropsMarkdown}\n\n## Outputs\n\n${outPutsPropsMarkdown}\n`;
    writeFileSync(readmePath, readmeContent);

    mdFiles.push(`- [${selector}](./${readmePath})`);
  }
});

console.log(mdFiles); // Output: ["./components/component1.md", "./components/subdirectory/component2.md"]
