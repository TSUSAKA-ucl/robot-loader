import 'aframe';
const THREE = window.AFRAME.THREE;

export async function urdfLoader2(planeEl,
				  robotModel,
				  robotIdString, // = null
				  urdfFile = 'urdf.json',
				  linkFile = 'linkmap.json',
				  modifierFile = 'update.json') {
  if (planeEl?.id) {
    if (!robotIdString) {
      robotIdString = planeEl.id;
    }
  } else {
    if (robotIdString) {
      planeEl.id = robotIdString;
    } else {
      planeEl.id = 'robot-' + Math.random().toString(36).slice(2,7);
      robotIdString = planeEl.id;
    }
  }
  if (robotIdString !== planeEl.id) {
    console.error('robotIdString does not match planeEl.id:',
		  robotIdString, planeEl?.id);
    console.error('Ignore robotIdString');
    robotIdString = planeEl.id;
  }

  const axesList = [];
  let base = null;

  const urdfPath = robotModel + '/' + urdfFile;
  console.log("Loading robot model from:", urdfPath);
  const response1 = await fetch(urdfPath);
  if (!response1.ok) {
    console.error('ERROR status:',response1.status, ', in Fetch',urdfPath);
    return;
  }
  const gltfDirPath = robotModel + '/';
  const linkPath = robotModel + '/' + linkFile;
  console.log("Loading link map from:", linkPath);
  const response2 = await fetch(linkPath);
  if (!response2.ok) {
    console.error('ERROR status:',response2.status, ', in Fetch', linkPath);
    return;
  }
  const modifierPath = robotModel + '/' + modifierFile;
  const response3 = await fetch(modifierPath);
  if (!response3.ok) {
    console.warn('cannot find URDF modifier:', modifierPath);
  }
  let urdf = null;
  let linkMap = null;
  let modifiers = null;
  try {
    urdf = await response1.json();
  } catch (error) {
    console.error('Error parsing urdf file:', error);
    return null; // DO NOTHING
  }
  try {
    linkMap = await response2.json();
  } catch (error) {
    console.error('Error parsing link file:', error);
    return null; // DO NOTHING
  }
  if (response3.ok) {
    try {
      modifiers = await response3.json();
      updateLeaves(urdf, modifiers);
      updateLeaves(linkMap, modifiers);
    } catch (error) {
      console.warn('parsing modifier file:', error);
      // CONTINUE
    }
  }
  //
  const revolutes = urdf.filter(obj => obj.$.type === 'revolute');
  // console.log('1: type of base:', typeof base, base);
  base = document.createElement('a-entity');
  console.log('2: type of base:', typeof base, base);
  base.setAttribute('class', 'link');
  // console.log("base link:", revolutes[0].parent.$.link);
  // const meshes = linkMap[revolutes[0].parent.$.link].visual.forEach(visual => 
  //   visual.geometry.mesh?.$.filename);
  linkMap[revolutes[0].parent.$.link].visual.forEach(visual => {
    const origin = visual.origin;
    const filename = visual.geometry.mesh?.$.filename;
    console.log('Base visual geometry.mesh.$.filename:', filename,
		'origin:', origin);
    const el = document.createElement('a-entity');
    el.setAttribute('class', 'visual');
    base.appendChild(el);
    setUrdfOrigin(el, origin);
    // console.log('Setting gltf-model to:', gltfDirPath + filename);
    el.setAttribute('gltf-model', gltfDirPath + filename);
  });
  // base.object3D.position.set(0, 0.25, 0);
  // base.object3D.quaternion.set(-0.5, 0.5, 0.5, 0.5); // world to three.js
  base.object3D.position.set(0, 0, 0);
  base.object3D.quaternion.set(0, 0, 0, 1);
  planeEl.appendChild(base);
  let parentEl = base;
  // FINISH base link creation

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
    // console.log("Processing joint:", joint.$.name,
    // 		"child link:", joint.child.$.link);
    linkMap[joint.child.$.link].visual.forEach(visual => {
      console.log('Joint visual geometry.mesh.$.filename:',
		  visual.geometry.mesh?.$.filename);
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
      el.setAttribute('gltf-model', gltfDirPath + filename);
    });
  });
  console.log('Final: base link:', base, 'end link:', parentEl);

  const id = planeEl.id;
  const endLinkEl = parentEl;
  const axes = axesList;
  const registerRobotFunc = () => { // 
    const robotRegistryComp = planeEl.sceneEl.robotRegistryComp;
    if (robotRegistryComp.get(id)) {
      console.warn('robot:',id,'already registered');
    }
    robotRegistryComp.add(id,
			  {el: planeEl, axes: axes, endLink: endLinkEl});
    // console.warn('el tag is:', planeEl.dataset.instanceTag);
    console.log('Robot ', id, ' registered with axes:', axes,
		'endLink:', endLinkEl);
    planeEl.emit('robot-registered', {id, axes, endLinkEl});
  };
  if (planeEl.sceneEl.hasLoaded) {
    registerRobotFunc();
  } else {
    planeEl.sceneEl.addEventListener('loaded', registerRobotFunc,
				     {once: true});
  }
  consoleChildLink(base);
  return true;
}


// ******** support functions ********
//
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
