(function (global) {

  var obj;

  /**
   * Defines a connection to a remove URL, returns callback to a object that is persistent between browser and server
   * @param remoteUrl
   * @param callback
   */
  function SPA(remoteUrl, callback) {
    xhr(remoteUrl, 'application/json', null, function (event) {
      obj = JSON.parse(event.target.responseText);
      createObserver(remoteUrl, obj);
      callback(obj);
    });

    document.body.addEventListener('click', clickHandler);
  }

  var lastObserver;

  function createObserver(href, obj) {
    lastObserver = jsonpatch.observe(obj, function (patches) {
      var applyChanges = function (event) {
        var patches = JSON.parse(event.target.responseText);
        if (lastObserver) {
          jsonpatch.unobserve(obj, lastObserver);
          lastObserver = null;
        }
        jsonpatch.apply(obj, patches);
        createObserver(href, obj);
      };

      xhr(href, 'application/json-patch+json', JSON.stringify(patches), applyChanges);
    });
  }

  function isApplicationLink(href) {
    return (href.protocol == window.location.protocol && href.host == window.location.host);
  }

  function clickHandler(event) {
    var target = event.target;
    if (window.spaExternalLink) {
      target = window.spaExternalLink;
      window.spaExternalLink = null;
    }
    if (target.href && isApplicationLink(target)) {
      event.preventDefault();
      history.pushState(null, null, target.href);
      xhr(target.href, 'application/json-patch+json', null, function (event) {
        var patches = JSON.parse(event.target.responseText);
        jsonpatch.apply(obj, patches);
      });
    }
  }

  function xhr(url, accept, data, callback) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', callback, false);
    oReq.open("GET", url, true);
    if (accept) {
      oReq.setRequestHeader('Accept', accept);
    }
    oReq.send(data);
  }

  global.SPA = {
    init: SPA,
    catchExternaLink: function (element) {
      element.addEventListener("click", function (event) {
        window.spaExternalLink = event.target;
      });
    }
  };
})(window);