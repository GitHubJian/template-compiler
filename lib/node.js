class VNode {
  constructor(tag, data, children, text) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
  }

  toString() {
    return JSON.stringify(this)
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
