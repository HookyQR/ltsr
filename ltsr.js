const readFile = require('fs').readFileSync;
const path = require('path');
const storedFunctions = new Map();
const primeRoot = process.cwd();
const isString = val => Number.isNaN(parseInt(val));

const REOriginalStack = Symbol('originalStack');
const RETemplates = Symbol('templates');
const REBuiltStack = Symbol('builtStack');
const RERoot = Symbol('root');

class RenderError {
  constructor(referenceError, template, root) {
    this[REOriginalStack] = referenceError.stack.replace('ReferenceError: ', '');
    this.message = this[REOriginalStack].split('\n').shift();
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
      (stack, name) => stack.replace(target, `Template ${path.join(this[RERoot], name)}.lt$1`),
      this[REOriginalStack]
    ).replace(/\n\s*at LTSR.*/g, '');
  }

  get stack() {
    return this[REBuiltStack] || (this[REBuiltStack] = this.stackWithLt());
  }
}

const mapProperties = (object, target = object) => {
  if (!(object instanceof Object)) return {};

  const result = {};
  Object.getOwnPropertyNames(object)
    .filter(isString)
    .forEach(p => {
      if (p === 'constructor') return result[p] = object[p];
      const desc = Object.getOwnPropertyDescriptor(object, p);
      if (desc.get) return result[p] = object[p];
      if (desc.value instanceof Function) return result[p] = desc.value.bind(target);

      return result[p] = desc.value;
    });
  return Object.assign(
    mapProperties(Object.getPrototypeOf(object), target),
    result);
};

class LTSR {
  constructor(root = primeRoot) {
    this.root = root;
  }
  render(
    name,
    {
      locals = {},
      collection = null,
      keyName = (collection instanceof Array || collection instanceof Set) ? 'index' : 'key',
      valueName = 'value',
      keepWhitespace = false,
    } = {}
  ) {
    if (!collection) return this.innerRender(name, locals, keepWhitespace);
    if ('string' !== typeof keyName || 'string' !== typeof valueName)
      throw new Error('keyName and valueName must be strings');

    const dataSet = { locals, collection, keyName, valueName, keepWhitespace };
    if (collection instanceof Array || collection instanceof Set) return this.renderSet(name, dataSet);
    else if (collection instanceof Map) return this.renderMap(name, dataSet);
    else if (Object.keys(collection).length) return this.renderObject(name, dataSet);

    throw new Error(`Don't know how to render with collection of type ${collection.constructor.name}`);
  }

  innerRender(name, locals, keepWhitespace) {
    let argValues = mapProperties(locals);
    let args = Object.keys(argValues).sort();
    let values = args.map(a => argValues[a]);
    let fnName = `${this.root}/${name}(${args})`;
    args.push('render');
    const render = this.render.bind(this);
    render.raw = this.raw.bind(this);
    values.push(render);

    if (!storedFunctions.has(fnName)) {
      storedFunctions.set(fnName, this.makeFunction(name, args));
    }
    const fn = storedFunctions.get(fnName);
    try {
      const result = fn(...values);
      return keepWhitespace ? result : result.trimEnd();
    } catch (e) {
      if (e instanceof ReferenceError) {

        e.message = `Render failed: ${e.message}`;
        throw new RenderError(e, name, this.root);
      } else if (e instanceof RenderError) {
        e.add(name);
      }
      throw e;
    }
  };

  loadFile(file) {
    let base = path.join(this.root, file);
    if (path.relative(this.root, base).startsWith('..'))
      throw new Error(`Attempt to load template (${file}) which falls outside of root (${this.root})`);
    return readFile(`${base}.lt`, 'utf8');
  }

  raw(file, keepWhitespace) {
    const string = this.loadFile(file);
    return keepWhitespace ? string : string.trimEnd();
  };

  makeFunction(file, args) { return new Function(args, `return \`${this.loadFile(file)}\``); }

  renderMap(name, { locals, collection, keyName, valueName, keepWhitespace }) {
    const output = [];
    for (let [key, value] of collection) {
      output.push(this.innerRender(name, { ...locals, [keyName]: key, [valueName]: value }, keepWhitespace));
    }
    return output.join('');
  };

  renderSet(name, { locals, collection, keyName, valueName, keepWhitespace }) {
    const output = [];
    let i = 0;
    for (let value of collection) {
      output.push(this.innerRender(name, { ...locals, [keyName]: i++, [valueName]: value }, keepWhitespace));
    }
    return output.join('');
  };

  renderObject(name, { locals, collection, keyName, valueName, keepWhitespace }) {
    return Object.keys(collection).map(key =>
      this.innerRender(name, { ...locals, [keyName]: key, [valueName]: collection[key] }, keepWhitespace)
    ).join('');
  }
}

module.exports = LTSR;
