import AFRAME from 'aframe';
const THREE = AFRAME.THREE;

// let controllerPosition = null;
// let controllerQuaternion = null;
AFRAME.registerComponent('add-frameObject', {
  init: function () {
    // console.warn('#### parent:',this.el.parentNode,
    //              '#### this.el:', this.el);
    const addToParent = () => {
      this.el.parentNode.frameObject = this.el;
    };
    if (this.el.parentNode.hasLoaded) {
      addToParent();
    } else {
      this.el.parentNode.addEventListener('loaded', addToParent);
    }
  // },
  // tick() {
  //   if (controllerPosition && controllerQuaternion) {
  //     this.el.object3D.position.copy(controllerPosition);
  //     this.el.object3D.quaternion.copy(controllerQuaternion);
  //   }
  }
});
//                 oculus-touch-controls="hand: right"

AFRAME.registerComponent('a-axes-frame', {
  schema: {
    length: {type: 'number', default: 0.2 },
    radius: {type: 'number', default: 0.0035 },
    sphere: {type: 'number', default: 0.012 },
    color: {type: 'string', default: 'white' }
  },
  init: function () {
    if (this.el.parentNode.getAttribute('thumbmenu-event-handler')) {
      console.warn('**** parent has thumbmenu-event-handler ');
      this.el.parentNode.frameObject = this.el;
    }
    this.el.setAttribute('geometry', {
      primitive: 'sphere',
      radius: this.data.sphere,
    });
    this.el.setAttribute('material', {
      color: this.data.color,
    });

    this.el.setAttribute('scale', '1 1 1');

    const length = this.data.length;
    const radius = this.data.radius;
    const xAxis = createCylinder(length, [1,0,0],radius, 'red');
    const yAxis = createCylinder(length, [0,1,0],radius, '#00ff00');
    const zAxis = createCylinder(length, [0,0,1],radius, 'blue');
    this.el.appendChild(xAxis);
    this.el.appendChild(yAxis);
    this.el.appendChild(zAxis);
  }
});


function createCylinder(length, axis, radius, color) {
  const offsetArray = axis.map(e=>length/2 * e);
  const offset = new THREE.Vector3(...offsetArray);
  const heightAxis = new THREE.Vector3(0,1,0);
  const rotAxis = new THREE.Vector3(0,0,0);
  rotAxis.crossVectors(heightAxis, new THREE.Vector3(...axis));
  const height = length;
  // console.warn('offset: ',offset, 'rotAxis:', rotAxis);
  const cylinder = document.createElement('a-entity');
  // Configure the geometry for a cylinder
  cylinder.setAttribute('geometry', {
    primitive: 'cylinder',
    height: height,
    radius: radius,
  });
  // Set the color
  cylinder.setAttribute('material', {
    color: color
  });
  // Set the position
  cylinder.setAttribute('position',
			{x: offset.x, y: offset.y, z: offset.z});
  cylinder.object3D.setRotationFromAxisAngle(rotAxis,Math.PI/2);
  return cylinder;
}
