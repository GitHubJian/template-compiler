;(function(global, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define([], factory())
  } else if (typeof exports === 'object') {
    exports = factory()
  } else {
    global['template-compiler'] = factory()
  }
})(global, function() {
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

  function isDef(v) {
    return v !== undefined && v !== null
  }

  /**
   * Create a cached version of a pure function.
   */
  function cached(fn) {
    var cache = Object.create(null)
    return function cachedFn(str) {
      var hit = cache[str]
      return hit || (cache[str] = fn(str))
    }
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  function makeMap(str, expectsLowerCase) {
    var map = Object.create(null)
    var list = str.split(',')
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true
    }

    return expectsLowerCase
      ? function(val) {
          return map[val.toLowerCase()]
        }
      : function(val) {
          return map[val]
        }
  }

  /**
   * Always return false.
   */
  function no() {
    return false
  }

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
      'link,meta,param,source,track,wbr'
  )

  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  )

  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
      'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
      'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
      'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
      'title,tr,track'
  )

  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
      'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
      'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
      'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
      's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
      'embed,object,param,source,canvas,script,noscript,del,ins,' +
      'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
      'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
      'output,progress,select,textarea,' +
      'details,dialog,menu,menuitem,summary,' +
      'content,element,shadow,template,blockquote,iframe,tfoot'
  )
  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
      'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
      'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  )

  var isPreTag = function(tag) {
    return tag === 'pre'
  }

  var isReservedTag = function(tag) {
    return isHTMLTag(tag) || isSVG(tag)
  }

  function getTagNamespace(tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
  }

  var acceptValue = makeMap('input,textarea,option,select,progress')
  var mustUseProp = function(tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag) && type !== 'button') ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  }

  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
  // Regular Expressions for parsing tags and attributes
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
  var ncname = '[a-zA-Z_][\\-\\.0-9_a-zA-Z' + unicodeRegExp.source + ']*'
  var qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'
  var startTagOpen = new RegExp('^<' + qnameCapture)
  var startTagClose = /^\s*(\/?)>/
  var endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>')
  var doctype = /^<!DOCTYPE [^>]+>/i
  // escape - to avoid being pased as HTML comment when inlined in page
  var comment = /^<!\--/
  var conditionalComment = /^<!\[/
  // Special Elements (can contain anything)
  var isPlainTextElement = makeMap('script,style,textarea', true)
  var reCache = {}

  var decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
  }
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

  var isIgnoreNewlineTag = makeMap('pre,textarea', true)
  var shouldIgnoreFirstNewline = function(tag, html) {
    return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
  }

  function decodeAttr(value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
    return value.replace(re, function(match) {
      return decodingMap[match]
    })
  }

  function isForbiddenTag(el) {
    return (
      el.tag === 'style' ||
      (el.tag === 'script' &&
        (!el.attrsMap.type || el.attrsMap.type === 'text/javascript'))
    )
  }

  function detectErrors(ast, warn) {
    if (ast) {
      checkNode(ast, warn)
    }
  }

  function checkNode(node, warn) {
    if (node.type === 1) {
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn)
        }
      }
    }
  }

  function baseWarn(msg) {
    console.error('[Compiler]: ' + msg)
  }

  var lineBreakRE = /[\r\n]/
  var whitespaceRE = /\s+/g

  // var decodeHTMLCached = cached(he.decode)

  // configurable state
  var warn$1
  var delimiters
  var platformIsPreTag

  function createASTElement(tag, attrs) {
    return {
      type: 1,
      tag: tag,
      attrsList: attrs,
      // attrsMap: makeAttrsMap(attrs),
      // rawAttrsMap: {},
      // parent: parent,
      children: []
    }
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

  var buildRegex = cached(function(delimiters) {
    var open = delimiters[0].replace(regexEscapeRE, '\\$&')
    var close = delimiters[1].replace(regexEscapeRE, '\\$&')
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  })

  function parseText(text, delimiters) {
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
    if (!tagRE.test(text)) {
      return
    }
    var tokens = []
    var rawTokens = []
    var lastIndex = (tagRE.lastIndex = 0)
    var match, index, tokenValue
    while ((match = tagRE.exec(text))) {
      index = match.index
      // push text token
      if (index > lastIndex) {
        rawTokens.push((tokenValue = text.slice(lastIndex, index)))
        tokens.push(JSON.stringify(tokenValue))
      }
      // tag token
      var exp = parseFilters(match[1].trim())
      tokens.push('_s(' + exp + ')')
      rawTokens.push({ '@binding': exp })
      lastIndex = index + match[0].length
    }
    if (lastIndex < text.length) {
      rawTokens.push((tokenValue = text.slice(lastIndex)))
      tokens.push(JSON.stringify(tokenValue))
    }
    return {
      expression: tokens.join('+'),
      tokens: rawTokens
    }
  }

  function parseHtml(html, options) {
    var stack = []
    var expectHTML = options.expectHTML
    var isUnaryTag$$1 = options.isUnaryTag || no
    var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no
    var index = 0
    var last, lastTag
    while (html) {
      last = html
      // Make sure we're not in a plaintext content element like script/style
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf('<')
        if (textEnd === 0) {
          // Comment:
          if (comment.test(html)) {
            var commentEnd = html.indexOf('-->')

            if (commentEnd >= 0) {
              if (options.shouldKeepComment) {
                options.comment(
                  html.substring(4, commentEnd),
                  index,
                  index + commentEnd + 3
                )
              }
              advance(commentEnd + 3)
              continue
            }
          }

          if (conditionalComment.test(html)) {
            var conditionalEnd = html.indexOf(']>')

            if (conditionalEnd >= 0) {
              advance(conditionalEnd + 2)
              continue
            }
          }

          // Doctype:
          var doctypeMatch = html.match(doctype)
          if (doctypeMatch) {
            advance(doctypeMatch[0].length)
            continue
          }

          // End tag:
          var endTagMatch = html.match(endTag)
          if (endTagMatch) {
            var curIndex = index
            advance(endTagMatch[0].length)
            parseEndTag(endTagMatch[1], curIndex, index)
            continue
          }

          // Start tag:
          var startTagMatch = parseStartTag()
          if (startTagMatch) {
            handleStartTag(startTagMatch)
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1)
            }
            continue
          }
        }

        var text = void 0,
          rest = void 0,
          next = void 0
        if (textEnd >= 0) {
          rest = html.slice(textEnd)
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            // < in plain text, be forgiving and treat it as text
            next = rest.indexOf('<', 1)
            if (next < 0) {
              break
            }
            textEnd += next
            rest = html.slice(textEnd)
          }
          text = html.substring(0, textEnd)
        }

        if (textEnd < 0) {
          text = html
        }

        if (text) {
          advance(text.length)
        }

        if (options.chars && text) {
          options.chars(text, index - text.length, index)
        }
      } else {
        var endTagLength = 0
        var stackedTag = lastTag.toLowerCase()
        var reStackedTag =
          reCache[stackedTag] ||
          (reCache[stackedTag] = new RegExp(
            '([\\s\\S]*?)(</' + stackedTag + '[^>]*>)',
            'i'
          ))
        var rest$1 = html.replace(reStackedTag, function(all, text, endTag) {
          endTagLength = endTag.length
          if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
            text = text
              .replace(/<!\--([\s\S]*?)-->/g, '$1')
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
          }
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1)
          }
          if (options.chars) {
            options.chars(text)
          }
          return ''
        })
        index += html.length - rest$1.length
        html = rest$1
        parseEndTag(stackedTag, index - endTagLength, index)
      }

      if (html === last) {
        options.chars && options.chars(html)
        if (!stack.length && options.warn) {
          options.warn('Mal-formatted tag at end of template: "' + html + '"', {
            start: index + html.length
          })
        }
        break
      }
    }

    // Clean up any remaining tags
    parseEndTag()

    function advance(n) {
      index += n
      html = html.substring(n)
    }

    function parseStartTag() {
      var start = html.match(startTagOpen)
      if (start) {
        var match = {
          tagName: start[1],
          attrs: [],
          start: index
        }
        advance(start[0].length)
        var end, attr
        while (
          !(end = html.match(startTagClose)) &&
          (attr = html.match(attribute))
        ) {
          attr.start = index
          advance(attr[0].length)
          attr.end = index
          match.attrs.push(attr)
        }
        if (end) {
          match.unarySlash = end[1]
          advance(end[0].length)
          match.end = index
          return match
        }
      }
    }

    function handleStartTag(match) {
      var tagName = match.tagName
      var unarySlash = match.unarySlash

      if (expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag)
        }
        if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
          parseEndTag(tagName)
        }
      }

      var unary = isUnaryTag$$1(tagName) || !!unarySlash

      var l = match.attrs.length
      var attrs = new Array(l)
      for (var i = 0; i < l; i++) {
        var args = match.attrs[i]
        var value = args[3] || args[4] || args[5]
        var shouldDecodeNewlines =
          tagName === 'a' && args[1] === 'href'
            ? options.shouldDecodeNewlinesForHref
            : options.shouldDecodeNewlines
        attrs[i] = {
          name: args[1],
          value: decodeAttr(value, shouldDecodeNewlines)
        }
      }

      if (!unary) {
        stack.push({
          tag: tagName,
          lowerCasedTag: tagName.toLowerCase(),
          attrs: attrs,
          start: match.start,
          end: match.end
        })
        lastTag = tagName
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end)
      }
    }

    function parseEndTag(tagName, start, end) {
      var pos, lowerCasedTagName
      if (start == null) {
        start = index
      }
      if (end == null) {
        end = index
      }

      // Find the closest opened tag of the same type
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase()
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          if (i > pos || (!tagName && options.warn)) {
            options.warn(
              'tag <' + stack[i].tag + '> has no matching end tag.',
              {
                start: stack[i].start,
                end: stack[i].end
              }
            )
          }
          if (options.end) {
            options.end(stack[i].tag, start, end)
          }
        }

        // Remove the open elements from the stack
        stack.length = pos
        lastTag = pos && stack[pos - 1].tag
      } else if (lowerCasedTagName === 'br') {
        if (options.start) {
          options.start(tagName, [], true, start, end)
        }
      } else if (lowerCasedTagName === 'p') {
        if (options.start) {
          options.start(tagName, [], false, start, end)
        }
        if (options.end) {
          options.end(tagName, start, end)
        }
      }
    }
  }

  /**
   * Convert HTML string to AST.
   */
  function parse(template, options) {
    warn$1 = options.warn || baseWarn
    platformIsPreTag = options.isPreTag || no
    platformMustUseProp = options.mustUseProp || no

    delimiters = options.delimiters

    var stack = []
    var preserveWhitespace = options.preserveWhitespace !== false
    var whitespaceOption = options.whitespace
    var root
    var currentParent
    var inVPre = false
    var inPre = false

    function closeElement(element) {
      trimEndingWhiteSpace(element)
      // tree management
      if (currentParent && !element.forbidden) {
        currentParent.children.push(element)
        // element.parent = currentParent
      }

      // remove trailing whitespace node again
      trimEndingWhiteSpace(element)

      if (platformIsPreTag(element.tag)) {
        inPre = false
      }
    }

    function trimEndingWhiteSpace(el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          lastNode.type === 3 &&
          lastNode.text === ' '
        ) {
          el.children.pop()
        }
      }
    }

    parseHtml(template, {
      warn: warn$1,
      expectHTML: options.expectHTML,
      isUnaryTag: options.isUnaryTag,
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      shouldKeepComment: options.comments,
      start: function start(tag, attrs, unary) {
        var element = createASTElement(tag, attrs)

        if (isForbiddenTag(element)) {
          element.forbidden = true
        }

        // processRawAttrs(element)

        if (!root) {
          root = element
        }

        if (!unary) {
          currentParent = element
          stack.push(element)
        } else {
          closeElement(element)
        }
      },
      end: function end() {
        var element = stack[stack.length - 1]
        // pop stack
        stack.length -= 1
        currentParent = stack[stack.length - 1]

        closeElement(element)
      },
      chars: function chars(text) {
        if (!currentParent) {
          return
        }
        var children = currentParent.children
        if (inPre || text.trim()) {
          text = text
          // text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = ''
        } else if (whitespaceOption) {
          if (whitespaceOption === 'condense') {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            text = lineBreakRE.test(text) ? '' : ' '
          } else {
            text = ' '
          }
        } else {
          text = preserveWhitespace ? ' ' : ''
        }
        if (text) {
          if (!inPre && whitespaceOption === 'condense') {
            // condense consecutive whitespaces into single space
            text = text.replace(whitespaceRE, ' ')
          }
          var res
          var child
          if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text
            }
          } else if (
            text !== ' ' ||
            !children.length ||
            children[children.length - 1].text !== ' '
          ) {
            child = {
              type: 3,
              text: text
            }
          }
          if (child) {
            children.push(child)
          }
        }
      },
      comment: function comment(text) {
        if (currentParent) {
          var child = {
            type: 3,
            text: text,
            isComment: true
          }
          currentParent.children.push(child)
        }
      }
    })

    return root
  }

  function processRawAttrs(el) {
    var list = el.attrsList
    var len = list.length
    if (len) {
      var attrs = (el.attrs = new Array(len))
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value)
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      el.plain = true
    }
  }

  function createCompilerCreator(baseCompile) {
    return function createCompiler(baseOptions) {
      return function compile(template) {
        var finalOptions = Object.create(baseOptions)
        var errors = []
        var tips = []

        var warn = function(msg, range, tip) {
          ;(tip ? tips : errors).push(msg)
        }

        finalOptions.warn = warn

        var compiled = baseCompile(template.trim(), finalOptions)
        {
          detectErrors(compiled.ast, warn)
        }
        compiled.errors = errors
        compiled.tips = tips

        return compiled
      }
    }
  }

  var createCompiler = createCompilerCreator(function baseCompile(
    template,
    options
  ) {
    var ast = parse(template.trim(), options)

    return ast
  })

  var baseOptions = {
    expectHTML: true,
    isPreTag: isPreTag,
    isUnaryTag: isUnaryTag,
    mustUseProp: mustUseProp,
    canBeLeftOpenTag: canBeLeftOpenTag,
    isReservedTag: isReservedTag,
    getTagNamespace: getTagNamespace
  }

  var compiler = createCompiler(baseOptions)

  function genData$2(el) {
    var data = {}

    if (el.attrsList) {
      data.attrsList = el.attrsList
    }

    return data
  }

  function genChildren(el) {
    var children = el.children
    if (children.length) {
      return children.map(function(c) {
        return genNode(c)
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
    return createTextVNode(transformSpecialNewlines(text.text))
  }

  function generate(ast) {
    var vcode = ast ? genElement(ast) : ''

    return vcode
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
    var tag = vnode.tag
    var data = vnode.data
    var children = vnode.children
    var text = vnode.text
    var attrHTMLFragment = ''

    for (var d in data) {
      for (var i = 0; i < data[d].length; i++) {
        var attr = data[d][i]
        attrHTMLFragment += `${attr['name']}="${attr['value']}" `
      }

      attrHTMLFragment = attrHTMLFragment.slice(0, -1)
    }

    if (isDef(tag)) {
      var html, childrenHTMLFragment
      if (children) {
        childrenHTMLFragment = createChildren$1(vnode, children)
      }

      if (isUnaryTag(tag)) {
        html = `<${tag}${attrHTMLFragment ? ' ' + attrHTMLFragment : ''}/>`
      } else {
        html = `<${tag}${
          attrHTMLFragment ? ' ' + attrHTMLFragment : ''
        }>${childrenHTMLFragment}</${tag}>`
      }

      return html
    } else if (isTrue(vnode.isComment)) {
      return createComment$1(text)
    } else {
      return createTextNode$1(text)
    }
  }

  function render(ast) {
    var vnode = generate(ast)
    if (!vnode) return ''

    return createElm(vnode)
  }

  return {
    compiler: compiler,
    render: render
  }
})
