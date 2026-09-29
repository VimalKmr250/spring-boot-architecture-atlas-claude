(function () {
  "use strict";

  var DECKS = {
    deck: { el: document.getElementById("stage"),    slug: "deck",       tab: "tab-deck", cur: 0, slides: [] },
    sb:   { el: document.getElementById("stage-sb"), slug: "springboot", tab: "tab-sb",   cur: 0, slides: [] },
    ed:   { el: document.getElementById("stage-ed"), slug: "events",     tab: "tab-ed",   cur: 0, slides: [] },
    dsa:  { el: document.getElementById("stage-dsa"), slug: "dsa",       tab: "tab-dsa",  cur: 0, slides: [] },
    st:   { el: document.getElementById("stage-st"), slug: "streams",    tab: "tab-st",   cur: 0, slides: [] }
  };
  var DECK_KEYS = ["deck", "sb", "ed", "dsa", "st"];

  var ivroot   = document.getElementById("ivroot");
  var counter  = document.getElementById("counter");
  var railfill = document.getElementById("railfill");
  var rail     = document.getElementById("rail");
  var navbar   = document.getElementById("navbar");
  var tocEl    = document.getElementById("toc");
  var tocGrid  = document.getElementById("tocgrid");
  var prevBtn  = document.getElementById("prev");
  var nextBtn  = document.getElementById("next");
  var tabIv    = document.getElementById("tab-iv");
  var ivnav    = document.getElementById("ivnav");

  var view = "deck";
  var tocFor = null;
  var tocButtons = [];
  var ivCur = "";

  /* ---- prepare both decks: eyebrows, and hide all but the first ---- */
  DECK_KEYS.forEach(function (k) {
    var d = DECKS[k];
    d.slides = Array.prototype.slice.call(d.el.querySelectorAll(".slide"));
    d.slides.forEach(function (s, i) {
      var eb = document.createElement("div");
      eb.className = "eyebrow";
      eb.textContent = (s.getAttribute("data-sec") || "") + "  \u00b7  " + String(i + 1).padStart(2, "0");
      s.insertBefore(eb, s.firstChild);
      s.hidden = i !== 0;
    });
  });

  function activeDeck() { return view === "iv" ? null : DECKS[view]; }

  /* ---- contents, rebuilt when the view changes ---- */
  // Decks list their slides; the interview page lists the sections in its side nav.
  function tocGroups(key) {
    var groups = [];
    function add(sec, item) {
      var g = groups[groups.length - 1];
      if (!g || g.name !== sec) { g = { name: sec, items: [] }; groups.push(g); }
      g.items.push(item);
    }
    if (key === "iv") {
      var sec = "Other", n = 0;
      Array.prototype.forEach.call(ivnav.children, function (el) {
        if (el.classList.contains("grp")) { sec = el.textContent; return; }
        var id = el.getAttribute("href").slice(1);
        if (!ivCur) ivCur = id;
        add(sec, { i: n++, key: id, title: el.textContent, go: function () { showIvSection(id); } });
      });
    } else {
      DECKS[key].slides.forEach(function (s, i) {
        add(s.getAttribute("data-sec") || "Other",
            { i: i, key: String(i), title: s.getAttribute("data-title") || ("Slide " + (i + 1)), go: function () { show(i); } });
      });
    }
    return groups;
  }

  function showIvSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    ivCur = id;
    markToc();
    target.scrollIntoView();
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }

  function markToc() {
    var cur = tocFor === "iv" ? ivCur : (DECKS[tocFor] ? String(DECKS[tocFor].cur) : "");
    tocButtons.forEach(function (b) {
      b.setAttribute("data-cur", b.getAttribute("data-key") === cur ? "1" : "0");
    });
  }

  function buildToc(key) {
    if (tocFor === key) return;
    tocFor = key;
    tocGrid.textContent = "";
    var groups = tocGroups(key);
    groups.forEach(function (g) {
      var wrap = document.createElement("div");
      wrap.className = "toc-sec";
      var h = document.createElement("h4");
      h.textContent = g.name;
      wrap.appendChild(h);
      var ol = document.createElement("ol");
      g.items.forEach(function (it) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("data-key", it.key);
        var n = document.createElement("i");
        n.textContent = String(it.i + 1).padStart(2, "0");
        b.appendChild(n);
        b.appendChild(document.createTextNode(it.title));
        b.addEventListener("click", function () { toggleToc(false); it.go(); });
        li.appendChild(b);
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
      tocGrid.appendChild(wrap);
    });
    tocButtons = Array.prototype.slice.call(tocGrid.querySelectorAll("button[data-key]"));
    markToc();
  }

  function show(i, skipHash) {
    var d = activeDeck();
    if (!d) return;
    d.cur = Math.max(0, Math.min(d.slides.length - 1, i));
    d.slides.forEach(function (s, n) { s.hidden = n !== d.cur; });
    counter.textContent = (d.cur + 1) + " / " + d.slides.length;
    railfill.style.width = ((d.cur + 1) / d.slides.length * 100).toFixed(2) + "%";
    prevBtn.disabled = d.cur === 0;
    nextBtn.disabled = d.cur === d.slides.length - 1;
    markToc();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!skipHash) { try { history.replaceState(null, "", "#" + d.slug + "/" + (d.cur + 1)); } catch (e) {} }
  }

  function go(delta) { show((activeDeck() || { cur: 0 }).cur + delta); }

  function toggleToc(force) {
    var open = typeof force === "boolean" ? force : tocEl.hidden;
    tocEl.hidden = !open;
    if (open) {
      var active = tocGrid.querySelector('button[data-cur="1"]');
      if (active) { try { active.scrollIntoView({ block: "center" }); } catch (e) {} }
    }
  }

  // On a phone the tab strip scrolls sideways; keep the selected tab in view.
  function revealTab() {
    var tab = document.getElementById(view === "iv" ? "tab-iv" : DECKS[view].tab), strip = tab.parentNode;
    var a = strip.getBoundingClientRect(), b = tab.getBoundingClientRect();
    if (b.left < a.left || b.right > a.right) strip.scrollLeft += (b.left + b.right - a.left - a.right) / 2;
  }

  function setView(v, skipHash) {
    view = (v === "iv" || DECK_KEYS.indexOf(v) >= 0) ? v : "deck";
    var d = activeDeck();
    DECK_KEYS.forEach(function (k) { DECKS[k].el.hidden = (k !== view); });
    ivroot.hidden = view !== "iv";
    navbar.hidden = !d;
    rail.hidden = !d;
    counter.hidden = !d;
    DECK_KEYS.forEach(function (k) {
      document.getElementById(DECKS[k].tab).setAttribute("aria-selected", k === view ? "true" : "false");
    });
    tabIv.setAttribute("aria-selected", view === "iv" ? "true" : "false");
    revealTab();
    toggleToc(false);
    buildToc(view);
    if (d) show(d.cur, true);
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!skipHash) {
      try { history.replaceState(null, "", d ? "#" + d.slug + "/" + (d.cur + 1) : "#interview"); } catch (e) {}
    }
  }

  window.go = go;
  window.show = show;
  window.setView = setView;
  window.toggleToc = toggleToc;

  /* ---- keyboard ---- */
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (e.key === "Escape" && !tocEl.hidden) { toggleToc(false); e.preventDefault(); return; }
    if (e.key === "c" || e.key === "C") { toggleToc(); e.preventDefault(); return; }
    if (!activeDeck()) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { go(1); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { go(-1); e.preventDefault(); }
    else if (e.key === "Home") { show(0); e.preventDefault(); }
    else if (e.key === "End") { show(activeDeck().slides.length - 1); e.preventDefault(); }
  });

  /* ---- interview-page scroll spy ---- */
  (function spy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("#ivnav a"));
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
                    .filter(Boolean);
    if (!("IntersectionObserver" in window) || !secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        ivCur = en.target.id;
        if (tocFor === "iv") markToc();
        links.forEach(function (a) {
          a.classList.toggle("on", a.getAttribute("href").slice(1) === en.target.id);
        });
      });
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });
    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ---- sliding-window stepper: every press moves exactly one pointer ---- */
  (function windowStepper() {
    var root = document.getElementById("sw-demo");
    if (!root) return;
    var input = root.querySelector("input");
    var grid  = root.querySelector(".sw-grid");
    var say   = root.querySelector(".sw-say");
    var outs = {}, btns = {};
    root.querySelectorAll("[data-sw-out]").forEach(function (el) { outs[el.getAttribute("data-sw-out")] = el; });
    root.querySelectorAll("button[data-sw]").forEach(function (b) { btns[b.getAttribute("data-sw")] = b; });

    var s = "", frames = [], at = 0, timer = null;

    function esc(t) {
      return String(t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
    }
    function q(t) { return "<code>" + esc(t) + "</code>"; }

    /* LC 3 on str, recorded as one frame per pointer move */
    function trace(str) {
      var out = [], seen = Object.create(null), l = 0, r = -1, best = 0, bestL = 0, explained = false;
      function win() { return str.slice(l, r + 1); }
      function push(kind, dup, msg) { out.push({ kind: kind, l: l, r: r, dup: dup, best: best, bestL: bestL, msg: msg }); }
      function clean(lead) {
        var len = r - l + 1, grew = len > best;
        if (grew) { best = len; bestL = l; }
        return lead + " No letter repeats, so " + q(win()) + " is fine — length " + len +
          (grew ? ", a new best." : "; the best stays " + best + ".");
      }

      push("start", null, str.length
        ? "The window is empty. Press <b>Next</b> and the head steps onto the first letter."
        : "Type some letters above to start.");

      for (r = 0; r < str.length; r++) {
        var c = str.charAt(r);
        seen[c] = (seen[c] || 0) + 1;
        var head = "The head moves to index " + r + " and brings in " + q(c) + ".";
        if (seen[c] === 1) { push("grow", null, clean(head)); continue; }

        push("grow", c, head + " Now " + q(c) + " appears twice, so " + q(win()) + " breaks the rule. " +
          "Growing it further can never fix that (Fact 2), so the head waits and the tail moves.");

        while (seen[c] > 1) {
          var d = str.charAt(l);
          seen[d]--; l++;
          var tail = "The tail drops " + (d === c ? "the older " : "") + q(d) + " from index " + (l - 1) + ".";
          if (seen[c] === 1) { push("shrink", null, clean(tail)); continue; }
          push("shrink", c, tail + (explained ? "" : " Why drop it, when " + q(c) + " is the problem? A window has no gaps: " +
            "to lose the older " + q(c) + ", everything in front of it has to go first.") +
            " " + q(c) + " still appears twice, so the tail keeps going.");
          explained = true;
        }
      }

      if (str.length) {
        r = str.length - 1;
        push("done", null, "The head has reached the end, so every possible ending has been tried. Longest clean window: " +
          q(str.substr(bestL, best)) + ", length " + best + ". The head moved " + str.length + " times and the tail " + l +
          " — " + (str.length + l) + " moves in all, never more than 2 × " + str.length + ".");
      }
      return out;
    }

    function add(cls, col, text) {
      var el = document.createElement("div");
      el.className = cls;
      el.style.gridColumn = String(col + 1);
      el.textContent = text;
      grid.appendChild(el);
      return el;
    }
    function pointer(col, name, moved) {
      var el = add("sw-ptr" + (moved ? " moved" : ""), col, "▲");
      el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(name));
    }
    function chip(text, cls) {
      var el = document.createElement("span");
      el.className = cls;
      el.textContent = text;
      outs.chips.appendChild(el);
    }

    function render() {
      var f = frames[at], n = s.length, i;

      grid.textContent = "";
      grid.style.setProperty("--n", String(Math.max(n, 1)));
      for (i = 0; i < n; i++) {
        var cls = "sw-cell";
        if (i > f.r) cls += " todo";
        else if (i < f.l) cls += (f.kind === "shrink" && i === f.l - 1) ? " out" : " done";
        else cls += (f.dup && s.charAt(i) === f.dup) ? " in dup" : " in";
        add(cls, i, s.charAt(i));
        add("sw-idx", i, String(i));
      }
      if (f.r >= f.l) add("sw-frame", f.l, "").style.gridColumn = (f.l + 1) + " / " + (f.r + 2);
      if (n) {
        if (f.l === f.r) pointer(f.l, "l r", f.kind === "grow" || f.kind === "shrink");
        else {
          pointer(f.l, "l", f.kind === "shrink");
          if (f.r >= 0) pointer(f.r, "r", f.kind === "grow");
        }
      }

      var label = { start: "Ready", grow: "Head moves · r = " + f.r, shrink: "Tail moves · l = " + f.l, done: "Finished" }[f.kind];
      say.innerHTML = '<span class="k ' + f.kind + '">' +
        (frames.length > 1 ? "Step " + at + " of " + (frames.length - 1) + " · " : "") + esc(label) + "</span>" + f.msg;

      outs.chips.textContent = "";
      if (f.r < f.l) chip("empty", "tag");
      else {
        chip(f.dup ? "broken" : "fine", f.dup ? "tag b" : "tag g");
        var order = [], cnt = Object.create(null);
        for (i = f.l; i <= f.r; i++) {
          var ch = s.charAt(i);
          if (!cnt[ch]) { cnt[ch] = 0; order.push(ch); }
          cnt[ch]++;
        }
        order.forEach(function (ch) { chip(ch + " ×" + cnt[ch], cnt[ch] > 1 ? "sw-chip bad" : "sw-chip"); });
      }

      outs.best.textContent = f.best ? f.best + "  ·  \"" + s.substr(f.bestL, f.best) + "\"" : "0 — nothing yet";

      outs.tape.textContent = "";
      var heads = 0, tails = 0;
      for (i = 1; i <= at; i++) {
        var k = frames[i].kind;
        if (k !== "grow" && k !== "shrink") continue;
        var m = document.createElement("i");
        m.className = (k === "grow" ? "r" : "l") + (i === at ? " now" : "");
        m.textContent = k === "grow" ? "r" : "l";
        outs.tape.appendChild(m);
        if (k === "grow") heads++; else tails++;
      }
      outs.moves.textContent = n ? "head " + heads + " + tail " + tails + " = " + (heads + tails) +
        "  ·  never more than 2n = " + (2 * n) : "";

      btns.back.disabled = btns.reset.disabled = at === 0;
      btns.next.disabled = at >= frames.length - 1;
      btns.play.disabled = frames.length < 2;
    }

    function step(d) { at = Math.max(0, Math.min(frames.length - 1, at + d)); render(); }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      btns.play.textContent = "Play";
      btns.play.setAttribute("aria-pressed", "false");
    }
    function play() {
      if (at >= frames.length - 1) at = 0;
      btns.play.textContent = "Pause";
      btns.play.setAttribute("aria-pressed", "true");
      step(1);
      timer = setInterval(function () {
        // stop quietly once the slide is navigated away from, or the run is over
        if (!root.offsetParent || at >= frames.length - 1) { stop(); return; }
        step(1);
      }, 1800);
    }
    function load(v) {
      var cleaned = v.replace(/\s+/g, "").slice(0, 14);
      if (cleaned !== v) input.value = cleaned;
      stop();
      s = cleaned; frames = trace(s); at = 0;
      render();
    }

    btns.next.addEventListener("click", function () { stop(); step(1); });
    btns.back.addEventListener("click", function () { stop(); step(-1); });
    btns.reset.addEventListener("click", function () { stop(); at = 0; render(); });
    btns.play.addEventListener("click", function () { if (timer) stop(); else play(); });
    input.addEventListener("input", function () { load(input.value); });
    load(input.value);
  })();

  /* ---- stream pipeline stepper: one frame per hand-off between stages ---- */
  // Frames follow the JDK's push model: the terminal operation pulls one element and each stage
  // hands it straight on. sorted() holds everything until the source is empty, and findFirst or a
  // full limit stops further pulls. The sequences match peek logs of the same pipelines on JDK 25.
  (function pipelineStepper() {
    var root = document.getElementById("pl-demo");
    if (!root) return;
    var select = root.querySelector("select");
    var input  = root.querySelector("input");
    var board  = root.querySelector(".pl-board");
    var say    = root.querySelector(".sw-say");
    var outs = {}, btns = {};
    root.querySelectorAll("[data-pl-out]").forEach(function (el) { outs[el.getAttribute("data-pl-out")] = el; });
    root.querySelectorAll("button[data-pl]").forEach(function (b) { btns[b.getAttribute("data-pl")] = b; });

    var FILTER = { op: "filter", label: ".filter(s -> s.length() > 3)" };
    var UPPER  = { op: "map", label: ".map(String::toUpperCase)", fn: function (s) { return s.toUpperCase(); } };
    var PLUS1  = { op: "map", label: ".map(n -> n + 1)", fn: function (n) { return n + 1; } };
    var SORTED = { op: "sorted", label: ".sorted()" };
    function limit(n) { return { op: "limit", label: ".limit(" + n + ")", n: n }; }
    var PRESETS = {
      first:   { words: true,  stages: [FILTER, UPPER], term: "findFirst" },
      list:    { words: true,  stages: [FILTER, UPPER], term: "toList" },
      sorted:  { words: true,  stages: [FILTER, SORTED, UPPER, limit(2)], term: "toList" },
      iterate: { words: false, stages: [PLUS1, limit(4)], term: "toList" },
      forever: { words: false, stages: [SORTED, limit(3)], term: "toList", cap: 8 }
    };

    var p, words = [], frames = [], at = 0, timer = null;

    function esc(t) {
      return String(t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
    }
    function q(t) { return "<code>" + esc(t) + "</code>"; }
    function joinAnd(xs) {
      xs = xs.map(q);
      return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
    }
    function times(n, what) { return n + " " + what + (n === 1 ? "" : "s"); }

    function trace() {
      var stages = p.stages.map(function (s) { return { op: s.op, fn: s.fn, n: s.n, seen: 0, buf: [], unused: [] }; });
      var T = stages.length + 1;                     // row 0 is the source, row T the terminal
      var src = [], rows = [], result = [], out = [], pulled = 0, found = null, stopped = false, prev = 0;
      for (var r = 0; r <= T; r++) rows.push({ calls: 0, act: [] });

      function snap(active, kind, tag, msg) {
        out.push({ active: active, kind: kind, tag: tag, msg: msg, pulled: pulled, found: found,
          src: src.map(function (c) { return { t: c.t, c: c.c }; }),
          rows: rows.map(function (row) { return { calls: row.calls, act: row.act.slice() }; }),
          result: result.slice() });
      }

      function deliver(i, x) {                       // hand x to row i
        var row = rows[i];
        row.calls++;
        if (i === T) {
          if (p.term === "findFirst") {
            found = x; stopped = true;
            row.act = [{ t: "Optional[" + x + "]", c: "pass" }];
            snap(i, "grow", "findFirst has its answer", "<code>findFirst()</code> has its answer, " + q(x) +
              ", so it tells the pipeline to stop. The source will not be asked for anything else.");
          } else {
            result.push(x);
            row.act = result.map(function (v) { return { t: v, c: "pass" }; });
            snap(i, "grow", "toList adds it", "<code>toList()</code> adds " + q(x) + ". Only now is the source asked for another element.");
          }
          return;
        }
        var s = stages[i - 1];
        if (s.op === "filter") {
          var ok = x.length > 3;
          row.act = [{ t: x, c: ok ? "pass" : "drop" }];
          snap(i, "grow", ok ? "filter passes it" : "filter drops it", ok
            ? q(x) + " has " + x.length + " letters, so <code>filter</code> passes it straight on."
            : q(x) + " has " + times(x.length, "letter") + ", not more than 3, so <code>filter</code> drops it. Nothing after the filter ever sees it.");
          if (ok) deliver(i + 1, x);
        } else if (s.op === "map") {
          var y = s.fn(x);
          row.act = [{ t: x }, { t: "→", c: "to" }, { t: y, c: "pass" }];
          snap(i, "grow", "map transforms it", "<code>map</code> turns " + q(x) + " into " + q(y) + " and passes it on.");
          deliver(i + 1, y);
        } else if (s.op === "sorted") {
          s.buf.push(x);
          row.act = s.buf.map(function (v) { return { t: v, c: "held" }; });
          snap(i, "shrink", "sorted() holds it", "<code>sorted()</code> keeps " + q(x) +
            " and passes nothing on. It cannot know which element comes first until it has seen every one.");
        } else {                                      // limit
          s.seen++;
          row.act = [{ t: x, c: "pass" }, { t: s.seen + " of " + s.n, c: "quiet" }];
          snap(i, "grow", "limit passes it", "<code>limit(" + s.n + ")</code> lets " + q(x) + " through: " + s.seen + " of " + s.n + ".");
          deliver(i + 1, x);
          if (s.seen === s.n && !stopped) {
            stopped = true;
            snap(i, "grow", "limit is full", "<code>limit(" + s.n + ")</code> has passed on " + s.n + " elements. From now on it answers " +
              "“stop” whenever the stages above ask whether to continue, so nothing more flows down.");
          }
        }
      }

      if (p.words) src = words.map(function (w) { return { t: w, c: "wait" }; });
      if (p.words && !words.length) {
        snap(-1, "start", "Ready", "Type some words above to start.");
        return out;
      }
      snap(-1, "start", "Ready", "Nothing has run yet: those calls only built the pipeline. Press <b>Next</b> and <code>" +
        p.term + "()</code> starts pulling elements from the source, one at a time.");

      for (var k = 0; !stopped && (p.words ? k < words.length : !p.cap || k < p.cap); k++) {
        src.forEach(function (c) { if (c.c === "now") c.c = "done"; });
        var x, msg;
        if (p.words) {
          x = words[k];
          src[k].c = "now";
          msg = k === 0
            ? "<code>" + p.term + "()</code> asks for an element, and the source hands over " + q(x) +
              ". It goes as far down the pipeline as it can before anything else is read."
            : "The source hands over the next element, " + q(x) + ".";
        } else {
          x = k === 0 ? 1 : prev * 2;
          src.push({ t: String(x), c: "now" });
          msg = k === 0
            ? "<code>" + p.term + "()</code> asks for an element. <code>iterate</code> hands over its seed, " + q(1) + ", without computing anything."
            : "Asked for another element, <code>iterate</code> computes " + q(prev + " * 2 = " + x) + " and hands it over.";
          prev = x;
        }
        pulled++;
        rows[0].calls = pulled;
        snap(0, "grow", "Pull", msg);
        deliver(1, x);
      }
      src.forEach(function (c) { if (c.c === "now") c.c = "done"; });

      // A finite source has run dry: a barrier can finally sort and release what it holds.
      if (p.words && !stopped) {
        stages.forEach(function (s, idx) {
          if (s.op !== "sorted" || stopped || !s.buf.length) return;
          var i = idx + 1, buf = s.buf.slice().sort(), j;
          for (j = 0; j < buf.length && !stopped; j++) {
            rows[i].act = buf.map(function (v, m) { return { t: v, c: m < j ? "done" : m === j ? "now" : "held" }; });
            snap(i, "shrink", j === 0 ? "The source is empty" : "sorted() releases the next", j === 0
              ? "The source is empty. Only now can <code>sorted()</code> sort its " + times(buf.length, "element") +
                " and release the first, " + q(buf[0]) + "."
              : "<code>sorted()</code> releases the next element, " + q(buf[j]) + ".");
            deliver(i + 1, buf[j]);
          }
          s.unused = buf.slice(j);
          rows[i].act = buf.map(function (v, m) { return { t: v, c: m < j ? "done" : "never" }; });
        });
      }

      var unread = src.filter(function (c) { return c.c === "wait"; }).map(function (c) { return c.t; });
      src.forEach(function (c) { if (c.c === "wait") c.c = "never"; });

      if (p.cap) {
        rows[1].act = rows[1].act.concat([{ t: "…", c: "more" }]);
        snap(-1, "shrink", "Never finishes", "…and so on, forever. <code>sorted()</code> is waiting for the end of a stream that has " +
          "no end, so <code>limit(3)</code> never receives a thing. On a real JVM this pipeline made about 46 million pulls in two " +
          "seconds without producing an element, and it ends in <code>OutOfMemoryError</code>. Bound the stream before the " +
          "barrier: <code>limit</code> first, or the three-argument <code>iterate</code>.");
        return out;
      }

      var done;
      if (!p.words) {
        src.push({ t: String(prev * 2), c: "never" });
        done = "Done after " + times(pulled, "pull") + " from an infinite source. The next value, " + q(prev * 2) +
          ", is never even computed: <code>iterate</code> runs its function only when asked for another element.";
      } else if (p.term === "findFirst") {
        if (found === null) {
          rows[T].act = [{ t: "Optional.empty", c: "quiet" }];
          done = "Done. No word has more than 3 letters, so every element was read and <code>findFirst()</code> returns <code>Optional.empty</code>.";
        } else {
          done = "Done after " + times(pulled, "pull") + ". " + (unread.length
            ? joinAnd(unread) + (unread.length === 1 ? " was" : " were") + " never read. That is short-circuiting: <code>findFirst()</code> " +
              "needed one match, and a lazy pipeline does no work that nobody asked for."
            : "The match was the last word, so everything was read: short-circuiting saves work only when the answer comes early.");
        }
      } else if (stages[1].op === "sorted") {
        var unused = stages[1].unused;
        done = unused.length
          ? "Done. <code>filter</code> ran " + times(rows[1].calls, "time") + ", <code>map</code> just " + rows[3].calls +
            ": after the barrier, laziness came back and <code>limit(2)</code> cut the flow short. " + joinAnd(unused) +
            (unused.length === 1 ? " was" : " were") + " sorted but never used."
          : "Done. <code>filter</code> ran on all " + times(rows[1].calls, "word") + " before <code>map</code> ran even once: " +
            "<code>sorted()</code> held everything back until the source was empty.";
      } else {
        done = "Done. Each element went through <code>filter</code>, and through <code>map</code> if it passed, before the next one was read: " +
          times(rows[1].calls, "filter call") + ", " + times(rows[2].calls, "map call") + ", and no intermediate list at any point.";
      }
      snap(-1, "done", "Finished", done);
      return out;
    }

    function chip(parent, t, c) {
      var el = document.createElement("span");
      el.className = "pl-el" + (c ? " " + c : "");
      el.textContent = t;
      parent.appendChild(el);
    }
    function cell(row, cls, text) {
      var el = document.createElement("div");
      el.className = cls;
      el.textContent = text;
      row.appendChild(el);
      return el;
    }

    function render() {
      var f = frames[at], last = at === frames.length - 1;
      var labels = ["Stream." + (p.words ? "of(…)" : "iterate(1, n -> n * 2)")]
        .concat(p.stages.map(function (s) { return s.label; }), ["." + p.term + "()"]);

      board.textContent = "";
      labels.forEach(function (label, i) {
        var row = document.createElement("div");
        row.className = "pl-row" + (i === f.active ? " on" : "");
        cell(row, "pl-op", label);
        cell(row, "pl-n", i === 0 ? (f.pulled ? f.pulled + " pulled" : "") : (f.rows[i].calls ? "×" + f.rows[i].calls : ""));
        var act = cell(row, "pl-act", "");
        (i === 0 ? f.src : f.rows[i].act).forEach(function (it) { chip(act, it.t, it.c); });
        if (i === 0 && !p.words && f.kind !== "done") chip(act, "…", "more");
        board.appendChild(row);
      });

      say.innerHTML = '<span class="k ' + f.kind + '">' +
        (frames.length > 1 ? "Step " + at + " of " + (frames.length - 1) + " · " : "") + esc(f.tag) + "</span>" + f.msg;

      outs.pulled.textContent = p.words ? f.pulled + " of " + words.length : f.pulled + ", from an infinite source";
      outs.calls.textContent = p.stages.map(function (s, k) { return s.op + " ×" + f.rows[k + 1].calls; }).join("  ·  ");
      outs.result.textContent = p.term === "findFirst"
        ? (f.found !== null ? "Optional[" + f.found + "]" : f.kind === "done" ? "Optional.empty" : "nothing yet")
        : (p.cap && last ? "nothing, ever" : "[" + f.result.join(", ") + "]" + (f.kind === "done" ? "" : "  so far"));

      btns.back.disabled = btns.reset.disabled = at === 0;
      btns.next.disabled = last;
      btns.play.disabled = frames.length < 2;
    }

    function step(d) { at = Math.max(0, Math.min(frames.length - 1, at + d)); render(); }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      btns.play.textContent = "Play";
      btns.play.setAttribute("aria-pressed", "false");
    }
    function play() {
      if (at >= frames.length - 1) at = 0;
      btns.play.textContent = "Pause";
      btns.play.setAttribute("aria-pressed", "true");
      step(1);
      timer = setInterval(function () {
        // stop quietly once the slide is navigated away from, or the run is over
        if (!root.offsetParent || at >= frames.length - 1) { stop(); return; }
        step(1);
      }, 1500);
    }
    function load() {
      stop();
      p = PRESETS[select.value] || PRESETS.first;
      input.disabled = !p.words;
      words = input.value.split(/[\s,]+/).filter(Boolean).slice(0, 8).map(function (w) { return w.slice(0, 12); });
      frames = trace(); at = 0;
      render();
    }

    btns.next.addEventListener("click", function () { stop(); step(1); });
    btns.back.addEventListener("click", function () { stop(); step(-1); });
    btns.reset.addEventListener("click", function () { stop(); at = 0; render(); });
    btns.play.addEventListener("click", function () { if (timer) stop(); else play(); });
    select.addEventListener("change", load);
    input.addEventListener("input", load);
    load();
  })();

  /* ---- syntax highlighting ---- */
  try {
    if (window.hljs) {
      window.hljs.configure({ ignoreUnescapedHTML: true });
      document.querySelectorAll("pre code").forEach(function (b) { window.hljs.highlightElement(b); });
    }
  } catch (e) { /* highlighting is decorative; the code still reads */ }

  /* ---- cross-references: interview answers link to the slides that cover them ---- */
  // Links name a slide by data-sec and/or data-slide (its data-title), not by number,
  // so inserting slides never breaks them. The href is filled in here.
  function findSlide(key, sec, title) {
    var d = DECKS[key];
    if (!d) return -1;
    for (var i = 0; i < d.slides.length; i++) {
      var s = d.slides[i];
      if ((!sec || s.getAttribute("data-sec") === sec) &&
          (!title || s.getAttribute("data-title") === title)) return i;
    }
    return -1;
  }
  document.querySelectorAll("a[data-deck]").forEach(function (a) {
    var key = a.getAttribute("data-deck");
    var i = findSlide(key, a.getAttribute("data-sec"), a.getAttribute("data-slide"));
    if (i >= 0) a.setAttribute("href", "#" + DECKS[key].slug + "/" + (i + 1));
  });
  // Before following one, record the current section on this history entry,
  // so Back lands on the question you left rather than the top of the page.
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("#ivroot a[data-deck]") : null;
    var sec = a && a.closest(".ivsec");
    if (sec && sec.id) { try { history.replaceState(null, "", "#" + sec.id); } catch (err) {} }
  });

  /* ---- routing: the hash on load, and Back/Forward afterwards ---- */
  function route(initial) {
    var h = (location.hash || "").replace("#", "");
    var m = /^([a-z]+)\/(\d+)$/.exec(h);
    var key = m && DECK_KEYS.filter(function (k) { return DECKS[k].slug === m[1]; })[0];
    if (key) {
      DECKS[key].cur = Math.max(0, parseInt(m[2], 10) - 1);
      setView(key, true);
      return;
    }
    var target = h && h !== "interview" ? document.getElementById(h) : null;
    if (h === "interview" || (target && ivroot.contains(target))) {
      // Already on the interview page: an in-page anchor, which the browser scrolls to itself.
      if (view === "iv" && !initial) return;
      setView("iv", true);
      if (target) target.scrollIntoView();
      return;
    }
    if (initial) setView("deck", true);
  }
  window.addEventListener("hashchange", function () { route(false); });
  route(true);
  // The web fonts arrive after the first layout and widen the tab labels, so measure again.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(revealTab);
})();
