import 'aframe';
const THREE = window.AFRAME.THREE;

export function urdfLoader(robotPlaneEl,
			   robotIdString,
			   robotModel) {
  // const planeEl = document.getElementById(robotIdString);
  const planeEl = robotPlaneEl;
  if (robotIdString !== planeEl?.id) {
    console.error('robotIdString does not match planeEl.id:', robotIdString, planeEl?.id);
    console.error('robotPlaneEl:', robotPlaneEl);
  }
  const robotRegistry = planeEl?.sceneEl?.robotRegistryComp?.el;
  // const robotRegistry = document.getElementById('robot-registry');
  console.log('robotPlaneId:', robotIdString, 'robotModel:', robotModel);
  if (!robotRegistry) {
    console.error('The robotRegistry itself cannot be found');
    console.log('planeEl:', planeEl);
    console.log('planeEl.sceneEl:', planeEl?.sceneEl);
    console.log('planeEl.sceneEl.robotRegistryComp:', planeEl?.sceneEl?.robotRegistryComp);
    return;
  }
  if (!planeEl) {
    console.error('robotPlane entity not found:', robotIdString);
    return;
  }
  let planeLoaded = planeEl.hasLoaded;
  let registryLoaded = robotRegistry.hasLoaded;
  if (planeLoaded && registryLoaded) {
    loadAndRegisterRobot({indivEl: planeEl, robotModel,
			  urdfFile: 'urdf.json', linkFile: 'linkmap.json',
			  modifierFile: 'update.json'});
  }
  planeEl.addEventListener('loaded', () => {
    planeLoaded = true;
    if (registryLoaded) {
      loadAndRegisterRobot({indivEl: planeEl, robotModel,
			    urdfFile: 'urdf.json', linkFile: 'linkmap.json',
			    modifierFile: 'update.json'});
      planeEl.removeEventListener('loaded', this);
    }
  });
  robotRegistry.addEventListener('loaded', () => {
    registryLoaded = true;
    if (planeLoaded) {
      loadAndRegisterRobot({indivEl: planeEl, robotModel,
			    urdfFile: 'urdf.json', linkFile: 'linkmap.json',
			    modifierFile: 'update.json'});
      robotRegistry.removeEventListener('loaded', this);
    }
  });
}

function loadAndRegisterRobot({indivEl,
			       robotModel,
			       urdfFile,
			       linkFile,
			       modifierFile}) {
  const robotRegistryComp = indivEl?.sceneEl?.robotRegistryComp;
  //const robotRegistry = document.getElementById('robot-registry');
  const indivId = indivEl.id;
  console.log('robot individual ID: ', indivId);
  const robot = robotRegistryComp.get(indivId);
  if (robot) {
    console.warn('robot ',indivId,' already registered');
    return;
  }

  const registerRobot = (id, indivEl, axes, endLinkEl) => {
    robotRegistryComp.add(id, {el: indivEl, axes: axes, endLink: endLinkEl});
    console.warn('el tag is:', indivEl.dataset.instanceTag);
    console.log('Robot ', id, ' registered with axes:', axes, 'endLink:', endLinkEl);
    indivEl.emit('robot-registered', {id, axes, endLinkEl});
  };

  const axes = loadAndBuildRobot({worldEl: indivEl, robotModel,
				  urdfFile, linkFile, modifierFile},
                                 registerRobot.bind(this, indivId, indivEl));
}

function loadAndBuildRobot({worldEl, robotModel, urdfFile, linkFile, modifierFile},
                           registerFunction) {
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
              // console.log('1: type of base:', typeof base, base);
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
                // console.log('Setting gltf-model to:', robotModel + '/' + filename);
                el.setAttribute('gltf-model', robotModel + '/' + filename);
              });
              // base.object3D.position.set(0, 0.25, 0);
              // base.object3D.quaternion.set(-0.5, 0.5, 0.5, 0.5); // world to three.js
              worldEl.appendChild(base);
              let parentEl = base;
              revolutes.forEach(joint => {
                // *** joint origin
                const jEl = document.createElement('a-entity');
                jEl.setAttribute('class', 'link');
                setUrdfOrigin(jEl, joint.origin);
                parentEl.appendChild(jEl);
                // *** axis
                const axisEl = document.createElement('a-entity');
                // const additionalQuat = new THREE.Quaternion(0, 0, 0.130526,
                //                                             0.991445);
		const identityQuat = new THREE.Quaternion().identity();
                axisEl.object3D.quaternion.copy(identityQuat);
		axisEl.object3D.position.set(0.0,0.0,0.0);
                axisEl.setAttribute('class', 'axis');
                if (joint.axis?.$.xyz) {
                  const axis = new THREE.Vector3(...joint.axis.$.xyz);
                  axisEl.axis = axis.normalize();
                }
                jEl.appendChild(axisEl);
                axesList.push(axisEl);
                // next
                parentEl = axisEl;
                // *** visuals
                // console.log("Processing joint:", joint.$.name, "child link:", joint.child.$.link);
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
		  axisEl.appendChild(el);
                  setUrdfOrigin(el, origin);
	          el.setAttribute('gltf-model', robotModel + '/' + filename);
		});
              });
              console.log('Final: base link:', base, 'end link:', parentEl);
              registerFunction(axesList, parentEl);
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
  // return axesList;
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
