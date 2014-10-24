var eventify = require('ngraph.events');
var createHitTest = require('./hitTest');
var createUserInputController = require('./userInput');
var createNodeView = require('./nodeView');
var renderLinks = require('./renderLinks');

module.exports = sceneView;

function sceneView(graphModel) {
  var view = init3dView();
  var domElement = view.domElement;
  var graph = graphModel.getGraph();
  var api = eventify({});
  api.search = search;

  var hitTest = createHitTest();
  hitTest.onSelected(function(idx) {
    var node = graph.getNode(idx);
    if (node) {
      showPreview(node);
    }
  });

  var userInputController = createUserInputController(view.getCamera(), domElement);
  userInputController.on('steeringModeChanged', toggleSteeringIndicator);

  view.onrender(hitTest.update);
  view.onrender(userInputController.update);

  var nodeView = renderNodes(view.getScene());
  graphModel.on('nodesReady', nodeView.initialize);
  graphModel.on('linksReady', renderLinks(view.getScene(), userInputController));

  return api;

  function search(pattern) {
    graph.forEachNode(function(node) {
      var isMatch = pattern && node.data && node.data.label && node.data.label.match(pattern);
      if (isMatch) {
        nodeView.setNodeUI(node.id, 0xffffff, 25);
      } else {
        nodeView.setNodeUI(node.id, 0x000000, 15);
      }
    });

    nodeView.refresh();
  }

  function toggleSteeringIndicator(isOn) {
    var steering = document.querySelector('.steering');
    steering.style.display = isOn ? 'none' : 'block';
  }

  function showPreview(node) {
    var dependencies = 0;
    var dependents = 0;
    node.links.forEach(calculateDependents);
    api.fire('preview', {
      name: node.data.label,
      dependencies: dependencies,
      dependents: dependents
    });

    function calculateDependents(link) {
      if (link.fromId === node.id) {
        dependencies += 1;
      } else {
        dependents += 1;
      }
    }
  }
}

function init3dView() {
  var scene = new THREE.Scene();
  scene.sortObjects = false;

  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 0;
  camera.lookAt(new THREE.Vector3(9000, 9000, 9000));
  window.camera = camera;

  var renderCallbacks = [];

  var renderer = new THREE.WebGLRenderer({
    antialias: false
  });
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);

  animate();

  return {
    onrender: onrender,
    getScene: getScene,
    getCamera: getCamera,
    domElement: renderer.domElement
  };

  function onrender(callback) {
    renderCallbacks.push(callback);
  }

  function getScene() {
    return scene;
  }

  function getCamera() {
    return camera;
  }

  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
    for (var i = 0; i < renderCallbacks.length; ++i) {
      renderCallbacks[i](scene, camera);
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}