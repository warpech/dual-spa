function parseRoute() {
  if (window.location.pathname.match(/page_1/)) {
    loadPartial('page_1');
  }
  else if (window.location.pathname.match(/page_2/)) {
    loadPartial('page_2');
  }
  else {
    loadPartial('page_1');
  }
}

function loadPartial(name) {
  var oReq = new XMLHttpRequest();
  oReq.onload = function () {
    document.getElementById('view').innerHTML = this.responseText;
  };
  oReq.open("GET", 'partials/' + name + '.html', true);
  oReq.send();
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('mainFile').innerHTML = window.location.pathname;
  parseRoute();
}, false);

document.addEventListener("click", function (event) {
  if (event.target.nodeName === 'A') {
    history.pushState(null, null, event.target.href);
    parseRoute();
    event.preventDefault();
  }
}, false);