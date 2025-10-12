import AFRAME from 'aframe'

// This component must be attached to the same element as the
// robot-registry or vrController(thumbstick-menu) component.
AFRAME.registerComponent('target-selector', {
  init: function () {
    this.el.addEventListener('thumbmenu-select', (evt) => {
      console.log('### target-selector: thumbmenu-select event:',
		  evt.detail.index);
      const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
      switch (evt.detail.texts[evt.detail.index]) {
      case 'nova': // select nova2
	console.log('### select nova');
        robotRegistryComp.eventDeliveryOneLocation('nova2-plane');
	break;
      case 'hand': // select rapier hand1
	console.log('### select hand1');
        robotRegistryComp.eventDeliveryOneLocation('rapier-controller');
	break;
      case 'jaka': // select jaka zu5
	console.log('### select jaka');
        robotRegistryComp.eventDeliveryOneLocation('jaka-plane');
	break;
      }
    });
  }
});
