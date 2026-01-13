import AFRAME from 'aframe';

AFRAME.registerComponent('reflect-collision', {
  schema: {
    color: {type: 'string', default: 'red'},
  },
  init: function () {
    this.workerDataStatusReady = false;
    const registerCheckWorkerStatus = () => {
      const robotId = this.el.id;
      console.debug('Status: Checking workerData status for', robotId);
      let checkCount = 0;
      const checkWorkerJoints = () => {
	const jointData = this.el.workerData.current.joints;
	if (jointData) { // not equal NULL?
	  const robotRegistry = this.el.sceneEl.robotRegistryComp;
	  this.axesList = robotRegistry.get(robotId)?.axes;
	  if (this.axesList) { // exists?
	    if (this.axesList.length === jointData.length) {
	      console.debug('Status: axesList and jointData length match.',
			    'axesList length:', this.axesList.length,
			    ' jointData length:', jointData.length);
	      // SUCCEED
	      if (this.el.workerData.current.status) {
		this.workerDataStatusReady = true;
		return;
	      }
	    } else {
              console.warn('length mismatch. axesList:', this.axesList,
			   ' jointData:', jointData);
	    }
	  } else {
	    console.warn('axesList cannot be found.',
			 'it may not have been registered yet.');
	  }
	} else {
	  // The worker hasn't started working yet
	}
	checkCount++;
	if (checkCount > 20) {
	  console.error('Failed to confirm workerData status ready state for',
			robotId,'after',checkCount,'tries.');
	  return;
	}
	console.debug('Status: Retrying to check workerData status for',robotId,
		      '... try #',checkCount);
	setTimeout(checkWorkerJoints, 500);
      };
      checkWorkerJoints();
      console.debug('workerDataStatusReady:', this.workerDataStatusReady);
    };
    if (this.el.workerData?.current?.status) {
      registerCheckWorkerStatus();
    } else {
      this.el.addEventListener('ik-worker-ready',
			       registerCheckWorkerStatus,
			       {once: true});
    }
    if (!(this.el.resetTargets && Array.isArray(this.el.resetTargets))) {
      this.el.resetTargets = [];
    }
    this.el.resetTargets.push({
      name: 'reflect-collision',
      defaultValue: {color: this.data.color},
    });
  },

  updateColor: function (el, color) {
    const onLoaded = () => {
      const obj = el.getObject3D('mesh');
      if (!obj) return;
      obj.traverse((node) => {
	if (node.isMesh && node.material) {
	  if (!node.userData.originalColor) {
            node.userData.originalColor = node.material.color.clone();
	  } else {
	    if (color === 'original') {
	      node.material.color.copy(node.userData.originalColor);
	    } else {
	      node.material.metalness = 0; // 金属光沢をゼロにする
	      node.material.roughness = 1; // 反射を抑えてマットにする
	      // node.material.vertexColors = false;
	      node.material.color.set(color); //  = new THREE.Color(color);
	      node.material.needsUpdate = true;
	    }
	  }
	}
      });
    };
    if (el.getObject3D('mesh')) {
      onLoaded();
    } else {
      el.addEventListener('model-loaded', onLoaded);
    }
  },
  // **** tick ****
  tick: function() {
    if (this?.workerDataStatusReady) { 
      // console.debug('Status: workerData.current.status:',
      // 		    this.el.workerData.current.status);
      const collisionPairs = this.el.workerData.current?.status?.collisions;
      if (collisionPairs && collisionPairs.length !== 0) {
	const uniqueFlat = [...new Set(collisionPairs.flat(Infinity))];
	console.log('Status: collisionPairs:', collisionPairs,
		     ' uniqueFlat:', uniqueFlat);
	const numberToEl = (num) => {
	  if (num > 0) { return this.axesList[num - 1]; }
	  else if (num === 0) {
	    // const childLinks = Array.from(this.el.children).filter(child=>
	    // child.classList.contains('link'));
	    // if (childLinks.length === 1) {
	    //   return childLinks[0];
	    // }
	    for (let i = 0; i < this.el.children.length; i++) {
	      const child = this.el.children[i];
	      if (child.classList.contains('link')) {
		return child;
	      }
	    }
	  }
	  return null;
	};
	for (let i = 0; i < this.axesList.length + 1; i++) {
	  const linkEl = numberToEl(i);
	  // console.log('Status: Processing link index:', i,
	  // 	      'link:', linkEl);
	  if (!uniqueFlat.includes(i)) {
	    // non-collision: original color
	    console.debug('Status: No collision on link index:', i,
			  'children:', linkEl?.children,
			  'linkEl:', linkEl);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      console.debug('Status: Restoring original color of visualEl:',
			    visualEl);
	      if (visualEl.classList.contains('visual') &&
		  visualEl.hasAttribute('gltf-model')) {
		this.updateColor(visualEl, 'original');
	      }
	    }
	  } else {
	    // collision
	    console.debug('Status: Collision detected on link index:', i,
			  'children:', linkEl?.children,
			  ' linkEl:', linkEl);
	    for (let j = 0; j < linkEl?.children?.length; j++) {
	      const visualEl = linkEl.children[j];
	      console.debug('Status: Changing color of visualEl due to collision:',
			    visualEl);
	      if (visualEl.classList.contains('visual') &&
	          visualEl.hasAttribute('gltf-model')) {
		this.updateColor(visualEl, this.data.color);
	      }
	    }
	  }
	}
      }
    }
  }
});
