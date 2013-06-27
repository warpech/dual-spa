(function (global) {

  var obj;

  /**
   * Defines a connection to a remove URL, returns callback to a object that is persistent between browser and server
   * @param remoteUrl
   * @param callback
   */
  function SPA(remoteUrl, callback) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function (event) {
      obj = JSON.parse(event.target.responseText);
      callback(obj);
    }, false);
    oReq.open("GET", remoteUrl, true);
    oReq.send();

    document.body.addEventListener('click', clickHandler);
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
      parseRoute(target.href);
    }
  }

  function parseRoute(href) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function (event) {
      var patches = JSON.parse(event.target.responseText);
      jsonpatch.apply(obj, patches);
    }, false);
    oReq.open("GET", href, true);
    //oReq.setRequestHeader('Accept-Encoding', 'application/json-patch'); //cannot do this in Chrome - http://news.anarchy46.net/2012/06/refused-to-set-unsafe-header.html
    oReq.setRequestHeader('Content-Type', 'application/json-patch'); //cannot do this in Chrome - http://news.anarchy46.net/2012/06/refused-to-set-unsafe-header.html
    oReq.send();
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