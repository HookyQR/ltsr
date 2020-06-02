const LTSRInner = require('../src/ltsr_inner');
const Filename = require('../src/filename');
const RenderError = require('../src/render_error');

const { join: joinPath } = require('path');

const { match: { any: anything } } = require('sinon');

describe('LTSR', () => {
  subject('ltsr', () => new LTSRInner(owner, filename, layout));
  set('error', () => ({
    add: stub()
  }));
  set('owner', () => ({
    error,
    render: stub().returns(''),
    raw: stub(),
  }));
  set('filename', () => new Filename(basePath, name));
  set('basePath', joinPath(__dirname, 'mock'));
  set('name', 'test');
  set('locals', {});
  set('keepWhitespace', false);

  set('layout', null);

  it('delegates subRender to owner.render', () => {
    ltsr.subRender();
    expect(owner.render).to.have.been.calledWith(anything, anything, true);
  });

  it('delegates render.raw to owner.raw', () => {
    ltsr.subRender.raw();
    expect(owner.raw).to.have.been.calledWith(anything, anything, true);
  });

  describe('#renderCollection', () => {
    subject('renderedCollection', () => ltsr.renderCollection(dataSet));
    set('dataSet', () => ({ mock: 'it is me', collection }));
    set('collection', []);

    it('stores the dataSet', () => {
      renderedCollection;
      expect(ltsr.dataSet).to.include({ mock: 'it is me' });
    });

    describe('collection types', () => {
      set('theStub', () => stub(ltsr, target));
      beforeEach(() => theStub);

      context('with an Array', () => {
        set('target', 'renderSet');

        it('calls renderSet', () => {
          renderedCollection;
          expect(theStub).to.have.been.calledOnce;
        });
      });

      context('with a Set', () => {
        set('target', 'renderSet');
        set('collection', new Set());

        it('calls renderSet', () => {
          renderedCollection;
          expect(theStub).to.have.been.calledOnce;
        });
      });

      context('with a Map', () => {
        set('target', 'renderMap');
        set('collection', new Map());

        it('calls renderMap', () => {
          renderedCollection;
          expect(theStub).to.have.been.calledOnce;
        });
      });

      context('with an Object', () => {
        set('target', 'renderObject');
        set('collection', {});

        it('calls renderObject', () => {
          renderedCollection;
          expect(theStub).to.have.been.calledOnce;
        });
      });

      context('with an unknown', () => {
        set('target', 'renderObject');
        set('collection', 5);

        it('throws', () => expect(() => renderedCollection).to.throw('render with collection'));
      });
    });
  });

  describe('#layoutWrap', () => {
    subject('wrapped', () => ltsr.layoutWrap(data, locals, keepWhitespace));
    set('data', 'a string');

    context('with no layout', () => {
      set('layout', null);

      it('returns the data', () => expect(wrapped).to.eq(data));
    });

    context('with a layout', () => {
      set('layout', () => new Filename(basePath, layoutName, 'layout'));
      set('layoutName', 'layoutTest');

      it('provides the render method', () => {
        wrapped;
        expect(owner.render).to.have.been.calledWith('sub render test');
      });

      describe('yielding', () => {
        set('locals', { title: 'the title' });

        it('reads from the dataSet', () => {
          expect(wrapped).to.include('the title');
          expect(wrapped).to.include('a string');
        });
      });

      describe('keepWhitespace', () => {
        context('when set', () => {
          set('keepWhitespace', true);

          it('keeps the trailing whitespace', () => expect(wrapped).to.match(/[\s\r\n]$/g));
        });
        context('when not set', () => {
          set('keepWhitespace', false);

          it('has no trailing whitespace', () => expect(wrapped).to.match(/[^\s\r\n]$/g));
        });
      });
    });
  });

  describe('#render', () => {
    subject('rendered', () => ltsr.render(locals, keepWhitespace));
    set('locals', { variable: 'the variable' });

    it('sends the locals for rendering', () => expect(rendered).to.include('the variable'));

    it('provides the owner render methods', () => {
      rendered;
      expect(owner.render).to.have.been.calledWith('inner');
      expect(owner.raw).to.have.been.calledWith('plain.txt');
    });

    describe('keepWhitespace', () => {
      context('when set', () => {
        set('keepWhitespace', true);

        it('keeps the trailing whitespace', () => expect(rendered).to.match(/[\s\r\n]$/g));
      });
      context('when not set', () => {
        set('keepWhitespace', false);

        it('has no trailing whitespace', () => expect(rendered).to.match(/[^\s\r\n]$/g));
      });
    });

    describe('failures', () => {
      context('missing template', () => {
        set('name', 'notAFile');

        it('fails', () => expect(() => rendered).to.throw(/No template found/));
      });

      context('missing variable', () => {
        set('locals', {});

        it('fails', () => expect(() => rendered).to.throw(/variable is not defined/));
        it('the template is passed to the error', () => {
          expect(() => rendered).to.throw();
          expect(error.add).to.have.been.calledWithMatch('template', `${name}.lt`);
        });
      });
    });
  });
});

