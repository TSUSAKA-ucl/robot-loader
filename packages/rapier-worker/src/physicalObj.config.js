import {getRigidBody, getJoint,
	FunctionState, getStepTime} from './rapierObjectUtils.js'

// ****************
// Create a dynamic rigid-body.
const hand23props = {
  density: 0.000000000002, // or mass or massProperties
  friction: 0.3,
  frictionCombineRule: 'Min',
  restitution: 0.7,
  restitutionCombineRule: 'Min',
};
//
const mag=0.25;
const rigidBodyArray = [
  { name: 'floor',
    type: 'kinematicPosition',
    collider: { shape: 'box',
		size: {x: 10.5, y:0.1, z:10.5},
		color: '#7BC8A4',
	      },
  },
  { name: 'box1',
    type: 'kinematicPosition',
    position: {x: (-1.0)*mag, y: (2.5)*mag, z: (-3.0)*mag},
    orientation: {w: 0.991445, x:0.0, y:0.0, z:0.130526},
    collider: { shape: 'box',
		size: {x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag},
		color: '#4CC3D9', // light blue color
	      },
  },
  { name: 'box2',
    position: {x: (-1.0)*mag, y: (4.0)*mag, z: (-3.0)*mag},
    orientation: {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		color: 'PowderBlue',
	      },
  },
  { name: 'box3',
    position: {x: (-1.0)*mag, y: (3.5)*mag, z: (-3.0)*mag},
    orientation: {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		color: 'SteelBlue'
	      },
  },
  //
  { name: 'hand1',
    type: 'kinematicPosition',
    position: {x: (1.0)*mag, y: (2.0)*mag, z: (-3.0)*mag},	
    orientation: {w: 0.991445, x:0.0, y:0.0, z:0.130526},
    collider: { shape: 'box',
		size: {x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag},
		color: 'Crimson', // dark red color
	      },
  },
  { name: 'hand2',
    position: {x: (1.0)*mag, y: (4.0)*mag, z: (-3.0)*mag},
    orientation: {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		props: hand23props,
		color: '#FF6347',	// tomato color
	      },
  },
  { name: 'hand3',
    position: {x: (1.0)*mag, y: (3.5)*mag, z: (-3.0)*mag},
    orientation: {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		props: hand23props,
		density: 0.02,
		color: 'LightCoral',
	      },
  },
  //
  { name: 'end1',
    position: {x: (0.0)*mag, y: (3.5)*mag, z: (-3.0)*mag},
    orientation: {w: 1.0, x:0.0, y:0.0, z:0.0},
    collider: { shape: 'box',
		size: {x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag},
		color: 'Moccasin' // light orange color
	      },
  },
  { name: 'end2',
    position: {x: (0.0)*mag, y: (3.5-0.6)*mag, z: (-3.0+0.6+0.2)*mag},
    orientation: {w: 1.0, x:0.0, y:0.0, z:0.0},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		color: 'LemonChiffon'	// light yellow color
	      },
  },
  { name: 'end3',
    position: {x: (0.0)*mag, y: (3.5+0.6)*mag, z: (-3.0+0.6+0.2)*mag},
    orientation: {w: 1.0, x:0.0, y:0.0, z:0.0},
    collider: { shape: 'box',
		size: {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},
		color: 'Khaki' // light yellow color
	      },
  },
];

// ****************
// definition of joints
const x = { x: 1.0, y: 0.0, z: 0.0 };
const y = { x: 0.0, y: 1.0, z: 0.0 };
// const z = { x: 0.0, y: 0.0, z: 1.0 };
const o = { x: 0.0, y: 0.0, z: 0.0 };
//
// anchor points on objects
const apBoxBJnt1A = {x: (0.0)*mag, y: (-0.6)*mag, z: (0.2)*mag};
const apBoxBJnt1B = {x: (0.0)*mag, y: (0.05)*mag, z: (-0.6)*mag};
const apBoxBJnt2A = {...apBoxBJnt1A}; apBoxBJnt2A.y = -apBoxBJnt2A.y;
const apBoxBJnt2B = {...apBoxBJnt1B}; apBoxBJnt2B.y = -apBoxBJnt2B.y;
//
const apHandJnt1A = {x: (0.0)*mag, y: (-0.6)*mag, z: (0.6+0.201)*mag};;
const apHandJnt2A = {...apHandJnt1A}; apHandJnt2A.y = -apHandJnt1A.y;
//
const apEndJnt1A = {x: (0.0)*mag, y: (-0.6+0.28)*mag, z: (0.2)*mag};
const apEndJnt2A = {...apEndJnt1A}; apEndJnt2A.y = -apEndJnt1A.y;
const apEndJnt1B = {x: (0.0)*mag, y: (0.0)*mag, z: (-0.6)*mag};
const apEndJnt2B = {...apEndJnt1B}; apEndJnt2B.y = -apEndJnt1B.y;
const endJStiffness = 2.0*800.0;
const endJDamping = 1000.0;
//
const jointArray = [
  {
    name: 'boxJoint1',  type: 'revolute',
    bodyA: 'box1',  anchorA: apBoxBJnt1A,
    bodyB: 'box2',  anchorB: apBoxBJnt1B,
    axis: x,
  },
  {
    name: 'boxJoint2',  type: 'revolute',
    bodyA: 'box1',  anchorA: apBoxBJnt2A,
    bodyB: 'box3',  anchorB: apBoxBJnt2B,
    axis: x,
  },
  //
  {
    name: 'handJoint1',  type: 'prismatic',
    bodyA: 'hand1',  anchorA: apHandJnt1A,
    bodyB: 'hand2',  anchorB: o,
    axis: y,
    limits: [-0.05*mag, 0.65*mag],
    motor: {
      type: 'position',
      targetPos: 0, stiffness: endJStiffness, damping: endJDamping
    },
  },
  {
    name: 'handJoint2',  type: 'prismatic',
    bodyA: 'hand1',  anchorA: apHandJnt2A,
    bodyB: 'hand3',  anchorB: o,
    axis: y,
    limits: [-0.65*mag, 0.05*mag],
    motor: {
      type: 'position',
      targetPos: 0, stiffness: endJStiffness, damping: endJDamping
    },
  },
  {
    name: 'endJoint1',  type: 'prismatic',
    bodyA: 'end1',  anchorA: apEndJnt1A,
    bodyB: 'end2',  anchorB: apEndJnt1B,
    axis: y,
    limits: [-0.5, 0.5],
    motor: {
      type: 'position',
      targetPos: 0, stiffness: endJStiffness, damping: endJDamping
    },
  },
  {
    name: 'endJoint2',  type: 'prismatic',
    bodyA: 'end1',  anchorA: apEndJnt2A,
    bodyB: 'end3',  anchorB: apEndJnt2B,
    axis: y,
    limits: [-0.5, 0.5],
    motor: {
      type: 'position',
      targetPos: 0, stiffness: endJStiffness, damping: endJDamping
    },
  },
];

// ****************
const functionArray = [
  { name: 'box1Translation',
    initialState: FunctionState.ACTIVE,
    method: function (t) {
      const object = this;
      if (!object.time) object.time = t;
      const ot = object.time;
      const rigidbody = getRigidBody('box1');
      rigidbody
        .setNextKinematicTranslation({x: -1.0*mag, y: 2.5*mag,
				      z: (-3.0+0.5*Math.sin(2.0*Math.PI*ot))*mag
                                     });
      object.time += getStepTime();
    },
  },
  { name: 'endJointClose',
    method: () => {
      getJoint('endJoint1')
        .configureMotorPosition(0.1, endJStiffness, endJDamping);
      getJoint('endJoint2')
        .configureMotorPosition(-0.1, endJStiffness, endJDamping);
    },
  },
  { name: 'endJointOpen',
    method: () => {
      getJoint('endJoint1')
        .configureMotorPosition(-0.1, endJStiffness, endJDamping);
      getJoint('endJoint2')
        .configureMotorPosition(0.1, endJStiffness, endJDamping);
    },
  },
  { name: 'handJointClose',
    method: () => {
      getJoint('handJoint1')
        .configureMotorPosition(0.65*mag, endJStiffness, endJDamping);
      getJoint('handJoint2')
        .configureMotorPosition(-0.65*mag, endJStiffness, endJDamping);
    },
  },
  { name: 'handJointOpen',
    method: () => {
      getJoint('handJoint1')
        .configureMotorPosition(-0.65*mag, endJStiffness, endJDamping);
      getJoint('handJoint2')
        .configureMotorPosition(0.65*mag, endJStiffness, endJDamping);
    },
  },
];

// ****************
// exports
export default {
  rigidBodies: rigidBodyArray,
  joints: jointArray,
  functions: functionArray,
}
