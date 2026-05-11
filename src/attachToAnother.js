import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe'
const THREE = window.AFRAME.THREE;
import './sendBaseCoord.js';

export function registerResetTarget() {
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
    if (!this.el.getAttribute('send-base-coord')) {
      this.el.setAttribute('send-base-coord', '');
    }
    // const events = parseSchemaEvents(this.data.event);
    // this.evtHandlers = [];
    this.onSceneLoaded = () => {
      const attachToRobot = (robot) => {
        // attach this.el to robot's endLink
        const endLink = robot?.endLink;
        if (!endLink) {
          customLogger?.warn(`QQQQQ Robot ${robot.id} has no endLink to attach to.`);
          return;
        }
        if (robot?.realAxes == null || !Array.isArray(robot.realAxes)) {
          customLogger?.warn(`QQQQQ Robot ${robot.id} has no axes array to attach to.`);
          return;
        }
        try {
          const targetAxisNum = this.data.axis-1;
          let targetLink;
          if (targetAxisNum < 0 || robot.realAxes.length <= targetAxisNum) {
            // robot.realAxesの最後の要素をtargetLinkにする
            targetLink = robot.realAxes.length > 0 ? robot.realAxes[robot.realAxes.length - 1].el : endLink;
          } else {
            targetLink = robot.realAxes[targetAxisNum].el;
          }
          // this.el.attached;
          robot.setAttribute('event-forwarder__'+this.el.id,
                             { target: this.el.id,
                               event: this.data.event });
          // this.el.play();
          customLogger?.debug(`QQQQQ Attached ${this.el.id} to ${robot.id}'s`,
                              this.data.axis>=robot.realAxes.length
                              ? `endLink :${endLink.id}`
                              : `axis ${this.data.axis}`);

          this.el.removeAttribute('position');
          this.el.removeAttribute('rotation');
          this.el.removeAttribute('scale');
          this.el.object3D.position.set(0, 0, 0);
          this.el.object3D.quaternion.set(0, 0, 0, 1);

          targetLink.object3D.add(this.el.object3D);

          if (!(robot.attached && Array.isArray(robot.attached))) {
            robot.attached = [];
          }
          robot.attached.push(this.el);
          robot.emit('attached', {child: this.el}, false);
          this.el.emit('attach', {parent: robot, endLink: targetLink}, false);

          const onIkWorkerReady = () => {
            const iHaveAbId = () => {
              // cd-workerがstop dependency listを作れるように、子(自分)の
              // workerのabIdをターゲット(親)robotのik-workerに
              // {type:'stop_dependency', stopAbId: abId}で伝える
              if (typeof this.el.abId === 'number' && robot.workerRef?.current) {
                const stopDependencyMsg = {type:'stop_dependency',
                                           stopAbId: this.el.abId,
                                          };
                if (typeof robot.workerRef.current.postMessage === 'function') {
                  robot.workerRef.current.postMessage(stopDependencyMsg);
                  customLogger?.log('## stop_dependency message posted from',
                                    this.el.id, 'to robot', robot.id,
                                    'message:', stopDependencyMsg);
                } else {
                  customLogger?.warn('## stop_dependency: attach-to-another: ',
                                     'robot.workerRef.current has no postMessage function.',
                                     'robot.workerRef.current:', robot.workerRef.current);
                }
              } else {
                customLogger?.warn('attach-to-another: cannot stop dependency',
                                   ' because abId or workerRef is missing.',
                                   'id:', this.el.id,
                                   'el.abId:', this.el.abId,
                                   'robot.workerRef:', robot.workerRef);
              }
            };
            if (typeof this.el.abId === 'number' && this.el.abId>=0) {
              iHaveAbId();
            } else {
              this.el.addEventListener('ab-id-ready', iHaveAbId, {once: true});
            }
          };
          if (robot.ikWorkerReady) {
            onIkWorkerReady();
          } else {
            robot.addEventListener('ik-worker-ready', onIkWorkerReady, {once: true});
          }
        } catch (e) {
          customLogger?.error('appendChild(TRHEE) failed:',e);
        }
      };
      const robotEl = document.getElementById(this.data.to);
      customLogger?.debug('QQQQQ attach-to-another: found robotEl.id:', robotEl.id);
      if (robotEl?.endLink && Array.isArray(robotEl?.realAxes) ) { // robot has been registered
        attachToRobot(robotEl);
      } else if (typeof robotEl?.addEventListener === 'function') {
        robotEl.addEventListener('robot-registered', () => {
          // customLogger?.debug(`QQQQQ Received robot-registered event from ${this.data.to}`,
          //         'and attaching now.');
          // // You can also check the id, axes, and endLinkEl in the event detail.
          attachToRobot(robotEl);
          this.parentRobotEl = robotEl;
        });
      } else {
        customLogger?.warn(`Cannot attach to ${this.data.to}: not found or invalid robot entity.`);
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
    // customLogger?.debug('attach-to-another: pause called for', this.el.id);
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
    //   customLogger?.warn('event-forwarder: target is not an a-entity:',
    //             this.data.target);
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
