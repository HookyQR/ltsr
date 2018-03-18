# JST

**Javascript Template String - Template file**

Use Javascript Template string syntax for file templates.

`renderRoot(folder)` : set the root directory for template loading

`render(file, locals = {})` : render template at `root/file` making the keys in `locals` available as arguments to the template

`renderSet(file, set = { key: []}, locals = {})` : repetitively render template at `root/file` making the keys in `locals` available as arguments to the template. The _single_ key in `set` must have a value of either an `Array` or a `Set`. This iterable is looped through and each value is sent to a standard `render` call along with the provided `locals`, if `locals` contains the same key, the value from the set takes its place.

`renderSet(file, mapKeyNames = {key: 'value'}, map = {}, locals = {})` : like `renderSet` except the content of `map` is iterated and the keys sent as the single `key` name from `mapKeyNames`, and the values sent as `value` from the same.

### Example: `partial.jst`
```html
<div>Hello ${name} of ${place}</div>
```
#### Called with `render('partial', {name: 'Hooky', place: 'Earth'})`:
```html
<div>Hello Hooky of Earth</div>
```
#### Called with `renderSet('partial', {name: ['Hooky', 'TJ']}, {place: 'Earth'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
```
#### Called with `renderMap('partial', {name: 'place'} {Hooky: 'Earth', TJ: 'Earth', Marvin: 'Mars'})`:
```html
<div>Hello Hooky of Earth</div>
<div>Hello TJ of Earth</div>
<div>Hello Marvin of Mars</div>
```
## partials at depth
The three render methods are available to the templates, enabling partial renders:
### With `outer.jst`
```html
<html>
  <body>
    ${ render('partial', user) }
  </body>
</html>
```
#### Calling with `render('outer', {user: {name: 'Hooky', place: 'Earth'}})`:
```html
<html>
  <body>
    <div>Hello Hooky of Earth</div>
  </body>
</html>
```