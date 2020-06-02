const site = require('./call_site');
const originalStackPrep = Error.prepareStackTrace;
const originalStackLimit = Error.stackTraceLimit;
class ErrorPrep {
  constructor() {
    this.layout = [];
    this.template = [];
  }

  add(kind, file) {
    this[kind].push(file);
  }

  ownStacker(error, stack) {
    return [
      error,
      ...stack.slice(0, originalStackLimit)
    ].join('\n    at ');
  }

  prep(error, stack) {
    if ((this.layout.length === 0 && this.template.length === 0) || stack.length === 0) {
      return originalStackPrep ? originalStackPrep(error, stack) : this.ownStacker(error, stack);
    }

    let layoutNext = false;
    const newStack = [true, ...stack.map(callSite => {
      if (layoutNext) {
        layoutNext = false;
        return site.rendering(this.template.pop() || '');
      }
      if (callSite.isEval()) {
        if (callSite.getEvalOrigin().includes(' makeLayout ')) {
          layoutNext = true;
          return site.layout(this.layout.pop() || '', callSite);
        }
        if (callSite.getEvalOrigin().includes(' makeFunction ')) {
          return site.layout(this.template.pop() || '', callSite);
        }
        return true;
      }
      return (!!process.env.DEBUG || !(callSite.getTypeName() || callSite.getFunctionName() || '').startsWith('LTSR'));
    })];

    if (originalStackPrep) {
      return originalStackPrep(error, stack).split('\n').map((line, index) => {
        if (newStack[index] === true) return line;
        if (newStack[index]) return newStack[index];
      }).filter(line => line).join('\n');
    }
    newStack = newStack.map((line, index) => (line === true) ? stack[index] : line).filter(line => line);
    return [
      error,
      ...newStack.slice(0, originalStackLimit),
    ].join('\n    at ');
  }

  build(e) {
    Error.stackTraceLimit = Infinity;
    Error.prepareStackTrace = (...args) => this.prep(...args);
    e.stack;
    return e;
  }
}

module.exports = ErrorPrep;
