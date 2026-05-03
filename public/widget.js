(function () {
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-store");
  if (!slug) { console.error("[ShopAssist] data-store attribute is required"); return; }
  var origin = new URL(script.src).origin;

  function build() {
    if (document.getElementById("shopassist-iframe")) return;

    var iframe = document.createElement("iframe");
    iframe.id = "shopassist-iframe";
    iframe.src = origin + "/c/" + encodeURIComponent(slug);
    iframe.title = "Shop assistant";
    iframe.allow = "clipboard-write";
    iframe.style.cssText = [
      "position:fixed", "bottom:90px", "right:20px", "width:380px", "height:560px",
      "max-width:calc(100vw - 32px)", "max-height:calc(100vh - 120px)",
      "border:0", "border-radius:18px",
      "box-shadow:0 20px 60px -15px rgba(0,0,0,0.35)",
      "z-index:2147483646", "display:none", "background:white",
    ].join(";");
    document.body.appendChild(iframe);

    var btn = document.createElement("button");
    btn.id = "shopassist-button";
    btn.setAttribute("aria-label", "Open chat");
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.style.cssText = [
      "position:fixed", "bottom:20px", "right:20px", "width:56px", "height:56px",
      "border-radius:50%", "border:0", "background:#7c3aed", "color:white",
      "box-shadow:0 10px 30px -5px rgba(124,58,237,0.5)", "cursor:pointer",
      "display:flex", "align-items:center", "justify-content:center",
      "z-index:2147483647", "transition:transform 0.15s",
    ].join(";");
    btn.onmouseover = function () { btn.style.transform = "scale(1.05)"; };
    btn.onmouseout = function () { btn.style.transform = "scale(1)"; };
    var open = false;
    btn.onclick = function () {
      open = !open;
      iframe.style.display = open ? "block" : "none";
      btn.innerHTML = open
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    };
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
