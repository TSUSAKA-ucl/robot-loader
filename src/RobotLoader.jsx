import {useRef, useEffect} from 'react';
import 'aframe';
// const THREE = window.AFRAME.THREE;
import {urdfLoader} from './urdfLoader.js';
import './robotSetJoint.js'; // registers the robot-set-joint AFrame component

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

	  console.warn('robotPlane: ', robotPlane.current);
          console.warn('el tag:', robotPlane.current.dataset.instanceTag);
	  console.warn('robotId: ', robotId);
	  console.warn('robotModel: ', robotModel);
          console.warn('sceneEl:', robotPlane.current.sceneEl);
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
        console.warn('robotPlane loaded event fired');
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
  const workerData = useRef({joints: initialJoints || [0,0,0,0,0,0],});
  console.log('workerData:', workerData.current);
  return (
    <>
      <a-plane ref={robotBasePlaneElRef}
               id={id} {...planeProps}>
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
