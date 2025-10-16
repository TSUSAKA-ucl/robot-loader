import AFRAME from 'aframe'

// This component must be attached to the same element as the
// robot-registry or vrController(thumbstick-menu) component.
AFRAME.registerComponent('rapier-selector', {
  init: function () {
    this.el.addEventListener('thumbmenu-select', (evt) => {
      console.log('### rapier-selector: thumbmenu-select event:',
		  evt.detail.index);
      const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
      switch (evt.detail.texts[evt.detail.index]) {
      case 'rapier': // select rapier (rapier 'hand1')
	console.log('### select rapier');
        robotRegistryComp.eventDeliveryOneLocation('rapier-controller');
	break;
      }
    });
  }
});
