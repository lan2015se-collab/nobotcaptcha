// NobotCAPTCHA SDK — auto-updating widget script
// Served fresh on every request (no cache) so all customer sites get the latest version instantly.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SDK_VERSION = "2.1.0";
const SDK_BUILT_AT = new Date().toISOString();

const sdkScript = `/* NobotCAPTCHA SDK v${SDK_VERSION} — built ${SDK_BUILT_AT} */
(function() {
  'use strict';

  // ── Endpoints auto-derived from script src ──
  var ORIGIN = (function() {
    var s = document.querySelectorAll('script[src*="functions/v1/sdk"]');
    if (s.length) {
      var src = s[s.length - 1].src;
      return src.split('/functions/v1/sdk')[0];
    }
    return '';
  })();
  var POW_URL = ORIGIN + '/functions/v1/pow';
  var NOTIFY_URL = ORIGIN + '/functions/v1/notify-failure';
  var CAPTCHA_URL = ORIGIN + '/functions/v1/generate-captcha';
  var MCC_URL = ORIGIN + '/functions/v1/manual-passcode';

  // ── State trackers (used for telemetry only) ──
  var mouseMovements = [], keyTimings = [], touchPoints = [], startTime = Date.now();
  document.addEventListener('mousemove', function(e) {
    if (mouseMovements.length < 50) mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() - startTime });
  });
  document.addEventListener('keydown', function(e) {
    if (keyTimings.length < 20) keyTimings.push({ t: Date.now() - startTime });
  });
  document.addEventListener('touchmove', function(e) {
    if (touchPoints.length < 50 && e.touches[0]) touchPoints.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() - startTime });
  });

  // ── Crypto helper ──
  function sha256Hex(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(buf) {
      return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function solvePoW(salt, difficulty, onTick) {
    var prefix = '';
    for (var i = 0; i < difficulty; i++) prefix += '0';
    var nonce = 0, MAX = 5000000;
    function step() {
      return sha256Hex(salt + nonce).then(function(h) {
        if (h.indexOf(prefix) === 0) return nonce;
        nonce++;
        if (nonce >= MAX) throw new Error('pow-timeout');
        if (onTick && nonce % 16 === 0) {
          onTick(Math.min(95, Math.round(nonce / Math.pow(16, difficulty) * 100)));
          return new Promise(function(r) { setTimeout(function() { r(step()); }, 0); });
        }
        return step();
      });
    }
    return step();
  }

  function notifyFailure(sitekey) {
    try {
      fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteKey: sitekey, domain: location.hostname })
      });
    } catch(e) {}
  }

  // ── Outage fallback: shown when our backend itself is unreachable ──
  function showOutageFallback(container, sitekey) {
    // notify the owner (apology email)
    try {
      fetch(MCC_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger-outage', siteKey: sitekey })
      });
    } catch(e) {}

    // fetch error_email to display
    var emailPromise = fetch(MCC_URL + '?siteKey=' + encodeURIComponent(sitekey))
      .then(function(r) { return r.json(); }).catch(function() { return {}; });

    // clear container, white card UI
    while (container.firstChild) container.removeChild(container.firstChild);
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #fde68a;background:#fffbeb;padding:14px;' + BASE_STYLE;

    var title = document.createElement('div');
    title.style.cssText = 'font-size:13px;font-weight:600;color:#92400e;margin-bottom:6px;';
    title.textContent = 'NobotCAPTCHA 暫時離線或無效的 API';
    container.appendChild(title);

    var desc = document.createElement('div');
    desc.style.cssText = 'font-size:12px;color:#78350f;line-height:1.5;margin-bottom:10px;';
    desc.textContent = '需要繼續請發送電子郵件，並在下方輸入一次性通關碼：';
    container.appendChild(desc);

    var emailLine = document.createElement('a');
    emailLine.style.cssText = 'display:block;font-size:13px;font-weight:600;color:#6366f1;text-decoration:none;margin-bottom:10px;word-break:break-all;';
    emailLine.textContent = '載入中…';
    container.appendChild(emailLine);

    emailPromise.then(function(d) {
      var em = d && d.error_email;
      if (em) {
        emailLine.textContent = em;
        emailLine.href = 'mailto:' + em + '?subject=' + encodeURIComponent('索取通關碼 - ' + location.hostname);
      } else {
        emailLine.textContent = '（站長未設定通知信箱）';
        emailLine.removeAttribute('href');
      }
    });

    var hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.name = 'nobot-response'; hidden.value = '';
    container.appendChild(hidden);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;';
    var input = document.createElement('input');
    input.type = 'text'; input.placeholder = '輸入通關碼'; input.autocomplete = 'off';
    input.style.cssText = 'flex:1;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;outline:none;';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = '驗證';
    btn.style.cssText = 'padding:8px 14px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;';
    row.appendChild(input); row.appendChild(btn);
    container.appendChild(row);

    var msg = document.createElement('div');
    msg.style.cssText = 'margin-top:8px;font-size:12px;min-height:16px;';
    container.appendChild(msg);

    var footer = document.createElement('div');
    footer.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #fde68a;text-align:center;font-size:10px;letter-spacing:.08em;color:#a16207;';
    footer.textContent = 'Powered By NobotCAPTCHA';
    container.appendChild(footer);

    btn.addEventListener('click', function() {
      var code = (input.value || '').trim().toUpperCase();
      if (!code) return;
      btn.disabled = true; msg.style.color = '#6b7280'; msg.textContent = '驗證中…';
      fetch(MCC_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', siteKey: sitekey, code: code })
      }).then(function(r) { return r.json(); }).then(function(v) {
        btn.disabled = false;
        if (v && v.ok) {
          hidden.value = v.token;
          msg.style.color = '#16a34a'; msg.textContent = '✓ 驗證成功';
          container.dispatchEvent(new CustomEvent('nobot:verified', { detail: { token: v.token } }));
        } else {
          var map = { invalid: '通關碼錯誤', used: '此通關碼已使用', expired: '通關碼已過期' };
          msg.style.color = '#dc2626'; msg.textContent = '✗ ' + (map[v && v.error] || '驗證失敗');
        }
      }).catch(function() {
        btn.disabled = false;
        msg.style.color = '#dc2626'; msg.textContent = '✗ 網路錯誤';
      });
    });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') btn.click(); });
  }

  // ── Styles (white theme to match dashboard) ──
  var BASE_STYLE = "font-family:'Space Grotesk',-apple-system,system-ui,sans-serif;user-select:none;";

  // ── Shared footer: "回報錯誤" mailto button ──
  function makeFooter(style) {
    var f = document.createElement('div');
    f.style.cssText = (style || 'margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6;text-align:center;');
    var a = document.createElement('a');
    a.href = 'mailto:aicoding2025tw@gmail.com?subject=' + encodeURIComponent('NobotCAPTCHA 錯誤回報 - ' + location.hostname);
    a.textContent = '回報錯誤';
    a.style.cssText = 'font-size:10px;letter-spacing:.08em;color:#9ca3af;text-decoration:none;cursor:pointer;background:none;border:none;padding:0;';
    a.onmouseenter = function() { a.style.color = '#6b7280'; };
    a.onmouseleave = function() { a.style.color = '#9ca3af'; };
    f.appendChild(a);
    return f;
  }

  // ── CHECKBOX widget (server-verified PoW) ──
  function createCheckboxWidget(container, sitekey, level) {
    container.style.cssText = 'width:300px;border-radius:6px;border:1px solid #e5e7eb;background:#ffffff;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);' + BASE_STYLE;
    var hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.name = 'nobot-response'; hidden.value = '';
    container.appendChild(hidden);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;';

    var box = document.createElement('button');
    box.type = 'button';
    box.style.cssText = 'width:28px;height:28px;border-radius:4px;border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:border-color .2s;';
    box.onmouseenter = function() { if (state === 'idle') box.style.borderColor = '#6366f1'; };
    box.onmouseleave = function() { if (state === 'idle') box.style.borderColor = '#d1d5db'; };

    var label = document.createElement('span');
    label.textContent = '我不是機器人';
    label.style.cssText = 'margin-left:12px;font-size:14px;color:#1f2937;flex:1;';

    row.appendChild(box); row.appendChild(label);

    var footer = makeFooter();
    container.insertBefore(row, hidden);
    container.insertBefore(footer, hidden);

    var state = 'idle', failCount = 0, lockUntil = 0;

    function showSpinner() {
      box.innerHTML = '<div style="width:16px;height:16px;box-sizing:border-box;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:nobot-spin .8s linear infinite;flex-shrink:0;"></div>';
    }
    function showCheck() {
      box.style.borderColor = '#22c55e';
      box.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,14 16,6"/></svg>';
    }
    function showCross(color) {
      box.style.borderColor = color;
      box.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
    }
    function reset() {
      state = 'idle';
      box.style.borderColor = '#d1d5db';
      box.innerHTML = '';
      label.textContent = '我不是機器人';
      label.style.color = '#1f2937';
    }
    function startLock() {
      var remaining = 60;
      lockUntil = Date.now() + 60000;
      state = 'locked';
      showCross('#ef4444');
      label.style.color = '#dc2626';
      label.textContent = '錯誤太多次，請 ' + remaining + ' 秒後再試';
      var t = setInterval(function() {
        remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining <= 0) { clearInterval(t); failCount = 0; reset(); return; }
        label.textContent = '錯誤太多次，請 ' + remaining + ' 秒後再試';
      }, 500);
    }

    box.addEventListener('click', function() {
      if (state !== 'idle') return;
      state = 'verifying';
      showSpinner();
      label.textContent = '驗證中…';

      fetch(POW_URL + '?level=' + encodeURIComponent(level || 'medium'))
        .then(function(r) { if (!r.ok) throw new Error('SERVICE_DOWN'); return r.json(); })
        .then(function(ch) {
          return solvePoW(ch.salt, ch.difficulty).then(function(nonce) {
            return fetch(POW_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ salt: ch.salt, ts: ch.ts, difficulty: ch.difficulty, sig: ch.sig, nonce: nonce })
            }).then(function(r) {
              if (!r.ok && r.status >= 500) throw new Error('SERVICE_DOWN');
              return r;
            });
          });
        })
        .then(function(r) { return r.json(); })
        .then(function(v) {
          if (!v || !v.ok) throw new Error(v && v.error || 'verify');
          state = 'verified';
          showCheck();
          label.textContent = '驗證成功';
          label.style.color = '#16a34a';
          hidden.value = v.token;
          container.dispatchEvent(new CustomEvent('nobot:verified', { detail: { token: v.token } }));
        })
        .catch(function(err) {
          if (err && err.message === 'SERVICE_DOWN') {
            showOutageFallback(container, sitekey);
            return;
          }
          failCount++;
          if (failCount >= 5) {
            notifyFailure(sitekey);
            startLock();
          } else {
            state = 'failed';
            showCross('#ef4444');
            label.style.color = '#dc2626';
            label.textContent = '驗證失敗，請重試';
            setTimeout(reset, 1800);
          }
        });
    });
  }

  // ── IMAGE widget (3x3 grid, AI-generated when available) ──
  function createImageWidget(container, sitekey) {
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;' + BASE_STYLE;
    var hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.name = 'nobot-response'; hidden.value = '';
    container.appendChild(hidden);
    renderImage(container, sitekey, hidden, 0, 0);
  }
  function renderImage(container, sitekey, hidden, attempt, failTotal) {
    while (container.firstChild && container.firstChild !== hidden) container.removeChild(container.firstChild);
    var loading = document.createElement('div');
    loading.style.cssText = 'padding:40px;text-align:center;';
    loading.innerHTML = '<div style="width:28px;height:28px;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:nobot-spin .8s linear infinite;margin:0 auto 8px;"></div><div style="font-size:12px;color:#6b7280;">載入中…</div>';
    container.insertBefore(loading, hidden);

    fetch(CAPTCHA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'image' }) })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d || !d.image) throw new Error('no-img');
        container.removeChild(loading);
        buildImageUI(container, sitekey, hidden, d, attempt, failTotal);
      })
      .catch(function() {
        showOutageFallback(container, sitekey);
      });
  }
  function buildImageUI(container, sitekey, hidden, data, attempt, failTotal) {
    var header = document.createElement('div');
    header.style.cssText = 'padding:12px 16px;background:#6366f1;color:#fff;';
    header.innerHTML = '<div style="font-size:13px;font-weight:600;">選出所有的「' + data.label + '」</div><div style="font-size:11px;opacity:.85;">請點選正確的圖片</div>';
    container.insertBefore(header, hidden);

    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;';
    var img = document.createElement('img');
    img.src = data.image;
    img.style.cssText = 'width:100%;display:block;aspect-ratio:1;object-fit:cover;';
    wrap.appendChild(img);

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);';
    var selected = {}, targets = {};
    (data.targets || []).forEach(function(t) { targets[t] = true; });
    for (var i = 0; i < 9; i++) (function(idx) {
      var c = document.createElement('button');
      c.type = 'button';
      c.style.cssText = 'border:2px solid transparent;background:transparent;cursor:pointer;transition:all .15s;';
      c.addEventListener('click', function() {
        if (selected[idx]) { delete selected[idx]; c.style.borderColor = 'transparent'; c.style.background = 'transparent'; }
        else { selected[idx] = true; c.style.borderColor = '#6366f1'; c.style.background = 'rgba(99,102,241,0.35)'; }
      });
      overlay.appendChild(c);
    })(i);
    wrap.appendChild(overlay);
    container.insertBefore(wrap, hidden);

    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f3f4f6;';
    var brand = document.createElement('span');
    brand.style.cssText = 'font-size:10px;color:#9ca3af;letter-spacing:.08em;';
    brand.textContent = 'Powered By NobotCAPTCHA';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = '驗證';
    btn.style.cssText = 'padding:6px 18px;background:#6366f1;color:#fff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;';
    btn.addEventListener('click', function() {
      var ok = true;
      for (var k = 0; k < 9; k++) if (!!targets[k] !== !!selected[k]) { ok = false; break; }
      if (ok) {
        showImageSuccess(container, hidden, sitekey);
      } else {
        var nextFail = failTotal + 1;
        if (nextFail >= 5) { notifyFailure(sitekey); showLocked(container, hidden); return; }
        renderImage(container, sitekey, hidden, attempt + 1, nextFail);
      }
    });
    footer.appendChild(brand); footer.appendChild(btn);
    container.insertBefore(footer, hidden);
  }
  function showImageSuccess(container, hidden, sitekey) {
    while (container.firstChild && container.firstChild !== hidden) container.removeChild(container.firstChild);
    container.style.cssText = 'width:320px;height:74px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;display:flex;align-items:center;padding:0 14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);' + BASE_STYLE;
    var icon = document.createElement('div');
    icon.style.cssText = 'width:28px;height:28px;border:2px solid #22c55e;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,14 16,6"/></svg>';
    var lbl = document.createElement('span');
    lbl.style.cssText = 'margin-left:12px;font-size:14px;color:#16a34a;flex:1;';
    lbl.textContent = '驗證成功';
    container.insertBefore(icon, hidden);
    container.insertBefore(lbl, hidden);
    var token = 'img.' + Date.now() + '.' + Math.random().toString(36).slice(2, 10);
    hidden.value = token;
    container.dispatchEvent(new CustomEvent('nobot:verified', { detail: { token: token } }));
  }
  function showLocked(container, hidden) {
    while (container.firstChild && container.firstChild !== hidden) container.removeChild(container.firstChild);
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #fecaca;background:#fff;padding:14px;text-align:center;' + BASE_STYLE;
    var p = document.createElement('div');
    p.style.cssText = 'color:#dc2626;font-size:14px;font-weight:600;';
    p.textContent = '錯誤太多次，請稍後再試';
    container.insertBefore(p, hidden);
  }

  // ── TEXT widget ──
  function createTextWidget(container, sitekey) {
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;' + BASE_STYLE;
    var hidden = document.createElement('input');
    hidden.type = 'hidden'; hidden.name = 'nobot-response'; hidden.value = '';
    container.appendChild(hidden);
    renderText(container, sitekey, hidden, 0);
  }
  function renderText(container, sitekey, hidden, failTotal) {
    while (container.firstChild && container.firstChild !== hidden) container.removeChild(container.firstChild);
    var loading = document.createElement('div');
    loading.style.cssText = 'padding:30px;text-align:center;';
    loading.innerHTML = '<div style="width:24px;height:24px;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:nobot-spin .8s linear infinite;margin:0 auto 8px;"></div><div style="font-size:12px;color:#6b7280;">載入中…</div>';
    container.insertBefore(loading, hidden);
    fetch(CAPTCHA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'text' }) })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d || !d.image) throw new Error('no-img');
        container.removeChild(loading);
        buildTextUI(container, sitekey, hidden, d.image, d.answer, failTotal);
      })
      .catch(function() {
        showOutageFallback(container, sitekey);
      });
  }
  function buildTextUI(container, sitekey, hidden, imageSrc, answer, failTotal) {
    var header = document.createElement('div');
    header.style.cssText = 'padding:10px 16px;background:#6366f1;color:#fff;font-size:13px;font-weight:600;';
    header.textContent = '請輸入圖片中的文字（不分大小寫）';
    container.insertBefore(header, hidden);

    var body = document.createElement('div');
    body.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:10px;align-items:center;';
    var img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'width:220px;height:70px;border-radius:6px;border:1px solid #e5e7eb;object-fit:cover;background:#f9fafb;';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;width:100%;gap:8px;';
    var refresh = document.createElement('button');
    refresh.type = 'button'; refresh.innerHTML = '↻';
    refresh.style.cssText = 'width:36px;height:36px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#6b7280;font-size:18px;cursor:pointer;';
    refresh.addEventListener('click', function() { renderText(container, sitekey, hidden, failTotal); });
    var input = document.createElement('input');
    input.type = 'text'; input.placeholder = '輸入文字'; input.autocomplete = 'off';
    input.style.cssText = 'flex:1;padding:8px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;color:#1f2937;font-size:15px;letter-spacing:3px;font-family:monospace;outline:none;';
    row.appendChild(refresh); row.appendChild(input);
    body.appendChild(img); body.appendChild(row);
    container.insertBefore(body, hidden);

    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f3f4f6;';
    var brand = document.createElement('span');
    brand.style.cssText = 'font-size:10px;color:#9ca3af;letter-spacing:.08em;';
    brand.textContent = 'Powered By NobotCAPTCHA';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = '驗證';
    btn.style.cssText = 'padding:6px 18px;background:#6366f1;color:#fff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;';
    btn.addEventListener('click', function() {
      if ((input.value || '').toUpperCase() === String(answer).toUpperCase()) {
        showImageSuccess(container, hidden, sitekey);
      } else {
        var nf = failTotal + 1;
        if (nf >= 5) { notifyFailure(sitekey); showLocked(container, hidden); return; }
        renderText(container, sitekey, hidden, nf);
      }
    });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') btn.click(); });
    footer.appendChild(brand); footer.appendChild(btn);
    container.insertBefore(footer, hidden);
  }

  // ── CSS keyframes ──
  var st = document.createElement('style');
  st.textContent = '@keyframes nobot-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(st);

  // ── Init ──
  function init() {
    var ws = document.querySelectorAll('.nobot-captcha');
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (w.hasAttribute('data-nobot-rendered')) continue;
      w.setAttribute('data-nobot-rendered', 'true');
      var sk = w.getAttribute('data-sitekey');
      if (!sk) continue;
      var type = w.getAttribute('data-type') || 'checkbox';
      var level = w.getAttribute('data-level') || 'medium';
      if (type === 'image') createImageWidget(w, sk);
      else if (type === 'text') createTextWidget(w, sk);
      else createCheckboxWidget(w, sk, level);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.nobot = { init: init, version: '${SDK_VERSION}' };
})();
`;

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("info") === "1") {
    return new Response(JSON.stringify({
      version: SDK_VERSION,
      built_at: SDK_BUILT_AT,
      size_bytes: sdkScript.length,
      source: sdkScript,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  return new Response(sdkScript, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Nobot-Version": SDK_VERSION,
    },
  });
});
