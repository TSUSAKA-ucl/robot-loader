import AFRAME from 'aframe'
import {updateColor,
	updateOpacity,
	changeOriginalColor
       } from './colorUtils.js';

AFRAME.registerComponent('change-opacity', {
  schema: {
    opacity: {type: 'number', default: 1.2},
  },
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      updateOpacity(this.el, this.data.opacity);
    });
  },

  update: function () {
    updateOpacity(this.el, this.data.opacity);
  },

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
	console.debug('CCCCC add-event el:', this.el);
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
      updateColor(this.el, this.data.color);
    });
  },
  update: function () {
    updateColor(this.el, this.data.color);
  },
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

AFRAME.registerComponent('change-original-color', {
  schema: {
    color: {type: 'string', default: 'white'},
  },
  init: function () {
    changeOriginalColor({el: this.el, newColor: this.data.color,
			 newMetalness: 0, newRoughness: 1,
			 changeCurrent: true});
  },
  update: function () {
    changeOriginalColor({el: this.el, newColor: this.data.color,
			 metalness: 0, roughness: 1,
			 changeCurrent: true});
  },
});


AFRAME.registerComponent('change-original-color-recursively', {
  schema: {
    color: {default: 'white'},
  },
  init: function () {
    const root = this.el;
    const colorVal = this.data.color;

    // DFS
    const traverse = (node) => {
      // gltf-model を持っていれば change-original-color を付与
      if (node.classList.contains('visual') &&
	  node.hasAttribute('gltf-model')) {
	node.setAttribute('change-original-color', `color: ${colorVal}`);
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
