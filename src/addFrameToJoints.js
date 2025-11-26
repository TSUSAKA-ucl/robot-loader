import AFRAME from 'aframe';
// const THREE = AFRAME.THREE;

AFRAME.registerComponent('add-frame-to-joints', {
  schema: {
    from: {type: 'number', default: 0},
    to: {type: 'number', default: -1},
    length: {type: 'number', default: 0.3}
  },
  init: function() {
    // console.warn('AAA enter add-frame-to-joints');
    const addAxesFrame = () => {
      const axesList = this.el.axes;
      axesList.slice(this.data.from, this.data.to >= 0 ? this.data.to + 1 : undefined)
	.forEach((axis) => {
	  const frame = document.createElement('a-entity');
	  frame.setAttribute('a-axes-frame', {length: this.data.length});
	  axis.appendChild(frame);
	  // console.warn('AAA add frame to axis:', axis);
	});
    }
    if (this.el.axes) {
      addAxesFrame();
    } else {
      this.el.addEventListener('robot-registered', addAxesFrame, {once: true});
    }
  }
});
