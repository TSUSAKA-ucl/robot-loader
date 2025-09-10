import RAPIER from '@dimforge/rapier3d-compat'

const sharedBodies = {};

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
  
  // Create a dynamic rigid-body.
  const box1id = 'box1';
  const {box: box1, boxCollider: box1Collider, boxmsg: box1msg}
  	= createBox(world,
		    {x: -1.0, y: 2.0, z: -3.0},	// position
		    {w: 0.991445, x:0.0, y:0.0, z:0.130526}, // orientation
		    {x: 0.4, y: 0.6, z: 0.2}, // size
		    "#4CC3D9", // light blue color
		    box1id);
  self.postMessage(box1msg);
  sharedBodies[box1id] = box1;
  
  // Create a dynamic rigid-body.
  const box2id = 'box2';
  const {box: box2, boxCollider: box2Collider, boxmsg: box2msg}
	= createBox(world,
		    {x: -1.0, y: 4.0, z: -3.0},	// position
		    {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
		    {x: 0.25, y: 0.05, z: 0.6},	// size
		    "#FF6347",	// tomato color
		    box2id);
  self.postMessage(box2msg);
  sharedBodies[box2id] = box2;

  // Create a dynamic rigid-body.
  const box3id = 'box3';
  const {box: box3, boxCollider: box3Collider, boxmsg: box3msg}
	= createBox(world,
		    {x: -1.0, y: 3.5, z: -3.0}, // position
		    {w: 0.991445, x:0.0, y:0.0, z:-0.130526},
		    {x: 0.25, y: 0.05, z: 0.6}, // size
		    'blue',
		    box3id);
  self.postMessage(box3msg);
  sharedBodies[box3id] = box3;

  // Create a prismatic joint between the two boxes.
  const x = { x: 1.0, y: 0.0, z: 0.0 };
  const y = { x: 0.0, y: 1.0, z: 0.0 };
  const z = { x: 0.0, y: 0.0, z: 1.0 };
  //
  // let pnt = { x: 0.0, y: 0.0, z: -1.0 };
  // let params = RAPIER.JointData.prismatic(pnt, y, y);
  // params.limitsEnabled = true;
  // params.limits = [-1.5, 0.5];
  // let joint = world.createImpulseJoint(params, box1, box2, true);
  const pnt1a = { x: 0.0, y: -0.6, z: 0.2 };
  const pnt1b = { x: 0.0, y: 0.05, z: -0.6 };
  let jntParams = RAPIER.JointData.revolute(pnt1a, pnt1b, x);
  jntParams.limitsEnabled = true;
  let joint = world.createImpulseJoint(jntParams, box1, box2, true);
  //
  const pnt2a = { x: 0.0, y: 0.6, z: 0.2 };
  const pnt2b = { x: 0.0, y: 0.05, z: -0.6 };
  let jntParams2 = RAPIER.JointData.revolute(pnt2a, pnt2b, x);
  jntParams2.limitsEnabled = true;
  let joint2 = world.createImpulseJoint(jntParams2, box1, box3, true);


  // Game loop. Replace by your own game loop system.

  let snapshot = world.snapshot;
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
      doStep = false;
      break;
    case 'start':
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
      snapshot = world.snapshot;
      console.log("Snapshotting simulation");
      break;
    default:
      console.warn("Worker: Unknown message", data);
    }
  }
      
  const workerTimeStep = 1.0 / 60.0;
  const loopTimeStep = workerTimeStep * 1000;
  world.timestep = workerTimeStep;
  let gameLoop = () => {
    // Step the simulation forward.  
    if (doStep) {
      world.step();
      if (singleStep) { doStep = false; singleStep = false; }
    }
    if (!snapshot) {
      snapshot = world.snapshot;
    }
    // Get and print the rigid-body's position.
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

function createBox(world, position, rotation, size, color, id) {
  // Create a dynamic rigid-body.
  let boxDesc = RAPIER.RigidBodyDesc.dynamic()
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
