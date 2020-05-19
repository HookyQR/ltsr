const expect = require('chai')
  .expect;

const LTSR = require('../ltsr');
const { join: joinPath } = require('path');

describe('LTSR', () => {
  set('ltsr', () => new LTSR(joinPath(__dirname, 'mock')));

  set('keepWhitespace', false);
  set('args', () => ({ keepWhitespace }));

  sharedExamples('bad render avoidance', () => {
    context('with a path out of root', () => {
      set('path', '../out/of/root');

      it('fails', () => expect(() => render).to.throw(Error, /outside of root/));
    });

    context('with a missing template', () => {
      set('path', 'nothing');

      it('fails', () => expect(() => render).to.throw(Error, /ENOENT/));
    });
  });

  sharedExamples('whitespace appreciator', () => {
    describe('whitespace', () => {
      set('path', 'simple');

      it('does not end with whitespace', () => expect(render).not.to.match(/\s$/g));

      context('when keeping whitespace', () => {
        set('keepWhitespace', true);

        it('ends with whitespace', () => expect(render).to.match(/\n$/g));
      });
    });
  });

  describe('.render', () => {
    subject('render', () => ltsr.render(path, args));

    itBehavesLike('bad render avoidance');
    itBehavesLike('whitespace appreciator');

    context('rendering one level deep', () => {
      set('path', 'index');

      context('rendering an object', () => {
        class Thing {
          get key() { return this.val.toUpperCase(); }
          get val() { return 'b'; }
          get constant() { return 'c'; }
        }

        set('args', { locals: new Thing() });

        it('succeeds', () => expect(render).to.eq('Bbc'));
      });

      context('when a variable is missing', () => {
        set('args', { locals: { key: 1 } });
        it('fails', () => expect(() => render).to.throw(/Render failed/));
      });

      context('with required args present', () => {
        set('args', { locals: { key: 1, val: 2, constant: 3 } });

        it('succeeds', () => expect(render).to.eq('123'));
      });

      context('with an Array', () => {
        set('args', {
          locals: { constant: 3 },
          collection: ['A', 'B', 'C'],
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(render).to.eq('0A31B32C3'));
      });

      context('with a Set', () => {
        set('args', {
          locals: { constant: 3 },
          collection: new Set(['a', 'b', 'c']),
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(render).to.eq('0a31b32c3'));
      });

      context('with an object', () => {
        set('args', {
          locals: { constant: 3 },
          collection: { a: 1, b: 2 },
          valueName: 'val'
        });

        it('succeeds', () => expect(render).to.eq('a13b23'));
      });

      context('with a map', () => {
        set('args', {
          locals: { constant: 3 },
          collection: new Map([['A', 1], ['B', 2]]),
          valueName: 'val'
        });

        it('succeeds', () => expect(render).to.eq('A13B23'));
      });
    });

    context('rendering at depth', () => {
      set('path', 'outer');
      set('args', { locals: { external: { key: 1, val: 2, constant: 3 } } });

      it('uses the same root', () => expect(render).to.eq('z123y'));

      context('when render is set', () => {
        set('args', { locals: { render: null, external: { key: 1, val: 2, constant: 3 } } });

        it('does not overwrite', () => expect(render).to.eq('z123y'));
      });

      context('depth requiring methods', () => {
        class Thing {
          method(value) { return '1' + value; }
        }
        set('args', { locals: new Thing() });
        set('path', 'sendingFunctions');

        it('succeeds', () => expect(render).to.eq('A1xZ'));
      });

      context('when a render error occurs at depth', () => {
        set('path', 'rendersBadInner');

        it('presents a useful error', () => {
          try {
            render;
            /* c8 ignore next */
            expect(1).to.eq(2); // deliberate failure - shouldn't be reached
          } catch (error) {
            expect(error.stack).to.include("mock/badInner.lt:3");
            expect(error.stack).to.include("mock/rendersBadInner.lt:");
            expect(error.stack.indexOf('/badInner')).to.be.below(error.stack.indexOf('/rendersBadInner'));
          }
        });
      });
    });
  });

  describe('.raw', () => {
    subject('render', () => ltsr.raw(path, keepWhitespace));

    itBehavesLike('bad render avoidance');
    itBehavesLike('whitespace appreciator');

    context('with a valid path', () => {
      set('path', 'index');

      it('succeeds', () => expect(render).to.eq('${key}${val}${constant}'));
    });

    context('depth raw called', () => {
      set('render', () => ltsr.render(path));
      set('path', 'rawOuter');

      it('does not try to interpolate at depth', () => expect(render).to.eq('z${key}${val}${constant}y'));
    });

    context('rendering without `.lt`', () => {
      set('path', 'plain.txt');

      it('succeeds', () => expect(() => render).not.to.throw());
    });
  });
});
