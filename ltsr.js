const readFile = require('fs')
  .readFileSync;
const path = require('path');

const storedFunctions = new Map();

const makeFunction = (file, args) => {
  let base = path.join(root, file);
  if (path.relative(root, base).startsWith('..')) throw new Error(`Attempt to load template (${file}) which falls outside of root (${root})`);
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
const render = (name, attrs = {}) => {
  let argValues = mapProperties(attrs);
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
};

const renderSet = (name, set = {}, attrs = {}) => {
  let key = Object.keys(set);
  if (key.length > 1) throw new Error("set must be an object with a single key value pair");
  key = key[0];
  if (set[key] instanceof Array || set[key] instanceof Set) {
    let result = "";
    for (const val of set[key]) {
      result += render(name, Object.assign({}, attrs, {
        [key]: val
      }));
    }
    return result;
  }
  throw new Error("value of set must be an Array or a Set");
}

const renderMap = (name, mapNames = { key: 'value' }, map = {}, attrs = {}) => {
  let key = Object.keys(mapNames);
  if (key.length > 1) throw new Error("mapNames should be an object with a single key value pair");
  key = key[0];
  let value = mapNames[key];
  if ('string' !== typeof value) throw new Error("the value of mapNames must be a string");
  let result = "";
  for (let mapKey in map) {
    result += render(name, Object.assign({}, attrs, {
      [key]: mapKey,
      [value]: map[mapKey]
    }));
  }
  return result;
}
const templateNames = ['render', 'renderSet', 'renderMap'];
const templateArgs = [render, renderSet, renderMap];

module.exports = {
  render,
  renderSet,
  renderMap,
  renderRoot
}

// class S extends String {
//   constructor(v) {
//     super(v);
//     this.extra = "a";
//   }
//   fn() {
//     return this.extra + "BCD";
//   }
//   static sFn() {}
// }

// class T extends S {}
// let t = new S("x");
// Object.defineProperty(t,'other', {
// 	get:
// 	function () {
// 		return function() {return t.fn() + "HELLO"};
// 	}
// })
// this.extra = "NOT A "
// t = {
//   other: () => "OTHER",
//   fn: () => "FN"
// }

// console.log(render('index', { name: ['Hooky', 'Bubba'], test: {other: "this is it"} }));
// console.log(render('index', { test: t, name: ['TJ', 'Bubba'] }));
// let t2 = new T('AVC');
// t2.other = () => "t2"
// console.log(render('index', { test: t2, name: ['TJ', 'Bubba'] }));
// console.log("====================")
// console.log(renderSet('index', { test: new Set([t, t2]) }, { name: ['TJ', 'Bubba'] }));
// console.log(renderMap('index', { name: 'test' }, { TJ: t, Hooky: t2 }));