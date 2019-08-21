const compiler = require('../lib/compiler')
const html = `<div class="root">
<h2 class="title">显卡差异化越来越难做，但华硕有生态优势</h2>
<p id="p1">
  [PConline 杂谈]今日华硕ROG动作频繁，新品一个接着一个，但是华硕显卡这边倒是没那么热闹，而我们PConline也恰好有机会采访到了华硕显卡的高层
  <strong>华硕全球显卡及电源研发产品总监杨承翰和华硕中国区主板显卡产品总监张楠，</strong>
  下面我们看看华硕显卡沉默的这些天里在秘密筹备着什么。
</p>
<p id="p2">
  <img src='http://img03.sogoucdn.com/app/a/200883/d88dc79d2db63f31d284c9e6628d71f8' data-size='640,432'
    data-ratio='0.67500' data-type='jpg' />
</p>
<ul>
  <li><a href="http://m.sogou.com">Sogou</a></li>
</ul>
</div>`

var ast = compiler.compile(html)
debugger
console.log(ast.render)
