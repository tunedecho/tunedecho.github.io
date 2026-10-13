/* Tuned Echo flight: the fork is struck, the camera rises from a Brooklyn skyline
   to an aerial view of New York, pulls back to a spinning dotted Earth, and the
   Earth settles back into the seal's inner circle. One continuous orthographic camera. */
(function (global) {
  'use strict';
  var G = global.TE_GEO, D = Math.PI / 180, EARTH = 6371000;
  var ANCHOR = [-73.992, 40.709];
  var BRAND = ['#d9738f', '#e8915a', '#e2b93b', '#4fae8f', '#4f8fcf', '#8a6fc9'];
  var DUR = 13.4;

  function decode(rs, d) { return rs.map(function (r) { var o = [], x = 0, y = 0; for (var i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; o.push([x / d, y / d]); } return o; }); }
  function vec(lon, lat) { var a = lon * D, b = lat * D, cb = Math.cos(b); return [cb * Math.cos(a), cb * Math.sin(a), Math.sin(b)]; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(a, b, c) { var h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
  function sm(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function pip(p, ring) { var c = false; for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) { var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c; } return c; }
  function hexRgb(h) { h = h.trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, k) { return 'rgb(' + Math.round(lerp(a[0], b[0], k)) + ',' + Math.round(lerp(a[1], b[1], k)) + ',' + Math.round(lerp(a[2], b[2], k)) + ')'; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------- static world, built once ---------- */
  var NYC_LL = decode(G.nyc, 1e4), REGION_LL = decode(G.region, 100);
  var NYC = NYC_LL.map(function (r) { return r.map(function (p) { return vec(p[0], p[1]); }); });
  var REGION = REGION_LL.map(function (r) { return r.map(function (p) { return vec(p[0], p[1]); }); });
  var MAN = -1; NYC_LL.forEach(function (r, i) { if (pip([-73.97, 40.78], r)) MAN = i; });
  function ringAt(ll) { for (var i = 0; i < NYC_LL.length; i++) if (pip(ll, NYC_LL[i])) return i; return -1; }

  var DOTS = []; G.dots.rows.forEach(function (row) { var lat = row[0], n = row[1], runs = row[2]; for (var k = 0; k < runs.length; k += 2) for (var i = runs[k]; i < runs[k] + runs[k + 1]; i++) DOTS.push(vec(-180 + (i + 0.5) * 360 / n, lat)); });

  var KX = Math.cos(ANCHOR[1] * D) * 111320, KY = 110540;
  function toLL(mx, my) { return [ANCHOR[0] + mx / KX, ANCHOR[1] + my / KY]; }
  function toM(lon, lat) { return [(lon - ANCHOR[0]) * KX, (lat - ANCHOR[1]) * KY]; }
  function vm(mx, my) { var ll = toLL(mx, my); return vec(ll[0], ll[1]); }

  // Buildings: denser and taller around Lower Manhattan, Midtown, Downtown Brooklyn, Jersey City, Long Island City
  var CL = [[-74.0115, 40.7085, 430, 850], [-73.9830, 40.7560, 400, 1400], [-73.9895, 40.6930, 210, 650], [-74.0360, 40.7180, 210, 650], [-73.9475, 40.7460, 170, 550], [-73.9700, 40.7900, 110, 900]];
  var CLM = CL.map(function (c) { return toM(c[0], c[1]); });
  var BUILD = (function () {
    var r = rng(20261013), out = [], used = {};
    for (var i = 0; i < 6000 && out.length < 640; i++) {
      var mx, my;
      if (r() < 0.55) { var ci = Math.floor(r() * CL.length), rad = CL[ci][3] * 1.3 * Math.sqrt(r()), a = r() * 6.283; mx = CLM[ci][0] + rad * Math.cos(a); my = CLM[ci][1] + rad * Math.sin(a); }
      else { mx = (r() * 2 - 1) * 7500; my = -5000 + r() * 15000; }
      var ll = toLL(mx, my), ring = ringAt(ll); if (ring < 0) continue;
      var key = Math.round(mx / 85) + ',' + Math.round(my / 85); if (used[key]) continue; used[key] = 1;
      var h = 10 + r() * 28;
      for (var k = 0; k < CL.length; k++) { var dx = mx - CLM[k][0], dy = my - CLM[k][1]; h += CL[k][2] * Math.exp(-(dx * dx + dy * dy) / (CL[k][3] * CL[k][3])) * (0.3 + 0.7 * r()); }
      var s = 34 + r() * 26 + h * 0.05, ang = (ring === MAN ? 29 : 14) * D, ca = Math.cos(ang), sa = Math.sin(ang), cs = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (o) { var ox = o[0] * s / 2, oy = o[1] * s / 2; cs.push(vm(mx + ox * ca + oy * sa, my - ox * sa + oy * ca)); });
      out.push({ c: cs, h: h, col: Math.floor(r() * 6), dn: Math.min(1, Math.hypot(mx, my) / 5000), seed: (r() * 1e9) | 0, lat: ll[1] });
    }
    out.sort(function (a, b) { return b.lat - a.lat; });
    return out;
  })();

  // Streets: Manhattan's 29-degree grid and a looser grid everywhere else
  function grid(center, angDeg, spacing, nOff, half, majorEvery) {
    var a = angDeg * D, u = [Math.sin(a), Math.cos(a)], v = [Math.cos(a), -Math.sin(a)], lines = [];
    for (var k = -nOff; k <= nOff; k++) {
      var o = [center[0] + v[0] * k * spacing, center[1] + v[1] * k * spacing];
      lines.push({ p: o, d: u, half: half, a: vm(o[0] - u[0] * half, o[1] - u[1] * half), b: vm(o[0] + u[0] * half, o[1] + u[1] * half), major: k % majorEvery === 0, off: k * spacing });
    }
    return lines;
  }
  var MC = toM(-73.968, 40.782);
  var STREETS = {
    man: { avenues: grid(MC, 29, 270, 8, 13000, 1), streets: grid(MC, 119, 80, 160, 3000, 10) },
    other: { a: grid([0, 0], 14, 170, 130, 22000, 6), b: grid([0, 0], 104, 170, 130, 22000, 6) }
  };
  var TRAFFIC = (function () {
    var r = rng(77), out = [];
    for (var i = 0; i < 1500; i++) {
      var man = r() < 0.45, L, lim;
      if (man) { var av = r() < 0.4; var set = av ? STREETS.man.avenues : STREETS.man.streets; L = set[Math.floor(r() * set.length)]; lim = L.half; }
      else { var set2 = r() < 0.5 ? STREETS.other.a : STREETS.other.b; do { L = set2[Math.floor(r() * set2.length)]; } while (Math.abs(L.off) > 6500); lim = 6500; }
      out.push({ L: L, man: man, lim: lim, s0: (r() * 2 - 1) * lim, v: (140 + r() * 320) * (r() < 0.5 ? -1 : 1), col: Math.floor(r() * 6) });
    }
    return out;
  })();
  var FERRIES = [[-74.0130, 40.7010, -74.0720, 40.6440, 0.11, 0.0], [-74.0055, 40.7045, -73.9680, 40.7350, 0.16, 0.4], [-74.0195, 40.7150, -74.0300, 40.7360, 0.22, 1.1], [-74.0140, 40.7000, -74.0450, 40.6890, 0.19, 0.7]];
  var CITIES = [[-0.13, 51.5], [-46.6, -23.5], [-118.2, 34.05], [-99.1, 19.4], [-87.6, 41.9], [-79.4, 43.7], [-123.1, 49.3], [-157.9, 21.3], [-77.0, -12.0], [-74.1, 4.7], [-58.4, -34.6], [-122.4, 37.8], [3.38, 6.52], [-95.4, 29.8], [-149.9, 61.2], [-21.9, 64.1], [-70.6, -33.4], [-9.1, 38.7]]
    .map(function (c, i) { return { v: vec(c[0], c[1]), col: i % 6, launch: 8.0 + i * 0.17 }; });
  var NYCV = vec(ANCHOR[0], ANCHOR[1]);
  var PULSES = (function () { var r = rng(5), out = []; for (var i = 0; i < 26; i++) { var b = BUILD[Math.floor(r() * BUILD.length)]; out.push({ v: b.c[0], t0: 3.6 + r() * 3.0, col: Math.floor(r() * 6) }); } return out; })();

  var NIGHT = { bg: [16, 20, 26], cream: [246, 242, 234] };

  /* ---------- a flight bound to one stage ---------- */
  function Flight(stage, opts) {
    this.stage = stage; this.mode = opts.mode || 'wide';
    this.canvas = opts.canvas || stage.querySelector('canvas.scene');
    this.seal = stage.querySelector('svg.seal');
    this.core = this.seal.querySelector('.core');
    this.disc = this.seal.querySelector('.seal-disc');
    this.ctx = this.canvas.getContext('2d');
    this.t = 0; this.playing = false; this.onframe = opts.onframe || null;
    var self = this;
    this._tick = function (now) { if (!self.playing) return; var t = (now - self._t0) / 1000; if (t >= DUR) { self.playing = false; self.draw(DUR); if (self.onend) self.onend(); return; } self.draw(t); requestAnimationFrame(self._tick); };
    this.colors(); this.resize(); this.draw(0);
  }
  Flight.DUR = DUR;
  Flight.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect(), dpr = Math.min(2, global.devicePixelRatio || 1);
    this.W = r.width; this.H = r.height; this.dpr = dpr;
    this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr);
    var sr = this.seal.getBoundingClientRect(); this.sealR = sr.width / 2;
    this.rIn = this.sealR * 125 / 200;
  };
  Flight.prototype.colors = function () {
    var cs = getComputedStyle(document.documentElement);
    this.ink = hexRgb(cs.getPropertyValue('--ink') || '#1f2329'); this.bg = hexRgb(cs.getPropertyValue('--bg') || '#f6f2ea');
  };
  Flight.prototype.play = function () {
    this.colors(); this.resize();
    this.stage.classList.remove('struck'); void this.stage.offsetWidth; this.stage.classList.add('struck');
    this._t0 = performance.now(); this.playing = true; requestAnimationFrame(this._tick);
  };
  Flight.prototype.stop = function () { this.playing = false; };
  Flight.prototype.seek = function (t) { this.playing = false; this.colors(); this.stage.classList.remove('struck'); this.draw(t); };

  Flight.prototype.draw = function (T) {
    var ctx = this.ctx, W = this.W, H = this.H, dpr = this.dpr, mode = this.mode, night = mode === 'night', lens = mode === 'lens';
    this.t = T; if (this.onframe) this.onframe(T);
    var cx = W / 2, cy = H / 2, rIn = this.rIn, sealR = this.sealR;
    var halfW = lens ? rIn : W / 2, sceneR = lens ? rIn : H / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);

    /* seal choreography */
    var coreA = 1 - sm(0.5, 0.95, T) + sm(12.4, 13.1, T);
    this.core.style.opacity = coreA.toFixed(3);
    if (!lens) {
      this.disc.style.opacity = (1 - sm(0.5, 1.0, T) + sm(12.5, 13.2, T)).toFixed(3);
      this.seal.style.opacity = (1 - 0.7 * sm(1.0, 1.8, T) + 0.7 * sm(11.7, 12.7, T)).toFixed(3);
    }
    if (night) { var nk = sm(0.5, 1.2, T) - sm(12.3, 13.1, T); this.seal.style.color = nk > 0.001 ? mix(this.ink, NIGHT.cream, nk) : ''; }

    /* camera */
    var tilt = 90 * sm(1.9, 3.9, T) * D, sinT = Math.sin(tilt), cosT = Math.cos(tilt);
    var V0 = lens ? 900 : 1600, A0 = V0 / EARTH, A2 = A0 * 3.2;
    var Rg = lens ? rIn * 0.97 : Math.min(W, H) * 0.39, Rend = rIn * 0.97;
    var lnR;
    if (T < 1.9) lnR = Math.log(halfW / A0);
    else if (T < 4.6) lnR = lerp(Math.log(halfW / A0), Math.log(halfW / A2), sm(1.9, 4.6, T));
    else lnR = lerp(Math.log(halfW / A2), Math.log(Rg), sm(4.6, 9.2, T));
    if (T > 11.8) lnR = lerp(Math.log(Rg), Math.log(Rend), sm(11.8, 12.9, T));
    var R = Math.exp(lnR), A = halfW / R, pxm = R / EARTH;
    var lon0 = (ANCHOR[0] - 85 * sm(7.6, 12.8, T)) * D, lat0 = lerp(ANCHOR[1], 18, sm(7.4, 10.2, T)) * D;
    var e = [-Math.sin(lon0), Math.cos(lon0), 0], n = [-Math.sin(lat0) * Math.cos(lon0), -Math.sin(lat0) * Math.sin(lon0), Math.cos(lat0)], c = [Math.cos(lat0) * Math.cos(lon0), Math.cos(lat0) * Math.sin(lon0), Math.sin(lat0)];
    var hor = cy + sceneR * (lens ? 0.42 : 0.36), base = hor + (cy - hor) * sinT;
    function gx(v) { return cx + (v[0] * e[0] + v[1] * e[1] + v[2] * e[2]) * R; }
    function gy(v) { return base - (v[0] * n[0] + v[1] * n[1] + v[2] * n[2]) * R * sinT; }

    /* palette */
    var P = night ? {
      land: mix(NIGHT.bg, NIGHT.cream, 0.07), coast: rgba(NIGHT.cream, 0.22), street: NIGHT.cream, streetA: 0.6,
      side0: mix(NIGHT.bg, NIGHT.cream, 0.10), side1: mix(NIGHT.bg, NIGHT.cream, 0.15), top: mix(NIGHT.bg, NIGHT.cream, 0.20),
      dot: NIGHT.cream, limb: rgba(NIGHT.cream, 0.25), ink: NIGHT.cream, traffic: ['#f6f2ea', '#e2b93b', '#e8915a', '#f6f2ea', '#d9738f', '#e2b93b']
    } : {
      land: mix(this.bg, this.ink, 0.075), coast: rgba(this.ink, 0.30), street: this.ink, streetA: 1,
      side0: mix(this.bg, this.ink, 0.10), side1: mix(this.bg, this.ink, 0.16), top: mix(this.bg, this.ink, 0.23),
      dot: this.ink, limb: rgba(this.ink, 0.28), ink: this.ink, traffic: BRAND
    };

    /* framing */
    ctx.save();
    if (lens) {
      var la = sm(0.55, 0.95, T) * (1 - sm(12.1, 12.9, T)); if (la <= 0) { ctx.restore(); return; }
      ctx.globalAlpha = la; ctx.beginPath(); ctx.arc(cx, cy, rIn, 0, 6.2832); ctx.clip();
      ctx.fillStyle = mix(this.bg, this.ink, 0.0); ctx.fill();
    } else if (night) {
      var pr = lerp(rIn, Math.min(H / 2, W / 2) * 0.985, sm(0.4, 1.4, T)); pr = lerp(pr, rIn, sm(11.9, 12.9, T));
      var pa = sm(0.3, 0.6, T) * (1 - sm(12.9, 13.3, T)); if (pa <= 0) { ctx.restore(); return; }
      ctx.globalAlpha = pa; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, 6.2832); ctx.fillStyle = rgba(NIGHT.bg, 1); ctx.fill(); ctx.clip();
    } else {
      ctx.globalAlpha = sm(0.5, 1.0, T) * (1 - sm(12.9, 13.4, T));
      if (ctx.globalAlpha <= 0) { ctx.restore(); return; }
    }
    var baseAlpha = ctx.globalAlpha;

    /* map layers */
    var nycA = 1 - sm(0.0033, 0.0052, A), regA = sm(0.0026, 0.0045, A) * (1 - sm(0.17, 0.30, A));
    function ringPath(rs, idxFilter) { var p = new Path2D(); for (var i = 0; i < rs.length; i++) { if (idxFilter && !idxFilter(i)) continue; var r = rs[i]; p.moveTo(gx(r[0]), gy(r[0])); for (var j = 1; j < r.length; j++) p.lineTo(gx(r[j]), gy(r[j])); p.closePath(); } return p; }
    if (regA > 0.002) { var rp = ringPath(REGION); ctx.globalAlpha = baseAlpha * regA; ctx.fillStyle = P.land; ctx.fill(rp); ctx.strokeStyle = P.coast; ctx.lineWidth = 0.8; ctx.stroke(rp); }
    if (nycA > 0.002) {
      var all = ringPath(NYC), manP = ringPath(NYC, function (i) { return i === MAN; }), othP = ringPath(NYC, function (i) { return i !== MAN; });
      ctx.globalAlpha = baseAlpha * nycA; ctx.fillStyle = P.land; ctx.fill(all);
      if (sinT > 0.05) { ctx.strokeStyle = P.coast; ctx.lineWidth = 1; ctx.stroke(all); }
      var gate = sm(0.35, 0.9, sinT) * nycA;
      if (gate > 0.01) {
        var self = this;
        var drawGrid = function (lineSets, spacing, clipPath, isMan) {
          ctx.save(); ctx.clip(clipPath);
          lineSets.forEach(function (set) {
            var sp = set.sp * pxm, minorA = sm(3, 10, sp) * 0.10 * set.k, majorA = sm(1.2, 5, set.majorSp * pxm) * 0.20 * set.k;
            [[false, minorA, 0.6], [true, majorA, 1]].forEach(function (pass) {
              if (pass[1] < 0.005) return; var p = new Path2D();
              set.lines.forEach(function (L) { if (pass[0] ? !L.major : L.major) return; p.moveTo(gx(L.a), gy(L.a)); p.lineTo(gx(L.b), gy(L.b)); });
              ctx.globalAlpha = baseAlpha * gate * pass[1] * P.streetA; ctx.strokeStyle = rgba(P.street, 1); ctx.lineWidth = pass[2]; ctx.stroke(p);
            });
          });
          var tA = gate * (1 - sm(0.0016, 0.0034, A));
          if (tA > 0.01) {
            var sz = lens ? 1.7 : 2.5;
            if (night) ctx.globalCompositeOperation = 'lighter';
            TRAFFIC.forEach(function (q) {
              if (q.man !== isMan) return;
              var span = 2 * q.lim, s = -q.lim + (((q.s0 + q.lim + q.v * T) % span) + span) % span;
              var mx = q.L.p[0] + q.L.d[0] * s, my = q.L.p[1] + q.L.d[1] * s, v = vm(mx, my), x = gx(v), y = gy(v);
              if (x < -4 || x > W + 4 || y < -4 || y > H + 4) return;
              ctx.fillStyle = P.traffic[q.col];
              if (night) { ctx.globalAlpha = baseAlpha * tA * 0.22; ctx.fillRect(x - sz * 1.5, y - sz * 1.5, sz * 3, sz * 3); }
              ctx.globalAlpha = baseAlpha * tA; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
            });
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.restore();
        };
        drawGrid([{ lines: STREETS.man.streets, sp: 80, majorSp: 800, k: 1 }, { lines: STREETS.man.avenues, sp: 270, majorSp: 270, k: 1 }], 80, manP, true);
        drawGrid([{ lines: STREETS.other.a, sp: 170, majorSp: 1020, k: 0.5 }, { lines: STREETS.other.b, sp: 170, majorSp: 1020, k: 0.5 }], 170, othP, false);
        // bridges with traffic
        var bA = gate * (1 - sm(0.002, 0.004, A));
        if (bA > 0.01) {
          // ferries with wakes
          FERRIES.forEach(function (f) {
            var ph = (T * f[4] + f[5]) % 2, s = ph < 1 ? ph : 2 - ph, back = ph < 1 ? -1 : 1;
            for (var k = 6; k >= 0; k--) { var ss = Math.min(1, Math.max(0, s + back * k * 0.012)); var v = vec(lerp(f[0], f[2], ss), lerp(f[1], f[3], ss));
              ctx.globalAlpha = baseAlpha * bA * (k === 0 ? 0.9 : 0.35 * (1 - k / 7)); ctx.fillStyle = k === 0 ? rgba(P.ink, 1) : (night ? '#4f8fcf' : '#4f8fcf');
              var r0 = k === 0 ? 1.9 : 1.3; ctx.beginPath(); ctx.arc(gx(v), gy(v), r0, 0, 6.2832); ctx.fill(); }
          });
          // a plane on approach to LaGuardia
          var pk = sm(3.0, 8.0, T); if (pk > 0 && pk < 1) {
            var p0 = [-74.24, 40.56], p1 = [-73.874, 40.776];
            ctx.globalAlpha = baseAlpha * bA * 0.5; ctx.strokeStyle = rgba(P.ink, 1); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath();
            for (var s2 = Math.max(0, pk - 0.25); s2 <= pk; s2 += 0.02) { var v2 = vec(lerp(p0[0], p1[0], s2), lerp(p0[1], p1[1], s2)); if (s2 === Math.max(0, pk - 0.25)) ctx.moveTo(gx(v2), gy(v2)); else ctx.lineTo(gx(v2), gy(v2)); }
            ctx.stroke(); ctx.setLineDash([]);
            var vp = vec(lerp(p0[0], p1[0], pk), lerp(p0[1], p1[1], pk)); ctx.globalAlpha = baseAlpha * bA; ctx.fillStyle = '#d9738f'; ctx.beginPath(); ctx.arc(gx(vp), gy(vp), 2.4, 0, 6.2832); ctx.fill();
          }
        }
      }
    }

    /* echo pulses rising from the city */
    var pA = nycA * sm(0.6, 0.95, sinT) * (1 - sm(0.0025, 0.0045, A));
    if (pA > 0.01) {
      ctx.lineWidth = 1.2;
      PULSES.forEach(function (q) { var k = (T - q.t0) / 1.4; if (k <= 0 || k >= 1) return; var x = gx(q.v), y = gy(q.v);
        ctx.globalAlpha = baseAlpha * pA * (1 - k) * 0.8; ctx.strokeStyle = BRAND[q.col]; ctx.beginPath(); ctx.arc(x, y, 2 + k * (lens ? 12 : 26), 0, 6.2832); ctx.stroke(); });
    }

    /* buildings, painted far to near */
    var bldA = 1 - sm(0.0011, 0.0024, A);
    if (bldA > 0.01) {
      var pxm0 = (halfW / A0) / EARTH, HK = (sceneR * (lens ? 1.15 : 1.0) / 450) / pxm0, winA = 1 - sm(0.3, 0.75, sinT);
      ctx.globalAlpha = baseAlpha * bldA;
      for (var bi = 0; bi < BUILD.length; bi++) {
        var b = BUILD[bi], rise = sm(0.35 + 0.6 * b.dn, 0.95 + 0.6 * b.dn, T); if (rise <= 0) continue;
        var hp = b.h * rise * HK * pxm * cosT, xs = [], ys = [];
        for (var k = 0; k < 4; k++) { xs.push(gx(b.c[k])); ys.push(gy(b.c[k])); }
        var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), maxy = Math.max.apply(null, ys);
        if (maxx < -2 || minx > W + 2 || maxy < -2 || Math.min.apply(null, ys) - hp > H + 2) continue;
        var edges = [0, 1, 2, 3].map(function (k) { return [k, (ys[k] + ys[(k + 1) % 4]) / 2]; }).sort(function (a, b) { return a[1] - b[1]; });
        for (var ei = 0; ei < 4; ei++) { var k0 = edges[ei][0], k1 = (k0 + 1) % 4;
          ctx.fillStyle = (k0 % 2) ? P.side0 : P.side1; ctx.beginPath(); ctx.moveTo(xs[k0], ys[k0]); ctx.lineTo(xs[k1], ys[k1]); ctx.lineTo(xs[k1], ys[k1] - hp); ctx.lineTo(xs[k0], ys[k0] - hp); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = P.top; ctx.beginPath(); ctx.moveTo(xs[0], ys[0] - hp); for (k = 1; k < 4; k++) ctx.lineTo(xs[k], ys[k] - hp); ctx.closePath(); ctx.fill();
        if (winA > 0.02 && rise > 0.5 && maxx - minx > 4) {
          var top = Math.min.apply(null, ys) - hp, light = 0.8 + 1.1 * b.dn;
          ctx.fillStyle = night ? (b.col % 3 === 0 ? '#e2b93b' : b.col % 3 === 1 ? '#e8915a' : '#f6f2ea') : BRAND[b.col];
          for (var wy = top + 3, row = 0; wy < maxy - 3; wy += 6, row++) for (var wx = minx + 2, col = 0; wx < maxx - 3; wx += 4.5, col++) {
            var hh = hash(b.seed, row, col); if (hh > (night ? 0.55 : 0.42)) continue;
            var on = sm(light + hh * 0.6, light + hh * 0.6 + 0.25, T); if (on <= 0) continue;
            ctx.globalAlpha = baseAlpha * bldA * winA * on; ctx.fillRect(wx, wy, 2, 3);
          }
          ctx.globalAlpha = baseAlpha * bldA;
        }
      }
    }

    /* the globe */
    var gA = sm(0.12, 0.26, A) * (1 - sm(lens ? 12.0 : 12.5, lens ? 12.8 : 13.2, T));
    if (gA > 0.002) {
      ctx.globalAlpha = baseAlpha * gA;
      if (!night) { ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = mix(this.bg, this.ink, 0.025); ctx.fill(); }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.strokeStyle = P.limb; ctx.lineWidth = 1; ctx.stroke();
      var spacing = R * 1.5 * D, ds = Math.max(0.9, Math.min(3.4, spacing * 0.5));
      ctx.fillStyle = rgba(P.dot, 1);
      for (var i = 0; i < DOTS.length; i++) {
        var v = DOTS[i], z = v[0] * c[0] + v[1] * c[1] + v[2] * c[2]; if (z <= 0.02) continue;
        var x = cx + (v[0] * e[0] + v[1] * e[1] + v[2] * e[2]) * R, y = cy - (v[0] * n[0] + v[1] * n[1] + v[2] * n[2]) * R;
        if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
        var s = ds * (0.55 + 0.45 * z); ctx.globalAlpha = baseAlpha * gA * (night ? 0.18 + 0.45 * z : 0.16 + 0.5 * z); ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      // echoes: arcs leaving Brooklyn for cities around the world
      var arcA = gA * (1 - sm(11.4, 12.2, T));
      if (arcA > 0.01) {
        CITIES.forEach(function (city) {
          var prog = sm(city.launch, city.launch + 1.2, T); if (prog <= 0) return;
          var a = NYCV, bv = city.v, w = Math.acos(Math.max(-1, Math.min(1, a[0] * bv[0] + a[1] * bv[1] + a[2] * bv[2]))), sw = Math.sin(w) || 1e-6;
          ctx.strokeStyle = BRAND[city.col]; ctx.lineWidth = lens ? 1 : 1.4; ctx.beginPath(); var pen = false, hx = 0, hy = 0, hv = false;
          for (var s = 0; s <= prog + 1e-6; s += 0.025) {
            var k0 = Math.sin((1 - s) * w) / sw, k1 = Math.sin(s * w) / sw, lift = 1 + 0.10 * Math.sin(Math.PI * s) * (0.35 + w / Math.PI);
            var p = [(a[0] * k0 + bv[0] * k1) * lift, (a[1] * k0 + bv[1] * k1) * lift, (a[2] * k0 + bv[2] * k1) * lift];
            var px = (p[0] * e[0] + p[1] * e[1] + p[2] * e[2]), py = (p[0] * n[0] + p[1] * n[1] + p[2] * n[2]), pz = p[0] * c[0] + p[1] * c[1] + p[2] * c[2];
            var vis = pz > 0 || px * px + py * py > 1; var X = cx + px * R, Y = cy - py * R;
            if (vis) { if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); pen = true; hx = X; hy = Y; hv = true; } else { pen = false; hv = false; }
          }
          ctx.globalAlpha = baseAlpha * arcA * 0.85; ctx.stroke();
          if (hv && prog < 1) { ctx.fillStyle = BRAND[city.col]; ctx.beginPath(); ctx.arc(hx, hy, lens ? 1.6 : 2.4, 0, 6.2832); ctx.fill(); }
          if (prog >= 1) { var bz = bv[0] * c[0] + bv[1] * c[1] + bv[2] * c[2]; if (bz > 0) { ctx.fillStyle = BRAND[city.col]; ctx.beginPath(); ctx.arc(cx + (bv[0] * e[0] + bv[1] * e[1] + bv[2] * e[2]) * R, cy - (bv[0] * n[0] + bv[1] * n[1] + bv[2] * n[2]) * R, lens ? 1.5 : 2.2, 0, 6.2832); ctx.fill(); } }
        });
      }
      // Brooklyn marker
      var nz = NYCV[0] * c[0] + NYCV[1] * c[1] + NYCV[2] * c[2];
      if (nz > 0) {
        var nx = cx + (NYCV[0] * e[0] + NYCV[1] * e[1] + NYCV[2] * e[2]) * R, ny = cy - (NYCV[0] * n[0] + NYCV[1] * n[1] + NYCV[2] * n[2]) * R, pulse = (T * 0.9) % 1;
        ctx.globalAlpha = baseAlpha * gA; ctx.fillStyle = '#e2b93b'; ctx.beginPath(); ctx.arc(nx, ny, lens ? 2 : 3, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = baseAlpha * gA * (1 - pulse) * 0.8; ctx.strokeStyle = '#e2b93b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(nx, ny, (lens ? 2 : 3) + pulse * (lens ? 8 : 14), 0, 6.2832); ctx.stroke();
      }
    }
    ctx.restore();
  };

  global.TEFlight = Flight;
})(window);
