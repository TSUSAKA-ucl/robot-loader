import RAPIER from '@dimforge/rapier3d-compat'

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
  if (shape && shape.type === 'Cuboid') {
    message.size = {x: shape.halfExtents.x * 2,
		    y: shape.halfExtents.y * 2,
		    z: shape.halfExtents.z * 2
		   };
  }
}

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
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(-1.0, 2.0, -3.0)
      .setRotation({w: 0.991445, x:0.0, y:0.0, z:0.130526});
  let rigidBody = world.createRigidBody(rigidBodyDesc);
  // Create a cuboid collider attached to the dynamic rigidBody.
  let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.6, 0.2);
  let collider = world.createCollider(colliderDesc, rigidBody);
  const box1msg = {type: 'definition', id: 'box1', shape: 'cuboid',
		   color: "#4CC3D9" };
  writeCuboidSizeToMessage(collider, box1msg);
  writePoseToMessage(rigidBody, box1msg);
  self.postMessage(box1msg);
  
  // Create a dynamic rigid-body.
  let box2Desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(-1.0, 4.0, -3.0)
      .setRotation({w: 0.991445, x:0.0, y:0.0, z:-0.130526});
  let box2 = world.createRigidBody(box2Desc);
  // Create a cuboid collider attached to the dynamic rigidBody.
  let box2ColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.6, 0.2);
  let box2Collider = world.createCollider(box2ColliderDesc, box2);
  const box2msg = {type: 'definition',
		   id: 'box2',
		   shape: 'cuboid',
		   size: {x:0.5*2, y:0.6*2, z:0.2*2},
		   color: "#FF6347"
		  };
  writePoseToMessage(box2, box2msg);
  self.postMessage(box2msg);

  // Game loop. Replace by your own game loop system.
  let gameLoop = () => {
    // Step the simulation forward.  
    world.step();

    // Get and print the rigid-body's position.
    const msg = {type: 'poses', body: 'box1'};
    writePoseToMessage(rigidBody, msg);
    self.postMessage(msg);
    msg.body = 'box2';
    writePoseToMessage(box2, msg);
    self.postMessage(msg);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
}

run_simulation();
