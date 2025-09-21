// **** Not Used **** SAMPLE CODE 
AFRAME.registerComponent('right-controller-menu', {
  schema: { radius: {default: 0.2}, items: {default: 6} },
  init: function () {
    this.menuVisible = false;
    this.menuEls = [];
    this.currentIndex = -1;

    // flower-like menu entity
    this.menuRoot = new AFRAME.THREE.Group();
    this.el.object3D.add(this.menuRoot);

    const angleStep = (2 * Math.PI) / this.data.items;
    for (let i = 0; i < this.data.items; i++) {
      const angle = i * angleStep;
      const circle = document.createElement('a-circle');
      circle.setAttribute('radius', 0.05);
      circle.setAttribute('color', 'gray');
      circle.setAttribute('opacity', '0.6');
      circle.setAttribute('rotation', '-90 0 0'); // flat facing up
      circle.object3D.position.set(
        Math.cos(angle) * this.data.radius,
        0.01, // small offset above controller
        Math.sin(angle) * this.data.radius
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

    this.el.addEventListener('axismove', (evt) => {
      if (!this.menuVisible) return;
      const [x, y] = evt.detail.axis; // -1..1
      if (Math.hypot(x, y) < 0.2) { // deadzone
        this.highlight(-1);
        return;
      }
      let angle = Math.atan2(y, x); // -π..π
      if (angle < 0) angle += 2 * Math.PI;
      const sector = Math.floor(angle / (2 * Math.PI / this.data.items));
      this.highlight(sector);
    });

    this.el.addEventListener('thumbstickup', () => {
      if (!this.menuVisible) return;
      this.menuVisible = false;
      this.menuEls.forEach(el => { el.object3D.visible = false; });

      if (this.currentIndex >= 0) {
        // dispatch custom event with chosen index
        this.el.emit('menu-select', { index: this.currentIndex });
      }
      this.currentIndex = -1;
    });
  },

  highlight: function (index) {
    if (this.currentIndex === index) return;
    this.currentIndex = index;
    this.menuEls.forEach((el, i) => {
      el.setAttribute('color', i === index ? 'yellow' : 'gray');
    });
  }
});
