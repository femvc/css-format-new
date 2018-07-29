'use strict'
/*
 * CSS Parser By Andy Wang (http://jsformat.com/css-format.html)
 * Original code by Andy Wang, Mozilla Public License
 * Use like this:
 *     var opt_str = '.a  {color :   red}'
 *     var output = cssformat.formatCSSText(opt_str, {})
 *     alert(output)
 *
 */
var conf = {
  type: 'expanded',
  no_spaces: 0,
  break_selectors: 0,
  remove_comment: 0,
  keep_last_semicolon: 1
}

var RuleNode = function() {
  this.guid = RuleNode.makeGUID()
}
RuleNode.prototype = {
  appendChild: function(child) {
    var me = this
    if (child && me.childNodes) {
      me.removeChild(child)

      me.childNodes.push(child)

      child.parentNode = me
    }
  },
  removeChild: function(elem) {
    var me = this
    if (me.childNodes) {
      for (var i = 0, len = me.childNodes.length; i < len; i++) {
        if (me.childNodes[i] === elem) {
          me.childNodes.splice(i, 1)
          break
        }
      }
    }
    elem.parentNode = undefined
  },
  getCSSText: function() {
    return this.formatCSSText({
      type: 'compressed',
      break_selectors: 0,
      no_spaces: 1,
      remove_comment: 1
    })
  },
  getFormatCSSText: function() {
    return this.formatCSSText({
      type: 'expanded',
      break_selectors: 0,
      no_spaces: 0,
      remove_comment: 0
    })
  },
  formatCSSText: function(opt) {
    if (opt !== 'default' && opt) {
      if (opt.type !== undefined) conf.type = opt.type
      if (opt.break_selectors !== undefined) conf.break_selectors = opt.break_selectors
      if (opt.no_spaces !== undefined) conf.no_spaces = opt.no_spaces
      if (opt.keep_last_semicolon !== undefined) conf.keep_last_semicolon = opt.keep_last_semicolon
      if (opt.remove_comment !== undefined) conf.remove_comment = opt.remove_comment
    }

    var me = this,
      html = '',
      list = me.childNodes || []
    for (var i = 0, len = list.length; i < len; i++) {
      html += list[i].getFormatOuterCSSText()
    }
    return (opt !== 'default' && opt ? html.replace(/^\s/, '') : html)
  },
  getFormatOuterCSSText: function() {
    var me = this,
      str,
      indent = me.getIndentSize(),
      html = '',
      inner,
      tabSize = '  ',
      spaces = ' '

    if (conf.type == 'compressed') {
      indent = ''
      tabSize = ''
    }
    if (conf.type == 'compact') {
      tabSize = ''
    }
    if (conf.type == 'compressed' || conf.no_spaces) spaces = ''

    if (me.nodeType == 'selfClose') {
      if (me.tagName == 'import' && me.clazz == 'Import()') {
        html = indent + me.nodeValue
      } else if (me.tagName == 'comment' && me.clazz == 'Comment()') {
        if (!conf.remove_comment) html = indent + '/*' + me.nodeValue.replace(/\n/g, indent + tabSize) + '*/'
      } else if (me.tagName == 'htmlcomment' && me.clazz == 'HtmlComment()') {
        if (!conf.remove_comment) html = indent + '<!--' + me.nodeValue.replace(/\n/g, indent + tabSize) + '-->'
      } else {
        html = indent + me.nodeValue
      }
    } else {
      inner = me.formatCSSText('default').replace(/^\n\n/, '\n')
      var list01 = []
      if (me.attrList && me.attrList.length) {
        for (var i = 0, len = me.attrList.length; i < len; i++) {
          str = me.attrList[i].replace(/\s+/g, ' ').replace(/(^\s|\s$)/g, '').replace(/\s*:\s*/g, ':')
          str = str.replace(':', ':' + spaces)
          list01.push(str)
        }
      }

      var attrStr, ruleName
      if (conf.type == 'compressed') {
        attrStr = (list01.length ? list01.join(';') + (conf.keep_last_semicolon ? ';' : '') : '')
        html = me.ruleNames.join(',') + '{' + attrStr + inner + '}'
      } else if (conf.type == 'compact') {
        attrStr = (list01.length ? list01.join(';' + spaces) + (conf.keep_last_semicolon ? ';' : '') : '')
        ruleName = conf.break_selectors ? me.ruleNames.join(',' + indent) : me.ruleNames.join(',' + spaces)
        html = indent + ruleName + spaces + '{' + spaces + attrStr + inner + (inner ? indent : spaces) + '}'
      } else if (conf.type == 'expanded') {
        attrStr = (list01.length ? indent + tabSize + list01.join(';' + indent + tabSize) + (conf.keep_last_semicolon ? ';' : '') : '')
        ruleName = conf.break_selectors ? me.ruleNames.join(',' + indent) : me.ruleNames.join(',' + spaces)
        html = indent + ruleName + spaces + '{' + attrStr + inner + indent + '}'
      }
    }

    return html
  },
  getDOMStructure: function(main) {
    var me = this,
      list = me.childNodes || []
    if (!main) {
      main = document.createElement('div');
      (document.body || document.documentElement).appendChild(main)
    }

    for (var i = 0, len = list.length; i < len; i++) {
      list[i].getOuterDOMStructure(main)
    }

    return main.innerHTML
  },
  getOuterDOMStructure: function(main) {
    var me = this

    if (me.clazz == 'Node()') {
      me.ruleNames.forEach(function(rule) {
        var main2 = main.querySelector(rule) || me.createMain(main, rule)
        if (main2) {
          me.getDOMStructure(main2)
        }
      })
    }
  },
  getIndentSize: function() {
    var parentNode = this
    var indentSize = -1
    while (parentNode) {
      indentSize++
      parentNode = parentNode.parentNode
    }
    return '\n' + Array(indentSize).join('  ')
  },
  createMain(main, rule) {
    var list = rule.replace(/\s+/ig, ' ').replace(/(^ | $)/ig, '').split(' ')
    for (var i = 0, len = list.length; i < len; i++) {
      var elem = main.querySelector(list[i])
      if (elem) {
        main = elem
        continue
      }
      elem = document.createElement('div')
      var tag, id = '',
        clazz = [],
        str = list[i]

      // h1.a#bb
      var p1 = (str + '#').indexOf('#'),
        p2 = (str + '.').indexOf('.')

      if (p1 !== 0 && p2 !== 0) {
        tag = str.substring(0, Math.min(p1, p2))
        elem = document.createElement(tag)
        str = str.replace(tag, '')
      }
      // .a#bb.c.d
      var arr = str.split('.')
      arr.forEach(function(mm) {
        if (!mm) return;
        var kk = mm.split('#')
        id = kk[1] || id
        clazz.push(kk[0])
      })

      if (id) elem.id = id
      if (clazz.length) elem.className = clazz.join(' ')

      main.appendChild(elem)
      main = elem
    }
    return main
  }
}
/**
 * @name 获取唯一id
 * @public
 * @return {String}
 */
RuleNode.makeGUID = (function() {
  var guid = 1000000; // 0 -> root
  return function() {
    return String(guid++)
  }
})()

var CSSRoot = {
  importTag: /^@import[ \t]+url\([^\)]*\)\s*;?/,
  // Token serial
  stack: [],
  // Strict xml model!!
  parseCSS: function(html, root) {
    var me = this
    me.stack = me.tokenization(html)
    // console.log(me.stack)
    me.domtree = me.treeConstruction(me.stack, root)
    return me.domtree
  },
  // Token serial
  tokenization: function(html) {
    var me = this,
      tokenserial = [],
      index,
      m, n,
      token,
      nodeValue,
      match

    // status machines

    // <!--comment--> <html>1234</html>
    while (html) {
      // Comment 
      if (html.indexOf('/*') === 0) {
        n = html.indexOf('*/', 2)
        n = n == -1 ? html.length : n
        nodeValue = html.substring(2, n)
        token = {
          tagName: 'comment',
          clazz: 'Comment()',
          nodeValue: nodeValue,
          nodeType: 'selfClose'
        }
        tokenserial.push(token)
        html = html.substring(n + 2, html.length).replace(/^\s+/, '')
      }
      // Comment 
      else if (html.indexOf('<!--') === 0) {
        n = html.indexOf('-->', 4)
        n = n == -1 ? html.length : n
        nodeValue = html.substring(4, n)
        token = {
          tagName: 'htmlcomment',
          clazz: 'HtmlComment()',
          nodeValue: nodeValue,
          nodeType: 'selfClose'
        }
        tokenserial.push(token)
        html = html.substring(n + 3, html.length).replace(/^\s+/, '')
      }
      // @import url(../aa/a.css) 
      else if (html.indexOf('@import') === 0) {
        match = html.match(me.importTag)

        if (match) {
          nodeValue = match[0].replace(/\s+$/g, '')
          nodeValue = nodeValue.replace(/\s*([\(\)])\s*/g, '$1')
          nodeValue = nodeValue.replace(/@import\s+/g, '@import ')
          token = {
            tagName: 'import',
            clazz: 'Import()',
            nodeValue: nodeValue,
            nodeType: 'selfClose'
          }
          tokenserial.push(token)
          html = html.substring(match[0].length).replace(/^\s+/, '')
        }
      }
      // end tag
      else if (html.indexOf('}') === 0) {
        token = {
          tagName: 'brace',
          clazz: 'Brace()',
          nodeValue: '}',
          nodeType: 'endTag'
        }
        tokenserial.push(token)
        html = html.substring(1).replace(/^\s+/, '')
      }
      // start tag
      else if (html.indexOf('{') === 0) {
        token = {
          tagName: 'brace',
          clazz: 'Brace()',
          nodeValue: '{',
          nodeType: 'startTag'
        }
        tokenserial.push(token)
        html = html.substring(1).replace(/^\s+/, '')
      }
      // text
      else {
        m = html.indexOf('}', 1)
        n = html.indexOf('{', 1)

        index = m == -1 ? (n > -1 ? n : html.length) : (n == -1 ? m : (m > n ? n : m))
        nodeValue = html.substring(0, index)
        // 去掉换行和多余的空格
        nodeValue = nodeValue.replace(/[\r\n]/g, ' ')
        nodeValue = nodeValue.replace(/\s+/g, ' ')
        nodeValue = nodeValue.replace(/^[ ]/g, '')
        nodeValue = nodeValue.replace(/[ ]$/g, '')
        nodeValue = nodeValue.replace(/\s*([\,;\[\]\(\)\+\>\=])\s+/g, '$1')

        token = {
          tagName: 'text',
          clazz: 'Text()',
          nodeValue: nodeValue,
          nodeType: 'selfClose'
        }
        tokenserial.push(token)
        html = html.substring(index, html.length).replace(/^\s+/, '')
      }
    }
    // console.log(tokenserial)
    return tokenserial
  },
  treeConstruction: function(tokens, parentNode) {
    var me = this,
      domtree = parentNode || CSSRoot.cssRoot,
      currentParent = domtree,
      token,
      elem,
      i,
      len
    domtree.childNodes = []
    domtree.attrList = []

    for (i = tokens.length - 1; i > -1; i--) {
      if (tokens[i].nodeType == 'startTag') {
        if (tokens[i - 1] && tokens[i - 1].tagName == 'text') {
          tokens[i - 1].nodeType = 'startTag'
          tokens[i - 1].tagName = 'node'
          tokens[i - 1].clazz = 'Node()'

          tokens.splice(i, 1)
        } else {
          tokens[i].tagName = 'node'
          tokens[i].clazz = 'Node()'
          if (tokens[i].nodeValue === '{')
            tokens[i].nodeValue = ''
        }
      }
    }

    for (i = 0, len = tokens.length; i < len; i++) {
      token = tokens[i]

      // combind [.aaa], [{] => [.aaa {]
      if (token.tagName == 'import' || token.tagName == 'comment' || token.tagName == 'htmlcomment') {
        elem = me.createElement(token.tagName, token)
        currentParent.appendChild(elem)
      }
      // ruleText
      else if (token.nodeType == 'selfClose') {
        // elem = me.createElement(token.tagName, token)
        // currentParent.appendChild(elem)
        currentParent.attrList = currentParent.attrList || []
        currentParent.attrList = currentParent.attrList.concat(token.nodeValue.replace(/(\s*;\s*)+$/, '').split(';'))
      }
      // ruleText && ruleName
      else if (token.nodeType == 'startTag') {
        elem = me.createElement(token.tagName, token)

        currentParent.appendChild(elem)
        elem.childNodes = []

        var list = token.nodeValue.split(';')
        var ruleName = list.pop()
        elem.ruleNames = ruleName.split(',')

        if (list.length) {
          currentParent.attrList = currentParent.attrList || []
          currentParent.attrList = currentParent.attrList.concat(list)
        }

        currentParent = elem
      } else if (token.nodeType == 'endTag') {
        currentParent = currentParent.parentNode
      }
    }
    return domtree
  },
  createElement: function(tagName, options) {
    var me = this,
      clazz = me.getElementConstructor(),
      elem = new clazz()
    if (!tagName) {
      throw new Error('createElement(tagName, options), tagName is null.')
    }
    tagName = String(tagName).toLowerCase()
    options = options || {}
    options.tagName = tagName

    for (var i in options) {
      elem[i] = options[i]
    }
    return elem
  }
}
// Over write method 'getElementConstructor'
CSSRoot.getElementConstructor = function() {
  return RuleNode
}

// 根节点 
CSSRoot.cssRoot = CSSRoot.createElement('root', {
  childNodes: [],
  clazz: 'RuleNode()',
  nodeType: 'startTag'
})

var cssformat = {}
cssformat.formatCSSText = function(str, opt) {
  return CSSRoot.parseCSS(str).formatCSSText(opt)
}

if (typeof global !== 'undefined' && typeof exports !== 'undefined') {
  global.cssformat = cssformat
  exports.formatCSSText = cssformat.formatCSSText
} else if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.cssformat = cssformat
}