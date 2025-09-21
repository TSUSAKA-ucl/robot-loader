// **** Not Currently Used ****
import { useEffect, useRef } from 'react'
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;


// ****************
// the entry point
// :
function KinematicsWorker() {
  // ****************
  // Worker thread generation
  const workerRef = useRef(null);
  const workerLastJoints = useRef(null);
  const workerLastStatus = useRef(null);
  const workerLastPose = useRef(null);
  useEffect(() => {
    if (workerRef.current === null) {
      console.log("******** Creating new worker ********");
      const worker = new Worker('/kinematics-worker.js', { type: 'module'});
      workerRef.current = worker;
      console.log("workerRef.current: ", worker);
      worker.onmessage = (event) => {
	switch (event.data.type) {
	case 'ready':
	  const bridgeProtocol = location.protocol==='https:' ? 'wss:':'ws:';
	  const bridgePort = 9090;
	  worker.postMessage({ type: 'init',
			       filename: robot_model +'/'+'urdf.json',
			       linkShapes: robot_model +'/'+'shapes.json',
			       bridgeUrl: `${bridgeProtocol}//${location.hostname}:${bridgePort}`,
			     });
	  break;
	case 'generator_ready':
	  worker.postMessage({ type: 'set_exact_solution',
			       exactSolution: false });
	  worker .postMessage({ type: 'set_initial_joints',
			        // joints: theta_body});
			        joints: theta_body_initial_map[robot_model]
			      });
	  break;
	case 'joints':
	  if (event.data.joints) {
	    console.debug("Worker joint message:",
			  event.data.joints.map(x => x.toFixed(3)).join(', '));
	    // Always skip to the latest data
	    workerLastJoints.current = event.data.joints;
	  }
	  break;
	case 'status':
	  workerLastStatus.current = event.data;
	  break;
	case 'pose':
	  workerLastPose.current = event.data;
	  break;
	}
      };
    }
  });
  return (
    <>
    </>
  );
}

export default KinematicsWorker
