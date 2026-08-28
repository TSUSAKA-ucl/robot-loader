import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';
const THREE = AFRAME.THREE;
import './sendBaseCoord.js';

// this.el.object3Dをaxisの方向に並進移動させるコンポーネント
AFRAME.registerComponent('one-axis-mover', {
  schema: {
    axis: { type: 'array', default: [0, 0, 1]},
    init: { type: 'number', default: 0}, // in m
    posiEvent: {type: 'string', default: 'bbuttondown'},
    posiStopEvent: {type: 'string', default: 'bbuttonup'},
    posiSpeed: {type: 'number', default: 0.05}, // m per second
    posiMax: {type: 'number', default: 0.1}, // in m
    negaEvent: {type: 'string', default: 'abuttondown'},
    negaStopEvent: {type: 'string', default: 'abuttonup'},
    negaSpeed: {type: 'number', default: -0.05},// m per second
    negaMax: {type: 'number', default: -0.0}, // in m
    stationaryJoints: {type: 'array', default: []}, // indices of joints that do not move
    interval: {type: 'number', default: 0.1}, // seconds
  },
  init: function () {
    this.scalar = this.data.init; // 他のcomponentが参照するためinitで初期化
    if (!this.el.getAttribute('send-base-coord')) {
      this.el.setAttribute('send-base-coord', '');
    }
    this.onloading = () => {
      this.initialPosition = this.el.object3D.position.clone();
      this.axis = new THREE.Vector3(...this.data.axis).normalize();
      this.scalar = this.data.init;
      this.startTime = Date.now();
      this.positiveMoving = false;
      this.negativeMoving = false;

      this.el.addEventListener(this.data.posiEvent, () => {
	this.positiveMoving = true;
	this.negativeMoving = false;
      });
      this.el.addEventListener(this.data.posiStopEvent, () => {
	this.positiveMoving = false;
      });
      this.el.addEventListener(this.data.negaEvent, () => {
	this.negativeMoving = true;
	this.positiveMoving = false;
      });
      this.el.addEventListener(this.data.negaStopEvent, () => {
	this.negativeMoving = false;
      });
    }
  },
  update: function () {
    if (this.el.hasLoaded) {
      this.onloading();
    } else {
      this.el.addEventListener('loaded', this.onloading, { once: true });
    }
  },
  tick: function (time, timeDelta) {
    if (this.positiveMoving || this.negativeMoving) {
      const deltaSeconds = timeDelta / 1000;
      const speed = this.positiveMoving ? this.data.posiSpeed : this.data.negaSpeed;
      const max = this.positiveMoving ? this.data.posiMax : this.data.negaMax;
      const dir = this.positiveMoving ? 1 : -1;
      this.scalar += speed * deltaSeconds;
      if (this.scalar*dir > max*dir) {
	this.scalar = max;
      }
      const newPosition = this.initialPosition.clone().add(this.axis.clone().multiplyScalar(this.scalar));
      this.el.object3D.position.copy(newPosition);
    }
  }
});
