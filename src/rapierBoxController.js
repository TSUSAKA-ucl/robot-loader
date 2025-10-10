import AFRAME from 'aframe'
// const THREE = window.AFRAME.THREE;
import {globalWorkerRef} from '@ucl-nuee/rapier-worker'

AFRAME.registerComponent('rapier-box-controller', {
  schema: {
    robotId: {type: 'string', default: 'rapier-controller'},
  },
  init: function() {
    const sceneEl = this.el.sceneEl;
    const onSceneLoaded = () => {
      const robotRegistry = this.el.sceneEl.robotRegistryComp;
      // const robotRegistry = document.getElementById('robot_registry');
      if (robotRegistry) {
	robotRegistry.add(this.data.robotId, {el: this.el, axes: []});
	this.registered = true;
      } else {
	console.warn('robotRegistry component not found!');
	this.registered = false;
      }
    }
    if (sceneEl.hasLoaded) {
      onSceneLoaded();
    } else {
      sceneEl.addEventListener('loaded', onSceneLoaded);
    }

    this.el.addEventListener('thumbmenu-select', (evt) => {
      console.log('### menu select event: ', evt.detail.index);
      switch (evt.detail.index) {
      case 7:
        globalWorkerRef?.current?.postMessage({
          type: 'call',
          name: 'handJointOpen',
        })
        break;
      case 5:
        globalWorkerRef?.current?.postMessage({
          type: 'call',
          name: 'handJointClose',
        });
        break;
      case 1:
        globalWorkerRef?.current?.postMessage({
          type: 'activate',
          name: 'box1Translation',
        });
        break;
      case 3:
        globalWorkerRef?.current?.postMessage({
          type: 'deactivate',
          name: 'box1Translation',
        });
        break;
      }
    });
  },
  tick: function() {
    if (!this.registered) {
      const robotRegistry = this.el.sceneEl.robotRegistryComp;
      // const robotRegistry = document.getElementById('robot_registry');
      if (robotRegistry) {
	robotRegistry.add(this.data.robotId, {el: this.el, axes: []});
	this.registered = true;
      }
    }
  },
  remove: function() {
    if (this.registered) {
      const robotRegistry = this.el.sceneEl.robotRegistryComp;
      // const robotRegistry = document.getElementById('robot_registry');
      if (robotRegistry) {
	robotRegistry.remove(this.data.robotId);
	this.registered = false;
      }
    }
  }
});
