# WolverineJS

## About

Give your JavaScript scripts regenerative healing abilities!

Run your scripts with WolverineJS, and when they crash, GPT-4 edits them and explains what went wrong. Even if you have many bugs, it will repeatedly rerun until it's fixed.

## Demo

Coming soon

## Setup

    npm install

Add your OpenAI API key to `.env` - _warning!_ by default, this uses GPT-4 and may make many repeated calls to the API.

## Example Usage

To run with GPT-4 (the default, tested option):

    node wolverine.js buggy_script.js

You can also run with other models, but be warned they may not adhere to the edit format as well:

    node wolverine.js --model=gpt-3.5-turbo buggy_script.js

## Future Plans

This is just a quick prototype I threw together in a few hours.

- Add flags to customize usage, such as asking for user confirmation before running changed code
- Further iterations on the edit format that GPT responds in. Currently, it struggles a bit with indentation, but I'm sure that can be improved
- A suite of example buggy files that we can test prompts on to ensure reliability and measure improvement
- Multiple files / codebases: send GPT everything that appears in the stack trace
- Graceful handling of large files - should we just send GPT relevant classes / functions?
- Extension to languages other than JavaScript
