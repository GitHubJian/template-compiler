const { createElement, createTextVNode } = require('../lib/build')

let a = createElement('div', { attrs: { class: 'root' } }, [
  createElement('h2', { attrs: { class: 'title' } }, [
    createTextVNode('显卡差异化越来越难做，但华硕有生态优势')
  ]),
  createTextVNode(' '),
  createElement('p', { attrs: { id: 'p1' } }, [
    createTextVNode(
      '\n  [PConline 杂谈]今日华硕ROG动作频繁，新品一个接着一个，但是华硕显卡这边倒是没那么热闹，而我们PConline也恰好有机会采访到了华硕显卡的高层\n  '
    ),
    createElement('strong', [
      createTextVNode(
        '华硕全球显卡及电源研发产品总监杨承翰和华硕中国区主板显卡产品总监张楠，'
      )
    ]),
    createTextVNode(
      '\n  下面我们看看华硕显卡沉默的这些天里在秘密筹备着什么。\n'
    )
  ]),
  createTextVNode(' '),
  createElement('p', { attrs: { id: 'p2' } }, [
    createElement('img', {
      attrs: {
        src:
          'http://img03.sogoucdn.com/app/a/200883/d88dc79d2db63f31d284c9e6628d71f8',
        'data-size': '640,432',
        'data-ratio': '0.67500',
        'data-type': 'jpg'
      }
    })
  ]),
  createTextVNode(' '),
  createElement('ul', [
    createElement('li', [
      createElement('a', { attrs: { href: 'http://m.sogou.com' } }, [
        createTextVNode('Sogou')
      ])
    ])
  ])
])
debugger
// TODO: vue Line: 5682
function createElement$1(tagName, vnode) {
  var elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  if (
    vnode.data &&
    vnode.data.attrs &&
    vnode.data.attrs.multiple !== undefined
  ) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

var b = createElement$1(a.tag, a)

console.log(b)
