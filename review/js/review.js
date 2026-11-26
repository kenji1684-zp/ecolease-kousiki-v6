/* ============================================================
   修正指示モード（確認用サイト専用）  ZEROPLUS 2026-11-20
   使い方：URL の末尾に ?review を付けて開く（例 …/recruit.html?review）
     ・直したい場所をクリック（スマホはタップ）→ 指示を書いて「保存」
     ・ページを移動しても指示は残る（このブラウザに保存）
     ・「まとめてコピー」→ ジャービス（Claude）や LINE・メールに貼り付け
   終了：ツールバーの「終了」、または URL に ?review=off
   ※ 本番用ファイルには入れません（tools/build-github-preview.py が確認用にだけ追加）
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'ecoReview.v1', ON = 'ecoReview.on', WHO = 'ecoReview.name';
  var qs = location.search;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  if (/[?&]review=off/.test(qs)) { ls(ON, null); return; }
  if (/[?&]review\b/.test(qs)) ls(ON, '1');
  if (ls(ON) !== '1') return;

  /* ---------- データ ---------- */
  var mem = [];
  function load() { try { mem = JSON.parse(ls(KEY) || '[]') || []; } catch (e) { mem = []; } return mem; }
  function save() { ls(KEY, JSON.stringify(mem)); }
  load();
  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  // サイトマップの全ページ（ツールバーの「ページ移動」に表示）
  var PAGES = [
    ['index.html', 'トップページ'],
    ['index-kv.html', 'TOP案（イラスト＋ピン）'], ['jigyo.html', '事業案内'], ['lease.html', '設備リース'], ['rental.html', '設備レンタル'],
    ['maintenance.html', 'ビルメンテナンス'], ['works.html', '施工実績'], ['company.html', '会社概要'],
    ['release.html', '再リースまでの流れ'], ['licence.html', '保有資格'], ['environment.html', '環境方針'],
    ['sdgs.html', 'SDGsへの取り組み'], ['recruit.html', '採用情報'], ['interview.html', '社員インタビュー'],
    ['data.html', 'データで見るエコリース'], ['news.html', 'お知らせ'], ['news-detail.html', 'お知らせ（記事ページ）'],
    ['contact.html', 'お問い合わせ'], ['privacy.html', 'プライバシーポリシー']
  ];
  function pageTitle() {
    if (PAGE === 'index.html') return 'トップページ';
    var t = (document.title || '').split(/[｜|]/)[0].trim();
    return t || PAGE;
  }
  function device() {
    var w = window.innerWidth;
    return (w >= 1024 ? 'PC' : w >= 768 ? 'タブレット' : 'スマホ') + '（幅' + w + 'px）';
  }

  /* ---------- 要素の説明 ---------- */
  var PICK = 'h1,h2,h3,h4,h5,p,li,dt,dd,th,td,a,button,img,svg,figure,video,iframe,label,input,select,textarea,blockquote,time,small,b,strong,em,span,section,header,footer,nav';
  function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function txt(el) {
    if (el.tagName === 'IMG') return el.getAttribute('alt') ? '画像「' + el.getAttribute('alt') + '」' : '画像';
    var t = clean(el.innerText || el.textContent);
    return t.length > 60 ? t.slice(0, 60) + '…' : t;
  }
  function kind(el) {
    var t = el.tagName;
    if (/^H[1-6]$/.test(t)) return '見出し';
    if (t === 'IMG' || t === 'FIGURE' || t === 'VIDEO') return '画像';
    if (t.toLowerCase() === 'text') return '図の中の文字';
    if (t.toLowerCase() === 'g') return '図のパーツ';
    if (t.toLowerCase() === 'svg') return '図・イラスト（全体）';
    if (el.closest('svg')) return '図のパーツ';
    if (t === 'A' || t === 'BUTTON') return el.classList.contains('btn') ? 'ボタン' : 'リンク';
    if (t === 'LI') return 'リストの項目';
    if (t === 'TD' || t === 'TH' || t === 'DT' || t === 'DD') return '表の項目';
    if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || t === 'LABEL') return 'フォーム';
    if (t === 'SECTION') return 'エリア全体';
    if (t === 'HEADER') return 'ヘッダー';
    if (t === 'FOOTER') return 'フッター';
    if (t === 'P') return '文章';
    if (/^(SPAN|B|STRONG|EM|SMALL|TIME)$/.test(t)) return '文字';
    return '要素';
  }
  function areaName(el) {
    if (el.closest('.site-header,header.site-header')) return 'ヘッダー';
    if (el.closest('footer')) return 'フッター';
    var s = el.closest('section,[data-screen-label]');
    while (s) {
      var lab = s.getAttribute('data-screen-label');
      if (lab) return lab;
      var h = s.querySelector('h1,h2');
      if (h) {
        var eb = s.querySelector('.eyebrow,.en,.os-pre');
        var name = clean(h.innerText || h.textContent).slice(0, 30);
        return name + (eb && clean(eb.textContent) && clean(eb.textContent).length < 30 ? '（' + clean(eb.textContent) + '）' : '');
      }
      s = s.parentElement && s.parentElement.closest('section,[data-screen-label]');
    }
    return 'ページ内';
  }
  function cssPath(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id) { parts.unshift('#' + el.id); break; }
      var tag = el.tagName.toLowerCase(), p = el.parentElement, idx = 1, sib = el;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) idx++;
      var cls = [].filter.call(el.classList || [], function (c) { return !/^(in|on|show|active|visible|is-|reveal|bx$|d\d)/.test(c); }).slice(0, 2);
      parts.unshift(tag + (cls.length ? '.' + cls.join('.') : '') + ':nth-of-type(' + idx + ')');
      el = p;
    }
    return parts.join(' > ');
  }
  function find(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }

  /* ---------- スタイル ---------- */
  var css = '' +
    '.rv-ui,.rv-ui *{box-sizing:border-box;font-family:"Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif!important;letter-spacing:0!important;line-height:1.5}' +
    '.rv-hl{position:absolute;pointer-events:none;z-index:2147483000;border:2px solid #e8402e;background:rgba(232,64,46,.08);border-radius:3px;transition:all .06s;display:none}' +
    '.rv-hl b{position:absolute;left:-2px;top:-22px;background:#e8402e;color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:3px 3px 3px 0;white-space:nowrap;max-width:80vw;overflow:hidden;text-overflow:ellipsis}' +
    '.rv-pin{position:absolute;z-index:2147483001;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#e8402e;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff;cursor:pointer}' +
    '.rv-pin.done{background:#7a8a72}' +
    '.rv-box{position:absolute;outline:2px dashed rgba(232,64,46,.7);outline-offset:2px;pointer-events:none;z-index:2147482999}' +
    '.rv-bar{position:fixed;left:12px;bottom:12px;z-index:2147483600;display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#1f2a1b;color:#fff;padding:8px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);font-size:13px;max-width:calc(100vw - 24px)}' +
    '.rv-bar .ttl{font-weight:700;padding:0 6px 0 4px;display:flex;align-items:center;gap:6px}' +
    '.rv-bar .ttl i{width:9px;height:9px;border-radius:50%;background:#e8402e;display:inline-block}' +
    '.rv-bar.browse .ttl i{background:#9bb88a}' +
    '.rv-bar button{appearance:none;border:0;border-radius:8px;padding:8px 11px;font-size:13px;font-weight:600;cursor:pointer;background:#3a4733;color:#fff}' +
    '.rv-bar button:hover{background:#4d5c45}' +
    '.rv-bar button.pri{background:#8cc63f;color:#1f2a1b}' +
    '.rv-bar button.pri:hover{background:#a3d65e}' +
    '.rv-bar select.rv-go{appearance:auto;border:0;border-radius:8px;padding:8px 6px;font-size:13px;font-weight:600;background:#fff;color:#1f2a1b;max-width:210px;cursor:pointer}' +
    '.rv-bar .cnt{background:#e8402e;border-radius:99px;padding:1px 8px;font-size:12px;margin-left:4px}' +
    '.rv-pop{position:fixed;z-index:2147483601;width:min(380px,calc(100vw - 24px));background:#fff;color:#222;border-radius:12px;box-shadow:0 16px 50px rgba(0,0,0,.35);padding:14px;font-size:13px}' +
    '.rv-pop .loc{font-size:12px;color:#5b6b53;margin-bottom:4px}' +
    '.rv-pop .cur{font-size:12px;background:#f3f6ef;border-left:3px solid #8cc63f;padding:6px 8px;margin:6px 0 10px;max-height:72px;overflow:auto;color:#333}' +
    '.rv-pop textarea{width:100%;min-height:96px;border:1px solid #c9d3c4;border-radius:8px;padding:8px;font-size:14px;resize:vertical;color:#222;background:#fff}' +
    '.rv-pop textarea:focus{outline:2px solid #8cc63f;border-color:#8cc63f}' +
    '.rv-pop .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}' +
    '.rv-pop .row .l{margin-right:auto}' +
    '.rv-pop button{appearance:none;border:1px solid #c9d3c4;background:#fff;color:#333;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer}' +
    '.rv-pop button.pri{background:#3e6b2a;border-color:#3e6b2a;color:#fff}' +
    '.rv-pop button.del{color:#c0392b;border-color:#f0c2bb}' +
    '.rv-pop .quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}' +
    '.rv-pop .quick button{padding:4px 9px;font-size:12px;font-weight:500;border-radius:99px;background:#f3f6ef;border-color:#dfe8d6}' +
    '.rv-panel{position:fixed;right:12px;top:12px;bottom:76px;z-index:2147483602;width:min(420px,calc(100vw - 24px));background:#fff;color:#222;border-radius:12px;box-shadow:0 16px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;font-size:13px}' +
    '.rv-panel header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #e3e9de;font-weight:700;font-size:14px}' +
    '.rv-panel header button{margin-left:auto}' +
    '.rv-panel .body{overflow:auto;padding:10px 14px;flex:1}' +
    '.rv-panel .who{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #e3e9de;font-size:12px}' +
    '.rv-panel .who input{flex:1;border:1px solid #c9d3c4;border-radius:6px;padding:6px 8px;font-size:13px}' +
    '.rv-panel h4{font-size:12px;color:#3e6b2a;margin:12px 0 6px;font-weight:700}' +
    '.rv-panel .it{border:1px solid #e3e9de;border-radius:8px;padding:8px 10px;margin-bottom:8px}' +
    '.rv-panel .it .n{display:inline-flex;width:20px;height:20px;border-radius:50%;background:#e8402e;color:#fff;font-size:11px;font-weight:700;align-items:center;justify-content:center;margin-right:6px}' +
    '.rv-panel .it .m{font-size:11px;color:#6b7766}' +
    '.rv-panel .it p{margin:4px 0 0;white-space:pre-wrap}' +
    '.rv-panel .it .ops{display:flex;gap:6px;margin-top:6px}' +
    '.rv-panel .it .ops a,.rv-panel .it .ops button{font-size:12px;color:#3e6b2a;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}' +
    '.rv-panel .it .ops .del{color:#c0392b}' +
    '.rv-panel footer{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #e3e9de;flex-wrap:wrap}' +
    '.rv-panel footer button,.rv-panel header button{appearance:none;border:1px solid #c9d3c4;background:#fff;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;color:#333}' +
    '.rv-panel footer .pri{background:#3e6b2a;border-color:#3e6b2a;color:#fff;flex:1}' +
    '.rv-toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483647;background:#1f2a1b;color:#fff;padding:10px 18px;border-radius:99px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.3)}' +
    '.rv-help{font-size:12px;color:#555;background:#f7faf3;border-radius:8px;padding:8px 10px;line-height:1.7}' +
    'html.rv-pick, html.rv-pick *{cursor:crosshair!important}' +
    'html.rv-pick .rv-ui, html.rv-pick .rv-ui *{cursor:auto!important}' +
    'html.rv-pick .rv-ui button{cursor:pointer!important}' +
    '@media(max-width:600px){.rv-bar{left:8px;right:8px;bottom:8px;gap:4px;padding:6px;flex-wrap:wrap}.rv-bar select.rv-go{flex:1 1 100%;max-width:none;order:-1}.rv-bar button{padding:8px 8px;font-size:12px;white-space:nowrap}.rv-bar .ttl{padding:0 2px}.rv-pop{left:8px!important;right:8px;width:auto}.rv-pop textarea{min-height:72px;font-size:16px}.rv-bar .ttl span{display:none}.rv-panel{left:8px;right:8px;top:8px;width:auto;bottom:70px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- UI ---------- */
  var picking = true, cur = null, pop = null, panel = null;
  var hl = document.createElement('div'); hl.className = 'rv-hl rv-ui'; hl.innerHTML = '<b></b>'; document.body.appendChild(hl);
  var layer = document.createElement('div'); layer.className = 'rv-ui'; document.body.appendChild(layer);
  var bar = document.createElement('div'); bar.className = 'rv-bar rv-ui';
  bar.innerHTML = '<div class="ttl"><i></i><span>修正指示モード</span></div>' +
    '<select class="rv-go" aria-label="ページ移動"></select>' +
    '<button type="button" data-a="mode">選択中</button>' +
    '<button type="button" data-a="page">ページ全体へ</button>' +
    '<button type="button" data-a="list">一覧<span class="cnt">0</span></button>' +
    '<button type="button" class="pri" data-a="copy">まとめてコピー</button>' +
    '<button type="button" data-a="exit">終了</button>';
  document.body.appendChild(bar);
  document.documentElement.classList.add('rv-pick');

  function toast(m) {
    var t = document.createElement('div'); t.className = 'rv-toast rv-ui'; t.textContent = m; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function setMode(p) {
    picking = p;
    document.documentElement.classList.toggle('rv-pick', p);
    bar.classList.toggle('browse', !p);
    var sm = window.innerWidth < 600;
    bar.querySelector('[data-a=mode]').textContent = p ? (sm ? '選択中' : '選択中（クリックで指示）') : (sm ? '閲覧中' : '閲覧中（リンク操作可）');
    bar.querySelector('[data-a=page]').textContent = sm ? '全体' : 'ページ全体へ';
    if (!p) hl.style.display = 'none';
  }
  function counts() {
    var c = mem.length;
    bar.querySelector('.cnt').textContent = c;
    var sel = bar.querySelector('.rv-go'), html = '';
    PAGES.forEach(function (pg) {
      var n = mem.filter(function (m) { return m.page === pg[0]; }).length;
      html += '<option value="' + pg[0] + '"' + (pg[0] === PAGE ? ' selected' : '') + '>' + (pg[0] === PAGE ? '▶ ' : '') + pg[1] + (n ? '（' + n + '件）' : '') + '</option>';
    });
    if (!PAGES.some(function (pg) { return pg[0] === PAGE; })) html = '<option selected>▶ ' + esc(pageTitle()) + '</option>' + html;
    sel.innerHTML = html;
  }
  function numOf(item) {
    var list = mem.filter(function (m) { return m.page === item.page; });
    return list.indexOf(item) + 1;
  }
  function globalNo(item) { return mem.indexOf(item) + 1; }

  /* ---------- ピン ---------- */
  function drawPins() {
    layer.innerHTML = '';
    mem.forEach(function (m) {
      if (m.page !== PAGE) return;
      var el = m.sel ? find(m.sel) : null;
      var x, y, r;
      if (el) {
        r = el.getBoundingClientRect();
        x = r.left + window.scrollX; y = r.top + window.scrollY;
        var bx = document.createElement('div'); bx.className = 'rv-box';
        bx.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
        layer.appendChild(bx);
      } else if (m.sel) {
        x = (m.x || 40); y = (m.y || 120);
      } else { return; } // ページ全体への指示はピン無し
      var p = document.createElement('div'); p.className = 'rv-pin';
      p.textContent = globalNo(m);
      p.style.left = Math.max(14, x) + 'px'; p.style.top = Math.max(14, y) + 'px';
      p.title = m.note;
      p.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openPop(el, m, e.clientX, e.clientY); });
      layer.appendChild(p);
    });
    counts();
  }
  var tmr; function redraw() { clearTimeout(tmr); tmr = setTimeout(drawPins, 120); }
  window.addEventListener('resize', redraw);
  window.addEventListener('load', redraw);
  setTimeout(drawPins, 600); setTimeout(drawPins, 2000);

  /* ---------- ハイライト ---------- */
  function target(e) {
    var el = e.target;
    if (!el || el.closest('.rv-ui')) return null;
    // 図（SVG）の中は、文字やパーツ単位で選べるようにする（図全体は枠の余白部分をクリック）
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') {
      var part = el.closest('text') || el.closest('g[class],g[data-i]') || el.closest('g');
      return part && part.closest('svg') ? part : el.closest('svg');
    }
    var t = el.closest(PICK);
    return t || el;
  }
  document.addEventListener('mousemove', function (e) {
    if (!picking || pop) return;
    var t = target(e);
    if (!t) { hl.style.display = 'none'; return; }
    var r = t.getBoundingClientRect();
    hl.style.display = 'block';
    hl.style.left = (r.left + window.scrollX - 2) + 'px'; hl.style.top = (r.top + window.scrollY - 2) + 'px';
    hl.style.width = (r.width + 4) + 'px'; hl.style.height = (r.height + 4) + 'px';
    hl.firstChild.textContent = areaName(t) + ' ＞ ' + kind(t);
  }, true);

  function block(e) {
    if (!picking) return;
    if (e.target.closest && e.target.closest('.rv-ui')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  }
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'submit'].forEach(function (ev) { document.addEventListener(ev, block, true); });
  document.addEventListener('click', function (e) {
    if (!picking) return;
    if (e.target.closest && e.target.closest('.rv-ui')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (pop) { closePop(); return; }
    var t = target(e); if (!t) return;
    openPop(t, null, e.clientX, e.clientY);
  }, true);

  /* ---------- 入力ポップアップ ---------- */
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(el, item, cx, cy) {
    closePop();
    hl.style.display = 'none';
    var isPage = !el && !(item && item.sel);
    var loc = item ? item.loc : (el ? areaName(el) + ' ＞ ' + kind(el) : 'ページ全体');
    var curTxt = item ? item.cur : (el ? txt(el) : '');
    pop = document.createElement('div'); pop.className = 'rv-pop rv-ui';
    pop.innerHTML =
      '<div class="loc">' + esc(pageTitle()) + '（' + PAGE + '）</div>' +
      '<div style="font-weight:700;font-size:14px">' + esc(loc) + '</div>' +
      (curTxt ? '<div class="cur">現在：' + esc(curTxt) + '</div>' : '<div style="height:8px"></div>') +
      '<textarea placeholder="どう直したいかを書いてください（例：「体操」を削除／この写真を差し替え／文字をもっと大きく）"></textarea>' +
      '<div class="quick"><button type="button">削除</button><button type="button">文言変更：</button><button type="button">写真差し替え</button><button type="button">文字を大きく</button><button type="button">色を変更：</button><button type="button">位置を移動：</button></div>' +
      '<div class="row">' + (item ? '<button type="button" class="del l">この指示を削除</button>' : '') +
      '<button type="button" class="cc">キャンセル</button><button type="button" class="pri ok">保存</button></div>';
    document.body.appendChild(pop);
    var ta = pop.querySelector('textarea');
    if (item) ta.value = item.note;
    [].forEach.call(pop.querySelectorAll('.quick button'), function (b) {
      b.addEventListener('click', function () { ta.value = (ta.value ? ta.value + '\n' : '') + b.textContent; ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; });
    });
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var x = Math.min(Math.max(12, (cx || 40) + 12), window.innerWidth - w - 12);
    var y = Math.min(Math.max(12, (cy || 80) + 12), window.innerHeight - h - bar.offsetHeight - 24);
    pop.style.left = x + 'px'; pop.style.top = Math.max(12, y) + 'px';
    setTimeout(function () { ta.focus(); }, 30);
    pop.querySelector('.cc').onclick = closePop;
    if (item) pop.querySelector('.del').onclick = function () { mem.splice(mem.indexOf(item), 1); save(); closePop(); drawPins(); renderPanel(); toast('指示を削除しました'); };
    pop.querySelector('.ok').onclick = function () {
      var v = ta.value.trim(); if (!v) { ta.focus(); return; }
      if (item) { item.note = v; item.t = Date.now(); }
      else {
        var r = el ? el.getBoundingClientRect() : null;
        mem.push({
          page: PAGE, title: pageTitle(), loc: loc, cur: curTxt, note: v,
          sel: el ? cssPath(el) : '', dev: device(),
          x: r ? Math.round(r.left + window.scrollX) : 0, y: r ? Math.round(r.top + window.scrollY) : 0,
          t: Date.now()
        });
      }
      save(); closePop(); drawPins(); renderPanel(); toast(item ? '指示を更新しました' : '指示を保存しました（' + mem.length + '件）');
    };
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) pop.querySelector('.ok').click(); if (e.key === 'Escape') closePop(); });
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 一覧パネル ---------- */
  function renderPanel() {
    if (!panel) return;
    var body = panel.querySelector('.body'); body.innerHTML = '';
    if (!mem.length) { body.innerHTML = '<p class="rv-help">まだ指示はありません。<br>直したい場所をクリック（スマホはタップ）すると、指示を書き込めます。<br>ページを移動しても指示は残ります。</p>'; return; }
    var pages = [];
    mem.forEach(function (m) { if (pages.indexOf(m.page) < 0) pages.push(m.page); });
    pages.forEach(function (pg) {
      var items = mem.filter(function (m) { return m.page === pg; });
      var h = document.createElement('h4'); h.textContent = items[0].title + '（' + pg + '）'; body.appendChild(h);
      items.forEach(function (m) {
        var d = document.createElement('div'); d.className = 'it';
        d.innerHTML = '<div><span class="n">' + globalNo(m) + '</span><b>' + esc(m.loc) + '</b></div>' +
          '<div class="m">' + esc(m.dev) + (m.cur ? '　現在：' + esc(m.cur) : '') + '</div>' +
          '<p>' + esc(m.note) + '</p>' +
          '<div class="ops">' + (pg === PAGE ? '<button type="button" class="go">この場所へ</button>' : '<a href="' + pg + '">このページへ</a>') +
          '<button type="button" class="ed">編集</button><button type="button" class="del">削除</button></div>';
        var go = d.querySelector('.go');
        if (go) go.onclick = function () { var el = m.sel && find(m.sel); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } else window.scrollTo({ top: Math.max(0, m.y - 150), behavior: 'smooth' }); };
        d.querySelector('.ed').onclick = function () {
          if (pg !== PAGE) { location.href = pg; return; }
          var el = m.sel && find(m.sel); openPop(el, m, window.innerWidth / 2 - 190, 120);
        };
        d.querySelector('.del').onclick = function () { if (confirm('この指示を削除しますか？')) { mem.splice(mem.indexOf(m), 1); save(); drawPins(); renderPanel(); } };
        body.appendChild(d);
      });
    });
  }
  function togglePanel() {
    if (panel) { panel.remove(); panel = null; return; }
    panel = document.createElement('div'); panel.className = 'rv-panel rv-ui';
    panel.innerHTML = '<header>修正指示の一覧<button type="button" class="x">閉じる</button></header>' +
      '<div class="who">記入者<input type="text" placeholder="お名前（例：福田）"></div>' +
      '<div class="body"></div>' +
      '<footer><button type="button" class="pri cp">まとめてコピー</button><button type="button" class="clr">全部消す</button></footer>';
    document.body.appendChild(panel);
    var who = panel.querySelector('.who input'); who.value = ls(WHO) || '';
    who.addEventListener('input', function () { ls(WHO, who.value.trim() || null); });
    panel.querySelector('.x').onclick = togglePanel;
    panel.querySelector('.cp').onclick = copyAll;
    panel.querySelector('.clr').onclick = function () {
      if (!mem.length) return;
      if (confirm('すべての修正指示（' + mem.length + '件）を消します。\n先に「まとめてコピー」で控えを取ってください。消してよろしいですか？')) { mem = []; save(); drawPins(); renderPanel(); }
    };
    renderPanel();
  }

  /* ---------- まとめてコピー ---------- */
  function buildText() {
    var d = new Date(), pad = function (n) { return ('0' + n).slice(-2); };
    var out = ['＜修正指示＞ エコリース 新サイト（確認用）',
      '日時：' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + (ls(WHO) ? '　記入者：' + ls(WHO) : ''),
      '件数：' + mem.length + '件', ''];
    var pages = [];
    mem.forEach(function (m) { if (pages.indexOf(m.page) < 0) pages.push(m.page); });
    pages.forEach(function (pg) {
      var items = mem.filter(function (m) { return m.page === pg; });
      out.push('【' + items[0].title + '　' + pg + '】');
      items.forEach(function (m) {
        out.push('（' + globalNo(m) + '）場所：' + m.loc + '　／' + m.dev);
        if (m.cur) out.push('　　現在：「' + m.cur + '」');
        out.push('　　指示：' + m.note.replace(/\n/g, '\n　　　　　'));
        if (m.sel) out.push('　　［位置］' + m.sel);
      });
      out.push('');
    });
    return out.join('\n');
  }
  function copyAll() {
    if (!mem.length) { toast('まだ指示がありません'); return; }
    var text = buildText();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.className = 'rv-ui';
      ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (ok) done();
      else { var w = window.open('', '_blank'); if (w) { w.document.write('<pre style="white-space:pre-wrap;font:14px/1.7 sans-serif;padding:16px">' + esc(text) + '</pre>'); } }
    }
    function done() {
      toast('コピーしました（' + mem.length + '件）。ジャービスやLINEに貼り付けてください');
      // 送った指示が次回のコピーに重複して入らないよう、消すかどうかを確認
      setTimeout(function () {
        if (confirm('コピーしました（' + mem.length + '件）。\n\n貼り付けて送ったら、この指示は一覧から消しますか？\n（消すと、次回のコピーに今回の指示が重複して入りません）\n\n［OK］消す　［キャンセル］残しておく')) {
          mem = []; save(); drawPins(); renderPanel(); toast('一覧を空にしました');
        }
      }, 400);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
  }

  /* ---------- ツールバー ---------- */
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'mode') setMode(!picking);
    if (a === 'page') openPop(null, null, window.innerWidth / 2 - 190, 120);
    if (a === 'list') togglePanel();
    if (a === 'copy') copyAll();
    if (a === 'exit') {
      if (confirm('修正指示モードを終了します。\n（書いた指示はこのブラウザに残ります。もう一度 ?review を付けて開くと続きから使えます）')) {
        ls(ON, null); location.href = location.pathname + location.hash;
      }
    }
  });
  bar.querySelector('.rv-go').addEventListener('change', function (e) {
    var v = e.target.value; if (v && /\.html$/.test(v) && v !== PAGE) location.href = v;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePop(); } });
  setMode(true);
  counts();
  if (!ls('ecoReview.seen')) { ls('ecoReview.seen', '1'); setTimeout(function () { toast('修正指示モード：直したい場所をクリックしてください'); }, 600); }
})();
