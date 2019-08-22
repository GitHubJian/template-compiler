function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

function isTrue(v) {
  return v === true
}

function isFalse(v) {
  return v === false
}

function isDef(v) {
  return v !== undefined && v !== null
}

function genData$2(el) {
  var data = {}

  if (el.attrs) {
    data.attrs = el.attrs
  }

  return data
}

function genChildren(el) {
  var children = el.children
  if (children.length) {
    var gen = genNode

    return children.map(function(c) {
      return gen(c)
    })
  }
}

function genNode(node) {
  if (node.type === 1) {
    return genElement(node)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

function genElement(el) {
  var data = genData$2(el)

  var children = genChildren(el)

  return createVNode(el.tag, data, children)
}

function genComment(comment) {
  return createEmptyVNode(JSON.stringify(comment.text))
}

function transformSpecialNewlines(text) {
  return text.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function genText(text) {
  return createTextVNode(
    text.type === 2
      ? text.expression
      : transformSpecialNewlines(JSON.stringify(text.text))
  )
}

function generate(ast) {
  var code = ast ? genElement(ast) : ''

  return code
}

function VNode(tag, data, children, text) {
  this.tag = tag
  this.data = data
  this.children = children
  this.text = text
}

function createVNode(tag, data, children) {
  if (Array.isArray(data) || isPrimitive(data)) {
    children = data
    data = undefined
  }

  if (!tag) {
    return createEmptyVNode()
  }

  var vnode
  if (typeof tag === 'string') {
    vnode = new VNode(tag, data, children)
  }

  if (isDef(vnode)) {
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function createEmptyVNode(text) {
  if (text === void 0) text = ''

  var node = new VNode()
  node.text = text
  node.isComment = true

  return node
}

function createTextVNode(val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

function createComment$1(text) {
  return `<!-- ${text} -->`
}

function createTextNode$1(text) {
  return text
}

function createChildren$1(vnode, children) {
  var html = ''
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; ++i) {
      html += createElm(children[i])
    }
  } else if (isPrimitive(vnode.text)) {
    html += createTextNode$1(String(vnode.text))
  }

  return html
}

function createElm(vnode) {
  var data = vnode.data
  var children = vnode.children
  var tag = vnode.tag
  var text = vnode.text
  var attrHTMLFragment = ''

  if (data && data.attrs) {
    for (var name in data.attrs) {
      attrHTMLFragment += `${name}="${data.attrs[name]}" `
    }
    attrHTMLFragment = attrHTMLFragment.slice(0, -1)
  }

  if (isDef(tag)) {
    var html, childrenHTMLFragment
    if (children) {
      childrenHTMLFragment = createChildren$1(vnode, children)
    }

    if (isUnaryTag(tag)) {
      html = `<${tag} ${attrHTMLFragment}/>`
    } else {
      html = `<${tag} ${attrHTMLFragment}>${childrenHTMLFragment}</${tag}>`
    }

    return html
  } else if (isTrue(vnode.isComment)) {
    return createComment$1(text)
  } else {
    return createTextNode$1(text)
  }
}

module.exports = {
  generate,
  createElm
}
