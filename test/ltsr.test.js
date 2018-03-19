const expect = require('chai')
  .expect;

const { render } = require('../ltsr');
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
    expect(() => render('test/index', { locals: { key: 1 } }))
    .to
    .throw(ReferenceError, /Render failed/)
  );
  it('succeeds when everything is present', () => {
    expect(render('test/index', { locals: { key: 1, val: 2, constant: 3 } }))
      .to.eql('123');
  });
  it('renders with a set', () => {
    expect(render('test/index', {
        locals: { constant: 3 },
        collection: ['a', 'b', 'c'],
        keyName: 'key',
        valueName: 'val'
      }))
      .to.eql('0a31b32c3');
  });
  it('renders with a map', () => {
    expect(render('test/index', { locals: { constant: 3 }, collection: { a: 1, b: 2 }, valueName: 'val' }))
      .to.eql('a13b23');
  });
  it('renders a partial', () => {
    expect(render('test/outer', { locals: { external: { key: 1, val: 2, constant: 3 } } }))
      .to.eql('z123y');
  })
});