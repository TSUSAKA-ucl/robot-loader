import {isoInvert, isoMultiply} from './isometry3.js';
const THREE = window.AFRAME.THREE;

// thisComp: constants
//	baseToWorld optional, default identity
// 	vrCtrlStartingPoseInv
// 	objStartingPose
// ctrlEl:
// 	object3D vary every frame
// 	laserVisible  constants

export function newObjPoseConstsWorld(thisComp, ctrlEl, movingObj, cameraPosition=null) {
  let distance1 = 1;
  let distance2 = 1;
  if (movingObj) {
    const movingObjPosition = movingObj.object3D.position.clone();
    thisComp.objStartingPose = [movingObjPosition,
				movingObj.object3D.quaternion.clone()];
    if (!cameraPosition) {
      distance1 = cameraPosition.distanceTo(movingObjPosition);
    }
  }
  if (ctrlEl) {
    const vrCtrlPosition = ctrlEl.object3D.position;
    const vrCtrlPose = [vrCtrlPosition,
			ctrlEl.object3D.quaternion];
    thisComp.vrCtrlStartingPoseInv = isoInvert(vrCtrlPose);
    if (!cameraPosition) {
      distance2 = cameraPosition.distanceTo(vrCtrlPosition);
    }
  } else {
    thisComp.vrCtrlStartingPoseInv = [new THREE.Vector3(0,0,0),
				      new THREE.Quaternion(0,0,0,1)];
  }
  thisComp.ratio = distance1/distance2;
}

export function newObjPoseConstsBase(thisComp, ctrlEl, opjectPoseIso3,
				     // cameraPosition=null
				    ) {
  thisComp.el.updateMatrixWorld(true);
  const matrixWorld = thisComp.el.object3D.matrixWorld;
  const pos = new THREE.Vector3().setFromMatrixPosition(matrixWorld);
  const quat = new THREE.Quaternion().setFromRotationMatrix(matrixWorld);
  thisComp.baseToWorld = isoInvert([pos, quat]);
  const vrCtrlPose = [ctrlEl.object3D.position,
		      ctrlEl.object3D.quaternion];
  thisComp.vrCtrlStartingPoseInv = isoMultiply(isoInvert(vrCtrlPose),
					       thisComp.baseToWorld);
  thisComp.objStartingPose = opjectPoseIso3;
  thisComp.ratio = 1;
}


export function newObjPoseUI(thisComp, ctrlEl) {
  if (!thisComp.triggerdownState || ctrlEl.laserVisible) {
    return null;
  }
  let vrControllerPose;
  if (!thisComp.baseToWorld) {
    vrControllerPose = [ctrlEl.object3D.position,
			ctrlEl.object3D.quaternion];
  } else {
    vrControllerPose = isoMultiply(thisComp.baseToWorld,
				   [ctrlEl.object3D.position,
				    ctrlEl.object3D.quaternion]);
  }
  const vrControllerDelta = isoMultiply(thisComp.vrCtrlStartingPoseInv,
                                        vrControllerPose);
  vrControllerDelta[0] = vrControllerDelta[0].multiplyScalar(1.0);
  vrControllerDelta[1].normalize();
  const vrCtrlToObj = [new THREE.Vector3(0, 0, 0),
                       thisComp.vrCtrlStartingPoseInv[1].clone()
                       .multiply(thisComp.objStartingPose[1])];
  const ObjToVrCtrl = [new THREE.Vector3(0, 0, 0),
                       vrCtrlToObj[1].clone().conjugate()];
  return isoMultiply(isoMultiply(thisComp.objStartingPose,
                                 isoMultiply(ObjToVrCtrl,
                                             vrControllerDelta)),
                     vrCtrlToObj);
}
