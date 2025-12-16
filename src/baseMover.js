import AFRAME from 'aframe';
const THREE = AFRAME.THREE;

AFRAME.registerComponent('base-mover', {
  schema: {
    velocityMax: { type: 'number', default: 0.2 },
    angularVelocityMax: { type: 'number', default: 0.5 },
  },
  init: function () {
    this.canMove = false;
    this.vrControllerEl = null;
    this.el.addEventListener('gripdown', (evt) => { // can move
      this.canMove = true;
      this.vrControllerEl = evt.detail?.originalTarget;
      console.log('base-mover gripdown', this.vrControllerEl);
    });
    this.el.addEventListener('gripup', (evt) => { // cannot move
      this.canMove = false;
      this.vrControllerEl = evt.detail?.originalTarget;
      console.log('base-mover gripup', this.vrControllerEl);
    });
    if (!(this.el.resetTargets && Array.isArray(this.el.resetTargets))) {
      this.el.resetTargets = [];
    }
    this.el.resetTargets.push({
      name: 'base-mover',
      defaultValue: {
	velocityMax: this.data.velocityMax,
	angularVelocityMax: this.data.angularVelocityMax
      }
    });
  },
  tick: function (time, timeDelta) {
    if (!this.canMove) return;
    console.log('base-mover tick', this.vrControllerEl.thumbstick);
    const velocityRatio = -this.vrControllerEl.thumbstick[1] || 0;
    const angularVelocityRatio = -this.vrControllerEl.thumbstick[0] || 0;
    const distance = (velocityRatio * this.data.velocityMax) * (timeDelta / 1000);
    const angle = (angularVelocityRatio * this.data.angularVelocityMax) * (timeDelta / 1000);
    const translation = this.el.object3D.position;
    const rotation = this.el.object3D.quaternion;
    const translatoinDelta = new THREE.Vector3(distance, 0, 0).applyQuaternion(rotation);
    const newPosition = translation.add(translatoinDelta);
    const rotationDelta = new THREE.Quaternion(0, 0, Math.sin(angle/2), Math.cos(angle/2));
    const newRotation = rotation.multiply(rotationDelta);
    this.el.object3D.position.copy(newPosition);
    this.el.object3D.quaternion.copy(newRotation);
  }
});
