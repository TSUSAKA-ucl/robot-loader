import AFRAME from 'aframe';
// const THREE = window.AFRAME.THREE;
import IkWorkerManager from '@ucl-nuee/ik-cd-worker';

AFRAME.registerComponent('ik-worker', {
  schema: {
    type: 'array', // intial joint values in radian
    topicBridgePort: { type: 'number', default: 0 },
  },
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
      const bridgePort = this.data.topicBridgePort;
      const topicBridgeWebSocketURL =
	    bridgePort!==0 ? null :
	    `${bridgeProtocol}//${location.hostname}:${bridgePort}`;
      this.removeWorker = IkWorkerManager({robotName: this.el.model,
					   initialJoints,
					   workerRef,
					   workerData,
					   topicBridgeWebSocketURL});
      // This robot may be or may NOT be REGISTERED in 'robot-registry'
      // before the emission of 'robot-dom-ready' by urdfLoader2
      // Here, use the add function to register it in the registry.
      const registerRobotFunc = () => { // 
	const id = this.el.id;
	const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
	console.log('#=======# id:',id, 'endLinkEl:',this.el.endLink);
	robotRegistryComp.add(id, {worker: this.el.workerRef,
				   workerData: this.el.workerData});
	console.log('Robot ', id, ' worker added:', this.el.workerRef);
	this.el.emit('ik-worker-start'); // what do i do next?
      };
      // if (this.el.sceneEl.hasLoaded) {
      if (this.el.model) {
	registerRobotFunc();
      } else {
	// this.el.sceneEl.addEventListener('loaded', registerRobotFunc,
	this.el.addEventListener('robot-dom-ready', registerRobotFunc,
				 { once: true });
      }
    }, {once: true});
  },
  remove:function() {
    if (this?.removeWorker) this.removeWorker();
  }
});
