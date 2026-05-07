import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;

AFRAME.registerComponent('still-objects', {
  schema: {
    model: {type: 'string', default: 'table'},
  },
  init: function() {
    this.el.model = null;
    const onLoaded = async () => {
      if (await stillLoader(this.el, this.data.model)) {
	this.el.model = this.data.model;
	this.el.emit('robot-dom-ready', null, false);
      } else {
	globalThis.__customLogger?.error('stillLoader causes error.',
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

async function stillLoader(planeEl,
			   robotModel,
			   robotIdString, // = null
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
      planeEl.id = 'still-' + Math.random().toString(36).slice(2,7);
      robotIdString = planeEl.id;
    }
  }
  if (robotIdString !== planeEl.id) {
    globalThis.__customLogger?.error('IdString does not match planeEl.id:',
				     robotIdString, planeEl?.id);
    globalThis.__customLogger?.error('Ignore IdString');
    robotIdString = planeEl.id;
  }

  let base = null;

  const gltfDirPath = robotModel + '/';
  const linkPath = robotModel + '/' + linkFile;
  globalThis.__customLogger?.log("Loading link map from:", linkPath);
  const response2 = await fetch(linkPath);
  if (!response2.ok) {
    globalThis.__customLogger?.error('ERROR status:',response2.status, ', in Fetch', linkPath);
    return;
  }
  const modifierPath = robotModel + '/' + modifierFile;
  let response3 = null;
  try {
    response3 = await fetch(modifierPath);
    if (!response3.ok) {
      globalThis.__customLogger?.warn('cannot find URDF modifier:', modifierPath);
    }
  } catch (error) {
    globalThis.__customLogger?.warn('Error fetching modifier file:', error);
    // CONTINUE
  }

  let linkMap = null;
  let modifiers = null;
  try {
    linkMap = await response2.json();
  } catch (error) {
    globalThis.__customLogger?.error('Error parsing link file:', error);
    return null; // DO NOTHING
  }
  if (response3.ok) {
    try {
      modifiers = await response3.json();
      updateLeaves(linkMap, modifiers);
    } catch (error) {
      globalThis.__customLogger?.warn('parsing modifier file:', error);
      // CONTINUE
    }
  }
  //
  base = document.createElement('a-entity');
  base.setAttribute('class', 'link');
  // linkMapの値のvisualキーを取り出して、base linkのvisualを作成
  let visuals = Object.values(linkMap).find(link => link.visual)?.visual;
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
  // base !== planeEl
  base.object3D.position.set(0, 0, 0);
  base.object3D.quaternion.set(0, 0, 0, 1);
  planeEl.appendChild(base);
  let parentEl = base;
  // FINISH base link creation

  const id = planeEl.id;
  const endLinkEl = parentEl; // for still objects, endLink is same as base link
  const axes = [ parentEl ];
  const realAxes = [ parentEl ];
  const registerRobotFunc = () => { // 
    globalThis.__customLogger?.debug('#>registerRobotFunc<# planeEl.id:',
				     planeEl?.id, 'endLinkEl:',endLinkEl);
    const robotRegistryComp = planeEl.sceneEl.robotRegistryComp;
    if (robotRegistryComp.get(id)) {
      globalThis.__customLogger?.warn('robot:',id,'already registered');
    }
    robotRegistryComp.newId(id,
			    {el: planeEl, axes: axes, endLink: endLinkEl});
    globalThis.__customLogger?.debug('######## ', id,
				     ' registered with axes(length):',
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
