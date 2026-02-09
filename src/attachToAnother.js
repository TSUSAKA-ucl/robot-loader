import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe'

export function registerResetTarget(component) {
  globalThis.__customLogger?.debug('event-forwarder: register component:',component.name,'of el',component.el.id);
  if (component.id) {
    globalThis.__customLogger?.debug('event-forwarder: register reset: component has id:',component.id);
  }
  const newData = { ... component.data };
  // if passing the same object reference, setAttribute may not work properly
  // and it use default value of the schema instead.
  // globalThis.__customLogger?.warn('event-forwarder: register reset: component data:',newData);
  // if (newData) {
  //   globalThis.__customLogger?.log('event-forwarder: register reset: component data:',newData);
  //   globalThis.__customLogger?.debug('event-forwarder: register reset: component data:',newData);
  // }
    
  if (!(component.el.resetTargets && Array.isArray(component.el.resetTargets))) {
    component.el.resetTargets = [];
  }
  const componentStr = component?.id ? component.name + '__' + component.id : component.name;
  globalThis.__customLogger?.debug('event-forwarder: componentStr:',componentStr);
  component.el.resetTargets.push({
    name: componentStr,
    defaultValue: newData
  });
}

function resetComponents(el) {
  if (el.resetTargets && Array.isArray(el.resetTargets)) {
    el.resetTargets.forEach( (target) => {
      // globalThis.__customLogger?.debug('event-forwarder: reset component:',target.name,'of el',el.id);
      el.removeAttribute(target.name);
      // globalThis.__customLogger?.debug('event-forwarder:',target.name,target.defaultValue,'set to el',el.id);
      el.setAttribute(target.name, target.defaultValue);
      el.components[target.name]?.play();
    });
  }
  if (el.attached && Array.isArray(el.attached)) {
    el.attached.forEach( (childEl) => {
      resetComponents(childEl);
    });
  }
}

function parseSchemaEvents(eventNames) {
  const evtArgs = eventNames.split(',')
	.map(e => e.trim()).filter(e => e.length > 0);
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
  return events;
}

AFRAME.registerComponent('attach-to-another', {
  schema: {
    to: {type: 'string'},
    axis: {type: 'number', default: Number.MAX_SAFE_INTEGER},
    event: {type: 'string', default: ''},
  },
  init: function() {
    // const events = parseSchemaEvents(this.data.event);
    // this.evtHandlers = [];
    this.onSceneLoaded = () => {
      const attachToRobot = (robot) => {
	// attach this.el to robot's endLink
	const endLink = robot?.endLink;
	if (!endLink) {
	  globalThis.__customLogger?.warn('endLink:',endLink);
	  globalThis.__customLogger?.warn(`Robot ${robot.id} has no endLink to attach to.`);
	  return;
	}
	if (robot?.axes == null || !Array.isArray(robot.axes)) {
	  globalThis.__customLogger?.warn(`Robot ${robot.id} has no axes array to attach to.`);
	  return;
	}
	// globalThis.__customLogger?.debug('QQQQQ endLink.hasLoaded?',endLink.hasLoaded);
	globalThis.__customLogger?.debug('QQQQQ Attaching this.data.axis:',this.data.axis,
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
	  const tmpResetTargets = this.el.resetTargets;
	  const tmpAttached = this.el.attached;
	  targetLink.appendChild(this.el);
	  this.el.resetTargets = tmpResetTargets;
	  this.el.attached = tmpAttached;
	  const onLoaded = () => {
	    robot.setAttribute('event-forwarder__'+this.el.id,
			       { target: this.el.id,
				 event: this.data.event });
	    // this.el.play();
	    globalThis.__customLogger?.debug(`QQQQQ Attached ${this.el.id} to ${robot.id}'s`,
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
	  };
	  if (targetLink.hasLoaded) {
	    onLoaded();
	  } else {
	    this.el.addEventListener('loaded', onLoaded, {once: true});
	  }
	} catch (e) {
	  globalThis.__customLogger?.error('appendChild failed:',e);
	}
      };
      const robotEl = document.getElementById(this.data.to);
      // globalThis.__customLogger?.debug('QQQQQ attach-to-another: found robotEl.id:', robotEl.id);
      if (robotEl?.endLink && Array.isArray(robotEl?.axes) ) { // robot has been registered
	attachToRobot(robotEl);
      } else if (typeof robotEl?.addEventListener === 'function') {
	robotEl.addEventListener('robot-registered', () => {
	  // globalThis.__customLogger?.debug(`QQQQQ Received robot-registered event from ${this.data.to}`,
	  // 	     'and attaching now.');
	  // // You can also check the id, axes, and endLinkEl in the event detail.
	  attachToRobot(robotEl);
	  this.parentRobotEl = robotEl;
	});
      } else {
	globalThis.__customLogger?.warn(`Cannot attach to ${this.data.to}: not found or invalid robot entity.`);
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
    // globalThis.__customLogger?.debug('attach-to-another: pause called for', this.el.id);
  },
  remove: function() {
    if (this.parentRobotEl) {
      // if parentRobotEl has event-forwarder component, remove it
      this.parentRobotEl.removeAttribute('event-forwarder__'+this.el.id);
    }
    // Remove event listeners
    // this.evtHandlers.forEach( (evtObj) => {
    //   this.el.removeEventListener(evtObj.name, evtObj.handler);
    // });
    // this.evtHandlers = [];
  }
});

AFRAME.registerComponent('event-forwarder', {
  multiple: true,
  schema: {
    target: {type: 'string'},
    event: {type: 'string'}
  },
  init: function() {
    const events = parseSchemaEvents(this.data.event);
    const targetEl = document.getElementById(this.data.target);
    this.eventForwarders = [];
    // if (this.data.target.tagNam=== 'A-ENTITY') {
      events.forEach( (evtName) => {
	const forwardEvent = (evt) => {
	    targetEl.emit(evtName, evt.detail,false);
	};
	this.el.addEventListener(evtName, forwardEvent);
	this.eventForwarders.push({name: evtName, handler: forwardEvent});
      });
    // } else {
    //   globalThis.__customLogger?.warn('event-forwarder: target is not an a-entity:',
    // 		   this.data.target);
    // }
    registerResetTarget(this);
  },
  remove: function() {
    this.eventForwarders.forEach( (evtObj) => {
      this.el.removeEventListener(evtObj.name, evtObj.handler);
    });
    this.eventForwarders = [];
  }
});
