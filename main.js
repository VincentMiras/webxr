import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

init();

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  //

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
  const geometry = new THREE.CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random() });
  const mesh = new THREE.Mesh(geometry, material);

  function onSelect() {
    if (reticle.visible) {
      mesh.position.set(0, 0, 0).applyMatrix4(controller.matrixWorld);

      const harrowClone = half_arrow.clone();
      reticle.matrix.decompose(harrowClone.position, new THREE.Quaternion(), new THREE.Vector3());
      harrowClone.lookAt(mesh.position)

      scene.add(harrowClone);
    }
  }


  ////// ARROW ////////////
  let arrow = null
  const loader = new GLTFLoader().setPath('/webxr/assets/models/');
  loader.load('Arrow.glb', (gltf) => {
    arrow = gltf.scene
    arrow.rotation.x -= Math.PI / 2;
  });

  let half_arrow = null
  loader.load('Half_arrow.glb', (gltf) => {
    half_arrow = gltf.scene
    half_arrow.rotation.x -= Math.PI / 2;
  });


  ///// TIRER FELECHE /////////////
  function shootArrow() {

    const arrowClone = arrow.clone();
    arrowClone.position.set(0, 0, - 0.3).applyMatrix4(controller.matrixWorld);
    arrowClone.quaternion.setFromRotationMatrix(controller.matrixWorld);
    scene.add(arrowClone);
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', shootArrow);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function update_arrows() {

}


function hittest(frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then(function (referenceSpace) {
        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
          hitTestSource = source;
        });
      });
      session.addEventListener('end', function () {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
      hitTestSourceRequested = true;
    }
    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }
}
//

function animate(timestamp, frame) {

  hittest(frame)
  renderer.render(scene, camera);
}