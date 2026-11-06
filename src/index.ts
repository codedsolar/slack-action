import * as core from '@actions/core';
import Input from './input.js';
import Output from './output.js';
import { run } from './run.js';

const input = new Input();
const output = new Output();

input
  .get()
  .then(() => {
    run(input, output).catch((err) => {
      if (input.ignoreFailures) {
        core.error(err.message);
        process.exit(0);
      } else {
        core.setFailed(err.message);
      }
    });
  })
  .catch((err) => {
    core.setFailed(err.message);
  });
