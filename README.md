# HTML Template Fragment

html fragment 与 ast JSON 语法树相互转换

### Usage

```
npm install html-template-compiler

const { compiler, render } = require('html-template-compiler')

```

### Api

- compiler(fragment)
  @desc 编译 html 片段
  @params fragment HTML 片段
  @return ast json 语法树

- render(ast)
  @desc 渲染 AST 语法树
  @params ast json 语法树
  @return html fragment
