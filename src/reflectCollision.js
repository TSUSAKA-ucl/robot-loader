import AFRAME from 'aframe';
import {updateColor} from './colorUtils.js';
import {registerResetTarget} from './attachToAnother.js';

export function numberToEl(num, el) {
  if (num > 0) { return el.axes[num - 1]; }
  else if (num === 0) {
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child.classList.contains('link')) {
        return child;
      }
    }
  }
  return null;
}

function changeLinksColor(linkEl, color) {
  for (let j = 0; j < linkEl?.children?.length; j++) {
    const childEl = linkEl.children[j];
    console.debug('Status: Changing color of childEl due to collision:',
                  childEl);
    if (childEl.classList.contains('visual') &&
        childEl.hasAttribute('gltf-model')) {
      updateColor(childEl, color);
    } else if ((childEl.classList.contains('axis') &&
                childEl?.jointType === 'fixed') ||
               childEl.classList.contains('link')) {
      // recurse into axis or link
      changeLinksColor(childEl, color);
    }
  }
}

AFRAME.registerComponent('reflect-collision', {
  schema: {
    color: {type: 'string', default: 'red'},
  },
  init: function () {
    registerResetTarget(this);
  },

  // **** tick ****
  tick: function() {
    if (this.el.workerData?.current?.status) {
      // console.debug('Status: workerData.current.status:',
      //                    this.el.workerData.current.status);
      const collisionPairs = this.el.workerData.current?.status?.collisions;
      if (collisionPairs) {
      if (collisionPairs.length === 0) {
        if (this.colored) {
          // restore original colors
          for (let i = 0; i < this.el.axes.length + 1; i++) {
            const linkEl = numberToEl(i, this.el);
            changeLinksColor(linkEl, 'original');
          }
          this.colored = false;
        }
      } else if (collisionPairs.length > 0) {
        const uniqueFlat = [...new Set(collisionPairs.flat(Infinity))];
        console.debug('Status: collisionPairs:', collisionPairs,
                      ' uniqueFlat:', uniqueFlat);
        for (let i = 0; i < this.el.axes.length + 1; i++) {
          const linkEl = numberToEl(i, this.el);
          // console.debug('Status: Processing link index:', i,
          //          'link:', linkEl);
          if (!uniqueFlat.includes(i)) {
            // non-collision: original color
            changeLinksColor(linkEl, 'original');
          } else {
            // collision
            changeLinksColor(linkEl, this.data.color);
            this.colored = true;
          }
        }
      }
      }
    }
  }
});
