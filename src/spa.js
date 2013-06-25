/**
 * Defines a connection to a remove URL, returns callback to a object that is persistent between browser and server
 * @param remoteUrl
 * @param callback
 */
function SPA(remoteUrl, callback) {
  var oReq = new XMLHttpRequest();
  oReq.onload = function () {
    //this.responseText;
    callback({});
  };
  oReq.onerror = function () {
    //this.responseText;
    callback({});
  };
  oReq.open("GET", remoteUrl, true);
  oReq.send();
}