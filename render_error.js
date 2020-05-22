const { join: joinPath } = require('path');

const REOriginalError = Symbol('originalError');
const RETemplates = Symbol('templates');
const REBuiltStack = Symbol('builtStack');
const RERoot = Symbol('root');

class RenderError {
  constructor(referenceError, template, root) {
    this[REOriginalError] = referenceError;
    this[RERoot] = root;
    this[RETemplates] = [template];
  }

  add(template) {
    this[RETemplates].push(template);
    this[REBuiltStack] = undefined;
  }

  stackWithLt() {
    const target = /eval .*makeFunction.*<anonymous>(.*)\)/;
    return this[RETemplates].reduce(
      (stack, name) => stack.replace(target, `Template ${joinPath(this[RERoot], name)}.lt$1`),
      this[REOriginalError].stack
    ).replace(/\n\s*at LTSR.*/g, '').replace('ReferenceError: ', '');
  }

  get stack() {
    return this[REBuiltStack] || (this[REBuiltStack] = this.stackWithLt());
  }
  get message() {
    return this.stack.split('\n').shift();
  }
}

module.exports = RenderError;
