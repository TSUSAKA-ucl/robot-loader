import RAPIER from '@dimforge/rapier3d-compat'

async function run_simulation() {
  await RAPIER.init();
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: -9.81, z: 0.0 };
  let world = new RAPIER.World(gravity);

  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.5, 0.1, 10.5);
  world.createCollider(groundColliderDesc);
  
  // Create a dynamic rigid-body.
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(-1.0, 2.0, -3.0)
      .setRotation({w: 0.991445, x:0.0, y:0.0, z:0.130526});
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  // Create a cuboid collider attached to the dynamic rigidBody.
  let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.6, 0.2);
  let collider = world.createCollider(colliderDesc, rigidBody);

  // Game loop. Replace by your own game loop system.
  let gameLoop = () => {
    // Step the simulation forward.  
    world.step();

    // Get and print the rigid-body's position.
    let position = rigidBody.translation();
    let orientation = rigidBody.rotation();
    // console.log("Rigid-body position: ", position.x, position.y);
    self.postMessage({type: 'poses', body: 'box1',
		      pose: [position.x, position.y, position.z,
			     orientation.w, orientation.x, orientation.y, orientation.z
			    ]});
    setTimeout(gameLoop, 16);
  };

  gameLoop();
}

run_simulation();
