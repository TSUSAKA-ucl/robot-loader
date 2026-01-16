// import AFRAME from 'aframe';
// const THREE = window.AFRAME.THREE;

export function changeOriginalColor({el, newColor,
				     newMetalness = null,
				     newRoughness = null,
				     changeCurrent = false}) {
  const onLoaded = () => {
    const obj = el.getObject3D('mesh');
    if (!obj) return;
    obj.traverse((node) => {
      if (node.isMesh && node.material) {
	const tmp = node.material.color.clone();
	node.material.color.set(newColor);
	node.userData.originalColor = node.material.color.clone();
	node.material.color.copy(tmp);
	if (newMetalness !== null) {
	  node.userData.originalMetalness = newMetalness;
	}
	if (newRoughness !== null) {
	  node.userData.originalRoughness = newRoughness;
	}
	if (changeCurrent) {
	  node.material.color.set(newColor);
	  if (newMetalness !== null) {
	    node.material.metalness = newMetalness;
	  }
	  if (newRoughness !== null) {
	    node.material.roughness = newRoughness;
	  }
	  node.material.needsUpdate = true;
	}
      }
    });
  };
  // 	const tmp = node.material.color.clone();
  // 	node.material.color.set(newColor);
  // 	node.userData.originalColor = node.material.color.clone();
  // 	console.log('Color: changeOriginalColor set originalColor to ', node.userData.originalColor);
  // 	// node.material.color.copy(tmp);
  // 	if (newMetalness !== null) {
  // 	  node.userData.originalMetalness = newMetalness;
  // 	}
  // 	if (newRoughness !== null) {
  // 	  node.userData.originalRoughness = newRoughness;
  // 	}
  // 	if (changeCurrent) {
  // 	  console.log('Color: changeOriginalColor set color to ', newColor);
  // 	  node.material.color.set(newColor);
  // 	  if (node.userData.originalMetalness) {
  // 	    node.material.metalness = node.userData.originalMetalness;
  // 	  }
  // 	  if (node.userData.originalRoughness) {
  // 	    node.material.roughness = node.userData.originalRoughness;
  // 	  }
  // 	  node.material.needsUpdate = true;
  // 	}
  //     }
  //   });
  // };
  if (el.getObject3D('mesh')) {
    onLoaded();
  } else {
    el.addEventListener('model-loaded', onLoaded);
  }
}

export function updateColor(el, color) {
  const onLoaded = () => {
    const obj = el.getObject3D('mesh');
    if (!obj) return;
    obj.traverse((node) => {
      if (node.isMesh && node.material) {
	if (!node.userData.originalColor) {
          node.userData.originalColor = node.material.color.clone();
	  node.userData.originalMetalness = node.material.metalness;
	  node.userData.originalRoughness = node.material.roughness;
	} else {
	  if (color === 'original') {
	    node.material.color.copy(node.userData.originalColor);
	    node.material.metalness = node.userData.originalMetalness;
	    node.material.roughness = node.userData.originalRoughness;
	    node.material.needsUpdate = true;
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
}


export function updateOpacity(el, opacity) {
  if (opacity > 1.0) return; // 何もしない
  const onLoaded = () => {
    const obj = el.getObject3D('mesh');
    if (!obj) return;
    obj.traverse((node) => {
      if (node.isMesh && node.material) {
        node.material.transparent = opacity < 1.0; // 透明度必要
        node.material.opacity = opacity;
        node.material.needsUpdate = true;
      }
    });
  };
  if (el.getObject3D('mesh')) {
    onLoaded();
  } else {
    el.addEventListener('model-loaded', onLoaded);
  }
}
