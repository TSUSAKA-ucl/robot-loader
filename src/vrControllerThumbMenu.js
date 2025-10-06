import AFRAME from 'aframe';
import {frameObject3D} from './vrControllerMotionUI';


AFRAME.registerComponent('thumbstick-menu', {
  schema: { radius: {default: 0.2},
	    items: {default: 'P,Q,R,S,T,U,V,W'},
	    cylinderHeight: { default: 0.25},
	  },
  init: function () {
    const menuText = this.data.items;
    const menuTexts = menuText.split(",");
    const numOfItems = menuTexts.length;

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


    // flower-like menu entity
    this.menuRoot = new AFRAME.THREE.Group();
    // this.menuRoot.object3D.position('0, -0.02, -0.04');
    this.el.object3D.add(this.menuRoot);

    const angleStep = (2 * Math.PI) / numOfItems;
    for (let i = 0; i < numOfItems; i++) {
      const angle = i * angleStep;
      const circle = document.createElement('a-circle');
      const label = document.createElement('a-text');
      label.setAttribute('value', menuTexts[i]);
      label.setAttribute('align', 'center');
      label.setAttribute('color', 'black');
      label.setAttribute('width', 2);
      label.object3D.position.set(0,0,0.01);
      circle.appendChild(label);
      circle.setAttribute('radius', 0.05);
      circle.setAttribute('color', 'gray');
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

    this.el.addEventListener('thumbstickdown', () => {
      this.menuVisible = true;
      this.menuEls.forEach(el => { el.object3D.visible = true; });
    });

    // this.el.addEventListener('axismove', (evt) => {
    this.el.addEventListener('thumbstickmoved', (evt) => {
      if (!this.menuVisible) return;
      // console.log('evt.detail: ', evt.detail);
      // const [x, y] = evt.detail.axis; // -1..1
      const x = evt.detail.x;
      const y = evt.detail.y;
      if (Math.hypot(x, y) < 0.2) { // deadzone
        this.highlight(-1);
        return;
      }
      let angle = Math.atan2(y, x); // -π..π
      if (angle < 0) angle += 2 * Math.PI;
      const sector = Math.floor(angle / (2 * Math.PI / numOfItems));
      this.highlight(sector);
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
        this.el.emit('thumbmenu-select', { index: this.currentIndex });
      }
      this.currentIndex = -1;
      this.menuEls.forEach((el,i)=>{el.setAttribute('color','gray');});
    });
  },

  highlight: function (index) {
    if (this.currentIndex === index) return;
    this.currentIndex = index;
    this.menuEls.forEach((el, i) => {
      el.setAttribute('color', i === index ? 'yellow' : 'gray');
      // console.log('## HIGHLIGHT ',i);
    });
  }
});
