import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arrows = [];
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


  function onSelect() {
    if (reticle.visible) {
      const mesh = new THREE.Mesh(geometry, material);
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


  /////////////// TIRER FELECHE //////////////////
  function shootArrow() {
    const arrowClone = arrow.clone();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const vector = new THREE.Vector3(
      (centerX / width) * 2 - 1,
      -(centerY / height) * 2 + 1,
      0.5
    );

    vector.unproject(camera);

    const direction = vector.sub(camera.position).normalize();

    arrowClone.position.copy(camera.position);
    arrowClone.lookAt(camera.position.clone().add(direction));

    const impulse = 0.7;
    const velocity = direction.multiplyScalar(impulse);
    arrowClone.userData.velocity = velocity;


    arrowClone.userData.distmax = 10
    if (reticle.visible = true) {
      const reticlePosition = new THREE.Vector3().setFromMatrixPosition(reticle.matrixWorld);
      const distanceToReticle = camera.position.distanceTo(reticlePosition);
      arrowClone.userData.distmax = distanceToReticle;
    }

    scene.add(arrowClone);
    arrows.push(arrowClone);
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


function updateArrows() {
  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i];
    arrow.position.add(arrow.userData.velocity);

    if (arrow.position.distanceTo(controller.position) > arrow.userData.distmax) {
      scene.remove(arrow);
      arrows.splice(i, 1);
      i--;
    }
  }
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

function animate(timestamp, frame) {

  hittest(frame)
  updateArrows()
  renderer.render(scene, camera);

}