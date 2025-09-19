import {useEffect} from 'react';
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;

export default LoadUrdf

AFRAME.registerComponent('robot-registry', {
  init: function () {
    this.objects = new Map();
  },
  add: function(id, el) {
    this.objects.set(id, el);
  },
  get: function(id) {
    return this.objects.get(id);
  },
  getAll: function() {
    return Array.from(this.objects.values());
  }
});

function LoadUrdf({robotPlane, robotModel}) {
  // const robotPlaneId = props.robotPlane;
  // const robotModel = props.robotModel;
  const robotPlaneId = (typeof robotPlane === 'string') ? robotPlane : robotPlane?.id;
  useEffect(() => {
    const robotRegistry = document.getElementById('robot_registry');
    console.log('robotPlaneId:', robotPlaneId, 'robotModel:', robotModel);
    const planeEl = document.getElementById(robotPlaneId);
    if (!robotRegistry) {
      console.error('robot-registry entity not found');
      return;
    }
    if (!planeEl) {
      console.error('robotPlane entity not found:', robotPlaneId);
      return;
    }
    let planeLoaded = planeEl.hasLoaded;
    let registryLoaded = robotRegistry.hasLoaded;
    if (planeLoaded && registryLoaded) {
      const axes = loadAndBuildRobot({worldEl: planeEl, robotModel,
				      urdfFile: 'urdf.json', linkFile: 'linkmap.json',
				      modifierFile: 'update.json'});
      robotRegistry.components['robot-registry'].add(robotModel, axes);
      return;
    }
    planeEl.addEventListener('loaded', () => {
      planeLoaded = true;
      if (registryLoaded) {
        const axes = loadAndBuildRobot({worldEl: planeEl, robotModel,
					urdfFile: 'urdf.json', linkFile: 'linkmap.json',
					modifierFile: 'update.json'});
	robotRegistry.components['robot-registry'].add(robotModel, axes);
        planeEl.removeEventListener('loaded', this);
      }
    });
    robotRegistry.addEventListener('loaded', () => {
      registryLoaded = true;
      if (planeLoaded) {
	const axes = loadAndBuildRobot({worldEl: planeEl, robotModel,
					urdfFile: 'urdf.json', linkFile: 'linkmap.json',
					modifierFile: 'update.json'});
        robotRegistry.components['robot-registry'].add(robotModel, axes);
        robotRegistry.removeEventListener('loaded', this);
      }
    });
  },[]);
  return (
    <>
    </>
  );
}

function loadAndBuildRobot({worldEl, robotModel, urdfFile, linkFile, modifierFile}) {
  console.log("Loading robot model from:", robotModel + '/' + urdfFile);
  const axesList = [];
  let base = null;
  fetch(robotModel + '/' + urdfFile)
    .then(response => response.json())
    .then(urdf => {
      console.log("Loading link map from:", robotModel + '/' + linkFile);
      fetch(robotModel + '/' + linkFile)
	.then(response => response.json())
	.then(linkMap => {
          console.log("Loading modifiers from:", robotModel + '/' + modifierFile);
	  fetch(robotModel + '/' + modifierFile)
	    .then(response => response.json())
	    .then(modifiers => {
              updateLeaves(urdf, modifiers);
              updateLeaves(linkMap, modifiers);
              const revolutes = urdf.filter(obj => obj.$.type === 'revolute');
              console.log('1: type of base:', typeof base, base);
              base = document.createElement('a-entity');
              console.log('2: type of base:', typeof base, base);
              base.setAttribute('class', 'link');
              console.log("base link:", revolutes[0].parent.$.link);
              // const meshes = linkMap[revolutes[0].parent.$.link].visual.forEach(visual => 
              //   visual.geometry.mesh?.$.filename);
              linkMap[revolutes[0].parent.$.link].visual.forEach(visual => {
                const origin = visual.origin;
                const filename = visual.geometry.mesh?.$.filename;
                console.log('Base visual geometry.mesh.$.filename:', filename, 'origin:', origin);
                const el = document.createElement('a-entity');
                el.setAttribute('class', 'visual');
                base.appendChild(el);
                setUrdfOrigin(el, origin);
                console.log('Setting gltf-model to:', robotModel + '/' + filename);
                el.setAttribute('gltf-model', robotModel + '/' + filename);
              });
              // base.object3D.position.set(0, 0.25, 0);
              // base.object3D.quaternion.set(-0.5, 0.5, 0.5, 0.5); // world to three.js
              worldEl.appendChild(base);
              let parentEl = base;
              revolutes.forEach(joint => {
                const jEl = document.createElement('a-entity');
                jEl.setAttribute('class', 'link');
                parentEl.appendChild(jEl);
                console.log("Processing joint:", joint.$.name, "child link:", joint.child.$.link);
                linkMap[joint.child.$.link].visual.forEach(visual => {
                  console.log('Joint visual geometry.mesh.$.filename:', visual.geometry.mesh?.$.filename);
                });
                linkMap[joint.child.$.link].visual.map(visual => {
                  const origin = visual.origin;
                  const filename = visual.geometry.mesh?.$.filename;
		  // visual.geometry.mesh?.$.filename).filter(filename => filename);
                  console.log('Joint meshes:', filename, 'origin:', origin);
                  const el = document.createElement('a-entity');
		  el.setAttribute('class', 'visual');
		  jEl.appendChild(el);
                  setUrdfOrigin(el, origin);
	          el.setAttribute('gltf-model', robotModel + '/' + filename);
		});
                setUrdfOrigin(jEl, joint.origin);
                // console.log("link:", joint.child.$.link,
                //             "quaternion:", jEl.object3D.quaternion);
                // const additionalQuat = new THREE.Quaternion(0, 0, 0.130526,
                //                                             0.991445);
                // const jointQuat = jEl.object3D.quaternion;
                // jEl.object3D.quaternion.multiplyQuaternions(jointQuat,
                //                                             additionalQuat);
                const axisEl = document.createElement('a-entity');
                axisEl.setAttribute('class', 'axis');
                if (joint.axis?.$.xyz) {
                  const axis = new THREE.Vector3(...joint.axis.$.xyz);
                  axisEl.axis = axis.normalize();
                }
                jEl.appendChild(axisEl);
                axesList.push(axisEl);
                parentEl = axisEl;
              });
	      // initScene(urdf, linkMap, modifiers);
	    }).catch(error => {
              console.error('Error loading modifiers:', error);
	    });
	}).catch(error => {
          console.error('Error loading link map:', error);
        });
    }).catch(error => {
      console.error('Error loading URDF or link map:', error);
    });
  console.log('3: type of base:', typeof base, base);
  consoleChildLink(base);
  // A-Frameエンティティの作成
  return axesList;
}

function updateLeaves(a, b) {
  for (const key in b) {
    if (!(key in a)) continue; // aに存在しないキーは無視
    const bVal = b[key];
    const aVal = a[key];
    if (
      bVal !== null &&
      typeof bVal === "object" &&
      !Array.isArray(bVal) &&
      aVal !== null &&
      typeof aVal === "object" &&
      !Array.isArray(aVal)
    ) {
      // 両方オブジェクトなら再帰
      updateLeaves(aVal, bVal);
    } else {
      // 配列やオブジェクトでない値は上書き
      a[key] = bVal;
    }
  }
  return a;
}

function setUrdfOrigin(el, origin) {
  if (origin?.$.xyz)
    el.object3D.position.set(...origin.$.xyz)
  if (origin?.$.rpyDegrees) {
    const [roll, pitch, yaw] = origin.$.rpyDegrees.map(deg => deg * Math.PI / 180);
    el.object3D.quaternion.setFromEuler(new THREE.Euler(roll, pitch, yaw, 'XYZ'));
  }
  if (origin?.$.rpy) {
    const [roll, pitch, yaw] = origin.$.rpy
    el.object3D.quaternion.setFromEuler(new THREE.Euler(roll, pitch, yaw, 'XYZ'));
  }
}

function consoleChildLink(el) {
  if (el) {
    const linkEl = el.querySelector('.link');
    if (linkEl) {
      console.log('Child link:', linkEl);
      consoleChildLink(linkEl);
    } else {
      console.log('No child link found in:', el);
    }
  }
}
