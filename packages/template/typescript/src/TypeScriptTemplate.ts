import { asyncOra } from '@electron-forge/async-ora';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';
import path from 'path';
import exec from 'child_process';

class TypeScriptTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  async initializeTemplate(directory: string) {
    await super.initializeTemplate(directory, {});
    await asyncOra('Setting up Forge configuration', async () => {
      const packageJSONPath = path.resolve(directory, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      // Configure scripts for TS template
      packageJSON.scripts.lint = 'eslint --ext .ts .';
      packageJSON.scripts.start = 'tsc && electron-forge start';
      packageJSON.config.forge.hooks.packageAfterCopy = async () => {
        exec("tsc", (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
        })
      }
      packageJSON.main = 'dist/index.js';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
    });

    await asyncOra('Setting up TypeScript configuration', async () => {
      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Copy tsconfig with a small set of presets
      await this.copyTemplateFile(directory, 'tsconfig.json');

      // Copy eslint config with recommended settings
      await this.copyTemplateFile(directory, '.eslintrc.json');

      // Remove index.js and replace with index.ts
      await fs.remove(filePath('index.js'));
      await this.copyTemplateFile(path.join(directory, 'src'), 'index.ts');
    });
  }
}

export default new TypeScriptTemplate();
