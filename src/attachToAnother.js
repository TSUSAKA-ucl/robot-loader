import AFRAME from 'aframe'

export function registerResetTarget(component) {
  console.debug('event-forwarder: register component:',component.name,'of el',component.el.id);
  if (component.id) {
    console.debug('event-forwarder: register reset: component has id:',component.id);
  }
  const newData = { ... component.data };
  // if passing the same object reference, setAttribute may not work properly
  // and it use default value of the schema instead.
  if (newData) {
    console.debug('event-forwarder: register reset: component data:',newData);
  }
    
  if (!(component.el.resetTargets && Array.isArray(component.el.resetTargets))) {
    component.el.resetTargets = [];
  }
  const componentStr = component?.id ? component.name + '__' + component.id : component.name;
  console.debug('event-forwarder: componentStr:',componentStr);
  component.el.resetTargets.push({
    name: componentStr,
    defaultValue: newData
  });
}

AFRAME.registerComponent('attach-to-another', {
  schema: {
    to: {type: 'string'},
    axis: {type: 'number', default: Number.MAX_SAFE_INTEGER},
  },
  init: function() {
    const onSceneLoaded = () => {
      const attachToRobot = (robot) => {
	// attach this.el to robot's endLink
	const endLink = robot?.endLink;
	if (!endLink) {
	  console.warn('endLink:',endLink);
	  console.warn(`Robot ${robot.id} has no endLink to attach to.`);
	  return;
	}
	if (robot?.axes == null || !Array.isArray(robot.axes)) {
	  console.warn(`Robot ${robot.id} has no axes array to attach to.`);
	  return;
	}
	// console.debug('QQQQQ endLink.hasLoaded?',endLink.hasLoaded);
	console.debug('QQQQQ Attaching this.data.axis:',this.data.axis,
		    'to robot:',robot.id,
		    'with axes:',robot.axes.length,
		    'endLink:',endLink.id);
	try {
	  const targetAxisNum = this.data.axis-1;
	  let targetLink;
	  if (targetAxisNum < 0 || robot.axes.length <= targetAxisNum) {
	    targetLink = endLink;
	  } else {
	    targetLink = robot.axes[targetAxisNum];
	  }
	  targetLink.appendChild(this.el);
	  // this.el.play();
	  console.debug(`QQQQQ Attached ${this.el.id} to ${robot.id}'s`,
		      this.data.axis>=robot.axes.length
		      ? `endLink :${endLink.id}`
		      : `axis ${this.data.axis}`);
	  this.el.removeAttribute('position');
	  this.el.removeAttribute('rotation');
	  this.el.removeAttribute('scale');
	  this.el.object3D.position.set(0, 0, 0);
	  this.el.object3D.quaternion.set(0, 0, 0, 1);
	  if (this.el.resetTargets && Array.isArray(this.el.resetTargets)) {
	    this.el.resetTargets.forEach( (target) => {
	      console.debug('event-forwarder: reset component:',target.name,'of el',this.el.id);
	      this.el.removeAttribute(target.name);
	      console.debug('event-forwarder:',target.name,target.defaultValue,'set to el',this.el.id);
	      this.el.setAttribute(target.name, target.defaultValue);
	    });
	  }
	  robot.emit('attached', {child: this.el}, false);
	  this.el.emit('attached', {parent: robot, endLink: targetLink}, false);
	} catch (e) {
	  console.error('appendChild failed:',e);
	}
      };
      const robotEl = document.getElementById(this.data.to);
      // console.debug('QQQQQ attach-to-another: found robotEl.id:', robotEl.id);
      if (robotEl?.endLink && Array.isArray(robotEl?.axes) ) { // robot has been registered
	attachToRobot(robotEl);
      } else if (typeof robotEl?.addEventListener === 'function') {
	robotEl.addEventListener('robot-registered', () => {
	  // console.debug(`QQQQQ Received robot-registered event from ${this.data.to}`,
	  // 	     'and attaching now.');
	  // // You can also check the id, axes, and endLinkEl in the event detail.
	  attachToRobot(robotEl);
	});
      } else {
	console.warn(`Cannot attach to ${this.data.to}: not found or invalid robot entity.`);
      }
    }
    // **** Wait for scene to load
    if (this.el.sceneEl.hasLoaded) {
      onSceneLoaded();
    } else {
      this.el.sceneEl.addEventListener('loaded', onSceneLoaded);
    }
  }
});


//    const forwardABbuttonEvent = (from,a,b, to) => {
function forwardABbuttonEvent(from,a,b, to) {
  from.addEventListener(a+'buttondown', (evt) => {
    console.debug('forwarding '+a+'buttondown event to attached child:', to.id);
    to.emit(a+'buttondown', evt, false);
  });
  from.addEventListener(a+'buttonup', (evt) => {
    console.debug('forwarding '+a+'buttonup event to attached child:', to.id);
    to.emit(a+'buttonup', evt, false);
  });
  from.addEventListener(b+'buttondown', (evt) => {
    console.debug('forwarding '+b+'buttondown event to attached child:', to.id);
    to.emit(b+'buttondown', evt, false);
  });
  from.addEventListener(b+'buttonup', (evt) => {
    console.debug('forwarding '+b+'buttonup event to attached child:', to.id);
    to.emit(b+'buttonup', evt, false);
  });
}

AFRAME.registerComponent('attach-event-broadcaster', {
  multiple: true,
  schema: {
    target: {type: 'string'}
  },
  init: function() {
    this.el.addEventListener('attached', (evt) => {
      console.debug('###### event broadcaster: attached event received:', evt);
      // const child = this.data.target;
      const child = evt.detail.child;
      console.debug('###### event broadcaster: child:', child?.id);
      if (child) {
	forwardABbuttonEvent(this.el, 'a', 'b', child);
	forwardABbuttonEvent(this.el, 'x', 'y', child);
      }
    });
  }
});
