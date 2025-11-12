import AFRAME from 'aframe'

AFRAME.registerComponent('robot-registry', {
  init: function () {
    this.el.sceneEl.robotRegistryComp = this;
    this.objects = new Map();
  },
  set: function(id, data) { // data: {el: robotEl, axes: [...axes]}
    this.objects.set(id, {data: data});
  },
  get: function(id) {
    return this.objects.get(id)?.data;
  },
  add: function(id, data) {
    console.log('Registry: registry add id:', id);
    if (id) {
      if (this.get(id)) {
	console.warn('registry add already exist id:', id);
	Object.assign(this.get(id), data);
	console.log('registry add data:', this.get(id));
      } else {
	this.set(id, data);
      }
    } else {
      console.warn('registry add invalid id:', id, ' data:', data);
    }
  },
  getWhole: function(id) {
    return this.objects.get(id);
  },
  enableEventDelivery: function(id, distributor) {
    const listenerEl = this.objects.get(id)?.data?.el;
    if (checkListenerList(listenerEl, distributor)) {
      distributor.listenersList[id] = listenerEl;
      listenerEl.shouldListenEvents += 1;
      console.log('enable listening event by', id);
    }
  },
  disableEventDelivery: function(id, distributor) {
    const listenerEl = this.objects.get(id)?.data?.el;
    if (checkListenerList(listenerEl, distributor)) {
      delete distributor.listenersList[id];
      if (listenerEl.shouldListenEvents) {
	listenerEl.shouldListenEvents -= 1;
      }
      console.log('disable listening event by', id);
    }
  },
  eventDeliveryEnabled: function(id, distributor) {
    const listenerEl = this.objects.get(id)?.data?.el;
    if (checkListenerList(listenerEl, distributor)) {
      if (distributor.listenersList[id]) {
	return true;
      }
    }
    return false;
  },
  eventDeliveryOneLocation: function(id, distributor) {
    const idList = this.list();
    if (!idList.includes(id)) {
      console.error('The specified id does not exist in the registry:', id);
      return;
    }
    // const data = this.objects.get(id);
    // console.log('*#*# data:', data);
    const listenerEl = this.objects.get(id)?.data?.el;
    if (checkListenerList(listenerEl, distributor)) {
      Object.keys(distributor.listenersList).forEach(key => 
	this.disableEventDelivery(key, distributor));
      this.enableEventDelivery(id, distributor);
    }
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
    this.el.listenersList = {}; // idString, el pair
    const distributorSetup = () => {
      const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
      // const robotRegistry = document.getElementById('robot-registry');
      // const robotRegistryComp = robotRegistry?.components['robot-registry'];
      if (!robotRegistryComp) {
	console.error('robot-registry component not found!');
	return;
      }
      this.distributionFunc =  (evt) => {
	const detail = evt.detail ? evt.detail : {};
	robotRegistryComp.list().forEach(id => {
	  // console.log('*** event distributor: ', evtName, ' to ', id, 
	  // 	      ' enabled=', robotRegistryComp.eventDeliveryEnabled(id));
	  const listenerEl = this.el?.listenersList[id];
	  if (listenerEl) {
	    detail.originalTarget = evt.target;
	    listenerEl.emit(evt.type, detail, true);
	  }
	});
      };

      ['thumbmenu-select',
       'triggerdown', 'triggerup', 'gripdown', 'gripup',
       'abuttondown', 'abuttonup', 'bbuttondown', 'bbuttonup',
       'thumbstickmoved', 'thumbstickdown', 'thumbstickup',
      ].forEach(evtName => {
	this.el.addEventListener(evtName, this.distributionFunc);
      });
    };
    if (this.el.sceneEl.hasLoaded) {
      distributorSetup();
    } else {
      const distributorSetupHandler = () => {
	distributorSetup();
	this.el.sceneEl.removeEventListener('loaded', distributorSetupHandler);
      }
      this.el.sceneEl.addEventListener('loaded', distributorSetupHandler);
    }
  },
  remove: function () {
    const robotRegistryComp = this.el.sceneEl.robotRegistryComp;
    if (!robotRegistryComp) {
      return;
    }
    ['thumbmenu-select',
     'triggerdown', 'triggerup', 'gripdown', 'gripup',
     'abuttondown', 'abuttonup', 'bbuttondown', 'bbuttonup',
     'thumbstickmoved', 'thumbstickdown', 'thumbstickup',
    ].forEach(evtName => {
      this.el.removeEventListener(evtName, this.distributionFunc);
    });
  }
});

AFRAME.registerComponent('target-selector', {
  schema: {
    event: { default: 'thumbmenu-select'}
  },
  init: function () {
    this.el.addEventListener(this.data.event, (evt) => {
      let distributorEl = null;
      if (this.el.getAttribute('event-distributor')) {
	distributorEl = this.el;
      } else if (this.el.sceneEl.getAttribute('event-distributor')) {
	distributorEl = this.el.sceneEl;
      }
      const robotRegistryComp = this.el.sceneEl.hasLoaded &&
	    this.el.sceneEl.robotRegistryComp;
      const menuText = evt.detail?.texts[evt.detail?.index];
      if (distributorEl && robotRegistryComp && menuText) {
	for (const id of robotRegistryComp.list()) {
	  if (menuText === id) {
	    robotRegistryComp.eventDeliveryOneLocation(id, distributorEl);
	    break;
	  }
	}
      }
    });
  }
});

function checkListenerList(listener, distributor) {
  if (listener?.isEntity && distributor.hasLoaded) {
    if (!listener?.shouldListenEvents) listener.shouldListenEvents = 0;
    if (Object.prototype.toString.call(distributor?.listenersList)
	=== '[object Object]') {
      if (// listener.hasLoaded &&
	Number.isInteger(listener.shouldListenEvents)) {
	return true;
      } else {
	console.error('el.shoudListenEvents must be INTEGER. ',
		      listener?.shouldListenEvents);
	return false;
      }
    } else {
      console.error('distributor.listenersList must be a plain boject. :',
		    distributor?.listenersList);
      return false;
    }
  } else {
    return false;
  }
}
