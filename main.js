import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let arrows = [];
let targets = [];
let deathsound = null;
let damagesound = null;
let lives = 15;
let last_shot = Date.now();


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


  /////// AUDIO ////////

  function startAudioContext() {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioLoader = new THREE.AudioLoader();

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    deathsound = new THREE.PositionalAudio(listener);
    audioLoader.load('/webxr/assets/sounds/sk_death.mp3', (buffer) => {
      deathsound.setBuffer(buffer);
      deathsound.setRefDistance(1);
      deathsound.setVolume(0.25);
    });

    damagesound = new THREE.Audio(listener);
    audioLoader.load('/webxr/assets/sounds/capi_death.mp3', (buffer) => {
      damagesound.setBuffer(buffer);
      damagesound.setVolume(0.25);
    });

    // Ensure the AudioContext is triggered after user interaction
    document.body.addEventListener('click', function () {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    });
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

  let sk = null
  loader.load('Skeleton.glb', (gltf) => {
    sk = gltf.scene
    sk.scale.set(1, 1, 1);
    sk.userData.animations = gltf.animations;
    setInterval(spawnSkeleton, 3000);
  });

  ///////////////
  function spawnSkeleton() {
    if (!sk) return;

    const skClone = SkeletonUtils.clone(sk);
    const spawnPosition = getRandomPosition();
    skClone.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    scene.add(skClone);



    const mixer = new THREE.AnimationMixer(skClone);
    skClone.userData.mixer = mixer;
    skClone.userData.animations = sk.userData.animations;
    const action = mixer.clipAction(sk.userData.animations[12]);
    action.play();

    const boundingBox = new THREE.Box3(
      new THREE.Vector3(-0.5, -1, -0.5),  // Coin inférieur gauche de la boîte
      new THREE.Vector3(0.5, 0.5, 0.5)      // Coin supérieur droit de la boîte
    );

    // Applique la position du squelette à la boîte de délimitation
    boundingBox.translate(new THREE.Vector3(skClone.position.x, 0, skClone.position.z));
    skClone.userData.boundingBox = boundingBox;
    targets.push({ enemy: skClone, score: 10 });
  }

  ////////////////////////////////////// position aleatoire ////////////////////////////////////////////////////////////////////////
  function getRandomPosition() {
    const minX = -10, maxX = 10;
    const minZ = -10, maxZ = 10;
    const y = -1;

    const x = Math.random() * (maxX - minX) + minX;
    const z = Math.random() * (maxZ - minZ) + minZ;

    return new THREE.Vector3(x, y, z);
  }

  /////////////// TIRER FELECHE //////////////////
  function shootArrow() {
    if (Date.now() - last_shot > 500) {
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


      arrowClone.userData.distmax = 30
      if (reticle.visible === true) {
        const reticlePosition = new THREE.Vector3().setFromMatrixPosition(reticle.matrixWorld);
        const distanceToReticle = camera.position.distanceTo(reticlePosition);
        arrowClone.userData.distmax = distanceToReticle;
      }

      scene.add(arrowClone);
      arrows.push(arrowClone);
      last_shot = Date.now();
    }
  }


  controller = renderer.xr.getController(0);
  controller.addEventListener('select', shootArrow);
  controller.addEventListener('select', onSelect);
  controller.addEventListener('select', startAudioContext);

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

    // Vérification de collision avec les squelettes
    for (let j = 0; j < targets.length; j++) {
      const { enemy, isDead } = targets[j];
      if (!isDead) {

        let boundingBox = enemy.userData.boundingBox;
        let arrowbox = new THREE.Box3().setFromObject(arrow);


        if (boundingBox.intersectsBox(arrowbox)) {
          killenemy(enemy)
        }
      }
    }

    if (arrow.position.distanceTo(controller.position) > arrow.userData.distmax) {
      scene.remove(arrow);
      arrows.splice(i, 1);
      i--;
    }
  }
}

function killenemy(enemy) {
  if (enemy.userData.isDead) return;

  enemy.userData.isDead = true;
  enemy.userData.mixer.stopAllAction();
  const hitAnimation = enemy.userData.animations[0];
  if (hitAnimation) {
    const action = enemy.userData.mixer.clipAction(hitAnimation);
    action.reset();
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();

    if (deathsound) {
      deathsound.position.copy(enemy.position); // Positionner l'audio au même endroit que le squelette
      deathsound.play();
    }


    action.getMixer().addEventListener("finished", () => {
      scene.remove(enemy);
      scene.remove(enemy.userData.boundingBox)
      targets = targets.filter((t) => t !== enemy);
    });
  }
}

let clock = new THREE.Clock();

function update_enemy() {
  const delta = clock.getDelta();
  targets.forEach(({ enemy, isDead }) => {
    if (!isDead) {

      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, enemy.position).setY(0).normalize();

      const distanceToCamera = enemy.position.distanceTo(camera.position);

      enemy.rotation.y = Math.atan2(direction.x, direction.z);

      const speed = 0.005;
      if (distanceToCamera > 2) {
        const movement = direction.multiplyScalar(speed);
        enemy.position.add(movement);

        if (enemy.userData.isAttacking) {
          const attackAction = enemy.userData.mixer.clipAction(enemy.userData.animations[11]);
          attackAction.stop();
          enemy.userData.isAttacking = false;
        }
        if (!enemy.userData.isWalking) {
          const walkAnimation = enemy.userData.animations[12];
          if (walkAnimation) {
            const action = enemy.userData.mixer.clipAction(walkAnimation);
            action.setEffectiveTimeScale(0.75);
            action.play();
            enemy.userData.isWalking = true;
          }
        }
      } else {
        if (!enemy.userData.isAttacking) {
          const attackAnimation = enemy.userData.animations[11];
          if (attackAnimation) {
            const action = enemy.userData.mixer.clipAction(attackAnimation);
            action.setEffectiveTimeScale(0.75);
            action.reset();
            action.clampWhenFinished = true;
            action.play();
            enemy.userData.isAttacking = true;
            action.getMixer().addEventListener('loop', function onAttackFinished(event) {
              if (event.action === action) {
                lives -= 1;
                console.log("Lives restantes : " + lives);
                if (damagesound) {
                  damagesound.play();
                }
              }
            });
          }
          if (enemy.userData.isWalking) {
            const walkAnimation = enemy.userData.animations[12];
            if (walkAnimation) {
              const action = enemy.userData.mixer.clipAction(walkAnimation);
              action.stop();
              enemy.userData.isWalking = false;
            }
          }
        }
      }


      if (enemy.userData.mixer) {
        enemy.userData.mixer.update(delta);
      }
    }
  });
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
  update_enemy();


}