import AFRAME from 'aframe'

AFRAME.registerComponent('robot-registry', {
  init: function () {
    this.el.sceneEl.robotRegistryComp = this;
    this.objects = new Map();
  },
  add: function(id, data) { // data: {el: robotEl, axes: [...axes]}
    this.objects.set(id, {data: data, eventDelivery: false});
  },
  get: function(id) {
    return this.objects.get(id)?.data;
  },
  getWhole: function(id) {
    return this.objects.get(id);
  },
  enableEventDelivery: function(id) {
    const entry = this.objects.get(id);
    if (entry) {
      entry.eventDelivery = true;
    }
  },
  disableEventDelivery: function(id) {
    const entry = this.objects.get(id);
    if (entry) {
      entry.eventDelivery = false;
    }
  },
  eventDeliveryEnabled: function(id) {
    const entry = this.objects.get(id);
    return entry ? entry.eventDelivery : false;
  },
  list: function() {
    return Array.from(this.objects.keys());
  },
  remove: function(id) {
    this.objects.delete(id);
  },
});

AFRAME.registerComponent('event-distributor', {
  init: function () {
    const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
    // const robotRegistry = document.getElementById('robot_registry');
    // const robotRegistryComp = robotRegistry?.components['robot-registry'];
    if (!robotRegistryComp) {
      console.error('robot-registry component not found!');
      return;
    }
    ['thumbmenu-select',
     'triggerdown', 'triggerup', 'gripdown', 'gripup',
     'abuttondown', 'abuttonup', 'bbuttondown', 'bbuttonup',
     'thumbstickmoved', 'thumbstickdown', 'thumbstickup',
    ].forEach(evtName => {
      this.el.addEventListener(evtName, (evt) => {
	const detail = evt.detail ? evt.detail : {};
	robotRegistryComp.list().forEach(id => {
	  // console.log('*** event distributor: ', evtName, ' to ', id, 
	  // 	      ' enabled=', robotRegistryComp.eventDeliveryEnabled(id));
	  const {data, eventDelivery} = robotRegistryComp.getWhole(id) || {};
	  if (eventDelivery && data && data.el) {
	    detail.originalTarget = evt.target;
	    data.el.emit(evtName, detail, false);
	  }
	});
      });
    });
  }
});
