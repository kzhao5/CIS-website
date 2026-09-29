(function () {
  "use strict";

  // Math
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  // Explorer: truncation regions of TIS and CIS in the (1 - p, eps) plane.
  // k = p + (1 - p) e^eps. CIS truncates when k > 1 + lam * max(1 - p, kappa),
  // i.e. eps > log(1 + lam * max(u, kappa) / u) with u = 1 - p.
  // TIS with cap C truncates when k > C, i.e. eps > log(1 + (C - 1) / u).
  var LAM = 2.3, KAPPA = 5e-3, C = 2;
  var W = 560, H = 380, M = { l: 58, r: 18, t: 18, b: 52 };
  var X0 = -4, X1 = 0, Y0 = -2, Y1 = 8;
  var NS = "http://www.w3.org/2000/svg";

  function sx(lu) { return M.l + (lu - X0) / (X1 - X0) * (W - M.l - M.r); }
  function sy(e) { return H - M.b - (e - Y0) / (Y1 - Y0) * (H - M.t - M.b); }
  function cisBound(u) { return Math.log(1 + LAM * Math.max(u, KAPPA) / u); }
  function tisBound(u) { return Math.log(1 + (C - 1) / u); }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function curve(fn) {
    var pts = [];
    for (var i = 0; i <= 200; i++) {
      var lu = X0 + (X1 - X0) * i / 200;
      pts.push([sx(lu), sy(Math.max(Y0 - 1, Math.min(Y1 + 3, fn(Math.pow(10, lu)))))]);
    }
    return pts;
  }

  function areaAbove(pts) {
    var d = "M" + pts[0][0] + "," + sy(Y1);
    pts.forEach(function (p) { d += " L" + p[0] + "," + p[1]; });
    return d + " L" + pts[pts.length - 1][0] + "," + sy(Y1) + " Z";
  }

  function line(pts) {
    return pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + "," + p[1]; }).join(" ");
  }

  function drawStatic(svg) {
    var defs = el("defs", {}, svg);
    var pat = el("pattern", { id: "hatch", width: 7, height: 7, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 7, stroke: "#b9b3c2", "stroke-width": 1.4 }, pat);

    var clip = el("clipPath", { id: "plot-area" }, defs);
    el("rect", { x: sx(X0), y: sy(Y1), width: sx(X1) - sx(X0), height: sy(Y0) - sy(Y1) }, clip);

    var cisPts = curve(cisBound), tisPts = curve(tisBound);
    var regions = el("g", { "clip-path": "url(#plot-area)" }, svg);
    el("path", { d: areaAbove(tisPts), fill: "url(#hatch)", opacity: 0.55 }, regions);
    el("path", { d: areaAbove(cisPts), fill: "#43c9a0", opacity: 0.16 }, regions);

    // grid and axes
    var g = el("g", { "font-size": 11, fill: "#736a83", "font-family": "Inter, sans-serif" }, svg);
    for (var lu = X0; lu <= X1; lu++) {
      el("line", { x1: sx(lu), x2: sx(lu), y1: sy(Y0), y2: sy(Y1), stroke: "#efeaf4" }, g);
      var t = el("text", { x: sx(lu), y: sy(Y0) + 18, "text-anchor": "middle" }, g);
      t.textContent = lu === 0 ? "1" : "10";
      if (lu !== 0) { var s = el("tspan", { dy: -5, "font-size": 8 }, t); s.textContent = String(lu); }
    }
    for (var e = Y0; e <= Y1; e += 2) {
      el("line", { x1: sx(X0), x2: sx(X1), y1: sy(e), y2: sy(e), stroke: e === 0 ? "#d9d1e3" : "#efeaf4" }, g);
      var ty = el("text", { x: sx(X0) - 10, y: sy(e) + 4, "text-anchor": "end" }, g);
      ty.textContent = String(e);
    }
    var xl = el("text", { x: (sx(X0) + sx(X1)) / 2, y: H - 10, "text-anchor": "middle", fill: "#413752", "font-size": 12 }, g);
    xl.textContent = "token uncertainty 1 − p";
    var yl = el("text", { x: 16, y: (sy(Y0) + sy(Y1)) / 2, "text-anchor": "middle", fill: "#413752", "font-size": 13, transform: "rotate(-90 16 " + (sy(Y0) + sy(Y1)) / 2 + ")" }, g);
    yl.textContent = "displacement ε";

    var curves = el("g", { "clip-path": "url(#plot-area)" }, svg);
    el("path", { d: line(tisPts), fill: "none", stroke: "#8b8594", "stroke-width": 2.2, "stroke-dasharray": "6 4" }, curves);
    el("path", { d: line(cisPts), fill: "none", stroke: "#0f8a6c", "stroke-width": 2.6 }, curves);

    var lab = el("g", { "font-size": 11.5, "font-family": "Inter, sans-serif", "font-weight": 600, stroke: "#fff", "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round" }, svg);
    var l1 = el("text", { x: sx(-1.75), y: sy(cisBound(Math.pow(10, -1.75))) - 10, fill: "#0f8a6c", "text-anchor": "middle" }, lab);
    l1.textContent = "CIS truncates above";
    var l2 = el("text", { x: sx(-1.45), y: sy(tisBound(Math.pow(10, -1.45))) - 14, fill: "#736a83", "text-anchor": "middle" }, lab);
    l2.textContent = "TIS truncates above";

    var dot = el("g", {}, svg);
    el("circle", { r: 11, fill: "#2a1a3a", opacity: 0.12 }, dot);
    el("circle", { r: 5.5, fill: "#2a1a3a", stroke: "#fff", "stroke-width": 2 }, dot);
    return dot;
  }

  function fmt(x) {
    if (!isFinite(x)) return "∞";
    if (x >= 1000) return x.toExponential(2);
    if (x >= 100) return x.toFixed(1);
    if (x >= 10) return x.toFixed(2);
    if (Math.abs(x - 1) < 0.01) return x.toFixed(5);
    return x.toFixed(3);
  }

  function initExplorer() {
    var svg = document.getElementById("plot");
    if (!svg) return;
    var dot = drawStatic(svg);
    var uIn = document.getElementById("u"), eIn = document.getElementById("e");
    var uOut = document.getElementById("u-out"), eOut = document.getElementById("e-out");
    var kOut = document.getElementById("k-out"), tisOut = document.getElementById("tis-out"), cisOut = document.getElementById("cis-out");

    function update() {
      var lu = parseFloat(uIn.value), eps = parseFloat(eIn.value);
      var u = Math.pow(10, lu), p = 1 - u;
      var k = p + u * Math.exp(eps);
      var wT = Math.min(k, C), wC = Math.min(k, 1 + LAM * Math.max(u, KAPPA));
      uOut.textContent = (u < 0.01 ? u.toExponential(1) : u.toFixed(3)) + "  (p = " + (p > 0.999 ? p.toFixed(5) : p.toFixed(3)) + ")";
      eOut.textContent = eps.toFixed(2);
      kOut.textContent = fmt(k);
      tisOut.textContent = fmt(wT) + (wT < k ? "  truncated" : "");
      cisOut.textContent = fmt(wC) + (wC < k ? "  truncated" : "");
      tisOut.className = wT < k ? "cut" : "";
      cisOut.className = wC < k ? "cut" : "";
      dot.setAttribute("transform", "translate(" + sx(lu) + "," + sy(eps) + ")");
    }
    uIn.addEventListener("input", update);
    eIn.addEventListener("input", update);
    update();
  }

  function initCopy() {
    var btn = document.getElementById("copy-bib"), bib = document.getElementById("bibtex");
    if (!btn || !bib) return;
    btn.addEventListener("click", function () {
      var text = bib.textContent;
      var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta); done();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderMath();
    initExplorer();
    initCopy();
  });
})();
