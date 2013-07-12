var app = angular.module('MyApp', ['ngPartial', 'animateMeModule', 'xBtnModule', 'uiHandsontable']);

/**
 * AppController
 */
function AppController($scope) {
  $scope.mainFile = window.location.pathname;

  var spa = new SPA(window.location.href, function (obj) {
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        $scope[i] = obj[i];
      }
      $scope.$apply();
    }
  });
  spa.onRemoteChange = function() {
    $scope.$apply();
  };
}