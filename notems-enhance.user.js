// ==UserScript==
// @name         Note.ms 阅读体验增强
// @namespace    https://note.ms/
// @version      1.2.0
// @description  优化 Note.ms，提供暗色模式、字体调整、行宽限制、数学公式渲染等功能，提升阅读体验。
// @author       Taffy
// @match        https://note.ms/*
// @match        http://note.ms/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /* ========================================================================
     *  0. 工具函数 & 常量
     * ======================================================================== */

    const IS_MD = location.pathname.endsWith('.md');

    function setting(key, defaultVal) {
        try { return GM_getValue(key, defaultVal); }
        catch { return defaultVal; }
    }
    function saveSetting(key, val) {
        try { GM_setValue(key, val); } catch { /* noop */ }
    }

    const ICONS = {
        sun: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
        moon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    };

    /* ========================================================================
     *  1. 核心 CSS 马上注入 (避免白屏闪烁)
     * ======================================================================== */

    const ROOT_CSS = /* css */ `
  /* --- 亮色变量 --- */
  :root {
    --nme-bg:           #ebeef2;
    --nme-paper:        #ffffff;
    --nme-text:         #1d1d1f;
    --nme-text-secondary: #6e6e73;
    --nme-border:       #d2d2d7;
    --nme-code-bg:      #f5f5f7;
    --nme-code-border:  #e0e0e3;
    --nme-code-text:    #1d1d1f;
    --nme-link:         #0066cc;
    --nme-accent:       #0071e3;
    --nme-shadow:       rgba(0,0,0,.08);
    --nme-max-width:    720px;
    --nme-font-size:    16px;
    --nme-line-height:  1.75;
    --nme-font-family:  'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
                        'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --nme-mono:         'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas,
                        'Liberation Mono', monospace;
  }

  /* --- 暗色变量 --- */
  :root.nme-dark {
    --nme-bg:           #1c1c1e;
    --nme-paper:        #2c2c2e;
    --nme-text:         #e5e5e7;
    --nme-text-secondary: #98989d;
    --nme-border:       #3a3a3c;
    --nme-code-bg:      #1c1c1e;
    --nme-code-border:  #3a3a3c;
    --nme-code-text:    #e5e5e7;
    --nme-link:         #64b5f6;
    --nme-accent:       #64b5f6;
    --nme-shadow:       rgba(0,0,0,.35);
  }

  /* --- 全局 --- */
  html, body {
    background: var(--nme-bg) !important;
    color: var(--nme-text) !important;
    font-family: var(--nme-font-family) !important;
    font-size: var(--nme-font-size) !important;
    line-height: var(--nme-line-height) !important;
  }
  body {
    transition: background .3s, color .3s;
  }

  /* --- 纸张容器 --- */
  .stack, .layer {
    background: var(--nme-paper) !important;
    border-color: var(--nme-border) !important;
    box-shadow: 0 2px 12px var(--nme-shadow) !important;
    transition: background .3s, border-color .3s, box-shadow .3s;
  }

  /* --- 编辑区 & 内容区：行宽限制 + 居中 + 自动换行 --- */
  textarea, .content, div[contenteditable] {
    max-width: var(--nme-max-width) !important;
    margin-left: auto !important;
    margin-right: auto !important;
    font-family: var(--nme-font-family) !important;
    font-size: var(--nme-font-size) !important;
    line-height: var(--nme-line-height) !important;
    color: var(--nme-text) !important;
    caret-color: var(--nme-accent) !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    transition: color .3s;
  }

  /* --- 编辑模式 textarea 居中 --- */
  textarea {
    display: block !important;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    resize: none !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    box-sizing: border-box !important;
  }

  /* --- 预览模式内容区换行 --- */
  .content {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    white-space: normal !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    box-sizing: border-box !important;
  }

  /* --- 页脚 --- */
  .footer, footer, [class*="footer"] {
    color: var(--nme-text-secondary) !important;
    transition: color .3s;
    width: 100% !important;
  }
  .footer a, footer a {
    color: var(--nme-text-secondary) !important;
  }

  /* --- 链接 --- */
  a {
    color: var(--nme-link) !important;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: color .3s, border-color .3s;
  }
  a:hover {
    border-bottom-color: var(--nme-link);
  }

  /* ==========================================================
   *  Markdown (.md) 专属样式
   * ========================================================== */

  .content h1 {
    font-size: 1.9em !important;
    font-weight: 700 !important;
    margin: 0.4em 0 0.6em !important;
    padding-bottom: 0.3em !important;
    border-bottom: 2px solid var(--nme-border) !important;
    color: var(--nme-text) !important;
    letter-spacing: -0.02em;
    word-break: break-word !important;
  }
  .content h2 {
    font-size: 1.5em !important;
    font-weight: 600 !important;
    margin: 1.2em 0 0.5em !important;
    padding-bottom: 0.25em !important;
    border-bottom: 1px solid var(--nme-border) !important;
    color: var(--nme-text) !important;
  }
  .content h3 {
    font-size: 1.25em !important;
    font-weight: 600 !important;
    margin: 1em 0 0.4em !important;
    color: var(--nme-text) !important;
  }

  .content p {
    margin: 0 0 1em !important;
    color: var(--nme-text) !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  .content ul, .content ol {
    padding-left: 1.8em !important;
    margin-bottom: 1em !important;
  }
  .content li {
    margin-bottom: 0.35em !important;
    color: var(--nme-text) !important;
  }

  /* --- 行内代码 --- */
  .content code {
    background: var(--nme-code-bg) !important;
    color: var(--nme-code-text) !important;
    padding: 0.15em 0.4em !important;
    border-radius: 4px !important;
    font-family: var(--nme-mono) !important;
    font-size: 0.88em !important;
    border: 1px solid var(--nme-code-border) !important;
    transition: background .3s, color .3s, border-color .3s;
    word-break: break-all !important;
  }

  /*position: relative;
    background: var(--nme-code-bg) !important;
    color: var(--nme-code-text) !important;
    padding: 1em 1.2em !important;
    border-radius: 8px !important;
    border: 1px solid var(--nme-code-border) !important;
    font-family: var(--nme-mono) !important;
    font-size: 0.88em !important;
    line-height: 1.55 !important;
    overflow-x: auto !important;
    margin-bottom: 1.2em !important;
    white-space: pre !important;
    word-wrap: normal !important;
    transition: background .3s, color .3s, border-color .3s;
  }
  .content pre code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: inherit !important;
    word-break: normal !important;
  }

  /* --- 代码块复制按钮 --- */
  .nme-copy-code-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: var(--nme-paper);
    border: 1px solid var(--nme-border);
    border-radius: 6px;
    color: var(--nme-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s, color 0.2s;
    z-index: 10;
  }
  .content pre:hover .nme-copy-code-btn {
    opacity: 1;
  }
  .nme-copy-code-btn:hover {
    background: var(--nme-code-bg);
    color: var(--nme-text);
  }
  .nme-copy-code-btn.copied {
    color: #34c759;
    border-color: #34c759;
  }

  /* --- 公式复制 --- */
  .katex-display, .katex {
    cursor: pointer;
    transition: opacity 0.2s;
    position: relative;
  }
  .katex-display:hover, .katex:hover {
    opacity: 0.8;
  }
  .katex-display::after, .katex::after {
    content: "点击复制";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--nme-text);
    color: var(--nme-paper);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: var(--nme-font-family);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
    white-space: nowrap;
    z-index: 100;
  }
  .katex-display:hover::after, .katex:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }
  .katex-display.copied::after, .katex.copied::after {
    content: "已复制！";
    background: #34c759
    font-size: inherit !important;
    word-break: normal !important;
  }

  /* --- 引用块 --- */
  .content blockquote {
    border-left: 4px solid var(--nme-accent) !important;
    margin: 0 0 1em 0 !important;
    padding: 0.6em 1em !important;
    color: var(--nme-text-secondary) !important;
    background: var(--nme-code-bg) !important;
    border-radius: 0 6px 6px 0 !important;
    transition: background .3s, color .3s, border-color .3s;
  }

  .content hr {
    border: none !important;
    border-top: 1px solid var(--nme-border) !important;
    margin: 1.5em 0 !important;
  }

  .content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.2em;
  }
  .content th, .content td {
    border: 1px solid var(--nme-border) !important;
    padding: 0.5em 0.8em !important;
    color: var(--nme-text) !important;
  }
  .content th {
    background: var(--nme-code-bg) !important;
    font-weight: 600;
  }

  /* ==========================================================
   *  工具栏
   * ========================================================== */
  #nme-toolbar {
    position: fixed;
    top: 12px;
    right: 16px;
    display: flex;
    gap: 6px;
    z-index: 99999;
    opacity: 0.25;
    transition: opacity 0.3s;
  }
  #nme-toolbar:hover {
    opacity: 1;
  }

  .nme-btn {
    width: 36px;
    height: 36px;
    border: 1px solid var(--nme-border);
    border-radius: 10px;
    background: var(--nme-paper);
    color: var(--nme-text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background .2s, border-color .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 1px 4px var(--nme-shadow);
    user-select: none;
    -webkit-user-select: none;
    line-height: 1;
  }
  .nme-btn:hover {
    background: var(--nme-code-bg);
    transform: translateY(-1px);
    box-shadow: 0 3px 10px var(--nme-shadow);
  }
  .nme-btn:active {
    transform: scale(0.92);
  }
  .nme-btn svg {
    display: block;
  }

  /* --- 保存状态指示点 --- */
  #nme-save-dot {
    position: fixed;
    top: 16px;
    left: 16px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34c759;
    opacity: 0;
    z-index: 99999;
    transition: opacity 0.5s, background 0.3s;
    pointer-events: none;
  }
  #nme-save-dot.nme-saving {
    opacity: 0.7;
    background: #ff9f0a;
    animation: nme-pulse 1s ease-in-out infinite;
  }
  #nme-save-dot.nme-saved {
    opacity: 0.7;
    background: #34c759;
  }
  #nme-save-dot.nme-error {
     background: #ff3b30 !important;
     opacity: 0.9 !important;
     animation: none;
  }

  @keyframes nme-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50%      { transform: scale(1.4); opacity: 1; }
  }

  /* --- 滚动条 --- */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--nme-border);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--nme-text-secondary);
  }
  `;

    GM_addStyle(ROOT_CSS);

    /* ========================================================================
     *  2. 极速加载外部依赖 (CSS 及 Font)
     * ======================================================================== */

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap';
    document.documentElement.appendChild(fontLink);

    if (IS_MD) {
        const katexCSS = document.createElement('link');
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.documentElement.appendChild(katexCSS);
    }

    /* ========================================================================
     *  3. 初始化主题与字号 (避免闪屏)
     * ======================================================================== */

    let isDark = setting('nme-dark', false);

    function applyTheme() {
        document.documentElement.classList.toggle('nme-dark', isDark);
        const btn = document.getElementById('nme-dark-btn');
        if (btn) btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    }

    function toggleDark() {
        isDark = !isDark;
        saveSetting('nme-dark', isDark);
        applyTheme();
    }

    const FONT_SIZES = [14, 15, 16, 17, 18, 20];
    let fontIdx = setting('nme-font-idx', 2);

    function applyFontSize() {
        const size = FONT_SIZES[fontIdx] || 16;
        document.documentElement.style.setProperty('--nme-font-size', size + 'px');
    }

    function fontSmaller() {
        if (fontIdx > 0) { fontIdx--; saveSetting('nme-font-idx', fontIdx); applyFontSize(); }
    }
    function fontLarger() {
        if (fontIdx < FONT_SIZES.length - 1) { fontIdx++; saveSetting('nme-font-idx', fontIdx); applyFontSize(); }
    }

    // 立即应用配置
    applyTheme();
    applyFontSize();

    /* ========================================================================
     *  4. 保存状态指示器 (网络层面钩子，必须在最前拦截)
     * ======================================================================== */

    let saveDot = null;
    let hideTimer = null;

    function setSaveStatus(status) {
        if (!saveDot) return;
        clearTimeout(hideTimer);

        if (status === 'saving') {
            saveDot.className = 'nme-saving';
        } else if (status === 'saved') {
            saveDot.className = 'nme-saved';
            hideTimer = setTimeout(() => { saveDot.className = ''; }, 3000);
        } else if (status === 'error') {
            saveDot.className = 'nme-error';
            hideTimer = setTimeout(() => { saveDot.className = ''; }, 5000);
        }
    }

    function initNetworkHooks() {
        if (IS_MD) return;

        // 拦截 fetch
        const origFetch = window.fetch;
        window.fetch = function (...args) {
            const options = args[1] || {};
            // 判断是否是提交保存的 POST 请求
            const isPost = options.method && options.method.toUpperCase() === 'POST';

            if (isPost) setSaveStatus('saving');

            return origFetch.apply(this, args).then(resp => {
                if (isPost) setSaveStatus('saved');
                return resp;
            }).catch(err => {
                if (isPost) setSaveStatus('error');
                throw err;
            });
        };

        // 拦截 XMLHttpRequest
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (...args) {
            this._nmeIsPost = args[0] && args[0].toUpperCase() === 'POST';
            return origOpen.apply(this, args);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            if (this._nmeIsPost) {
                setSaveStatus('saving');
                this.addEventListener('load', () => setSaveStatus('saved'));
                this.addEventListener('error', () => setSaveStatus('error'));
            }
            return origSend.apply(this, args);
        };
    }

    // 立即启动网络拦截
    initNetworkHooks();

    /* ========================================================================
     *  5. DOM 加载完成后的操作
     * ======================================================================== */

    function createToolbar() {
        const bar = document.createElement('div');
        bar.id = 'nme-toolbar';

        // 暗色模式
        const darkBtn = document.createElement('button');
        darkBtn.id = 'nme-dark-btn';
        darkBtn.className = 'nme-btn';
        darkBtn.title = '切换暗色模式';
        darkBtn.addEventListener('click', toggleDark);
        // 初始化按钮图标
        darkBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
        bar.appendChild(darkBtn);

        // 字体缩小
        const smallBtn = document.createElement('button');
        smallBtn.className = 'nme-btn';
        smallBtn.textContent = 'A\u2212';
        smallBtn.title = '缩小字体';
        smallBtn.style.fontSize = '12px';
        smallBtn.addEventListener('click', fontSmaller);
        bar.appendChild(smallBtn);

        // 字体放大
        const bigBtn = document.createElement('button');
        bigBtn.className = 'nme-btn';
        bigBtn.textContent = 'A+';
        bigBtn.title = '放大字体';
        bigBtn.style.fontSize = '13px';
        bigBtn.addEventListener('click', fontLarger);
        bar.appendChild(bigBtn);

        // 编辑/预览模式切换
        const mdBtn = document.createElement('button');
        mdBtn.className = 'nme-btn';
        mdBtn.title = IS_MD ? '编辑模式' : '预览模式';
        mdBtn.innerHTML = IS_MD ? ICONS.edit : ICONS.eye;
        mdBtn.addEventListener('click', () => {
            if (IS_MD) location.href = location.pathname.replace(/\.md$/, '');
            else location.href = location.pathname + '.md';
        });
        bar.appendChild(mdBtn);

        // 一键复制全文
        const copyBtn = document.createElement('button');
        copyBtn.className = 'nme-btn';
        copyBtn.title = '复制全文';
        copyBtn.innerHTML = ICONS.copy;
        copyBtn.addEventListener('click', () => {
            const textToCopy = IS_MD ? document.querySelector('.content').innerText : document.querySelector('textarea').value;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.innerHTML = ICONS.check;
                copyBtn.style.color = '#34c759';
                copyBtn.style.borderColor = '#34c759';
                setTimeout(() => {
                    copyBtn.innerHTML = ICONS.copy;
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = '';
                }, 2000);
            });
        });
        bar.appendChild(copyBtn);

        document.body.appendChild(bar);
    }

    function fixCodeEscaping() {
        if (!IS_MD) return;
        document.querySelectorAll('pre, code').forEach(el => {
            // 简单修复，确保不会破坏可能的子元素
            if (el.children.length === 0 && (el.innerHTML.includes('&amp;#039;') || el.innerHTML.includes('&#039;'))) {
                el.innerHTML = el.innerHTML
                    .replace(/&amp;#039;/g, "'")
                    .replace(/&#039;/g, "'")
                    .replace(/&amp;quot;/g, '"')
                    .replace(/&#034;/g, '"')
                    .replace(/&amp;lt;/g, '&lt;')
                    .replace(/&amp;gt;/g, '&gt;')
                    .replace(/&amp;amp;/g, '&amp;');
            }
        });
    }

    function renderMath() {
        // 利用 KaTeX 的 auto-render 插件，全自动安全渲染
        if (!IS_MD || typeof renderMathInElement === 'undefined') return;

        const content = document.querySelector('.content');
        if (!content) return;

        renderMathInElement(content, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            // 忽略代码区块与输入区域，防止误伤
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
            throwOnError: false
        });

        // 为渲染后的公式添加点击复制功能
        document.querySelectorAll('.katex-display, .katex').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                // 获取原始的 TeX 代码
                const texElement = this.querySelector('annotation[encoding="application/x-tex"]');
                if (texElement) {
                    const texCode = texElement.textContent;
                    // 判断是行内公式还是块级公式，加上对应的定界符
                    const isDisplay = this.classList.contains('katex-display');
                    const textToCopy = isDisplay ? `$$\n${texCode}\n$$` : `$${texCode}$`;
                    
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        this.classList.add('copied');
                        setTimeout(() => this.classList.remove('copied'), 1500);
                    });
                }
            });
        });
    }

    function addCodeBlockCopy() {
        if (!IS_MD) return;
        document.querySelectorAll('.content pre').forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'nme-copy-code-btn';
            btn.innerHTML = ICONS.copy;
            btn.title = '复制代码';
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const code = pre.querySelector('code');
                const text = code ? code.innerText : pre.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    btn.innerHTML = ICONS.check;
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.innerHTML = ICONS.copy;
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });
            
            pre.appendChild(btn);
        });
    }

    function initDOM() {
        // 创建顶层 UI 元素
        if (!IS_MD) {
            saveDot = document.createElement('div');
            saveDot.id = 'nme-save-dot';
            document.body.appendChild(saveDot);
        }
        createToolbar();

        // 内容渲染增强
        fixCodeEscaping();
        renderMath();
        addCodeBlockCopy();
    }

    // 生命周期绑定
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDOM);
    } else {
        initDOM();
    }
})();
