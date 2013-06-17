var Site = angular.module('Site', ['animateMeModule', 'xBtnModule']);

/**
 * Site.config
 */
Site.config(function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider
    .when('/page_1', {templateUrl: 'partials/page_1.html'})
    .when('/page_2', {templateUrl: 'partials/page_2.html'})
    .otherwise({redirectTo: '/page_1'});
});

/**
 * AppController
 */
function AppController($scope, $rootScope) {
  $scope.mainFile = window.location.pathname;

  $scope.username = "Marcin";

  $scope.subpage = {
    people: [
      {id: 1, name: {first: 'Joe', last: 'Fabiano'}, gender: 'Male', age: 21, languages: {english: 'Yes', spanish: 'Yes', french: 'No'}, salary: 2000},
      {id: 2, name: {first: 'Fred', last: 'Wecler'}, gender: 'Male', age: 25, languages: {english: 'Yes', spanish: 'No', french: 'No'}, salary: 2500},
      {id: 3, name: {first: 'Steve', last: 'Wilson'}, gender: 'Male', age: 32, languages: {english: 'Yes', spanish: 'No', french: 'No'}, salary: 1700},
      {id: 4, name: {first: 'Maria', last: 'Fernandez'}, gender: 'Female', age: 27, languages: {english: 'No', spanish: 'Yes', french: 'Yes'}, salary: 3000},
      {id: 5, name: {first: 'Pierre', last: 'Barbault'}, gender: 'Male', age: 46, languages: {english: 'Yes', spanish: 'No', french: 'Yes'}, salary: 1450},
      {id: 6, name: {first: 'Nancy', last: 'Moore'}, gender: 'Female', age: 34, languages: {english: 'Yes', spanish: 'No', french: 'No'}, salary: 2300},
      {id: 7, name: {first: 'Barbara', last: 'MacDonald'}, gender: 'Female', age: 19, languages: {english: 'Yes', spanish: 'No', french: 'No'}, salary: 1900},
      {id: 8, name: {first: 'Wilma', last: 'Williams'}, gender: 'Female', age: 33, languages: {english: 'Yes', spanish: 'Yes', french: 'Yes'}, salary: 2400},
      {id: 9, name: {first: 'Sasha', last: 'Silver'}, gender: 'Male', age: 27, languages: {english: 'Yes', spanish: 'No', french: 'Yes'}, salary: 2110},
      {id: 10, name: {first: 'Don', last: 'Pérignon'}, gender: 'Male', age: 42, languages: {english: 'No', spanish: 'No', french: 'Yes'}, salary: 2090},
      {id: 11, name: {first: 'Aaron', last: 'Kinley'}, gender: 'Female', age: 33, languages: {english: 'Yes', spanish: 'Yes', french: 'Yes'}, salary: 2799}
    ],
    settings: {
      isEmptyRow: function (r) {
        var val;
        //c === 1 to ignore id column
        for (var c = 1, clen = this.countCols(); c < clen; c++) {
          val = this.getDataAtCell(r, c);
          if (val !== '' && val !== null && typeof val !== 'undefined') {
            return false;
          }
        }
        return true;
      }
    },
    html: "Loading Ajax..."
  }
}