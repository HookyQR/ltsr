const readFile = require('fs')
  .readFileSync;
const path = require('path');

const storedFunctions = new Map();

const makeFunction = (file, args) => {
  let base = path.join(root, file);
  if (path.relative(root, base)
    .startsWith('..')) throw new Error(`Attempt to load template (${file}) which falls outside of root (${root})`);
  let str = readFile(`${base}.lt`, 'utf8');
  return new Function(args, `return \`${str}\``);
}

let root = process.cwd();
const renderRoot = dir => root = dir;
const isString = val => Number.isNaN(parseInt(val));
const mapProperties = (object, target = object) => {
  if (!(object instanceof Object)) return [];

  const result = {};
  Object.getOwnPropertyNames(object)
    .filter(isString)
    .forEach(p => {
      if (p === 'constructor') return result[p] = object[p];
      const desc = Object.getOwnPropertyDescriptor(object, p);
      if (desc.get) {
        return result[p] = object[p];
      }
      if (desc.value instanceof Function) {
        return result[p] = desc.value.bind(target);
      }
      return result[p] = desc.value;
    })
  const proto = Object.getPrototypeOf(object);
  if (proto.constructor === Object) { return result; }
  return Object.assign(mapProperties(proto, target), result);
}
const innerRender = (name, locals) => {
  let argValues = mapProperties(locals);
  let args = Object.keys(argValues)
    .sort();
  let values = args.map(a => argValues[a]);
  let fnName = `${name}(${args})`;
  args.push(...templateNames);
  values.push(...templateArgs);
  let fn;
  if (!storedFunctions.has(fnName)) {
    fn = makeFunction(name, args);
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
    throw (e);
  }
}

const innerRenderCollectionPart = (name, locals, collected) => {
  return innerRender(name, Object.assign({}, locals, collected));
}

const renderMap = (name, locals, collection, keyName, valueName) => {
  const output = []
  for (let [key, value] of collection) {
    output.push(
      innerRenderCollectionPart(name, locals, {
        [keyName]: key,
        [valueName]: value
      }));
  }
  return output.join('');
}
const renderSet = (name, locals, collection, keyName, valueName) => {
  const output = []
  let i = 0;
  for (let value of collection) {
    output.push(
      innerRenderCollectionPart(name, locals, {
        [keyName]: i++,
        [valueName]: value
      }));
  }
  return output.join('');
}
const renderObject = (name, locals, collection, keyName, valueName) =>
  Object.keys(collection)
  .map(key =>
    innerRenderCollectionPart(name, locals, {
      [keyName]: key,
      [valueName]: collection[key]
    }))
  .join('');

const render = (
  name, {
    locals = {},
    collection = null,
    keyName = (collection instanceof Array || collection instanceof Set) ? 'index' : 'key',
    valueName = 'value'
  } = {}) => {
  if (!collection) return innerRender(name, locals);
  if ('string' !== typeof keyName || 'string' !== typeof valueName)
    throw new Error('keyName and valueName must be strings');
  if (collection instanceof Array || collection instanceof Set)
    return renderSet(name, locals, collection, keyName, valueName);
  else if (collection instanceof Map)
    return renderMap(name, locals, collection, keyName, valueName);
  else if (Object.keys(collection)
    .length)
    return renderObject(name, locals, collection, keyName, valueName);
  else
    throw new Error(`Don't know how to render with collection of type ${collection.constructor.name}`);
};

const templateNames = ['render'];
const templateArgs = [render];

module.exports = {
  render,
  renderRoot
}