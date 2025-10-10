import {useRef, useEffect} from 'react';
import 'aframe';
// const THREE = window.AFRAME.THREE;
import {urdfLoader} from './urdfLoader.js';
import './robotSetJoint.js'; // registers the robot-set-joint AFrame component
import IkWorkerManager from '@ucl-nuee/ik-cd-worker';
import './armMotionUI.js'; // registers the arm-motion-ui AFrame component

export default RobotLoader;

function LoadUrdf({robotPlane, robotId, robotModel}) {
  useEffect(() => {
    const onLoadPlane = () => {
      if (robotPlane.current) {
        const el = robotPlane.current;
        const tag = Math.random().toString(36).slice(2,7);
        if (el.dataset.instanceTag) {
          // ****************
          // To prevent issues when React Strict Mode causes double rendering.
          // React sometimes call this code BEFORE the second rendering of robotPlane.
          // ****************
	  console.warn('robotPlane already has instanceTag:',
                       el.dataset.instanceTag);
          // **** Do nothing ****
	} else {
          el.dataset.instanceTag = tag;
          console.log('ADD robotBasePlaneTag:', tag, 'el:', el);

	  console.warn('NO WARNING:robotPlane: ', robotPlane.current);
          console.warn('NO WARNING:el tag:',
                       robotPlane.current.dataset.instanceTag);
	  console.warn('NO WARNING:robotId: ', robotId);
	  console.warn('NO WARNING:robotModel: ', robotModel);
          console.warn('NO WARNING:sceneEl:', robotPlane.current.sceneEl);
	  urdfLoader(robotPlane.current, robotId, robotModel);
        }
      } else {
	console.warn('robotPlane has not been loaded yet');
      }
    }
    if (robotPlane.current?.hasLoaded) {
      onLoadPlane();
    } else {
      robotPlane.current?.addEventListener('loaded', ()=>{
        console.warn('NO WARNING:robotPlane loaded event fired');
        onLoadPlane();
      });
      return () => {
	robotPlane.current?.removeEventListener('loaded', onLoadPlane);
      }
    }
  }, []);
  return (
    <>
    </>
  );
}

function RobotLoader(props) {
  const {id, model, initialJoints, bridgeURL, ...planeProps} = props;
  const robotBasePlaneElRef = useRef(null);
  // ****************
  // Worker thread management
  const workerRef = useRef(null);
  const workerData = useRef({ joints: [], status: {}, pose: {} });
  useEffect(() => {
    const remove = IkWorkerManager({robotName: model,
                                    initialJoints: initialJoints ||
                                    [0, 0, 0, 0, 0, 0],
		                    workerRef,
		                    workerData});
    robotBasePlaneElRef.current.addEventListener('robot-registered', (e) => {
      console.warn('NO WARNING:robot-registered event received in RobotLoader:', e);
      const sceneEl = robotBasePlaneElRef.current.sceneEl;
      const robotRegistryComp = sceneEl?.robotRegistryComp;
      const data = robotRegistryComp.get(id);
      if (data) {
        data.workerData = workerData;
        data.workerRef = workerRef;
        robotBasePlaneElRef.current.regData = data;
        console.log('robot data updated with workerData:', data);
      } else {
        console.error('robot data not found for id:', id);
      }
    });
    return remove;
  }, []);
  console.log('workerData:', workerData.current);
  return (
    <>
      <a-plane ref={robotBasePlaneElRef}
               id={id} {...planeProps}
               arm-motion-ui
      >
        <LoadUrdf robotPlane={robotBasePlaneElRef}
                  robotId={id}
                  robotModel={model} />
      </a-plane>
      <a-entity robot-set-joint
                ref={el => {
                  if (el) {
                    el.setAttribute('robot-set-joint', {robotId: id});
                    el.setAttribute('robot-set-joint', {workerData: workerData});
                  }}}
      />
      {/* <a-entity robot-set-joint={{robotId: robotId, workerData: workerData}} /> */}
    </>
  );
}
