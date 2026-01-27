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

function resetComponents(el) {
  if (el.resetTargets && Array.isArray(el.resetTargets)) {
    el.resetTargets.forEach( (target) => {
      // console.debug('event-forwarder: reset component:',target.name,'of el',el.id);
      el.removeAttribute(target.name);
      // console.debug('event-forwarder:',target.name,target.defaultValue,'set to el',el.id);
      el.setAttribute(target.name, target.defaultValue);
    });
  }
  if (el.attached && Array.isArray(el.attached)) {
    el.attached.forEach( (childEl) => {
      resetComponents(childEl);
    });
  }
}

AFRAME.registerComponent('attach-to-another', {
  schema: {
    to: {type: 'string'},
    axis: {type: 'number', default: Number.MAX_SAFE_INTEGER},
    event: {type: 'string', default: ''},
  },
  init: function() {
    const evtArgs = this.data.event.split(',').map(e => e.trim()).filter(e => e.length > 0);
    const events = [];
    evtArgs.forEach( (evtName) => {
      if (evtName === 'a' || evtName === 'b' || evtName === 'x' || evtName === 'y') {
	events.push(evtName + 'buttondown');
	events.push(evtName + 'buttonup');
      } else if (evtName === 'trigger' || evtName === 'grip') {
	events.push(evtName + 'down');
	events.push(evtName + 'up');
      } else if (evtName === 'thumbstick') {
	events.push('thumbstickmoved');
	events.push('thumbstickdown');
	events.push('thumbstickup');
      } else {
	events.push(evtName);
      }
    });
    this.onSceneLoaded = () => {
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
	  events.forEach( (evtName) => {
	    robot.addEventListener(evtName, (evt) => {
	      // console.debug(`Forwarding event ${evtName} from robot ${robot.id} to attached child ${this.el.id}`);
	      this.el.emit(evtName, evt, false);
	    });
	  });
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
	  resetComponents(this.el);
	  if (!(robot.attached && Array.isArray(robot.attached))) {
	    robot.attached = [];
	  }
	  robot.attached.push(this.el);
	  robot.emit('attached', {child: this.el}, false);
	  this.el.emit('attach', {parent: robot, endLink: targetLink}, false);
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
    };
  },
  update: function() {
    // **** Wait for scene to load
    if (this.el.sceneEl.hasLoaded) {
      this.onSceneLoaded();
    } else {
      this.el.sceneEl.addEventListener('loaded', this.onSceneLoaded);
    }
  },
  pause: function() {
    // console.debug('attach-to-another: pause called for', this.el.id);
  }
});


// //    const forwardABbuttonEvent = (from,a,b, to) => {
// function forwardABbuttonEvent(from,a,b, to) {
//   from.addEventListener(a+'buttondown', (evt) => {
//     console.warn('forwarding '+a+'buttondown event to attached child:', to.id);
//     to.emit(a+'buttondown', evt, false);
//   });
//   from.addEventListener(a+'buttonup', (evt) => {
//     console.warn('forwarding '+a+'buttonup event to attached child:', to.id);
//     to.emit(a+'buttonup', evt, false);
//   });
//   from.addEventListener(b+'buttondown', (evt) => {
//     console.warn('forwarding '+b+'buttondown event to attached child:', to.id);
//     to.emit(b+'buttondown', evt, false);
//   });
//   from.addEventListener(b+'buttonup', (evt) => {
//     console.warn('forwarding '+b+'buttonup event to attached child:', to.id);
//     to.emit(b+'buttonup', evt, false);
//   });
// }

// AFRAME.registerComponent('attach-event-broadcaster', {
//   multiple: true,
//   schema: {
//     target: {type: 'string'}
//   },
//   init: function() {
//     const setEventForwarding = (child) => {
//       console.warn('###### event broadcaster',this.id,': setting event forwarding to child:', child?.id);
//       if (child) {
// 	forwardABbuttonEvent(this.el, 'a', 'b', child);
// 	forwardABbuttonEvent(this.el, 'x', 'y', child);
//       }
//       registerResetTarget(this);
//     };
//     const targetEl = document.getElementById(this.data.target);
//     if (this.el.attached && Array.isArray(this.el.attached) &&
// 	this.el.attached.includes(targetEl)) {
//       setEventForwarding(targetEl);
//     } else {
//       this.evtListener = (evt) => {
// 	console.warn('###### event broadcaster',this.id,': listen event received:', evt);
// 	console.warn('###### child.id:', evt.detail.child.id, ' target:', this.data.target);
// 	if (evt.detail.child.id === this.data.target) {
// 	  const child = evt.detail.child;
// 	  console.warn('###### event broadcaster',this.id,': child:', child?.id);
// 	  setEventForwarding(child);
// 	  this.el.removeEventListener('attached', this.evtListener);
// 	}
//       };
//       this.el.addEventListener('attached', this.evtListener);
//     }
//   }
// });
