import RAPIER from '@dimforge/rapier3d-compat'

const sharedBodies = {};
const mag=0.25;

run_simulation();
async function run_simulation() {
  await RAPIER.init();
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: -9.81, z: 0.0 };
  let world = new RAPIER.World(gravity);

  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.5, 0.1, 10.5);
  const groundCollider = world.createCollider(groundColliderDesc);
  const groundPlaneMsg = {type: 'definition', id: 'plane1', shape: 'cuboid',
			  color: "#7BC8A4"};
  writeCuboidSizeToMessage(groundCollider, groundPlaneMsg);
  writePoseToMessage(groundCollider, groundPlaneMsg);
  self.postMessage(groundPlaneMsg);
  
  // ****************
  // Create a dynamic rigid-body.
  const box1 = boxCreateAndPost('box1', world,
				{x: (-1.0)*mag, y: (2.0)*mag, z: (-3.0)*mag},	// position
				{w: 0.991445, x:0.0, y:0.0, z:0.130526}, // orientation
				{x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag}, // size
				"#4CC3D9", // light blue color
				'kinematicPosition'
			       );
  const box2 = boxCreateAndPost('box2', world,
				{x: (-1.0)*mag, y: (4.0)*mag, z: (-3.0)*mag},	// position
				{w: 0.991445, x:0.0, y:0.0, z:-0.130526},
				{x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},	// size
				"PowderBlue"
			       );
  const box3 = boxCreateAndPost('box3', world,
				{x: (-1.0)*mag, y: (3.5)*mag, z: (-3.0)*mag}, // position
				{w: 0.991445, x:0.0, y:0.0, z:-0.130526},
				{x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag}, // size
				'SteelBlue'
			       );
  const hand1 = boxCreateAndPost('hand1', world,
				 {x: (1.0)*mag, y: (2.0)*mag, z: (-3.0)*mag},	// position
				 {w: 0.991445, x:0.0, y:0.0, z:0.130526}, // orientation
				 {x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag}, // size
				 "Crimson", // dark red color
				 'kinematicPosition'
				);
  const hand2 = boxCreateAndPost('hand2', world,
				 {x: (1.0)*mag, y: (4.0)*mag, z: (-3.0)*mag},	// position
				 {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
				 {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},	// size
				 "#FF6347"	// tomato color
				);
  const hand3 = boxCreateAndPost('hand3', world,
				 {x: (1.0)*mag, y: (3.5)*mag, z: (-3.0)*mag}, // position
				 {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
				 {x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag}, // size
				 'LightCoral'
				);
  const end1 = boxCreateAndPost('end1', world,
				{x: (0.0)*mag, y: (3.5)*mag, z: (-3.0)*mag},	// position
				{w: 1.0, x:0.0, y:0.0, z:0.0}, // orientation
				{x: (0.4)*mag, y: (0.6)*mag, z: (0.2)*mag}, // size
				"Moccasin" // light orange color
			       );
  const end2 = boxCreateAndPost('end2', world,
				{x: (0.0)*mag, y: (3.5-0.6)*mag, z: (-3.0+0.6+0.2)*mag},	// position
				{w: 1.0, x:0.0, y:0.0, z:0.0},
				{x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag},	// size
				"LemonChiffon"	// light yellow color
			       );
  const end3 = boxCreateAndPost('end3', world,
				{x: (0.0)*mag, y: (3.5+0.6)*mag, z: (-3.0+0.6+0.2)*mag}, // position
				{w: 1.0, x:0.0, y:0.0, z:0.0},
				{x: (0.25)*mag, y: (0.05)*mag, z: (0.6)*mag}, // size
				'Khaki' // light yellow color
			       );

  // ****************
  // Create some joints
  const x = { x: 1.0, y: 0.0, z: 0.0 };
  const y = { x: 0.0, y: 1.0, z: 0.0 };
  const z = { x: 0.0, y: 0.0, z: 1.0 };
  const o = { x: 0.0, y: 0.0, z: 0.0 };
  //
  const pnt1a = {x: (0.0)*mag, y: (-0.6)*mag, z: (0.2)*mag};
  const pnt1b = {x: (0.0)*mag, y: (0.05)*mag, z: (-0.6)*mag};
  let jntParams = RAPIER.JointData.revolute(pnt1a, pnt1b, x);
  jntParams.limitsEnabled = true;
  let joint = world.createImpulseJoint(jntParams, box1, box2, true);
  //
  const pnt2a = {x: (0.0)*mag, y: (0.6)*mag, z: (0.2)*mag};
  const pnt2b = {x: (0.0)*mag, y: (-0.05)*mag, z: (-0.6)*mag};
  let jntParams2 = RAPIER.JointData.revolute(pnt2a, pnt2b, x);
  jntParams2.limitsEnabled = true;
  let joint2 = world.createImpulseJoint(jntParams2, box1, box3, true);
  //
  // Create prismatic joint between hand1(tomato) and hand2
  const pnt3a = {x: (0.0)*mag, y: (-0.6)*mag, z: (0.6+0.201)*mag};
  let jntParams3 = RAPIER.JointData.prismatic(pnt3a, o, y);
  jntParams3.limitsEnabled = true;
  jntParams3.limits = [-0.25*mag, 0.25*mag];
  let joint3 = world.createImpulseJoint(jntParams3, hand1, hand2, true);
  // between hand1(tomato) and hand3
  const pnt4a = {x: (0.0)*mag, y: (0.6)*mag, z: (0.6+0.201)*mag};
  let jntParams4 = RAPIER.JointData.prismatic(pnt4a, o, y);
  jntParams4.limitsEnabled = true;
  jntParams4.limits = [-0.25*mag, 0.25*mag];
  let joint4 = world.createImpulseJoint(jntParams4, hand1, hand3, true);

  // another prismatic joint between end1 and end2(tomato)
  const pnt5a = {x: (0.0)*mag, y: (-0.6+0.28)*mag, z: (0.2)*mag};
  const pnt5b = {x: (0.0)*mag, y: (0.0)*mag, z: (-0.6)*mag};
  let jntParams5 = RAPIER.JointData.prismatic(pnt5a, pnt5b, y);
  jntParams5.limitsEnabled = true;
  jntParams5.limits = [-0.5, 0.5];
  let joint5 = world.createImpulseJoint(jntParams5, end1, end2, true);
  joint5.configureMotorPosition(0.0, 10.0*800.0, 100.0);
  // between end1 and end3(blue)
  const pnt6a = {x: (0.0)*mag, y: (0.6-0.28)*mag, z: (0.2)*mag};
  const pnt6b = {x: 0.0*mag, y: -0.0*mag, z: -0.6*mag};
  let jntParams6 = RAPIER.JointData.prismatic(pnt6a, pnt6b, y);
  jntParams6.limitsEnabled = true;
  jntParams6.limits = [-0.5, 0.5];
  let joint6 = world.createImpulseJoint(jntParams6, end1, end3, true);
  joint6.configureMotorPosition(-0.0, 10.0*800.0, 100.0);
  


  // ****************
  // handling of the messages from the main thread
  let snapshot = null;
  let doStep = false;
  let singleStep = false;
  self.onmessage = (e) => {
    const data = e.data;
    switch (data.type) {
    case 'reset':
      if (snapshot) {
	console.log("Resetting simulation");
	world = RAPIER.World.restoreSnapshot(snapshot);
      }
      break;
    case 'stop':
      console.log("Stopping simulation");
      doStep = false;
      break;
    case 'start':
      console.log("Starting simulation");
      if (!doStep) {
	doStep = true;
	singleStep = false;
      }
      break;
    case 'step':
      if (!doStep) {
	singleStep = true;
	doStep = true;
      }
      break;
    case 'snapshot':
      if (!doStep) {
	snapshot = world.takeSnapshot();
	console.log("Snapshotting simulation");
      }
      break;
    case 'setNextPose':
      {
	const body = sharedBodies[data.id];
	if (body) {
	  const position = new RAPIER.Vector3(data.pose[0], data.pose[1], data.pose[2]);
	  const orientation = new RAPIER.Quaternion(data.pose[3],
						    data.pose[4], data.pose[5], data.pose[6]);
	  setNextPose(body, position, orientation);
	}
      }
      break;
    default:
      console.warn("Worker: Unknown message", data);
    }
  }
      
  // ****************
  // Game loop. Replace by your own game loop system.
  let firstStep = true;
  let changeJointMotor = true;
  snapshot = world.takeSnapshot();
  const workerTimeStep = 1.0 / 60.0;
  const loopTimeStep = workerTimeStep * 1000;
  world.timestep = workerTimeStep;
  let time = 0.0;
  let gameLoop = () => {
    // Step the simulation forward.  
    if (doStep) {
      world.step();
      time += workerTimeStep;
      if (firstStep) {
	firstStep = false;
	// The first step is the warm up step to propagate
	// the position corrections made by the joints.
	Object.keys(sharedBodies).forEach((id) => {
	  sharedBodies[id].setLinvel({x:0, y:0, z:0}, true);
	  sharedBodies[id].setAngvel({x:0, y:0, z:0}, true);
	});
      }
      if (singleStep) { doStep = false; singleStep = false; }
    }
    if (!snapshot) {
      snapshot = world.snapshot;
    }

    if (time <= 5.0) {
      box1.setNextKinematicTranslation({x: -1.0*mag, y: 2.0*mag,
					z: (-3.0 + 0.5*Math.sin(2.0*Math.PI*time))*mag});
    }
    if (time > 6.0) {
      if (changeJointMotor) {
	joint5.configureMotorPosition(0.2, 0.0, 0.0);
	joint6.configureMotorPosition(-0.2, 0.0, 0.0);
	changeJointMotor = false;
      }
    }
    // Get and post the rigid-bodies poses
    const msg = {type: 'poses', id: null, pose: null};
    Object.keys(sharedBodies).forEach((id) => {
      msg.id = id;
      writePoseToMessage(sharedBodies[id], msg);
      self.postMessage(msg);
    });
    setTimeout(gameLoop, loopTimeStep);
  };

  gameLoop();
}



function writePoseToMessage(body, message) {
  if (!body) return;
  const position = body.translation();
  const orientation = body.rotation();
  message.pose = [position.x, position.y, position.z,
		  orientation.w, orientation.x, orientation.y, orientation.z
		 ];
}
function writeCuboidSizeToMessage(collider, message) {
  if (!collider) return;
  const shape = collider.shape;
  if (shape && shape.type === RAPIER.ShapeType.Cuboid) {
    message.size = {x: shape.halfExtents.x * 2,
		    y: shape.halfExtents.y * 2,
		    z: shape.halfExtents.z * 2
		   };
    // console.log("msg with Cuboid size:", message);
  } else {
    console.warn("Collider shape is not Cuboid:", shape);
    console.warn("msg without size:", message);
  }
}

function boxCreateAndPost(id,
			  world, position, rotation, size, color,
			  dynamicsType = 'dynamic',
			  share = true, shareList = sharedBodies
			 ) {
  const {box, boxCollider, boxmsg}
	= createBox(world, position, rotation, size, color, id, dynamicsType);
  self.postMessage(boxmsg);
  if (share) {
    shareList[id] = box;
  }
  return box;
}

function createBox(world, position, rotation, size, color, id,
		  dynamicsType = 'dynamic') {
  // Create a dynamic rigid-body.
  let boxDesc;
  switch (dynamicsType) {
  case 'dynamic':
    boxDesc = RAPIER.RigidBodyDesc.dynamic()
    break;
  case 'kinematicPosition':
    boxDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    break;
  case 'kinematicVelocity':
    boxDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
    break;
  case 'fixed':
    boxDesc = RAPIER.RigidBodyDesc.fixed()
    break;
  default:
    console.warn("Unknown dynamics type:", dynamicsType,
		 "using dynamic.");
    boxDesc = RAPIER.RigidBodyDesc.dynamic()
  }
  boxDesc
    .setTranslation(position.x, position.y, position.z)
    .setRotation(rotation);
  let box = world.createRigidBody(boxDesc);
  // Create a cuboid collider attached to the dynamic rigidBody.
  let boxColliderDesc = RAPIER.ColliderDesc.cuboid(size.x, size.y, size.z);
  let boxCollider = world.createCollider(boxColliderDesc, box);
  const boxmsg = {type: 'definition', id: id, shape: 'cuboid',
		   color: color };
  writeCuboidSizeToMessage(boxCollider, boxmsg);
  writePoseToMessage(box, boxmsg);
  return {box, boxCollider, boxmsg};
}

function setNextPose(body, position, rotation) {
  if (!body.isKinematic()) {
    console.warn("setNextPose: body is not kinematic:", body);
    return;
  }
  body.setNextKinematicTranslation(position);
  body.setNextKinematicRotation(rotation);
}
