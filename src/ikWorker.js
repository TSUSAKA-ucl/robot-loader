import AFRAME from 'aframe';
// const THREE = window.AFRAME.THREE;
import IkWorkerManager from '@ucl-nuee/ik-cd-worker';

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
