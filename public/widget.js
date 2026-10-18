(function() {
  console.log('[SelectBot Widget] Initializing loader v2.0...');

  // 1. Identify this script tag
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i];
      }
    }
    return scripts[scripts.length - 1];
  })();

  if (!scriptTag) {
    console.error('[SelectBot Widget] Initialization Error: Could not locate widget <script> element on page.');
    return;
  }

  // 2. Extract bot deployment ID
  var botId = scriptTag.getAttribute('data-bot-id');
  if (!botId) {
    console.error('[SelectBot Widget] Configuration Error: Missing required "data-bot-id" attribute on script tag.');
    console.info('[SelectBot Widget] Expected syntax: <script src="' + (scriptTag.src || '/widget.js') + '" data-bot-id="dep_lens_light_pub" async></script>');
    return;
  }

  // 3. Resolve SelectBot Engine Host URL
  var hostUrl = '';
  if (scriptTag.src) {
    try {
      var parsed = new URL(scriptTag.src);
      hostUrl = parsed.origin;
    } catch(e) {
      console.warn('[SelectBot Widget] Could not parse script URL:', e);
    }
  }
  if (!hostUrl || hostUrl === 'null' || hostUrl.indexOf('http') !== 0) {
    hostUrl = window.location.origin;
  }

  // Ensure public endpoint is used if ais-dev was configured
  if (hostUrl.indexOf('ais-dev-') !== -1) {
    console.warn('[SelectBot Widget] Notice: Development URL detected. Automatically routing to public production endpoint (ais-pre-).');
    hostUrl = hostUrl.replace('ais-dev-', 'ais-pre-');
  }

  console.log('[SelectBot Widget] Verified host:', hostUrl, '| Deployment ID:', botId);

  // Prevent duplicate mounts
  if (document.getElementById('selectbot-widget-container')) {
    console.log('[SelectBot Widget] Container already active, skipping re-injection.');
    return;
  }

  // 4. Build and inject Launcher + Iframe
  function mountWidget(botData) {
    if (document.getElementById('selectbot-widget-container')) return;

    var container = document.createElement('div');
    container.id = 'selectbot-widget-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;';

    // The chat widget iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'selectbot-frame';
    iframe.src = hostUrl + '/?embed=true&deploymentId=' + encodeURIComponent(botId);
    iframe.title = (botData && botData.businessName) ? (botData.businessName + ' Chat Assistant') : 'SelectBot Chat Assistant';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.style.cssText = 'position:fixed;bottom:96px;right:24px;width:390px;height:620px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);border:none;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);display:none;transition:opacity 0.2s ease, transform 0.2s ease;z-index:999998;pointer-events:auto;background:transparent;';

    // Launcher button
    var brandColor = (botData && botData.appearance && botData.appearance.brandColor) || '#4f46e5';

    var button = document.createElement('button');
    button.id = 'selectbot-toggle';
    button.setAttribute('aria-label', 'Open SelectBot Chat');
    button.style.cssText = 'width:58px;height:58px;border-radius:50%;background-color:' + brandColor + ';color:#ffffff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;outline:none;transition:transform 0.2s ease,box-shadow 0.2s ease;pointer-events:auto;';

    var chatIconSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    var closeIconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    button.innerHTML = chatIconSvg;

    button.onmouseover = function() {
      button.style.transform = 'scale(1.06)';
      button.style.boxShadow = '0 10px 28px rgba(0,0,0,0.28)';
    };
    button.onmouseout = function() {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)';
    };

    var isOpen = false;
    button.onclick = function() {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.style.display = 'block';
        button.innerHTML = closeIconSvg;
        button.setAttribute('aria-label', 'Close SelectBot Chat');
      } else {
        iframe.style.display = 'none';
        button.innerHTML = chatIconSvg;
        button.setAttribute('aria-label', 'Open SelectBot Chat');
      }
    };

    container.appendChild(iframe);
    container.appendChild(button);

    function attach() {
      if (document.body) {
        document.body.appendChild(container);
        console.log('[SelectBot Widget] Chat widget launcher created successfully on page.');
      }
    }

    if (document.body) {
      attach();
    } else {
      window.addEventListener('DOMContentLoaded', attach);
    }
  }

  // 5. Attempt public bot validation with graceful fallback
  var verifyUrl = hostUrl + '/api/public/bot/' + encodeURIComponent(botId);
  fetch(verifyUrl, { method: 'GET', mode: 'cors' })
    .then(function(res) {
      if (!res.ok) {
        return res.json().catch(function() { return {}; }).then(function(errData) {
          throw new Error(errData.error || ('Server responded with HTTP ' + res.status));
        });
      }
      return res.json();
    })
    .then(function(botData) {
      console.log('[SelectBot Widget] Deployment successfully verified for: ' + (botData.businessName || botData.name));
      mountWidget(botData);
    })
    .catch(function(err) {
      console.warn('[SelectBot Widget] Fallback note (' + err.message + '). Mounting widget frame directly.');
      mountWidget(null);
    });
})();
