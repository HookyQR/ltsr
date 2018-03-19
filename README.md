# LTSR

**Literal Template String Render**

Use Javascript Literal Template String syntax for file templates.

`renderRoot(folder)` : set the root directory for template loading

`render(file, { locals: , collection: , keyName:, valueName: })`

`render` second argument defaults:
  * `locals = {}`
  * `collection = null`
  * `keyName = 'index'`: When collection is a `Set` or an `Array`.
  * `keyName = 'key'`: Otherwise.
  * `valueName = 'value'`

### Single render:
`render(file, { locals: {} })` : render template at `root/file` making the keys in `locals` available as arguments to the template

### Iterative render, with an Array or a Set:
With `collection: (Array or Set)` : repetitively render template at `root/file` making the keys in `locals` available as arguments to the template. Collection is iterated and the index and values are sent as the `valueName` and `keyName` respectively.

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
Called with `renderSet('partial', {collection: ['Hooky', 'TJ'], locals: {place: 'Earth'}, valueName: 'name'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
```
* Note: the array index is passed to the partial (with the default key `'index'`), but is not used in this case.
#### Iterative call with an Object
Called with `renderMap('partial', {collection: {Hooky: 'Earth', TJ: 'Earth', Marvin: 'Mars'}, keyName: 'name', valueName: 'place'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
<div>Hello Marvin of Mars</div>
```
## partials at depth
The render method is available to templates, enabling partial renders:
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