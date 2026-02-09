import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;

AFRAME.registerComponent('robot-loader', {
  schema: {
    model: {type: 'string', default: 'jaka_zu_5'},
  },
  init: function() {
    globalThis.__customLogger?.debug('### START robot-loader for:',this.data.model);
    this.el.model = null;
    const onLoaded = async () => {
      if (await urdfLoader2(this.el, this.data.model)) {
	this.el.model = this.data.model;
	// robot-loaderは入れ子になっているケースがあるのでbubblingすると不具合を起こす
	this.el.emit('robot-dom-ready', null, false);
      } else {
	globalThis.__customLogger?.error('urdfLoader causes error.',
		      'next event is not emitted.');
      }
    };
    if (this.el.hasLoaded) {
      onLoaded();
    } else {
      this.el.addEventListener('loaded', onLoaded, {once: true});
    }
  }
});


async function urdfLoader2(planeEl,
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
    globalThis.__customLogger?.error('robotIdString does not match planeEl.id:',
		  robotIdString, planeEl?.id);
    globalThis.__customLogger?.error('Ignore robotIdString');
    robotIdString = planeEl.id;
  }

  const axesList = [];
  const realAxes = [];
  let base = null;

  const urdfPath = robotModel + '/' + urdfFile;
  globalThis.__customLogger?.log("Loading robot model from:", urdfPath);
  const response1 = await fetch(urdfPath);
  if (!response1.ok) {
    globalThis.__customLogger?.error('ERROR status:',response1.status, ', in Fetch',urdfPath);
    return;
  }
  const gltfDirPath = robotModel + '/';
  const linkPath = robotModel + '/' + linkFile;
  globalThis.__customLogger?.log("Loading link map from:", linkPath);
  const response2 = await fetch(linkPath);
  if (!response2.ok) {
    globalThis.__customLogger?.error('ERROR status:',response2.status, ', in Fetch', linkPath);
    return;
  }
  const modifierPath = robotModel + '/' + modifierFile;
  const response3 = await fetch(modifierPath);
  if (!response3.ok) {
    globalThis.__customLogger?.warn('cannot find URDF modifier:', modifierPath);
  }
  let urdf = null;
  let urdfIsSorted = false;
  let linkMap = null;
  let modifiers = null;
  try {
    const urdfRaw = await response1.json();
    if (Array.isArray(urdfRaw)) {
      urdf = {...urdfRaw};
      urdfIsSorted = true;
    } else {
      urdf = urdfRaw;
    }
  } catch (error) {
    globalThis.__customLogger?.error('Error parsing urdf file:', error);
    return null; // DO NOTHING
  }
  try {
    linkMap = await response2.json();
  } catch (error) {
    globalThis.__customLogger?.error('Error parsing link file:', error);
    return null; // DO NOTHING
  }
  if (response3.ok) {
    try {
      modifiers = await response3.json();
      updateLeaves(urdf, modifiers);
      updateLeaves(linkMap, modifiers);
    } catch (error) {
      globalThis.__customLogger?.warn('parsing modifier file:', error);
      // CONTINUE
    }
  }
  //
  globalThis.__customLogger?.log('updated urdf:',urdf);
  let urdfArray = Object.values(urdf);
  if (!urdfIsSorted) {
    urdfArray = sortJointsByHierarchy(urdfArray);
  }
  const revolutes = urdfArray.filter(obj => (obj.$.type === 'revolute' ||
					     obj.$.type === 'prismatic' ||
					     obj.$.type === 'fixed'));
  // globalThis.__customLogger?.debug('1: type of base:', typeof base, base);
  base = document.createElement('a-entity');
  // globalThis.__customLogger?.debug('2: type of base:', typeof base, base);
  base.setAttribute('class', 'link');
  // globalThis.__customLogger?.debug("base link:", revolutes[0].parent.$.link);
  // const meshes = linkMap[revolutes[0].parent.$.link].visual.forEach(visual => 
  //   visual.geometry.mesh?.$.filename);
  // linkMap[revolutes[0].parent.$.link].visual.forEach(visual => {
  let visuals = linkMap[revolutes[0].parent.$.link]?.visual;
  if (visuals) {
    if (!Array.isArray(visuals)) {
      visuals = [visuals];
    }
  } else {
    visuals = [];
  }
  for (const visual of visuals) {
    const origin = visual.origin;
    const filename = visual.geometry.mesh?.$.filename;
    globalThis.__customLogger?.debug('Base visual geometry.mesh.$.filename:', filename,
		  'origin:', origin);
    const el = document.createElement('a-entity');
    el.setAttribute('class', 'visual');
    base.appendChild(el);
    setUrdfOrigin(el, origin);
    if (visual.geometry.mesh.$.scale) {
      el.setAttribute('scale', visual.geometry.mesh.$.scale);
    }
    // globalThis.__customLogger?.debug('Setting gltf-model to:', gltfDirPath + filename);
    await new Promise((resolve)=>{
      const cleanup = (success) => {
	el.removeEventListener('model-loaded', onLoaded);
	el.removeEventListener('model-error', onError);
	globalThis.__customLogger?.debug('LLLL loader success:', success,
		      ' cleanup listeners for:', filename);
      };
      const onLoaded = () => { cleanup(true); resolve(true); };
      const onError = () => { cleanup(false); resolve(false); };
      el.addEventListener('model-loaded', onLoaded);
      el.addEventListener('model-error', onError);
      el.setAttribute('gltf-model', gltfDirPath + filename);
      resolve(true);
    });
  }
  // base.object3D.position.set(0, 0.25, 0);
  // base.object3D.quaternion.set(-0.5, 0.5, 0.5, 0.5); // world to three.js
  base.object3D.position.set(0, 0, 0);
  base.object3D.quaternion.set(0, 0, 0, 1);
  planeEl.appendChild(base);
  let parentEl = base;
  // FINISH base link creation

  // revolutes.forEach(joint => {
  for (const joint of revolutes) {
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
    if (joint.$.type === 'revolute') axesList.push(axisEl);
    realAxes.push({el: axisEl, type: joint.$.type});
    axisEl.jointType = joint.$.type;
    // next
    parentEl = axisEl;
    // *** visuals
    // globalThis.__customLogger?.debug("Processing joint:", joint.$.name,
    // 		"child link:", joint.child.$.link);
    let visuals = linkMap[joint.child.$.link].visual;
    if (visuals) {
      if (!Array.isArray(visuals)) {
	visuals = [visuals];
      }
    } else {
      visuals = [];
    }
    visuals.forEach(visual => {
      globalThis.__customLogger?.debug('Joint visual geometry.mesh.$.filename:',
		    visual.geometry.mesh?.$.filename);
    });
    // linkMap[joint.child.$.link].visual.map(visual => {
    for (const visual of visuals) {
      const origin = visual.origin;
      const filename = visual.geometry.mesh?.$.filename;
      // visual.geometry.mesh?.$.filename).filter(filename => filename);
      globalThis.__customLogger?.debug('Joint meshes:', filename, 'origin:', origin);
      const el = document.createElement('a-entity');
      el.setAttribute('class', 'visual');
      axisEl.appendChild(el);
      setUrdfOrigin(el, origin);
      if (visual.geometry.mesh.$.scale) {
	el.setAttribute('scale', visual.geometry.mesh.$.scale);
      }
      await new Promise((resolve)=>{
	const cleanup = (success) => {
	  el.removeEventListener('model-loaded', onLoaded);
	  el.removeEventListener('model-error', onError);
	  globalThis.__customLogger?.debug('MMMM loader success:', success,
		      ' cleanup listeners for:', filename);
	};
	const onLoaded = () => { cleanup(true); resolve(true); };
	const onError = () => { cleanup(false); resolve(false); };
	el.addEventListener('model-loaded', resolve, { once: true });
	el.addEventListener('model-error', onError);
	el.setAttribute('gltf-model', gltfDirPath + filename);
	resolve(true);
      });
    }
  }
  globalThis.__customLogger?.log('######## Final: id:',planeEl.id,
	      'base link:', base, 'end link:', parentEl);

  const id = planeEl.id;
  const endLinkEl = parentEl;
  const axes = axesList;
  const registerRobotFunc = () => { // 
    globalThis.__customLogger?.debug('#>registerRobotFunc<# planeEl.id:',planeEl?.id, 'endLinkEl:',endLinkEl);
    const robotRegistryComp = planeEl.sceneEl.robotRegistryComp;
    if (robotRegistryComp.get(id)) {
      globalThis.__customLogger?.warn('robot:',id,'already registered');
    }
    robotRegistryComp.add(id,
			  {el: planeEl, axes: axes, endLink: endLinkEl});
    // globalThis.__customLogger?.debug('#><><><# planeEl.id:',planeEl?.id, 'endLinkEl:',planeEl.endLink);
    globalThis.__customLogger?.debug('######## ', id, ' registered with axes(length):',
		Object.keys(axes).length,
		'endLink(id):', endLinkEl.id);
    planeEl.axes = axes;
    planeEl.realAxes = realAxes;
    planeEl.endLink = endLinkEl;
    planeEl.emit('robot-registered', {id, axes, endLinkEl}, false);
  };
  if (planeEl.model) {
    registerRobotFunc();
  } else {
    planeEl.addEventListener('robot-dom-ready', registerRobotFunc,
			     {once: true});
  }
  // consoleChildLink(base);
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
      globalThis.__customLogger?.log('Child link:', linkEl);
      consoleChildLink(linkEl);
    } else {
      globalThis.__customLogger?.log('No child link found in:', el);
    }
  }
}

function sortJointsByHierarchy(urdfData) {
  const graph = new Map(); // parent -> list of joints
  const inDegree = new Map(); // child link name -> number of parents
  const linkToJoint = new Map(); // child link -> joint object (for ordered result)
  urdfData.forEach(joint => {
    const parent = joint.parent.$.link;
    const child = joint.child.$.link;
    if (!graph.has(parent)) { graph.set(parent, []); }
    graph.get(parent).push(joint);
    inDegree.set(child, (inDegree.get(child) || 0) + 1);
    if (!inDegree.has(parent)) { inDegree.set(parent, 0); }
    linkToJoint.set(child, joint);
  });
  const queue = [];
  for (const [link, degree] of inDegree.entries()) {
    if (degree === 0) { queue.push(link); }
  }
  const orderedJoints = [];
  while (queue.length > 0) {
    const parentLink = queue.shift();
    const children = graph.get(parentLink) || [];
    for (const joint of children) {
      const childLink = joint.child.$.link;
      orderedJoints.push(joint);
      inDegree.set(childLink, inDegree.get(childLink) - 1);
      if (inDegree.get(childLink) === 0) {
	queue.push(childLink);
      }
    }
  }
  if (orderedJoints.length !== urdfData.length) {
    globalThis.__customLogger?.warn('Cycle detected or disconnected components in URDF joints');
  }
  return orderedJoints;
}
