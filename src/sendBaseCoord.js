import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
// tick毎にthis.el.object3Dの位置姿勢を調べて、変化していたらworkerに送るコンポーネント
import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;

import {registerResetTarget} from './attachToAnother.js';

// doUpdateスキーマがfalseだったらここでのupdateMatrixWorldはしない
// デフォルトはtrue
AFRAME.registerComponent('send-base-coord', {
  after: ['attach-to-another'],
  schema: {
    doUpdate: {type: 'boolean', default: true},
  },
  init: function () {
    registerResetTarget(this);
  },
  update: function () {
    this.prevBaseCoord = new THREE.Matrix4();
    this.updated = false;
  },
  tick: function () {
    if (this.data.doUpdate) {
      this.el.object3D.updateMatrixWorld();
      //  updateMatrixWorldを呼ばないと一回前のレンダリング時の
      //  位置姿勢が返ってくることがあるが、attach-to-another
      // コンポーネントは直接matrixWorldを書き換えるためschemaで制御可能とする
    }
    const currentBaseCoord = this.el.object3D.matrixWorld;
    if (this.el.ikWorkerReady === true && this.el.workerRef?.current) {
      if (!currentBaseCoord.equals(this.prevBaseCoord)) {
	// console.warn('XXXXX Base coord changed, sending to worker. prev:', this.prevBaseCoord.elements, 'current:', currentBaseCoord.elements);
	const worker = this.el.workerRef.current;
	if (typeof worker.postMessage === 'function') {
	  if (this.data.doUpdate) {
	    // postするときに最新の位置姿勢を送る
	    this.el.object3D.updateMatrixWorld();
	  }
	  const baseCoord = this.el.object3D.matrixWorld.elements;
	  worker.postMessage({ type: 'set_base_coord', baseCoord: baseCoord });
	  this.updated = true;
	}
      }
    }
    if (this.updated) {
      this.prevBaseCoord.copy(currentBaseCoord);
    }
  }
});
