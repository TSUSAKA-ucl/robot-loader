import AFRAME from 'aframe'

// This component must be attached to the same element as the
// robot-registry or vrController(thumbstick-menu) component.
AFRAME.registerComponent('target-selector', {
  init: function () {
    this.el.addEventListener('thumbmenu-select', (evt) => {
      console.log('### target-selector: thumbmenu-select event:',
		  evt.detail.index);
      switch (evt.detail.index) {
      case 0: // select nova2
      case 2: // select rapier hand1
      case 4: // select jaka zu5
	break;
      }
    });
  }
}
