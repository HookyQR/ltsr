const readFile = require('fs')
  .readFileSync;
const path = require('path');

const storedFunctions = new Map();

const loadFile = (file, noTrim, root) => {
  let base = path.join(root, file);
  if (path.relative(root, base).startsWith('..'))
    throw new Error(`Attempt to load template (${file}) which falls outside of root (${root})`);
  const string = readFile(`${base}.lt`, 'utf8');
  return noTrim ? string : string.trimEnd();
};

const makeFunction = (file, args, noTrim, root) => new Function(args, `return \`${loadFile(file, noTrim, root)}\``);

let primeRoot = process.cwd();
const isString = val => Number.isNaN(parseInt(val));

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

const innerRender = (name, locals, noTrim, render) => {
  let argValues = mapProperties(locals);
  let args = Object.keys(argValues).sort();
  let values = args.map(a => argValues[a]);
  let fnName = `${render.root}/${name}(${args})`;
  args.push('render');
  values.push(render);

  let fn;
  if (!storedFunctions.has(fnName)) {
    fn = makeFunction(name, args, noTrim, render.root);
    storedFunctions.set(fnName, fn);
  } else {
    fn = storedFunctions.get(fnName);
  }
  try {
    return fn.apply(null, values);
  } catch (e) {
    if (e instanceof ReferenceError) {
      e.message = `Render failed: ${e.message}`;
      e.stack = `${e.message}
    Template: ${name}`;
    }
    throw e;
  }
};

const renderMap = (name, { locals, collection, keyName, valueName, noTrim }, render) => {
  const output = [];
  for (let [key, value] of collection) {
    output.push(innerRender(name, { ...locals, [keyName]: key, [valueName]: value }, noTrim, render));
  }
  return output.join('');
};

const renderSet = (name, { locals, collection, keyName, valueName, noTrim }, render) => {
  const output = [];
  let i = 0;
  for (let value of collection) {
    output.push(innerRender(name, { ...locals, [keyName]: i++, [valueName]: value }, noTrim, render));
  }
  return output.join('');
};

const renderObject = (name, { locals, collection, keyName, valueName, noTrim }, render) =>
  Object.keys(collection).map(key =>
    innerRender(name, { ...locals, [keyName]: key, [valueName]: collection[key] }, noTrim, render)
  ).join('');

const renderer = (root = primeRoot) => {
  const render = (
    name, {
      locals = {},
      collection = null,
      keyName = (collection instanceof Array || collection instanceof Set) ? 'index' : 'key',
      valueName = 'value',
      noTrim = false,
    } = {}) => {
    if (!collection) return innerRender(name, locals, noTrim, render);
    if ('string' !== typeof keyName || 'string' !== typeof valueName)
      throw new Error('keyName and valueName must be strings');

    const dataSet = { locals, collection, keyName, valueName, noTrim };
    if (collection instanceof Array || collection instanceof Set) return renderSet(name, dataSet, render);
    else if (collection instanceof Map) return renderMap(name, dataSet, render);
    else if (Object.keys(collection).length) return renderObject(name, dataSet, render);

    throw new Error(`Don't know how to render with collection of type ${collection.constructor.name}`);
  };

  Object.defineProperties(render, {
    root: { value: root },
    raw: { value: (name, noTrim) => loadFile(name, noTrim, root) }
  });
  return Object.freeze(render);
};


module.exports = {
  renderer,
};
