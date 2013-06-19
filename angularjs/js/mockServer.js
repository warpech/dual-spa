function mockServer(scope) {
  var current = 0;
  var names = ["Fred", "Wilma", "Pebbles", "Dino", "Barney", "Betty", "Bamm-Bamm"];

  function changeUsername() {
    var patch = [
      {op: "replace", path: "/username", value: names[current] }
    ];

    for (var i = 0, ilen = scope.subpage.people.length; i < ilen; i++) {
      if (scope.subpage.people[i].name.first) {
        patch.push({op: "replace", path: "/subpage/people/" + i + "/name/first", value: names[current] });
      }
    }

    jsonpatch.apply(scope, patch);
    if (!scope.$$phase) {
      scope.$apply();
    }
  }

  setInterval(function () {
    current++;
    if (current === names.length) {
      current = 0;
    }
    changeUsername()
  }, 2000);

  changeUsername()
}