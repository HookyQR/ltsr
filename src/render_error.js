const REOriginalError = Symbol('originalError');
const RETemplates = Symbol('templates');
const REBuiltStack = Symbol('builtStack');

class RenderError {
  constructor(referenceError, template) {
    this[REOriginalError] = referenceError;
    this[RETemplates] = [template];
  }

  add(template) {
    this[RETemplates].push(template);
    this[REBuiltStack] = undefined;
  }

  stackWithLt() {
    const target = /eval .*makeFunction.*<anonymous>(.*)\)/;
    const renamed = this[RETemplates].reduce(
      (stack, name) => stack.replace(target, `Template ${name}$1`),
      this[REOriginalError].stack
    ).replace('ReferenceError: ', '');
    if (process.env.DEBUG) return renamed;
    return renamed.replace(/\n\s*at LTSR.*/g, '');
  }

  get stack() {
    return this[REBuiltStack] || (this[REBuiltStack] = this.stackWithLt());
  }
  get message() {
    return `Render failed: ${this.stack.split('\n').shift()}`;
  }
}

module.exports = RenderError;
