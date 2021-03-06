const Filename = require('./filename');
const LTSRInner = require('./ltsr_inner');
const RenderError = require('./render_error');

const primeRoot = process.cwd();

class LTSR {
  constructor({ root = primeRoot, layout }) {
    this.error = new RenderError();
    this.root = root;
    this.layout = layout ? new Filename(this.root, layout, 'layout') : undefined;
  }

  render(
    name,
    {
      locals = {},
      collection = null,
      keyName = (collection instanceof Array || collection instanceof Set) ? 'index' : 'key',
      valueName = 'value',
      keepWhitespace = false,
      layout = null,
      sep = '',
    } = {},
    partial
  ) {
    let layoutFile = partial ? undefined : this.layout;
    if (layout) layoutFile = new Filename(this.root, layout, 'layout');
    const inner = new LTSRInner(this, new Filename(this.root, name, partial && 'partial'), layoutFile);

    try {
      if (!collection) return inner.render(locals, keepWhitespace);
      if ('string' !== typeof keyName || 'string' !== typeof valueName)
        throw new Error('keyName and valueName must be strings');

      return inner.renderCollection({ locals, collection, keyName, valueName, keepWhitespace, sep });
    } catch (e) {
      if (!partial) throw this.error.build(e); // the initial call
      throw e;
    }
  }

  raw(name, keepWhitespace, partial) {
    return new LTSRInner(this, new Filename(this.root, name, partial && 'partial')).raw(keepWhitespace);
  }
}

module.exports = LTSR;
