const expect = require('chai')
  .expect;

const { renderer } = require('../ltsr');
const { join: joinPath } = require('path');

describe('ltsr', () => {
  set('render', () => renderer(joinPath(__dirname, 'mock')));

  sharedExamples('bad render avoidance', () => {
    context('with a path out of root', () => {
      set('path', '../out/of/root');

      it('fails', () => expect(() => rendered).to.throw(Error, /outside of root/));
    });

    context('with a missing template', () => {
      set('path', 'nothing');

      it('fails', () => expect(() => rendered).to.throw(Error, /ENOENT/));
    });
  });

  describe('render', () => {
    subject('rendered', () => render(path, args));

    set('args', {});

    itBehavesLike('bad render avoidance');


    context('rendering one level deep', () => {
      set('path', 'index');

      context('rendering an object', () => {
        class Thing {
          get key() { return this.val.toUpperCase(); }
          get val() { return 'b'; }
          get constant() { return 'c'; }
        }

        set('args', { locals: new Thing() });

        it('succeeds', () => expect(rendered).to.eq('Bbc'));
      });

      context('when a variable is missing', () => {
        set('args', { locals: { key: 1 } });
        it('fails', () => expect(() => rendered).to.throw(ReferenceError, /Render failed/));
      });

      context('with required args present', () => {
        set('args', { locals: { key: 1, val: 2, constant: 3 } });

        it('succeeds', () => expect(rendered).to.eq('123'));
      });

      context('with an Array', () => {
        set('args', {
          locals: { constant: 3 },
          collection: ['A', 'B', 'C'],
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(rendered).to.eq('0A31B32C3'));
      });

      context('with a Set', () => {
        set('args', {
          locals: { constant: 3 },
          collection: new Set(['a', 'b', 'c']),
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(rendered).to.eq('0a31b32c3'));
      });

      context('with an object', () => {
        set('args', {
          locals: { constant: 3 },
          collection: { a: 1, b: 2 },
          valueName: 'val'
        });

        it('succeeds', () => expect(rendered).to.eq('a13b23'));
      });

      context('with a map', () => {
        set('args', {
          locals: { constant: 3 },
          collection: new Map([['A', 1], ['B', 2]]),
          valueName: 'val'
        });

        it('succeeds', () => expect(rendered).to.eq('A13B23'));
      });
    });

    context('rendering at depth', () => {
      set('path', 'outer');
      set('args', { locals: { external: { key: 1, val: 2, constant: 3 } } });

      it('uses the same root', () => expect(rendered).to.eq('z123y'));

      context('when render is set', () => {
        set('args', { locals: { render: null, external: { key: 1, val: 2, constant: 3 } } });

        it('does not overwrite', () => expect(rendered).to.eq('z123y'));
      });

      context('depth requiring methods', () => {
        class Thing {
          method(value) { return '1' + value; }
        }
        set('args', { locals: new Thing() });

        set('path', 'sendingFunctions');

        it('succeeds', () => expect(rendered).to.eq('A1xZ'));
      });
    });
  });

  describe('render.raw', () => {
    subject('rendered', () => render.raw(path));

    itBehavesLike('bad render avoidance');

    context('with a valid path', () => {
      set('path', 'index');

      it('succeeds', () => expect(rendered).to.eq('${key}${val}${constant}'));
    });

    context('depth raw called', () => {
      set('rendered', () => render(path));
      set('path', 'rawOuter');

      it('does not try to interpolate at depth', () => expect(rendered).to.eq('z${key}${val}${constant}y'));
    });
  });
});
