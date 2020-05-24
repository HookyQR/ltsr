const expect = require('chai')
  .expect;

const LTSR = require('../src/ltsr');
const { join: joinPath } = require('path');

describe('LTSR', () => {
  set('ltsr', () => new LTSR({ root: joinPath(__dirname, 'mock') }));

  set('keepWhitespace', false);
  set('args', () => ({ ...baseArgs, ...overrideArgs }));
  set('baseArgs', () => ({ keepWhitespace }));
  set('overrideArgs', {});

  sharedExamples('bad render avoidance', () => {
    context('with a path out of root', () => {
      set('path', '../out/of/root');

      it('fails', () => expect(() => render).to.throw(Error, /outside of root/));
    });

    context('with a missing template', () => {
      set('path', 'notATemplate');

      it('fails', () => expect(() => render).to.throw(Error, /No template/));
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
    set('path', 'index');

    itBehavesLike('bad render avoidance');
    itBehavesLike('whitespace appreciator');

    describe('default layout', () => {
      set('ltsr', () => new LTSR({ root: joinPath(__dirname, 'mock'), layout: 'index' }));

      set('path', 'simple');

      it('renders with the default layout', () => {
        expect(render).to.eq('Wrap_A simple string_ped');
      });

      context('overriding the default', () => {
        set('baseArgs', { layout: 'withTitle' });

        it('renders with the provided layout', () => {
          expect(render).to.eq(' then A simple string');
        });
      });

      describe('raw never renders template', () => {
        set('render', () => ltsr.raw('simple'));

        it('does not render the layout', () => {
          expect(render).to.eq('A simple string');
        });
      });

      context('depth rendering', () => {
        set('baseArgs', { locals: { external: { key: 1, val: 2, constant: 3 } } });
        set('path', 'outer');

        it('only renders the default template on the outer', () => {
          expect(render).to.eq('Wrap_z123y_ped');
        });
      });
    });

    context('bad values', () => {
      context('keyName', () => {
        set('baseArgs', { keyName: 1, collection: [] });

        it('bails', () => expect(() => render).to.throw(/must be strings/));
      });

      context('valueName', () => {
        set('baseArgs', { valueName: 1, collection: [] });

        it('bails', () => expect(() => render).to.throw(/must be strings/));
      });

      context('collection not iterable', () => {
        set('baseArgs', { collection: 5 });

        it('bails', () => expect(() => render).to.throw(/Don't know how to render with collection of type Number/));
      });


    });

    context('rendering one level deep', () => {
      context('rendering an object', () => {
        class Thing {
          get key() { return this.val.toUpperCase(); }
          get val() { return 'b'; }
          get constant() { return 'c'; }
        }

        set('baseArgs', { locals: new Thing() });

        it('succeeds', () => expect(render).to.eq('Bbc'));
      });

      context('when a variable is missing', () => {
        set('baseArgs', { locals: { key: 1 } });
        it('fails', () => expect(() => render).to.throw(/Render failed/));
      });

      context('with required args present', () => {
        set('baseArgs', { locals: { key: 1, val: 2, constant: 3 } });

        it('succeeds', () => expect(render).to.eq('123'));
      });

      context('with an Array', () => {
        set('baseArgs', {
          locals: { constant: 3 },
          collection: ['A', 'B', 'C'],
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(render).to.eq('0A31B32C3'));

        context('defaults to `index`, `value`', () => {
          set('baseArgs', { collection: ['a', 'b', 'c'] });
          set('path', 'defaults/index_value');

          it('succeeds', () => expect(render).to.eq('0a1b2c'));
        });

        context('calling with a sep', () => {
          set('overrideArgs', { sep: 'x' });

          it('inserts between', () => expect(render).to.eq('0A3x1B3x2C3'));
        });
      });

      context('with a Set', () => {
        set('baseArgs', {
          locals: { constant: 3 },
          collection: new Set(['a', 'b', 'c']),
          keyName: 'key',
          valueName: 'val'
        });
        it('succeeds', () => expect(render).to.eq('0a31b32c3'));

        context('defaults to `index`, `value`', () => {
          set('baseArgs', { collection: new Set(['a', 'b', 'c']) });
          set('path', 'defaults/index_value');

          it('succeeds', () => expect(render).to.eq('0a1b2c'));
        });

        context('calling with a sep', () => {
          set('overrideArgs', { sep: 'x' });

          it('inserts between', () => expect(render).to.eq('0a3x1b3x2c3'));
        });
      });

      context('with an object', () => {
        set('baseArgs', {
          locals: { constant: 3 },
          collection: { a: 1, b: 2 },
          valueName: 'val'
        });

        it('succeeds', () => expect(render).to.eq('a13b23'));

        context('defaults to `key`, `value`', () => {
          set('baseArgs', { collection: { a: 1, b: 2 } });
          set('path', 'defaults/key_value');

          it('succeeds', () => expect(render).to.eq('a1b2'));
        });

        context('calling with a sep', () => {
          set('overrideArgs', { sep: 'x' });

          it('inserts between', () => expect(render).to.eq('a13xb23'));
        });
      });

      context('with a map', () => {
        set('baseArgs', {
          locals: { constant: 3 },
          collection: new Map([['A', 1], ['B', 2]]),
          valueName: 'val'
        });

        it('succeeds', () => expect(render).to.eq('A13B23'));

        context('defaults to `key`, `value`', () => {
          set('baseArgs', { collection: new Map([['A', 1], ['B', 2]]) });
          set('path', 'defaults/key_value');

          it('succeeds', () => expect(render).to.eq('A1B2'));
        });

        context('calling with a sep', () => {
          set('overrideArgs', { sep: 'x' });

          it('inserts between', () => expect(render).to.eq('A13xB23'));
        });
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
          method(value) { return this.other() + value; }
          other() { return '1'; }
        }
        set('args', { locals: new Thing() });
        set('path', 'sendingFunctions');

        it('succeeds', () => expect(render).to.eq('A1xZ'));
      });

      context('when a render error occurs at depth', () => {
        set('path', 'rendersBadInner');
        set('args', {});

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

    context('rendering with layout', () => {
      set('args', () => ({ layout: 'layout/index', keepWhitespace }));
      set('path', 'simple');

      it('wraps the rendered text', () => expect(render).to.eq('Wrap_A simple string_ped'));

      context('with whitespace kept', () => {
        set('keepWhitespace', true);

        it('keeps trailing whitespace for both', () => expect(render).to.eq('Wrap_A simple string\n_ped\n'));
      });

      context('when the layout yields for a value', () => {
        set('args', () => ({ layout: 'layout/withTitle', locals }));
        set('locals', { title: 'Working' });
        it('succeeds', () => expect(render).to.eq('Working then A simple string'));

        context('when the requested value is not present', () => {
          set('locals', {});

          it('still renders', () => expect(render).to.eq(' then A simple string'));
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
