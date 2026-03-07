const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sdkScript = `
(function() {
  'use strict';

  // ── State ──
  var mouseMovements = [];
  var keyTimings = [];
  var startTime = Date.now();
  var maxMoves = 50;
  var touchPoints = [];

  // ── Mouse tracking ──
  document.addEventListener('mousemove', function(e) {
    if (mouseMovements.length < maxMoves) {
      mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() - startTime });
    }
  });

  // ── Key timing tracking ──
  document.addEventListener('keydown', function(e) {
    if (keyTimings.length < 20) {
      keyTimings.push({ k: e.key.length === 1 ? 1 : 0, t: Date.now() - startTime });
    }
  });

  // ── Touch tracking ──
  document.addEventListener('touchmove', function(e) {
    if (touchPoints.length < maxMoves && e.touches[0]) {
      touchPoints.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() - startTime });
    }
  });

  // ── Browser Fingerprint ──
  function getFingerprint() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 200; canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('NobotFP', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('NobotFP', 4, 17);
    var canvasHash = canvas.toDataURL().slice(-50);

    var screen_res = screen.width + 'x' + screen.height + 'x' + screen.colorDepth;
    var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var lang = navigator.language || '';
    var platform = navigator.platform || '';
    var cores = navigator.hardwareConcurrency || 0;
    var memory = navigator.deviceMemory || 0;
    var webgl = '';
    try {
      var gl = document.createElement('canvas').getContext('webgl');
      if (gl) {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) webgl = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
      }
    } catch(e) {}

    var plugins = [];
    if (navigator.plugins) {
      for (var i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }

    return {
      canvas: canvasHash,
      screen: screen_res,
      tz: timezone,
      lang: lang,
      platform: platform,
      cores: cores,
      memory: memory,
      webgl: webgl.substring(0, 60),
      plugins: plugins.length,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || '0',
      touchSupport: 'ontouchstart' in window
    };
  }

  // ── Cookie check ──
  function checkCookie() {
    var testKey = '__nobot_ck_' + Math.random().toString(36).substring(7);
    try {
      document.cookie = testKey + '=1;path=/;SameSite=Lax';
      var hasCookie = document.cookie.indexOf(testKey) !== -1;
      document.cookie = testKey + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      return hasCookie;
    } catch(e) { return false; }
  }

  // ── Behavior analysis ──
  function analyzeBehavior() {
    var moves = mouseMovements.length > 0 ? mouseMovements : touchPoints;
    if (moves.length < 3) return { isHuman: false, score: 0.1 };

    var reactionTime = Date.now() - startTime;
    if (reactionTime < 400) return { isHuman: false, score: 0.1 };

    if (moves.length >= 3) {
      var totalDeviation = 0;
      for (var i = 1; i < moves.length - 1; i++) {
        var prev = moves[i - 1], curr = moves[i], next = moves[i + 1];
        var dt = (next.t - prev.t) || 1;
        var ratio = (curr.t - prev.t) / dt;
        var expectedX = prev.x + (next.x - prev.x) * ratio;
        var expectedY = prev.y + (next.y - prev.y) * ratio;
        totalDeviation += Math.sqrt(Math.pow(curr.x - expectedX, 2) + Math.pow(curr.y - expectedY, 2));
      }
      var avgDeviation = totalDeviation / (moves.length - 2);
      if (avgDeviation < 0.5 && moves.length > 5) return { isHuman: false, score: 0.2 };
    }

    if (moves.length >= 4) {
      var speeds = [];
      for (var j = 1; j < moves.length; j++) {
        var dx = moves[j].x - moves[j-1].x;
        var dy = moves[j].y - moves[j-1].y;
        var ddt = moves[j].t - moves[j-1].t || 1;
        speeds.push(Math.sqrt(dx*dx + dy*dy) / ddt);
      }
      var avgSpeed = speeds.reduce(function(a,b){return a+b;}, 0) / speeds.length;
      var speedVariance = speeds.reduce(function(a,b){return a + Math.pow(b - avgSpeed, 2);}, 0) / speeds.length;
      if (speedVariance < 0.001 && speeds.length > 5) return { isHuman: false, score: 0.3 };
    }

    var score = 0.7;
    if (moves.length > 10) score += 0.05;
    if (reactionTime > 2000) score += 0.05;
    if (keyTimings.length > 0) score += 0.05;
    if (checkCookie()) score += 0.05;
    return { isHuman: true, score: Math.min(score, 0.99) };
  }

  // ── IMAGE CAPTCHA DATA ──
  var imageCategories = [
    { name: '貓', emoji: '🐱', decoys: ['🐶','🐰','🐻','🐼','🦊','🐸','🐵','🐔'] },
    { name: '花', emoji: '🌸', decoys: ['🌲','🌵','🍀','🍂','🌾','🌿','🎋','🍁'] },
    { name: '車', emoji: '🚗', decoys: ['🚢','✈️','🚀','🏍️','🚲','🛴','🛶','🚁'] },
    { name: '星星', emoji: '⭐', decoys: ['🌙','☀️','🌈','⚡','💧','🔥','❄️','🌊'] },
    { name: '蘋果', emoji: '🍎', decoys: ['🍊','🍋','🍇','🍉','🍓','🥝','🍌','🥭'] },
    { name: '魚', emoji: '🐟', decoys: ['🐦','🦋','🐝','🐞','🦎','🐢','🦀','🐙'] },
  ];

  // ── DISTORTED TEXT CAPTCHA ──
  function generateCaptchaText() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var len = 5 + Math.floor(Math.random() * 2);
    var text = '';
    for (var i = 0; i < len; i++) text += chars[Math.floor(Math.random() * chars.length)];
    return text;
  }

  function drawDistortedText(canvas, text) {
    var ctx = canvas.getContext('2d');
    canvas.width = 220; canvas.height = 70;

    // Background noise
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 220, 70);

    // Random lines
    for (var i = 0; i < 6; i++) {
      ctx.strokeStyle = 'hsl(' + Math.random()*360 + ',50%,40%)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random()*220, Math.random()*70);
      ctx.lineTo(Math.random()*220, Math.random()*70);
      ctx.stroke();
    }

    // Random dots
    for (var d = 0; d < 40; d++) {
      ctx.fillStyle = 'hsl(' + Math.random()*360 + ',30%,50%)';
      ctx.fillRect(Math.random()*220, Math.random()*70, 2, 2);
    }

    // Draw each character with distortion
    var x = 15;
    for (var c = 0; c < text.length; c++) {
      ctx.save();
      ctx.translate(x, 35 + (Math.random()-0.5)*16);
      ctx.rotate((Math.random()-0.5)*0.6);
      var scale = 0.85 + Math.random()*0.35;
      ctx.scale(scale, scale);
      ctx.font = (22 + Math.floor(Math.random()*10)) + 'px ' + ['Arial','Georgia','Courier','Verdana'][Math.floor(Math.random()*4)];
      ctx.fillStyle = 'hsl(' + (200 + Math.random()*120) + ',70%,' + (60+Math.random()*25) + '%)';
      ctx.fillText(text[c], 0, 0);
      ctx.restore();
      x += 28 + Math.floor(Math.random()*10);
    }

    // Wavy distortion overlay lines
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var w = 0; w < 220; w += 2) {
      ctx.lineTo(w, 35 + Math.sin(w*0.05)*12 + (Math.random()-0.5)*4);
    }
    ctx.stroke();
  }

  // ── Widget styles ──
  var baseStyles = 'font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;user-select:none;';

  // ── CHECKBOX Widget ──
  function createCheckboxWidget(container, sitekey) {
    container.style.cssText = 'width:300px;height:74px;border-radius:6px;border:1px solid #334155;background:#1e293b;display:flex;align-items:center;padding:0 12px;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);' + baseStyles;

    var checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.style.cssText = 'width:28px;height:28px;border-radius:4px;border:2px solid #475569;background:#0f172a;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:border-color 0.2s;';
    checkbox.setAttribute('aria-label', 'Verify you are human');
    checkbox.onmouseenter = function() { checkbox.style.borderColor = '#6366f1'; };
    checkbox.onmouseleave = function() { checkbox.style.borderColor = '#475569'; };

    var label = document.createElement('span');
    label.textContent = '我不是機器人';
    label.style.cssText = 'margin-left:12px;font-size:14px;color:#cbd5e1;flex:1;';

    var brand = document.createElement('div');
    brand.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
    brand.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="font-size:9px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Nobot</span>';

    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(brand);

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'nobot-response';
    hiddenInput.value = '';
    container.appendChild(hiddenInput);

    var state = 'idle';

    checkbox.addEventListener('click', function() {
      if (state !== 'idle') return;
      state = 'verifying';
      checkbox.innerHTML = '<div style="width:20px;height:20px;border:2px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:nobot-spin 0.8s linear infinite;"></div>';
      label.textContent = '驗證中...';

      setTimeout(function() {
        var result = analyzeBehavior();
        if (result.isHuman) {
          state = 'verified';
          checkbox.style.borderColor = '#22c55e';
          checkbox.style.cursor = 'default';
          checkbox.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,14 16,6"/></svg>';
          label.textContent = '驗證成功';
          label.style.color = '#22c55e';
          emitToken(container, hiddenInput, sitekey, result.score);
        } else {
          failState(checkbox, label, function() { state = 'idle'; });
        }
      }, 1200);
    });
  }

  // ── IMAGE Widget ──
  function createImageWidget(container, sitekey) {
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #334155;background:#1e293b;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);overflow:hidden;' + baseStyles;

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'nobot-response';
    hiddenInput.value = '';
    container.appendChild(hiddenInput);

    renderImageChallenge(container, sitekey, hiddenInput, 0);
  }

  function renderImageChallenge(container, sitekey, hiddenInput, attempt) {
    // Clear previous content except hidden input
    while (container.firstChild && container.firstChild !== hiddenInput) container.removeChild(container.firstChild);
    if (!container.contains(hiddenInput)) container.appendChild(hiddenInput);

    var cat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
    var targetCount = 2 + Math.floor(Math.random() * 2); // 2-3 targets
    var grid = [];
    for (var t = 0; t < targetCount; t++) grid.push({ emoji: cat.emoji, isTarget: true });
    var decoys = cat.decoys.slice().sort(function() { return Math.random()-0.5; });
    for (var d = 0; d < 9 - targetCount; d++) grid.push({ emoji: decoys[d % decoys.length], isTarget: false });
    grid.sort(function() { return Math.random()-0.5; });

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:12px 16px;background:#6366f1;color:white;display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div><div style="font-size:13px;font-weight:600;">選出所有的「' + cat.name + '」</div><div style="font-size:11px;opacity:0.8;">請點選正確的圖案</div></div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    container.insertBefore(header, hiddenInput);

    // Grid
    var gridEl = document.createElement('div');
    gridEl.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px;';
    var selected = new Set();

    grid.forEach(function(item, idx) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.style.cssText = 'width:100%;aspect-ratio:1;background:#0f172a;border:2px solid transparent;border-radius:6px;font-size:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;';
      cell.textContent = item.emoji;
      cell.addEventListener('click', function() {
        if (selected.has(idx)) { selected.delete(idx); cell.style.borderColor = 'transparent'; cell.style.background = '#0f172a'; }
        else { selected.add(idx); cell.style.borderColor = '#6366f1'; cell.style.background = '#1e1b4b'; }
      });
      gridEl.appendChild(cell);
    });
    container.insertBefore(gridEl, hiddenInput);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #334155;';
    var brandF = document.createElement('span');
    brandF.style.cssText = 'font-size:10px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;';
    brandF.textContent = 'Nobot';

    var verifyBtn = document.createElement('button');
    verifyBtn.type = 'button';
    verifyBtn.textContent = '驗證';
    verifyBtn.style.cssText = 'padding:6px 20px;background:#6366f1;color:white;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s;';
    verifyBtn.onmouseenter = function() { verifyBtn.style.background = '#4f46e5'; };
    verifyBtn.onmouseleave = function() { verifyBtn.style.background = '#6366f1'; };

    verifyBtn.addEventListener('click', function() {
      var correct = true;
      grid.forEach(function(item, idx) {
        if (item.isTarget && !selected.has(idx)) correct = false;
        if (!item.isTarget && selected.has(idx)) correct = false;
      });

      if (correct) {
        var result = analyzeBehavior();
        result.score = Math.max(result.score, 0.8);
        result.isHuman = true;
        // Show success
        container.style.cssText = 'width:320px;height:74px;border-radius:8px;border:1px solid #334155;background:#1e293b;display:flex;align-items:center;padding:0 12px;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);' + baseStyles;
        while (container.firstChild && container.firstChild !== hiddenInput) container.removeChild(container.firstChild);
        var successIcon = document.createElement('div');
        successIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,14 16,6"/></svg>';
        successIcon.style.cssText = 'width:28px;height:28px;border:2px solid #22c55e;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        var successLabel = document.createElement('span');
        successLabel.textContent = '驗證成功';
        successLabel.style.cssText = 'margin-left:12px;font-size:14px;color:#22c55e;flex:1;';
        var successBrand = document.createElement('div');
        successBrand.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
        successBrand.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="font-size:9px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Nobot</span>';
        container.insertBefore(successIcon, hiddenInput);
        container.insertBefore(successLabel, hiddenInput);
        container.appendChild(successBrand);
        emitToken(container, hiddenInput, sitekey, result.score);
      } else {
        if (attempt < 2) {
          renderImageChallenge(container, sitekey, hiddenInput, attempt + 1);
        } else {
          // Failed too many times
          header.style.background = '#ef4444';
          header.innerHTML = '<div style="font-size:13px;font-weight:600;">驗證失敗，請重試</div>';
          setTimeout(function() { renderImageChallenge(container, sitekey, hiddenInput, 0); }, 2000);
        }
      }
    });

    footer.appendChild(brandF);
    footer.appendChild(verifyBtn);
    container.insertBefore(footer, hiddenInput);
  }

  // ── TEXT Widget ──
  function createTextWidget(container, sitekey) {
    container.style.cssText = 'width:320px;border-radius:8px;border:1px solid #334155;background:#1e293b;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);overflow:hidden;' + baseStyles;

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'nobot-response';
    hiddenInput.value = '';
    container.appendChild(hiddenInput);

    renderTextChallenge(container, sitekey, hiddenInput, 0);
  }

  function renderTextChallenge(container, sitekey, hiddenInput, attempt) {
    while (container.firstChild && container.firstChild !== hiddenInput) container.removeChild(container.firstChild);
    if (!container.contains(hiddenInput)) container.appendChild(hiddenInput);

    var answer = generateCaptchaText();

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:10px 16px;background:#6366f1;color:white;display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div style="font-size:13px;font-weight:600;">請輸入圖片中的文字</div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    container.insertBefore(header, hiddenInput);

    // Canvas
    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'padding:12px;display:flex;flex-direction:column;align-items:center;gap:10px;';

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'border-radius:6px;border:1px solid #334155;';
    drawDistortedText(canvas, answer);

    // Refresh button
    var refreshRow = document.createElement('div');
    refreshRow.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;';

    var refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.innerHTML = '↻';
    refreshBtn.title = '換一張';
    refreshBtn.style.cssText = 'width:36px;height:36px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#94a3b8;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;';
    refreshBtn.onmouseenter = function() { refreshBtn.style.borderColor = '#6366f1'; };
    refreshBtn.onmouseleave = function() { refreshBtn.style.borderColor = '#334155'; };
    refreshBtn.addEventListener('click', function() {
      answer = generateCaptchaText();
      drawDistortedText(canvas, answer);
      textInput.value = '';
    });

    var textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = '請輸入上方文字';
    textInput.autocomplete = 'off';
    textInput.style.cssText = 'flex:1;padding:8px 12px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:15px;letter-spacing:3px;font-family:monospace;outline:none;transition:border-color 0.2s;';
    textInput.onfocus = function() { textInput.style.borderColor = '#6366f1'; };
    textInput.onblur = function() { textInput.style.borderColor = '#334155'; };

    refreshRow.appendChild(refreshBtn);
    refreshRow.appendChild(textInput);
    canvasWrap.appendChild(canvas);
    canvasWrap.appendChild(refreshRow);
    container.insertBefore(canvasWrap, hiddenInput);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #334155;';

    var brandF = document.createElement('span');
    brandF.style.cssText = 'font-size:10px;color:#64748b;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;';
    brandF.textContent = 'Nobot';

    var verifyBtn = document.createElement('button');
    verifyBtn.type = 'button';
    verifyBtn.textContent = '驗證';
    verifyBtn.style.cssText = 'padding:6px 20px;background:#6366f1;color:white;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s;';
    verifyBtn.onmouseenter = function() { verifyBtn.style.background = '#4f46e5'; };
    verifyBtn.onmouseleave = function() { verifyBtn.style.background = '#6366f1'; };

    verifyBtn.addEventListener('click', function() {
      if (textInput.value.toUpperCase() === answer.toUpperCase()) {
        var result = analyzeBehavior();
        result.score = Math.max(result.score, 0.8);
        result.isHuman = true;
        // Show success
        container.style.cssText = 'width:320px;height:74px;border-radius:8px;border:1px solid #334155;background:#1e293b;display:flex;align-items:center;padding:0 12px;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);' + baseStyles;
        while (container.firstChild && container.firstChild !== hiddenInput) container.removeChild(container.firstChild);
        var successIcon = document.createElement('div');
        successIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,10 8,14 16,6"/></svg>';
        successIcon.style.cssText = 'width:28px;height:28px;border:2px solid #22c55e;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        var successLabel = document.createElement('span');
        successLabel.textContent = '驗證成功';
        successLabel.style.cssText = 'margin-left:12px;font-size:14px;color:#22c55e;flex:1;';
        var successBrand = document.createElement('div');
        successBrand.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
        successBrand.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="font-size:9px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Nobot</span>';
        container.insertBefore(successIcon, hiddenInput);
        container.insertBefore(successLabel, hiddenInput);
        container.appendChild(successBrand);
        emitToken(container, hiddenInput, sitekey, result.score);
      } else {
        if (attempt < 2) {
          renderTextChallenge(container, sitekey, hiddenInput, attempt + 1);
        } else {
          header.style.background = '#ef4444';
          header.innerHTML = '<div style="font-size:13px;font-weight:600;">驗證失敗，請重試</div>';
          setTimeout(function() { renderTextChallenge(container, sitekey, hiddenInput, 0); }, 2000);
        }
      }
    });

    // Enter key support
    textInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') verifyBtn.click();
    });

    footer.appendChild(brandF);
    footer.appendChild(verifyBtn);
    container.insertBefore(footer, hiddenInput);
  }

  // ── Shared helpers ──
  function emitToken(container, hiddenInput, sitekey, score) {
    var fp = getFingerprint();
    var token = btoa(JSON.stringify({
      siteKey: sitekey,
      timestamp: Date.now(),
      score: score,
      movements: mouseMovements.length,
      fp: fp,
      cookie: checkCookie(),
      keys: keyTimings.length,
      touch: touchPoints.length
    }));
    hiddenInput.value = token;
    var event = new CustomEvent('nobot:verified', { detail: { token: token, score: score } });
    container.dispatchEvent(event);
  }

  function failState(checkbox, label, onReset) {
    checkbox.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
    label.textContent = '驗證失敗，請重試';
    label.style.color = '#ef4444';
    setTimeout(function() {
      checkbox.innerHTML = '';
      checkbox.style.borderColor = '#475569';
      label.textContent = '我不是機器人';
      label.style.color = '#cbd5e1';
      onReset();
    }, 2000);
  }

  // ── CSS ──
  var style = document.createElement('style');
  style.textContent = '@keyframes nobot-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  // ── Init ──
  function init() {
    var widgets = document.querySelectorAll('.nobot-captcha');
    for (var i = 0; i < widgets.length; i++) {
      if (!widgets[i].hasAttribute('data-nobot-rendered')) {
        widgets[i].setAttribute('data-nobot-rendered', 'true');
        var sitekey = widgets[i].getAttribute('data-sitekey');
        var type = widgets[i].getAttribute('data-type') || 'checkbox';
        if (!sitekey) continue;
        if (type === 'image') createImageWidget(widgets[i], sitekey);
        else if (type === 'text') createTextWidget(widgets[i], sitekey);
        else createCheckboxWidget(widgets[i], sitekey);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.nobot = { init: init, analyzeBehavior: analyzeBehavior, getFingerprint: getFingerprint };
})();
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(sdkScript, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
