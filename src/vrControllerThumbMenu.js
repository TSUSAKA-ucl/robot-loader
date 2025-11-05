import AFRAME from 'aframe';
const THREE = AFRAME.THREE;

AFRAME.registerComponent('thumbstick-menu', {
  schema: { radius: {default: 0.2},
	    items: {default: 'P,Q,R,S,T,U,V,W'},
	    cylinderHeight: { default: 0.25},
	  },
  init: function () {
    this.el.thumbstick = [0,0];
    const menuText = this.data.items;
    this.menuTexts = menuText.split(",").map(str=>str.trim());
    this.menuDisplayTexts = this.menuTexts.map(str => {
      return str.split(/[^a-zA-Z0-9]/)[0];
    });
    const numOfItems = this.menuTexts.length;
    this.menuColors = Array(numOfItems).fill('gray');

    this.menuVisible = false;
    this.menuEls = [];
    this.currentIndex = -1;

    const cylinder = document.createElement('a-cylinder');
    this.el.laserCylinder = cylinder;
    const cylinderHeight = this.data.cylinderHeight;
    this.el.laserCylinderHeight = cylinderHeight;
    cylinder.setAttribute('radius', 0.002); // radius
    cylinder.setAttribute('height', cylinderHeight);  // length
    cylinder.setAttribute('color', 'red');
    // cylinder.setAttribute('position', `0 ${-cylinderHeight/2} 0`);
    cylinder.setAttribute('position', '0 0 0');
    cylinder.setAttribute('rotation', '0 0 0');
    // cylinder.setAttribute('position', '-0.01 -0.06 -0.10'); 
    // cylinder.setAttribute('rotation', '57 10.5 0');
    this.el.appendChild(cylinder);
    // this.frame = buildUpFrameAxes(this.el);
    this.el.laserVisible = true;
    this.el.addEventListener('loaded', () => {
      flipRayOnOff(this.el, true);
      // If the frameObject(a-axes-frame) is attached to this.el
      // wait for it to appear, then turn off laser
    });

    // flower-like menu entity
    this.menuRoot = new AFRAME.THREE.Group();
    // this.menuRoot.object3D.position('0, -0.02, -0.04');
    this.el.object3D.add(this.menuRoot);
    // Object.freeze(this.menuTexts);
    const angleStepHalf = Math.PI/numOfItems;
    const angleStep = 2*angleStepHalf;

    this.menuCircles = [];
    this.menuLabels = [];
    for (let i = 0; i < numOfItems; i++) {
      const angle = i * angleStep;
      const circle = document.createElement('a-circle');
      const label = document.createElement('a-text');
      this.menuCircles.push(circle);
      this.menuLabels.push(label);
      label.setAttribute('value', this.menuDisplayTexts[i]);
      label.setAttribute('align', 'center');
      label.setAttribute('color', 'black');
      label.setAttribute('width', 2);
      label.object3D.position.set(0,0,0.01);
      circle.appendChild(label);
      circle.setAttribute('radius', 0.05);
      circle.setAttribute('color', this.menuColors[i]);
      circle.setAttribute('opacity', '0.6');
      circle.setAttribute('rotation', '-90 0 0'); // flat facing up
      circle.object3D.position.set(
        Math.cos(angle) * this.data.radius,
        -0.02, // small offset above controller
        Math.sin(angle) * this.data.radius - 0.04
      );
      this.el.sceneEl.appendChild(circle);
      circle.object3D.visible = false;
      this.menuEls.push(circle);
      this.menuRoot.add(circle.object3D);
    }
    const menuSelector = (evt) => {
      if (!this.menuVisible) return;
      // console.log('evt.detail: ', evt.detail);
      // const [x, y] = evt.detail.axis; // -1..1
      const x = evt.detail.x;
      const y = evt.detail.y;
      if (Math.hypot(x, y) < 0.2) { // deadzone
        this.highlight(-1);
        return;
      }
      let angle = Math.atan2(y, x) + angleStepHalf; // -π..π
      if (angle < 0) angle += 2 * Math.PI;
      const sector = Math.floor(angle / angleStep);
      this.highlight(sector);
    };

    this.el.addEventListener('thumbstickdown', () => {
      const evt = {detail: {x: this.el.thumbstick[0],
			    y: this.el.thumbstick[1]}};
      this.menuVisible = true;
      this.menuEls.forEach(el => { el.object3D.visible = true; });
      menuSelector(evt);
    });
    // this.el.addEventListener('axismove', (evt) => {
    this.el.addEventListener('thumbstickmoved',
			     (evt) => {
			       this.el.thumbstick[0] = evt.detail.x;
			       this.el.thumbstick[1] = evt.detail.y;
			       menuSelector(evt);
			    });

    this.el.addEventListener('thumbstickup', () => {
      // console.log('### thumbstick UP event');
      // console.log('current index: ', this.currentIndex);
      // console.log('menuVisible: ', this.menuVisible);
      if (!this.menuVisible) return;
      this.menuVisible = false;
      this.menuEls.forEach(el => { el.object3D.visible = false; });
      if (this.currentIndex >= 0) {
        // dispatch custom event with chosen index
        // console.log('emit menu number :', this.currentIndex);
        this.el.emit('thumbmenu-select', { index: this.currentIndex,
					   texts: this.menuTexts,
					   colors: this.menuColors,
					   label: this.menuLabels[this.currentIndex],
					 });
      }
      this.currentIndex = -1;
      // console.log('### thumbstick UP menuColors reset:', this.menuColors);
      this.menuEls.forEach((el,i)=>{el.setAttribute('color',
						    this.menuColors[i]);});
    });
  },

  highlight: function (index) {
    if (this.currentIndex === index) return;
    this.currentIndex = index;
    this.menuEls.forEach((el, i) => {
      el.setAttribute('color', i === index ? 'yellow' : this.menuColors[i]);
      // console.log('## HIGHLIGHT ',i);
    });
  }
});

AFRAME.registerComponent('thumbmenu-event-handler', {
  init: function() {
    this.el.addEventListener('thumbmenu-select', (evt) => {
      // console.log('### menu select event:', evt.detail.index);
      // console.log('### menu index:', evt.detail.index);
      // console.log('### menu texts:', evt.detail.texts);
      console.log('### menu text[i]:', evt.detail.texts[evt.detail.index]);
      // console.log('### this.el.laserCylinder:', this.el.laserCylinder);
      if (evt.detail.texts[evt.detail.index] === 'ray' ||
	  evt.detail.texts[evt.detail.index] === 'motion') {
	if (this.el?.laserVisible) {
	  evt.detail.label.setAttribute('value', 'ray');
	  evt.detail.colors[evt.detail.index] = 'orange';
	  flipRayOnOff(this.el, false);
	} else {
	  evt.detail.label.setAttribute('value', 'motion');
	  evt.detail.colors[evt.detail.index] = 'blue';
	  flipRayOnOff(this.el, true);
	}
      }
    });
  }
});

function flipRayOnOff(thisEl, tf) {
  console.log('### flip ray on/off. prev. laserVisible :', thisEl.laserVisible,
	     ' arg tf:', tf);
  if (! ('laserVisible' in thisEl)) return;
  switch (tf) {
  case false:
    thisEl.laserVisible = false;
    break;
  case true:
    thisEl.laserVisible = true;
    break;
  default:
    thisEl.laserVisible = !thisEl.laserVisible;
    break;
  }
  thisEl.setAttribute('line', 'visible', thisEl.laserVisible);
  thisEl.setAttribute('raycaster', 'enabled', thisEl.laserVisible);
  if (thisEl?.laserCylinder) {
    const cylinder = thisEl.laserCylinder;
    cylinder.object3D.visible = thisEl.laserVisible;
    if (thisEl.laserVisible) {
      const cylinderHeight = thisEl.laserCylinderHeight;
      const ray = thisEl.getAttribute('raycaster').direction;
      const v = new THREE.Vector3(ray.x, ray.y, ray.z).normalize();
      const q = new THREE.Quaternion()
            .setFromUnitVectors(new THREE.Vector3(0,1,0), v);
      const p = new THREE.Vector3(0.005, cylinderHeight*0.5, 0.015);
      cylinder.object3D.quaternion.copy(q);
      cylinder.object3D.position.copy(p.applyQuaternion(q));
      // console.log('ray x,y,z: ', ray.x, ray.y, ray.z);
    }
  }
  if (thisEl?.frameObject) {
    thisEl.frameObject.object3D.visible = ! thisEl.laserVisible;
    // console.log('#### changeVisibility of frameObject :',
    // 		thisEl.frameObject.object3D.visible);
  } else {
    console.warn('#### frameObject exists?', thisEl?.frameObject);
  }
}
