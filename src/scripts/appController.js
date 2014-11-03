require('./search/searchBar');

// dirty hack to get THREE.js into global namespace
var THREE = window.THREE = require('three').THREE;

var appEvents = require('./events');

require('an').controller(AppController);

function AppController($scope, $http) {
  var graphModel = require('./graphModel')($http);
  var scene = require('./scene/scene')(graphModel);
  scene.on('preview', showPreview);

  graphModel.on('labelsReady', function() {
    $scope.allPackagesGraph = graphModel.getGraph();
  });

  appEvents.on('search', scene.search);
  appEvents.on('focusScene', scene.focus);
  appEvents.on('focusOnPackage',scene.focusOnPackage);

  function showPreview(node) {
    $scope.package = node;
    if (!$scope.$$phase) $scope.$digest();
  }
}
