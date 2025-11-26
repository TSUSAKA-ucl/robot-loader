import AFRAME from 'aframe'

AFRAME.registerComponent('attach-to-another', {
  schema: {
    to: {type: 'string'},
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
	// console.warn('QQQQQ endLink.hasLoaded?',endLink.hasLoaded);
	try {
	  endLink.appendChild(this.el);
	  console.log(`QQQQQ Attached ${this.el.id} to ${robot.id}'s endLink:`,endLink);
	  this.el.removeAttribute('position');
	  this.el.removeAttribute('rotation');
	  this.el.removeAttribute('scale');
	  this.el.object3D.position.set(0, 0, 0);
	  this.el.object3D.quaternion.set(0, 0, 0, 1);
	  robot.emit('attached', {child: this.el}, false);
	  this.el.emit('attached', {parent: robot, endLink: endLink}, false);
	  // forwardABbuttonEvent(robot, this.el);
	} catch (e) {
	  console.error('appendChild failed:',e);
	}
      };
      const robotEl = document.getElementById(this.data.to);
      // console.warn('QQQQQ attach-to-another: found robotEl.id:', robotEl.id);
      if (robotEl?.endLink && Array.isArray(robotEl?.axes) ) { // robot has been registered
	attachToRobot(robotEl);
      } else if (typeof robotEl?.addEventListener === 'function') {
	robotEl.addEventListener('robot-registered', () => {
	  // console.warn(`QQQQQ Received robot-registered event from ${this.data.to}`,
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
    console.warn('forwarding abuttondown event to attached child:', to);
    to.emit('abuttondown', evt, false);
  });
  from.addEventListener(a+'buttonup', (evt) => {
    console.warn('forwarding abuttonup event to attached child:', to);
    to.emit('abuttonup', evt, false);
  });
  from.addEventListener(b+'buttondown', (evt) => {
    console.warn('forwarding bbuttondown event to attached child:', to);
    to.emit('bbuttondown', evt, false);
  });
  from.addEventListener(b+'buttonup', (evt) => {
    console.warn('forwarding bbuttonup event to attached child:', to);
    to.emit('bbuttonup', evt, false);
  });
}

AFRAME.registerComponent('attach-event-broadcaster', {
  init: function() {
    this.el.addEventListener('attached', (evt) => {
      const child = evt.detail.child;
      console.warn('###### event broadcaster: attached event received:', evt);
      forwardABbuttonEvent(this.el, 'a', 'b', child);
      forwardABbuttonEvent(this.el, 'x', 'y', child);
    });
  }
});
