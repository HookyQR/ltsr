# LTSR

**Literal Template String Render**

Use Javascript Literal Template String syntax for file templates.

`lstr = new LTSR(folder)` : set the root directory for template loading

`ltsr.render(file, { locals:, collection:, keyName:, valueName:, keepWhitespace})`

`render` second argument defaults:
  * `locals = {}`
  * `collection = null`
  * `keyName = 'index'`: When collection is a `Set` or an `Array`.
  * `keyName = 'key'`: Otherwise.
  * `valueName = 'value'`
  * `keepWhitespace = false`: set to true to keep trailing whitespace from the template file

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
