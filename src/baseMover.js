import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = AFRAME.THREE;
import {registerResetTarget} from './attachToAnother.js';
import './sendBaseCoord.js';

AFRAME.registerComponent('base-mover', {
  schema: {
    velocityMax: { type: 'number', default: 0.2 },
    angularVelocityMax: { type: 'number', default: 0.5 },
  },
  init: function () {
    // もしsend-base-coordコンポーネントが付いていなければ(何回付けても構わないため)つけておく
    if (!this.el.getAttribute('send-base-coord')) {
      this.el.setAttribute('send-base-coord', '');
    }
    this.canMove = false;
    this.vrControllerEl = null;
    this.el.addEventListener('gripdown', (evt) => { // can move
      this.canMove = true;
      this.vrControllerEl = evt.detail?.originalTarget;
      globalThis.__customLogger?.log('base-mover gripdown', this.vrControllerEl);
    });
    this.el.addEventListener('gripup', (evt) => { // cannot move
      this.canMove = false;
      this.vrControllerEl = evt.detail?.originalTarget;
      globalThis.__customLogger?.log('base-mover gripup', this.vrControllerEl);
    });
    registerResetTarget(this);
  },
  tick: function (time, timeDelta) {
    if (!this.canMove) return;
    globalThis.__customLogger?.debug('base-mover tick', this.vrControllerEl.thumbstick);
    const velocityRatio = -this.vrControllerEl.thumbstick[1] || 0;
    const angularVelocityRatio = -this.vrControllerEl.thumbstick[0] || 0;
    const distance = (velocityRatio * this.data.velocityMax) * (timeDelta / 1000);
    const angle = (angularVelocityRatio * this.data.angularVelocityMax) * (timeDelta / 1000);
    const translation = this.el.object3D.position;
    const rotation = this.el.object3D.quaternion;
    const translationDelta = new THREE.Vector3(distance, 0, 0).applyQuaternion(rotation);
    const newPosition = translation.add(translationDelta);
    const rotationDelta = new THREE.Quaternion(0, 0, Math.sin(angle/2), Math.cos(angle/2));
    const newRotation = rotation.multiply(rotationDelta);
    this.el.object3D.position.copy(newPosition);
    this.el.object3D.quaternion.copy(newRotation);
    if (typeof this.el.workerRef?.current?.postMessage === 'function') {
      this.el.object3D?.updateMatrixWorld();
      const baseMatrixWorld = this.el.object3D.matrixWorld.elements;
      this.el.workerRef.current.postMessage({type: 'set_base_coord',
					     baseCoord: baseMatrixWorld});
    }
  }
});
