var Site = angular.module('Site', []);

function AppController ($scope) {
  $scope.mainFile = window.location.pathname;
}

Site.config(function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider
    .when('/page_1', {templateUrl: 'partials/page_1.html'})
    .when('/page_2', {templateUrl: 'partials/page_2.html'})
    .otherwise({redirectTo: '/page_1'});
});