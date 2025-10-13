import AFRAME from 'aframe';
// const THREE = window.AFRAME.THREE;
import {urdfLoader2} from './urdfLoader2.js'; // async function
import './reflectWorkerJoints.js'; // registers two AFrame components
import IkWorkerManager from '@ucl-nuee/ik-cd-worker';
import './armMotionUI.js'; // registers the arm-motion-ui AFrame component


AFRAME.registerComponent('robot-loader', {
  schema: {
    model: {type: 'string', default: 'jaka_zu_5'},
  },
  init: function() {
    const onLoaded = async () => {
      if (await urdfLoader2(this.el, this.data.model)) {
	this.el.model = this.data.model;
	this.el.emit('robot-dom-ready');
      } else {
	console.error('urdfLoader causes error.',
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

AFRAME.registerComponent('ik-worker', {
  schema: { type: 'array'}, // intial joint value
  init: function() {
    this.el.addEventListener('robot-dom-ready', () => {
      // ****************
      // Worker thread management
      this.el.workerRef = {current: null};
      const workerRef = this.el.workerRef;
      this.el.workerData = {current: { joints: null,
				       status: {}, pose: {} }};
      const workerData = this.el.workerData;
      const initialJoints = this.data.map(parseFloat);
      // *** controller offset subscribe
      const bridgeProtocol = location.protocol==='https:' ? 'wss:':'ws:';
      const bridgePort = 9090;
      const topicBridgeWebSocketURL =
	    // `${bridgeProtocol}//${location.hostname}:${bridgePort}`;
	    null;
      this.remove = IkWorkerManager({robotName: this.el.model,
                                     initialJoints,
		                     workerRef,
		                     workerData,
				     topicBridgeWebSocketURL});
      // This robot may be or may NOT be REGISTERED in 'robot-registry'
      // before the emission of 'robot-dom-ready' by urdfLoader2
      // Here, use the add function to register it in the registry.
      const id = this.el.id;
      const registerRobotFunc = () => { // 
	const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
	robotRegistryComp.add(id, {worker: this.el.workerRef,
				   workerData: this.el.workerData});
	console.log('Robot ', id, ' worker added:', this.el.workerRef);
	this.el.emit('ik-worker-start'); // what do i do next?
      };
      if (this.el.sceneEl.hasLoaded) {
	registerRobotFunc();
      } else {
	this.el.sceneEl.addEventListener('loaded', registerRobotFunc,
					 { once: true });
      }
    }, {once: true});
  },
  remove:function() {
    if (this?.remove) this.remove();
  }
});
