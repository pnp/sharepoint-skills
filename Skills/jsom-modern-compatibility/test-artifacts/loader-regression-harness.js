function createLoaderHarness(options) {
  var scriptRegistry = new Map();
  var appendedScripts = [];
  var windowObject = {
    location: { origin: 'https://tenant.sharepoint.com' },
    _spPageContextInfo: options.pageInfo,
    SP: options.initialSP || null
  };

  function createScriptElement() {
    return {
      tagName: 'SCRIPT',
      dataset: {},
      listeners: {},
      addEventListener: function(type, handler) {
        this.listeners[type] = handler;
      },
      dispatchEvent: function(type) {
        if (type === 'load' && typeof this.onload === 'function') {
          this.onload();
        }
        if (type === 'error' && typeof this.onerror === 'function') {
          this.onerror();
        }
        if (this.listeners[type]) {
          this.listeners[type]();
        }
      }
    };
  }

  var documentObject = {
    querySelector: function(selector) {
      var match = selector.match(/^script\[src="(.+)"\]$/);
      if (!match) {
        return null;
      }
      return scriptRegistry.get(match[1]) || null;
    },
    createElement: function(tagName) {
      if (tagName !== 'script') {
        throw new Error('Unsupported element: ' + tagName);
      }
      return createScriptElement();
    },
    head: {
      appendChild: function(script) {
        appendedScripts.push(script.src);
        scriptRegistry.set(script.src, script);

        if (options.loadFailures && options.loadFailures.indexOf(script.src) !== -1) {
          script.dispatchEvent('error');
          return;
        }

        if (options.deferLoads && options.deferLoads.indexOf(script.src) !== -1) {
          return;
        }

        if (options.onScriptLoaded) {
          options.onScriptLoaded(script.src, windowObject);
        }

        script.dispatchEvent('load');
      }
    }
  };

  const pendingScriptLoads = new Map();

  function hasRequiredJsomNamespaces() {
    return !!(
      windowObject.SP &&
      windowObject.SP.ClientContext &&
      windowObject.SP.SOD
    );
  }

  function getVerifiedWebAbsoluteUrl() {
    var pageInfo = windowObject._spPageContextInfo;

    if (pageInfo && pageInfo.webAbsoluteUrl) {
      return pageInfo.webAbsoluteUrl.replace(/\/$/, '');
    }

    throw new Error(
      'Unable to determine the current SharePoint web URL. ' +
      'window._spPageContextInfo.webAbsoluteUrl is required on this page.'
    );
  }

  function waitForExistingScript(existing, src) {
    return new Promise(function(resolve, reject) {
      if (existing.dataset.loadState === 'loaded') {
        resolve();
        return;
      }

      if (existing.dataset.loadState === 'failed') {
        reject(new Error('Previously failed: ' + src));
        return;
      }

      function onLoad() {
        existing.dataset.loadState = 'loaded';
        resolve();
      }

      function onError() {
        existing.dataset.loadState = 'failed';
        reject(new Error('Load failed: ' + src));
      }

      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
    });
  }

  function loadScript(src) {
    if (pendingScriptLoads.has(src)) {
      return pendingScriptLoads.get(src);
    }

    var promise = new Promise(function(resolve, reject) {
      var selector = 'script[src="' + src + '"]';
      var existing = documentObject.querySelector(selector);
      var script;

      if (existing) {
        waitForExistingScript(existing, src).then(resolve).catch(reject);
        return;
      }

      script = documentObject.createElement('script');
      script.src = src;
      script.dataset.loadState = 'loading';
      script.onload = function() {
        script.dataset.loadState = 'loaded';
        resolve();
      };
      script.onerror = function() {
        script.dataset.loadState = 'failed';
        reject(new Error('Load failed: ' + src));
      };
      documentObject.head.appendChild(script);
    }).finally(function() {
      pendingScriptLoads.delete(src);
    });

    pendingScriptLoads.set(src, promise);
    return promise;
  }

  async function ensureJSOMLibraries(extraFiles) {
    var siteBase = getVerifiedWebAbsoluteUrl();
    var core = ['init.js', 'MicrosoftAjax.js', 'SP.Runtime.js', 'SP.js'];
    var chain = core.slice(0);
    var i;
    var file;
    var src;
    var hasClassicJsom = hasRequiredJsomNamespaces();
    var failures = [];

    if (extraFiles) {
      for (i = 0; i < extraFiles.length; i++) {
        chain.push(extraFiles[i]);
      }
    }

    for (i = 0; i < chain.length; i++) {
      file = chain[i];
      src = siteBase + '/_layouts/15/' + file;

      if (hasClassicJsom) {
        if (file === 'init.js' || file === 'MicrosoftAjax.js' || file === 'SP.Runtime.js' || file === 'SP.js') {
          continue;
        }
      }

      try {
        await loadScript(src);
      } catch (error) {
        failures.push(file + ' (' + error.message + ')');
      }
    }

    if (failures.length > 0) {
      throw new Error('Required SharePoint JavaScript dependencies failed to load: ' + failures.join(', '));
    }

    if (!hasRequiredJsomNamespaces()) {
      throw new Error('JSOM dependencies did not initialize correctly. window.SP.ClientContext is unavailable.');
    }
  }

  return {
    windowObject: windowObject,
    documentObject: documentObject,
    scriptRegistry: scriptRegistry,
    appendedScripts: appendedScripts,
    ensureJSOMLibraries: ensureJSOMLibraries,
    loadScript: loadScript,
    hasRequiredJsomNamespaces: hasRequiredJsomNamespaces
  };
}

function createReadySP() {
  return {
    ClientContext: function() {},
    SOD: {}
  };
}

async function runRegressionCases() {
  var siteBase = 'https://tenant.sharepoint.com/sites/playground';
  var baseScripts = [
    siteBase + '/_layouts/15/init.js',
    siteBase + '/_layouts/15/MicrosoftAjax.js',
    siteBase + '/_layouts/15/SP.Runtime.js',
    siteBase + '/_layouts/15/SP.js'
  ];
  var results = [];

  async function record(name, test) {
    try {
      var observed = await test();
      results.push({ name: name, result: 'pass', observed: observed });
    } catch (error) {
      results.push({ name: name, result: 'fail', observed: error.message });
    }
  }

  await record('Successful dependency load', async function() {
    var harness = createLoaderHarness({
      pageInfo: { webAbsoluteUrl: siteBase },
      onScriptLoaded: function(src, windowObject) {
        if (src === siteBase + '/_layouts/15/SP.js') {
          windowObject.SP = createReadySP();
        }
      }
    });

    await harness.ensureJSOMLibraries();

    if (!harness.hasRequiredJsomNamespaces()) {
      throw new Error('Required namespaces were not available after load.');
    }

    return 'Loader resolved and required namespaces became available.';
  });

  await record('Required dependency load failure', async function() {
    var harness = createLoaderHarness({
      pageInfo: { webAbsoluteUrl: siteBase },
      loadFailures: [siteBase + '/_layouts/15/SP.js']
    });

    try {
      await harness.ensureJSOMLibraries();
    } catch (error) {
      if (error.message.indexOf('Required SharePoint JavaScript dependencies failed to load') === -1) {
        throw error;
      }
      return 'Loader threw and business logic would not continue.';
    }

    throw new Error('Loader unexpectedly succeeded.');
  });

  await record('Existing in-flight script tag', async function() {
    var harness = createLoaderHarness({
      pageInfo: { webAbsoluteUrl: siteBase }
    });
    var src = siteBase + '/_layouts/15/SP.js';
    var existing = {
      dataset: { loadState: 'loading' },
      listeners: {},
      addEventListener: function(type, handler) {
        this.listeners[type] = handler;
      },
      dispatchEvent: function(type) {
        if (this.listeners[type]) {
          this.listeners[type]();
        }
      }
    };

    harness.scriptRegistry.set(src, existing);
    var promise = harness.loadScript(src);
    harness.windowObject.SP = createReadySP();
    existing.dispatchEvent('load');
    await promise;

    return 'Loader waited for the existing script load event.';
  });

  await record('Existing failed script tag', async function() {
    var harness = createLoaderHarness({
      pageInfo: { webAbsoluteUrl: siteBase }
    });
    var src = siteBase + '/_layouts/15/SP.js';

    harness.scriptRegistry.set(src, {
      dataset: { loadState: 'failed' },
      addEventListener: function() {}
    });

    try {
      await harness.loadScript(src);
    } catch (error) {
      if (error.message !== 'Previously failed: ' + src) {
        throw error;
      }
      return 'Loader rejected clearly for an existing failed script.';
    }

    throw new Error('Existing failed script unexpectedly resolved.');
  });

  await record('Concurrent calls for the same script', async function() {
    var harness = createLoaderHarness({
      pageInfo: { webAbsoluteUrl: siteBase },
      deferLoads: [baseScripts[0]]
    });
    var first = harness.loadScript(baseScripts[0]);
    var second = harness.loadScript(baseScripts[0]);

    if (first !== second) {
      throw new Error('Concurrent calls did not reuse the same promise.');
    }

    if (harness.appendedScripts.length !== 1) {
      throw new Error('Concurrent calls appended duplicate script tags.');
    }

    harness.scriptRegistry.get(baseScripts[0]).dispatchEvent('load');
    await Promise.all([first, second]);

    return 'Shared in-flight promise prevented duplicate loads.';
  });

  await record('Modern page without _spPageContextInfo.webAbsoluteUrl', async function() {
    var harness = createLoaderHarness({
      pageInfo: null
    });

    try {
      await harness.ensureJSOMLibraries();
    } catch (error) {
      if (error.message.indexOf('Unable to determine the current SharePoint web URL') === -1) {
        throw error;
      }
      return 'Loader failed clearly and did not fall back to tenant root.';
    }

    throw new Error('Loader unexpectedly succeeded without page context info.');
  });

  return results;
}

if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
  runRegressionCases()
    .then(function(results) {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(function(error) {
      console.error(error);
      process.exitCode = 1;
    });
}

if (typeof module !== 'undefined') {
  module.exports = {
    createLoaderHarness: createLoaderHarness,
    runRegressionCases: runRegressionCases
  };
}
