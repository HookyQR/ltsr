const stackLine = (kind, file, callSite) => {
  const line = callSite.getLineNumber();
  const col = callSite.getColumnNumber() - (line === 1 ? 8 : 0);
  return `    ${kind} (${file}:${line}:${col})`;
};

const layout = (file, callSite) => stackLine('at Layout', file, callSite);
const template = (file, callSite) => stackLine('at Template', file, callSite);
const rendering = (file) => `    (rendering ${file})`;

module.exports = {
  template,
  layout,
  rendering
};
