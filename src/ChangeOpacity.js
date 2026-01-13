import AFRAME from 'aframe'

AFRAME.registerComponent('change-opacity', {
  schema: {
    opacity: {type: 'number', default: 1.2},
  },
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      this.updateOpacity(this.data.opacity);
    });
  },

  update: function () {
    this.updateOpacity(this.data.opacity);
  },

  updateOpacity: function (opacity) {
    if (opacity > 1.0) return; // 何もしない
    const onLoaded = () => {
      const obj = this.el.getObject3D('mesh');
      if (!obj) return;
      obj.traverse((node) => {
	if (node.isMesh && node.material) {
          node.material.transparent = opacity < 1.0; // 透明度必要
          node.material.opacity = opacity;
          node.material.needsUpdate = true;
	}
      });
    };
    if (this.el.getObject3D('mesh')) {
      onLoaded();
    } else {
      this.el.addEventListener('model-loaded', onLoaded);
    }
  }
});

AFRAME.registerComponent('attach-opacity-recursively', {
  schema: {
    opacity: {default: 1.1},
  },
  init: function () {
    const root = this.el;
    const opacityVal = this.data.opacity;
    if (opacityVal > 1.0) return;

    // DFS
    const traverse = (node) => {
      // gltf-model を持っていれば change-opacity を付与
      if (node.classList.contains('visual') &&
	  node.hasAttribute('gltf-model')) {
        node.setAttribute('change-opacity', `opacity: ${opacityVal}`);
      }

      const children = node.children;
      if (!children || children.length === 0) return;

      // 子を再帰的に辿る
      for (let i = 0; i < children.length; i++) {
	const child = children[i];
        // childEl が A-Frame の entity であることを確認
        if (
          child.tagName === 'A-ENTITY' ||
          Object.prototype.hasOwnProperty.call(child, 'object3D')
        ) {
	  if (['link', 'axis', 'visual'].some(cls => child.classList.contains(cls))) {
            traverse(child);
	  }
        }
      }
    };
    if (this.el.endLink) {
      traverse(root);
    } else {
      this.el.addEventListener('robot-registered', () => {
	console.warn('CCCCC add-event el:', this.el);
	traverse(root);
      });
    }
  }
});

AFRAME.registerComponent('change-color', {
  schema: {
    color: {type: 'string', default: 'white'},
  },
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      this.updateColor(this.data.color);
    });
  },
  update: function () {
    this.updateColor(this.data.color);
  },
  updateColor: function (color) {
    const onLoaded = () => {
      const obj = this.el.getObject3D('mesh');
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
    if (this.el.getObject3D('mesh')) {
      onLoaded();
    } else {
      this.el.addEventListener('model-loaded', onLoaded);
    }
  }
});

AFRAME.registerComponent('attach-color-recursively', {
  schema: {
    color: {default: 'white'},
  },
  init: function () {
    const root = this.el;
    const colorVal = this.data.color;

    // DFS
    const traverse = (node) => {
      // gltf-model を持っていれば change-color を付与
      if (node.classList.contains('visual') &&
	  node.hasAttribute('gltf-model')) {
	node.setAttribute('change-color', `color: ${colorVal}`);
      }

      const children = node.children;
      if (!children || children.length === 0) return;

      // 子を再帰的に辿る
      for (let i = 0; i < children.length; i++) {
	const child = children[i];
	// childEl が A-Frame の entity であることを確認
	if (
	  child.tagName === 'A-ENTITY' ||
	  Object.prototype.hasOwnProperty.call(child, 'object3D')
	) {
	  if (['link', 'axis', 'visual'].some(cls => child.classList.contains(cls))) {
	    traverse(child);
	  }
	}
      }
    };
    if (this.el.endLink) {
      traverse(root);
    } else {
      this.el.addEventListener('robot-registered', () => {
	traverse(root);
      });
    }
  }
});
