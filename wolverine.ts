import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import * as difflib from 'diff';

import { Configuration, OpenAIApi } from 'openai';
const chalk = require('chalk');

require('dotenv').config();

// Set up the OpenAI API
const openaiApiKey = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
  apiKey: openaiApiKey,
});
const openai = new OpenAIApi(configuration);

async function runScript(
  scriptName: string,
  scriptArgs: string[]
): Promise<[string, number]> {
  return new Promise((resolve, reject) => {
    const args = [scriptName, ...scriptArgs];
    child_process.execFile(process.execPath, args, (error, stdout, stderr) => {
      if (error) {
        resolve([stderr, error.code || 1]);
      } else {
        resolve([stdout, 0]);
      }
    });
  });
}

async function sendErrorToGpt(
  file_path: string,
  args: string[],
  error_message: string,
  model: string
): Promise<string> {
  const fileLines = fs.readFileSync(file_path, 'utf-8').split('\n');

  const fileWithLines = fileLines
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n');

  const initialPromptText = fs.readFileSync('prompt.txt', 'utf-8');

  const prompt =
    initialPromptText +
    '\n\n' +
    'Here is the script that needs fixing:\n\n' +
    `${fileWithLines}\n\n` +
    'Here are the arguments it was provided:\n\n' +
    `${args}\n\n` +
    'Here is the error message:\n\n' +
    `${error_message}\n` +
    'Please provide your suggested changes, and remember to stick to the ' +
    'exact format as described above.';

  const response = await openai.createCompletion({
    model: model,
    prompt: prompt,
    temperature: 1.0,
  });

  if (
    response &&
    response.data &&
    response.data.choices &&
    response.data.choices.length > 0 &&
    response.data.choices[0].text
  ) {
    return response.data.choices[0].text.trim();
  } else {
    throw new Error('Unable to get a valid response from the OpenAI API.');
  }
}

function applyChanges(file_path: string, changes_json: string): void {
  const originalFileLines = fs.readFileSync(file_path, 'utf-8').split('\n');

  const changes = JSON.parse(changes_json);

  const operation_changes = changes.filter(
    (change: any) => 'operation' in change
  );
  const explanations = changes
    .filter((change: any) => 'explanation' in change)
    .map((change: any) => change.explanation);

  operation_changes.sort((a: any, b: any) => b.line - a.line);

  const fileLines = originalFileLines.slice();
  for (const change of operation_changes) {
    const operation = change.operation;
    const line = change.line;
    const content = change.content;

    if (operation === 'Replace') {
      fileLines[line - 1] = content + '\n';
    } else if (operation === 'Delete') {
      fileLines.splice(line - 1, 1);
    } else if (operation === 'InsertAfter') {
      fileLines.splice(line, 0, content + '\n');
    }
  }

  fs.writeFileSync(file_path, fileLines.join('\n'));

  console.log(chalk.blue('Explanations:'));
  for (const explanation of explanations) {
    console.log(chalk.blue(`- ${explanation}`));
  }

  console.log('\nChanges:');
  const diff = difflib.createTwoFilesPatch(
    'original',
    'modified',
    originalFileLines.join('\n'),
    fileLines.join('\n')
  );
  const coloredDiff = diff.split('\n').map((line) => {
    if (line.startsWith('+')) {
      return chalk.green(line);
    } else if (line.startsWith('-')) {
      return chalk.red(line);
    } else {
      return line;
    }
  });

  console.log(coloredDiff.join('\n'));
}

async function main(
  script_name: string,
  script_args: string[],
  revert = false,
  model = 'gpt-4'
): Promise<void> {
  if (revert) {
    const backup_file = script_name + '.bak';
    if (fs.existsSync(backup_file)) {
      fs.copyFileSync(backup_file, script_name);
      console.log(`Reverted changes to ${script_name}`);
      process.exit(0);
    } else {
      console.log(`No backup file found for ${script_name}`);
      process.exit(1);
    }
  }

  // Make a backup of the original script
  fs.copyFileSync(script_name, script_name + '.bak');

  while (true) {
    const [output, returncode] = await runScript(script_name, script_args);

    if (returncode === 0) {
      console.log(chalk.blue('Script ran successfully.'));
      console.log('Output:', output);
      break;
    } else {
      console.log(chalk.blue('Script crashed. Trying to fix...'));
      console.log('Output:', output);

      const json_response = await sendErrorToGpt(
        script_name,
        script_args,
        output,
        model
      );

      applyChanges(script_name, json_response);
      console.log(chalk.blue('Changes applied. Rerunning...'));
    }
  }
}

// Example usage: main('your_script.ts', ['arg1', 'arg2']);
