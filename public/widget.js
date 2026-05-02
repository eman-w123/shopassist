(function () {
  var current = document.currentScript;
  if (!current) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) { current = scripts[i]; break; }
    }
  }
  if (!current) return;
  var slug = current.getAttribute('data-store');
  if (!slug) { console.warn('[ShopAssist] data-store attribute is required'); return; }

  var origin = new URL(current.src).origin;
  if (window.__shopAssistMounted) return;
  window.__shopAssistMounted = true;

  var collapsedSize = '64px';
  var expandedW = '380px';
  var expandedH = '600px';

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/embed/' + encodeURIComponent(slug);
  iframe.title = 'ShopAssist chat';
  iframe.allow = 'clipboard-write';
  iframe.style.cssText = [
    'position:fixed','bottom:20px','right:20px','z-index:2147483647',
    'width:' + expandedW,'height:' + expandedH,'max-width:calc(100vw - 24px)',
    'max-height:calc(100vh - 40px)','border:0','border-radius:18px',
    'box-shadow:0 20px 60px -15px rgba(0,0,0,.35)','background:transparent',
    'transition:width .2s ease, height .2s ease, opacity .2s ease',
    'display:none'
  ].join(';');

  var bubble = document.createElement('button');
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  bubble.style.cssText = [
    'position:fixed','bottom:20px','right:20px','z-index:2147483647',
    'width:' + collapsedSize,'height:' + collapsedSize,'border-radius:50%',
    'border:0','cursor:pointer','color:#fff','background:#7c3aed',
    'box-shadow:0 14px 36px -10px rgba(124,58,237,.55)',
    'display:flex','align-items:center','justify-content:center',
    'transition:transform .15s ease'
  ].join(';');
  bubble.addEventListener('mouseenter', function () { bubble.style.transform = 'scale(1.05)'; });
  bubble.addEventListener('mouseleave', function () { bubble.style.transform = 'scale(1)'; });

  var open = false;
  function setOpen(v) {
    open = v;
    iframe.style.display = v ? 'block' : 'none';
    bubble.style.display = v ? 'none' : 'flex';
  }
  bubble.addEventListener('click', function () { setOpen(true); });

  // Allow the embedded page to request close
  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return;
    if (e.data && e.data.type === 'shopassist:close') setOpen(false);
    if (e.data && e.data.type === 'shopassist:color' && typeof e.data.color === 'string') {
      bubble.style.background = e.data.color;
    }
  });

  function mount() {
    document.body.appendChild(iframe);
    document.body.appendChild(bubble);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();