const expect = require('chai').expect;

const { render, renderSet, renderMap, renderRoot } = require('../ltsr');
describe('ltsr', () => {
  it('fails with a path out of root', () =>
    expect(() => render('../../nothing'))
    .to
    .throw(Error, /outside of root/)
  );
  it("fails when the template doesn't exit", () =>
    expect(() => render('nothing'))
    .to
    .throw(Error, /ENOENT/)
  );
  it('fails when a variable is missing', () =>
    expect(() => render('test/index', {key: 1}))
    .to
    .throw(ReferenceError, /Render failed/)
  );
  it('succeeds when everything is present', () => {
    expect(render('test/index', {key: 1, val: 2})).to.eql('12');
  });
  it('renders with a set', () => {
    expect(renderSet('test/index', {key: [1,2,3]}, {val: 2})).to.eql('122232');
  });
  it('renders with a map', () => {
    expect(renderMap('test/index', {key: 'val'}, {a:1, b:2})).to.eql('a1b2');
  });
  it('renders a partial', () => {
    expect(render('test/outer', {external: {key: 1, val: 2}})).to.eql('z12y');
  })
});