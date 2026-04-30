import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;

export function registerResetTarget() {
}

function parseSchemaEvents(eventNames) {
  const evtArgs = eventNames.split(',')
	.map(e => e.trim()).filter(e => e.length > 0);
  const events = [];
  evtArgs.forEach( (evtName) => {
    if (evtName === 'a' || evtName === 'b' || evtName === 'x' || evtName === 'y') {
      events.push(evtName + 'buttondown');
      events.push(evtName + 'buttonup');
    } else if (evtName === 'trigger' || evtName === 'grip') {
      events.push(evtName + 'down');
      events.push(evtName + 'up');
    } else if (evtName === 'thumbstick') {
      events.push('thumbstickmoved');
      events.push('thumbstickdown');
      events.push('thumbstickup');
    } else {
      events.push(evtName);
    }
  });
  return events;
}

function invertIsometry3(source, target) {
    const te = source.elements;
    const tt = target.elements;

    // 回転成分（3x3）の転置
    tt[0] = te[0];  tt[1] = te[4];  tt[2] = te[8];
    tt[4] = te[1];  tt[5] = te[5];  tt[6] = te[9];
    tt[8] = te[2];  tt[9] = te[6];  tt[10] = te[10];

    // 平行移動成分 (tx, ty, tz)
    const tx = te[12];
    const ty = te[13];
    const tz = te[14];

    // 新しい平行移動成分 = -(R^T * T)
    tt[12] = -(tt[0] * tx + tt[4] * ty + tt[8] * tz);
    tt[13] = -(tt[1] * tx + tt[5] * ty + tt[9] * tz);
    tt[14] = -(tt[2] * tx + tt[6] * ty + tt[10] * tz);

    // 固定値
    tt[3] = 0; tt[7] = 0; tt[11] = 0;
    tt[15] = 1;
}

AFRAME.registerComponent('attach-to-another', {
  after: ['set-joints-directly-in-degree',
	  'set-joints-directly',
	  'reflect-worker-joints',
	  'base-mover',
	 ],
  before: ['send-base-coord'],
  schema: {
    to: {type: 'string'},
    axis: {type: 'number', default: Number.MAX_SAFE_INTEGER},
    event: {type: 'string', default: ''},
  },
  // このコンポーネントはbase-moverとは共存できない
  // このコンポーネントを使うときはsend-base-coordコンポーネントを自動的に付与する
  // this.newParent		// targetLinkのentity
  // this.newParent.object3D
  // this.parentRobotEl		// targetLinkが属するrobotのentity
  // this.originalParent	// attach-to-anotherを付けたentityの元の親entity
  // this.originalParent.object3D
  // this.orignalMatrix	// attach-to-anotherを付けたentityのattach前のmatrix
  // **** 案1 ****
  // initでobject3D.matrixAutoUpdateをfalseにする: removeで元の値に戻す
  // object3D.matrixWorldAutoUpdateもfalseにする: removeで元の値に戻す
  // newParent.object3DをupdateMatrixWorld
  // newParent.object3D.matrixWorldに(updateかinitで保存しておいた)自分のmatrixを掛ける
  // それを自分のobject3D.matrixWorldにセットする
  // **** 案2(テストして案1がだめなら) ****
  // initでobject3D.matrixAutoUpdatesをfalseにする: removeで元の値に戻す
  // object3D.matrixWorldAutoUpdateはtrueにする(たぶん自動計算すると思われる): removeで元の値に戻す
  // tickで、
  // originalParentをupdateMatrixWorldしてinvertIsometry3する
  // その結果に、newParentをupdateMatrixWorldしたmatrixWorldを掛ける
  // updateかinitで保存しておいた自分のmatrixを掛ける
  init: function() {
    this.newParent = null;
    this.originalParent = null;
    if (!this.el.getAttribute('send-base-coord')) {
      // ik-workerにこのentityのmatrixWorldを送る。
      // ただしdoUpdateMatrixWorldフラグがfalseになるようにする
      this.el.setAttribute('send-base-coord', 'doUpdate: false');
    }
    this.onSceneLoaded = () => {
      const attachToRobot = (robot) => {
	// attach this.el to robot's endLink
	const endLink = robot?.endLink;
	if (!endLink) {
	  customLogger?.warn(`QQQQQ Robot ${robot.id} has no endLink to attach to.`);
	  return;
	}
	if (robot?.realAxes == null || !Array.isArray(robot.realAxes)) {
	  customLogger?.warn(`QQQQQ Robot ${robot.id} has no axes array to attach to.`);
	  return;
	}
	try {
	  const targetAxisNum = this.data.axis-1;
	  let targetLink;
	  if (targetAxisNum < 0 || robot.realAxes.length <= targetAxisNum) {
	    // robot.realAxesの最後の要素をtargetLinkにする
	    targetLink = robot.realAxes.length > 0 ? robot.realAxes[robot.realAxes.length - 1].el : endLink;
	  } else {
	    targetLink = robot.realAxes[targetAxisNum].el;
	  }
	  // this.el.attached;
	  robot.setAttribute('event-forwarder__'+this.el.id,
			     { target: this.el.id,
			       event: this.data.event });
	  // this.el.play();
	  customLogger?.debug(`QQQQQ Attached ${this.el.id} to ${robot.id}'s`,
			      this.data.axis>=robot.realAxes.length
			      ? `endLink :${endLink.id}`
			      : `axis ${this.data.axis}`);
	  this.newParent = targetLink;
	  this.parentRobotEl = robot;
	  this.originalParent = this.el.parentEl;
	  this.originalMatrixAutoUpdate = this.el.object3D.matrixAutoUpdate
	  this.originalMatrixWorldAutoUpdate = this.el.object3D.matrixWorldAutoUpdate
	  this.el.object3D.matrixAutoUpdate = false;
	  this.el.object3D.matrixWorldAutoUpdate = true;
	  this.el.object3D.updateMatrix()
	  this.orignalMatrix = this.el.object3D.matrix.clone();
	  this.el.removeAttribute('position');
	  this.el.removeAttribute('rotation');
	  this.el.removeAttribute('scale');
	  // 意味は無いはず: this.el.object3D.position.set(0, 0, 0);
	  // 意味は無いはず: this.el.object3D.quaternion.set(0, 0, 0, 1);

	  if (!(robot.attached && Array.isArray(robot.attached))) {
	    robot.attached = [];
	  }
	  robot.attached.push(this.el);
	  robot.emit('attached', {child: this.el}, false);
	  this.el.emit('attach', {parent: robot, endLink: targetLink}, false);

	  const onIkWorkerReady = () => {
	    const iHaveAbId = () => {
	      // cd-workerがstop dependency listを作れるように、子(自分)の
	      // workerのabIdをターゲット(親)robotのik-workerに
	      // {type:'stop_dependency', stopAbId: abId}で伝える
	      if (typeof this.el.abId === 'number' && robot.workerRef?.current) {
		const stopDependencyMsg = {type:'stop_dependency',
					   stopAbId: this.el.abId,
					  };
		if (typeof robot.workerRef.current.postMessage === 'function') {
		  robot.workerRef.current.postMessage(stopDependencyMsg);
		  customLogger?.log('## stop_dependency message posted from',
				    this.el.id, 'to robot', robot.id,
				    'message:', stopDependencyMsg);
		} else {
		  customLogger?.warn('## stop_dependency: attach-to-another: ',
				     'robot.workerRef.current has no postMessage function.',
				     'robot.workerRef.current:', robot.workerRef.current);
		}
	      } else {
		customLogger?.warn('attach-to-another: cannot stop dependency',
				   ' because abId or workerRef is missing.',
				   'id:', this.el.id,
				   'el.abId:', this.el.abId,
				   'robot.workerRef:', robot.workerRef);
	      }
	    };
	    if (typeof this.el.abId === 'number' && this.el.abId>=0) {
	      iHaveAbId();
	    } else {
	      this.el.addEventListener('ab-id-ready', iHaveAbId, {once: true});
	    }
	  };
	  if (robot.ikWorkerReady) {
	    onIkWorkerReady();
	  } else {
	    robot.addEventListener('ik-worker-ready', onIkWorkerReady, {once: true});
	  }
	} catch (e) {
	  customLogger?.error('appendChild failed:',e);
	}
      };
      const robotEl = document.getElementById(this.data.to);
      customLogger?.debug('QQQQQ attach-to-another: found robotEl.id:', robotEl.id);
      if (robotEl?.endLink && Array.isArray(robotEl?.realAxes) ) { // robot has been registered
	attachToRobot(robotEl);
      } else if (typeof robotEl?.addEventListener === 'function') {
	robotEl.addEventListener('robot-registered', () => {
	  // customLogger?.debug(`QQQQQ Received robot-registered event from ${this.data.to}`,
	  // 	     'and attaching now.');
	  // // You can also check the id, axes, and endLinkEl in the event detail.
	  attachToRobot(robotEl);
	});
      } else {
	customLogger?.warn(`Cannot attach to ${this.data.to}: not found or invalid robot entity.`);
      }
    };
  },
  update: function() {
    // **** Wait for scene to load
    if (this.el.sceneEl.hasLoaded) {
      this.onSceneLoaded();
    } else {
      this.el.sceneEl.addEventListener('loaded', this.onSceneLoaded);
    }
  },
  pause: function() {
    // customLogger?.debug('attach-to-another: pause called for', this.el.id);
  },
  remove: function() {
    if (this.parentRobotEl) {
      // if parentRobotEl has event-forwarder component, remove it
      this.parentRobotEl.removeAttribute('event-forwarder__'+this.el.id);
      // remove this.el from parentRobotEl.attached
      if (this.parentRobotEl.attached && Array.isArray(this.parentRobotEl.attached)) {
	this.parentRobotEl.attached = this.parentRobotEl.attached.filter( (child) => child !== this.el);
      }
    }
    if (this.newParent) {
      // this.newParent.remove(this.el);
      this.newParent = null;
    }
    if (this.originalMatrixAutoUpdate !== undefined) {
      this.el.object3D.matrixAutoUpdate = this.originalMatrixAutoUpdate;
    }
    if (this.originalMatrixWorldAutoUpdate !== undefined) {
      this.el.object3D.matrixWorldAutoUpdate = this.originalMatrixWorldAutoUpdate;
    }
  },
  tick: function() {
    if (this.newParent) {
      // 理由は不明だが案2(matrixWorldAutoUpdateをtrue)のほうが表示がカクつかないように見える
      this.originalParent.object3D.updateMatrixWorld();
      const invOriginalMatrixWorld = new THREE.Matrix4();
      invertIsometry3(this.originalParent.object3D.matrixWorld, invOriginalMatrixWorld);
      this.newParent.object3D.updateMatrixWorld();
      const newParentMatrixWorld = this.newParent.object3D.matrixWorld;
      const origToNew = new THREE.Matrix4().multiplyMatrices(invOriginalMatrixWorld, newParentMatrixWorld);
      const finalMatrix = new THREE.Matrix4().multiplyMatrices(origToNew, this.orignalMatrix);
      this.el.object3D.matrix.copy(finalMatrix);
      // const newMatrix = new THREE.Matrix4().multiplyMatrices(newParentMatrixWorld, this.orignalMatrix);
      // this.el.object3D.matrixWorld.copy(newMatrix);
    }
  }
});

AFRAME.registerComponent('event-forwarder', {
  multiple: true,
  schema: {
    target: {type: 'string'},
    event: {type: 'string'}
  },
  init: function() {
    const events = parseSchemaEvents(this.data.event);
    const targetEl = document.getElementById(this.data.target);
    this.eventForwarders = [];
    // if (this.data.target.tagNam=== 'A-ENTITY') {
      events.forEach( (evtName) => {
	const forwardEvent = (evt) => {
	    targetEl.emit(evtName, evt.detail,false);
	};
	this.el.addEventListener(evtName, forwardEvent);
	this.eventForwarders.push({name: evtName, handler: forwardEvent});
      });
    // } else {
    //   customLogger?.warn('event-forwarder: target is not an a-entity:',
    // 		   this.data.target);
    // }
    registerResetTarget(this);
  },
  remove: function() {
    this.eventForwarders.forEach( (evtObj) => {
      this.el.removeEventListener(evtObj.name, evtObj.handler);
    });
    this.eventForwarders = [];
  }
});
