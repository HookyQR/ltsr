# LTSR

**Literal Template String Render**

Use Javascript Literal Template String syntax for file templates.

`ltsr = new LTSR({root: , layout: })` : create a renderer at a specific root, optionally with a default layout.

`ltsr.render(file, { locals:, collection:, sep:, keyName:, valueName:, keepWhitespace, layout:})`

`render` second argument defaults:
  * `locals = {}`
  * `collection = null`
  * `sep = ''`: String to place between collection elements
  * `keyName = 'index'`: When collection is a `Set` or an `Array`.
  * `keyName = 'key'`: Otherwise.
  * `valueName = 'value'`
  * `keepWhitespace = false`: set to true to keep trailing whitespace from the template file
  * `layout = undefined`: see **Layout** section below

`ltsr.raw(file, keepWhitespace = false)` may be used to render the template without interpolation, useful for including javascript files which have string templates in them.

It also allows the file (on disk) to not include the `.lt` extension. `ltsr.raw("style.css")` (or `render.raw` from within a template) will first attempt to render `style.css.lt`, if that fails it will attempt to render `style.css`.

### Single render:
`render(file, { locals: {} })` : render template at `root/file` making the keys in `locals` available as arguments to the template

### Iterative render, with an Array or a Set:
With `collection: (Array or Set)` : repetitively render template at `root/file` making the keys in `locals` available as arguments to the template. Collection is iterated and the index and values are sent as the `valueName` and `keyName` respectively.

Effectively making these lines equivalent:
```javascript
['a', 'b', 'c'].map((value, index) => ltsr.render('template', { locals: { content: value, position: index } })).join('');

ltsr.render('template', {collection: ['a', 'b', 'c'], valueName: 'content', keyName: 'position'}));
```

The following are also equivalent, using the default value and key names for arrays:
```javascript
['a', 'b', 'c'].map((value, index) => ltsr.render('template', { locals: { value, index } })).join('');

ltsr.render('template', { collection: ['a', 'b', 'c'] }));
```

### Iterative render, with a Map or an Object:
With `collection: (Map or Object)` : as above, but the key is passed where the index would have been above.

### Example: `partial.lt`
```html
<div>Hello ${name} of ${place}</div>
```

#### Simple call
Called with `render('partial', {locals: {name: 'Hooky', place: 'Earth'}})`:
```html
<div>Hello Hooky of Earth</div>
```
#### Iterative call with and Array
Called with `render('partial', {collection: ['Hooky', 'TJ'], locals: {place: 'Earth'}, valueName: 'name'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
```
* Note: the array index is passed to the partial (with the default key `'index'`), but is not used in this case.

#### Iterative call with an Object
Called with `render('partial', {collection: {Hooky: 'Earth', TJ: 'Earth', Marvin: 'Mars'}, keyName: 'name', valueName: 'place'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
<div>Hello Marvin of Mars</div>
```
## partials at depth
The render and render.raw methods are available to templates, enabling partial renders:
### With `outer.lt`
```html
<html>
  <body>
    ${ render('partial', {locals: user}) }
  </body>
</html>
```
#### Calling with `render('outer', {locals: {user: {name: 'Hooky', place: 'Earth'}}})`:
```html
<html>
  <body>
    <div>Hello Hooky of Earth</div>
  </body>
</html>
```

### Layouts
Providing a layout template to `render` will wrap the target rendered file in the layout at the point of a `yield`.

#### With `layout.lt`
```html
<html>
  <head><title>${yield 'title'}</title></head>
  <body>${yield}</body>
</html>
```

#### And `content.lt`
```html
This is the body
```

#### Calling with `render('content', {layout: 'layout', locals: {title: 'This is the title'}})`:
```html
<html>
  <head><title>This is the title</title></head>
  <body>This is the body</body>
</html>
```

Unlike rendering a partial, if a value yielded for (such as `yield 'title'` in this case) is not provided, LTSR will not raise an error.
No arguments are passed to the layout, but can be provided in the `locals` field of the render options. Note that they must be `yield`ed for.

If render is called with a layout while rendering a collection, each item is wrapped in the layout.

### Using `sep`

When rendering a collection, you can provided an element separator string to place between items.

#### With `partial.lt`
```html
<div>${name}</div>
```

#### Calling with `render('partial', { collection: ['me', 'you', 'her', 'him'], valueName: 'name', sep: '<hr/>\n'})`:
```html
<div>me</div><hr/>
<div>you</div><hr/>
<div>her</div><hr/>
<div>him</div>
```

