import AFRAME from 'aframe';
const THREE = window.AFRAME.THREE;
import {newObjPoseConstsWorld, newObjPoseUI} from './newObjPoseUI.js'

AFRAME.registerComponent('world-motion-ui', {
  init: function() {
    this.triggerdownState = false;
    this.setEventListeners = () => {
      this.el.addEventListener('triggerdown', (evt) => {
	this.vrControllerEl = evt.detail?.originalTarget;
	if (!this.vrControllerEl) {
	  console.warn('world-motion-ui: triggerdown event has no originalTarget event detail', evt);
	  return;
	}
	newObjPoseConstsWorld(this, this.vrControllerEl, this.el, this.el.sceneEl.camera.position);
	this.triggerdownState = true;
      });
      this.el.addEventListener('triggerup', (evt) => {
	this.triggerdownState = false;
      });
    };
    this.setEventListeners();
  },
  tick: function() {
    if (this.el?.shouldListenEvents && this.vrControllerEl) {
      const newPose = newObjPoseUI(this, this.vrControllerEl);
      if (newPose) {
	this.el.object3D.position.copy(newPose[0]);
	this.el.object3D.quaternion.copy(newPose[1]);
      }
    }
  }
});
