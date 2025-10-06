import AFRAME from 'aframe';
import {frameObject3D} from './vrControllerMotionUI';
import {globalWorkerRef} from '@ucl-nuee/rapier-worker'

AFRAME.registerComponent('thumbmenu-event-hander', {
  init: function() {
    this.el.addEventListener('thumbmenu-select', (evt) => {
      console.log('### menu select event: ', evt.detail.index);
      const cylinder = this.el.laserCylinder;
      const cylinderHeight = this.el.laserCylinderHeight;
      switch (evt.detail.index) {
      case 6: {
        const ray = this.el.getAttribute('raycaster').direction;
        const v = new THREE.Vector3(ray.x, ray.y, ray.z).normalize();
        const q = new THREE.Quaternion()
              .setFromUnitVectors(new THREE.Vector3(0,1,0), v);
        const p = new THREE.Vector3(0.005, cylinderHeight*0.5, 0.015);
        cylinder.object3D.quaternion.copy(q);
        cylinder.object3D.position.copy(p.applyQuaternion(q));
        // console.log('ray x,y,z: ', ray.x, ray.y, ray.z);
      
        this.el.laserVisible = !this.el.laserVisible;
        this.el.setAttribute('line', 'visible', this.el.laserVisible);
        this.el.setAttribute('raycaster', 'enabled', this.el.laserVisible);
        cylinder.object3D.visible = this.el.laserVisible;
        frameObject3D.visible = ! this.el.laserVisible;
        // this.frame.object3D.visible = !this.el.laserVisible;
      }
        break;
      case 4:
        globalWorkerRef?.current?.postMessage({
          type: 'call',
          name: 'endJointOpen',
        })
        break;
      case 0:
        globalWorkerRef?.current?.postMessage({
          type: 'call',
          name: 'endJointClose',
        });
        break;
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
  }
});
