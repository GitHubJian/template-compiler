function genProps(props) {
  var staticProps = ''

  for (var i = 0; i < props.length; i++) {
    var prop = props[i]
    var value = transformSpecialNewlines(prop.value)
    staticProps += '"' + prop.name + '":' + value + ','
  }

  staticProps = '{' + staticProps.slice(0, -1) + '}'

  return staticProps
}

function genData$2(el, state) {
  var data = '{'
  if (el.attrs) {
    data += 'attrs:' + genProps(el.attrs) + ','
  }

  data = data.replace(/,$/, '') + '}'
  return data
}

function CodegenState(options) {
  this.options = options
  this.warn = options.warn || baseWarn
  this.onceId = 0
  this.staticRenderFns = []
  this.pre = false
}

function genChildren(el, state, altGenNode) {
  var children = el.children
  if (children.length) {
    var gen = altGenNode || genNode
    return (
      '[' +
      children
        .map(function(c) {
          return gen(c, state)
        })
        .join(',') +
      ']'
    )
  }
}

function genNode(node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

function genElement(el, state) {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre
  }

  var code
  var data
  if (!el.plain) {
    data = genData$2(el, state)
  }

  var children = genChildren(el, state)
  code =
    "createElement('" +
    el.tag +
    "'" +
    (data ? ',' + data : '') +
    (children ? ',' + children : '') +
    ')'

  return code
}

function genComment(comment) {
  return 'createEmptyVNode(' + JSON.stringify(comment.text) + ')'
}

function transformSpecialNewlines(text) {
  return text.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function genText(text) {
  return (
    'createTextVNode(' +
    (text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))) +
    ')'
  )
}

function generate(ast, options) {
  var state = new CodegenState(options)
  var code = ast ? genElement(ast, state) : 'createElement("div")'

  return {
    // render: 'with(this){return ' + code + '}'
    render: code
  }
}

module.exports = generate
