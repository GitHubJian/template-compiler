var ALWAYS_NORMALIZE = 2

/**
 * Check if value is primitive.
 */
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

function isUndef(v) {
  return v === undefined || v === null
}

function isTextNode(node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function createElement(tag, data, children, alwaysNormalize) {
  if (Array.isArray(data) || isPrimitive(data)) {
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
  }

  return _createElement(tag, data, children)
}

function _createElement(tag, data, children) {
  if (!tag) {
    return createEmptyVNode()
  }

  var vnode
  if (typeof tag === 'string') {
    vnode = new VNode(tag, data, children, undefined, undefined)
  }

  if (isDef(vnode)) {
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function VNode(tag, data, children, text, elm, context) {
  this.tag = tag
  this.data = data
  this.children = children
  this.text = text
  this.elm = elm
  this.context = context
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

module.exports = {
  createElement,
  createEmptyVNode,
  createTextVNode
}
