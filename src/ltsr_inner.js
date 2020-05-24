const { readFileSync: readFile } = require('fs');

const storedFunctions = new Map();
const storedFiles = new Map();
const storedLayouts = new Map();

const isString = val => Number.isNaN(parseInt(val));

const RenderError = require('./render_error');
const GeneratorFunction = Object.getPrototypeOf(function* () { }).constructor;

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
  return Object.assign(mapProperties(Object.getPrototypeOf(object), target), result);
};

const loadFile = path => {
  if (process.env.DEBUG || !storedFiles.has(path)) {
    storedFiles.set(path, readFile(path, 'utf8'));
  }
  return storedFiles.get(path);
};

class LTSRInner {
  constructor(owner, filename, layout) {
    this.owner = owner;
    this.filename = filename;
    this.layout = layout;
    this.subRender = (name, opts) => this.owner.render(name, opts, true);
    this.subRender.raw = (name, opts) => this.owner.raw(name, opts, true);
    this.dataSet = { locals: {} };
  }

  renderCollection(dataSet) {
    const { collection } = this.dataSet = dataSet;
    if (collection instanceof Array || collection instanceof Set) return this.renderSet();
    else if (collection instanceof Map) return this.renderMap();
    else if (Object.keys(collection).length) return this.renderObject();

    throw new Error(`Don't know how to render with collection of type ${collection.constructor.name}`);
  }

  layoutWrap(data, locals, keepWhitespace) {
    if (!this.layout) return data;

    const layoutGenerator = this.makeLayout(this.layout.get())(this.subRender);

    let state = layoutGenerator.next();

    while (!state.done) {
      let value = (state.value !== undefined) ? locals[state.value] : data;
      if (value === undefined) value = '';
      state = layoutGenerator.next(value);
    }
    return keepWhitespace ? state.value : state.value.trimEnd();
  }

  render(locals, keepWhitespace) {
    let argValues = mapProperties(locals);
    let args = Object.keys(argValues).sort();
    let values = args.map(a => argValues[a]);

    args.push('render', 'exports');
    values.push(this.subRender, this.exports);
    let func;
    try {
      func = this.makeFunction(args);
      const result = func.method(...values);
      return this.layoutWrap(keepWhitespace ? result : result.trimEnd(), locals, keepWhitespace);
    } catch (e) {
      if (e instanceof ReferenceError) { throw new RenderError(e, func.path); }
      if (e instanceof RenderError) { e.add(func.path); }
      throw e;
    }
  };

  raw(keepWhitespace) {
    const file = loadFile(this.filename.get(true));
    return keepWhitespace ? file : file.trimEnd();
  };

  makeLayout(layout) {
    if (process.env.DEBUG || !storedLayouts.has(layout)) {
      storedLayouts.set(layout, new GeneratorFunction('render', `return \`${loadFile(layout)}\``));
    }
    return storedLayouts.get(layout);
  }

  makeFunction(args) {
    const path = this.filename.get();
    const fnName = `${path}(${args})`;
    if (process.env.DEBUG || !storedFunctions.has(fnName)) {
      storedFunctions.set(fnName, new Function(args, `return \`${loadFile(path)}\``));
    }
    return { path, method: storedFunctions.get(fnName) };
  }

  renderMap() {
    const { locals, collection, keyName, valueName, keepWhitespace, sep } = this.dataSet;
    const output = [];
    for (let [key, value] of collection) {
      output.push(this.render({ ...locals, [keyName]: key, [valueName]: value }, keepWhitespace));
    }
    return output.join(sep);
  };

  renderSet() {
    const { locals, collection, keyName, valueName, keepWhitespace, sep } = this.dataSet;
    const output = [];
    let i = 0;
    for (let value of collection) {
      output.push(this.render({ ...locals, [keyName]: i++, [valueName]: value }, keepWhitespace));
    }
    return output.join(sep);
  };

  renderObject() {
    const { locals, collection, keyName, valueName, keepWhitespace, sep } = this.dataSet;
    return Object.keys(collection).map(key =>
      this.render({ ...locals, [keyName]: key, [valueName]: collection[key] }, keepWhitespace)
    ).join(sep);
  }
}

module.exports = LTSRInner;
