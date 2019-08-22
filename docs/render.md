# render(ast)

Convert AST to HTML

- `ast` `<JSON Object>` Note that

## Example:

```js
const compile = require('html-template-compiler')

const ast = compile.compiler({
  type: 1,
  tag: 'div',
  attrsList: [{ name: 'class', value: 'root' }],
  children: [{ type: 3, text: 'Hello, wrold' }],
  errors: [],
  tips: []
})
console.log(ast)
```
