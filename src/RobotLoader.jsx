import {useRef, useEffect} from 'react';
import 'aframe';
// const THREE = window.AFRAME.THREE;
import LoadUrdf from './LoadUrdf.jsx';
import './robotSetJoint.js'; // registers the robot-set-joint AFrame component

export default RobotLoader;

function RobotLoader(props) {
  const {id, model, initialJoints, bridgeURL, ...planeProps} = props;
  const robotId = id;
  const workerData = useRef({joints: initialJoints || [0,0,0,0,0,0],});
  console.log('workerData:', workerData.current);
  return (
    <>
      <a-plane id={robotId} {...planeProps}>
        <LoadUrdf robotPlane={robotId} robotModel={model} />
      </a-plane>
      <a-entity robot-set-joint
                ref={el => {
                  if (el) {
                    el.setAttribute('robot-set-joint', {robotId: robotId});
                    el.setAttribute('robot-set-joint', {workerData: workerData});
                  }}}
      />
      {/* <a-entity robot-set-joint={{robotId: robotId, workerData: workerData}} /> */}
    </>
  );
}
