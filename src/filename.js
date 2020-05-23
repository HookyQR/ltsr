const { existsSync: exists } = require('fs');
const { join: joinPath, relative: relativePath } = require('path');

class Filename {
  constructor(root, name, kind) {
    this.root = root;
    this.name = name;
    this.kind = kind;
    if (relativePath(root, joinPath(this.root, this.name)).startsWith('..'))
      throw new Error(`Attempt to load template (${name}) which falls outside of root (${root})`);
  }

  get(allowNoLt) {
    let file = this.kind ?
      this.from(this.kind, allowNoLt) || this.from('', allowNoLt) :
      this.from('', allowNoLt);

    if (file) { return file; }
    throw new Error(`No template found: ${this.name}`);
  }
  from(mid, allowNoLt) {
    const file = joinPath(this.root, mid, this.name);
    if (exists(`${file}.lt`)) { return `${file}.lt`; }
    if (allowNoLt && exists(file)) { return file; }
  }
}

module.exports = Filename;
