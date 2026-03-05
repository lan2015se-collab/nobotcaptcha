const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// The complete NobotCAPTCHA client-side SDK
const sdkScript = `
(function() {
  'use strict';

  // ── State ──
  var mouseMovements = [];
  var startTime = Date.now();
  var maxMoves = 50;

  // ── Mouse tracking ──
  document.addEventListener('mousemove', function(e) {
    if (mouseMovements.length < maxMoves) {
      mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() - startTime });
    }
  });

  // ── Behavior analysis ──
  function analyzeBehavior() {
    var moves = mouseMovements;
    if (moves.length < 3) return { isHuman: false, score: 0.1 };

    var reactionTime = Date.now() - startTime;
    if (reactionTime < 400) return { isHuman: false, score: 0.1 };

    // Path linearity check
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

    // Speed variance check
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

    return { isHuman: true, score: 0.9 };
  }

  // ── Widget rendering ──
  function createWidget(container) {
    var sitekey = container.getAttribute('data-sitekey');
    if (!sitekey) return;

    container.style.cssText = 'width:300px;height:74px;border-radius:6px;border:1px solid #334155;background:#1e293b;display:flex;align-items:center;padding:0 12px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;user-select:none;box-shadow:0 4px 24px -4px rgba(0,0,0,0.3);';

    // Checkbox
    var checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.style.cssText = 'width:28px;height:28px;border-radius:4px;border:2px solid #475569;background:#0f172a;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:border-color 0.2s;';
    checkbox.setAttribute('aria-label', 'Verify you are human');
    checkbox.onmouseenter = function() { checkbox.style.borderColor = '#6366f1'; };
    checkbox.onmouseleave = function() { checkbox.style.borderColor = '#475569'; };

    // Label
    var label = document.createElement('span');
    label.textContent = '我不是機器人';
    label.style.cssText = 'margin-left:12px;font-size:14px;color:#cbd5e1;flex:1;';

    // Branding
    var brand = document.createElement('div');
    brand.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
    brand.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span style="font-size:9px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Nobot</span>';

    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(brand);

    var state = 'idle';

    // Hidden input for form submission
    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'nobot-response';
    hiddenInput.value = '';
    container.appendChild(hiddenInput);

    checkbox.addEventListener('click', function() {
      if (state !== 'idle') return;
      state = 'verifying';

      // Spinner
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

          var token = btoa(JSON.stringify({
            siteKey: sitekey,
            timestamp: Date.now(),
            score: result.score,
            movements: mouseMovements.length
          }));
          hiddenInput.value = token;

          // Dispatch custom event
          var event = new CustomEvent('nobot:verified', { detail: { token: token, score: result.score } });
          container.dispatchEvent(event);
        } else {
          state = 'failed';
          checkbox.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>';
          label.textContent = '驗證失敗，請重試';
          label.style.color = '#ef4444';

          setTimeout(function() {
            state = 'idle';
            checkbox.innerHTML = '';
            checkbox.style.borderColor = '#475569';
            label.textContent = '我不是機器人';
            label.style.color = '#cbd5e1';
          }, 2000);
        }
      }, 1500);
    });
  }

  // ── CSS animation ──
  var style = document.createElement('style');
  style.textContent = '@keyframes nobot-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  // ── Init ──
  function init() {
    var widgets = document.querySelectorAll('.nobot-captcha');
    for (var i = 0; i < widgets.length; i++) {
      if (!widgets[i].hasAttribute('data-nobot-rendered')) {
        widgets[i].setAttribute('data-nobot-rendered', 'true');
        createWidget(widgets[i]);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally
  window.nobot = { init: init, analyzeBehavior: analyzeBehavior };
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
