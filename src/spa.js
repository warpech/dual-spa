(function (global) {

  /**
   * Defines a connection to a remove URL, returns callback to a object that is persistent between browser and server
   * @param remoteUrl
   * @param callback
   */
  function SPA(remoteUrl, callback) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function (event) {
      callback(JSON.parse(event.target.responseText));
    }, false);
    oReq.open("GET", remoteUrl, true);
    oReq.send();

    document.body.addEventListener('click', clickHandler);
  }

  function isApplicationLink(href) {
    return (href.protocol == window.location.protocol && href.host == window.location.host);
  }

  function clickHandler(event) {
    if (event.target.nodeName === 'A' && isApplicationLink(event.target)) {
      event.preventDefault();
      history.pushState(null, null, event.target.href);
      //parseRoute();
    }
  }

  global.SPA = SPA;
})(window);