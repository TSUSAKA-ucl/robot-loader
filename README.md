# Animating objects in A-Frame using Rapier

## Installation and Startup
```
pnpm install
```
```
pnpm build
```
```
cd ../main && pnpm dev
```
or
```
cd dist/ && <START HTTPS SERVER>
```
## How to Operate this Sample Scene

1. The three spheres, the light green cylinder and a robot arm
   are only present in the A-frame and are not present in the Rapier model.
2. Pushing the thumbstick and selecting "(pie menu)V" toggles the ray on
   and off.
3. When the ray is displayed, the three spheres are push buttons
   that can be clicked with a ray. The largest sphere is for start/stop,
   and the second sphere is for stepping.
4. When the ray is not displayed, the red object moves as usual while
   the trigger is being pulled, following the movement of the VR controller.
5. The light yellow object is not fixed, and will be thrown off when
   the red object hits it. The blue object is fixed in space only by its base.
6. The pie menu "S" stops the movement of the blue object, and "Q" resume it.
7. The pie menu "P" closes the yellow object, and "T" opens it.

### Explanation of the Sample Scene Creation in the Main Thread

1. Modules that users do not need to touch  
   1. [`main.jsx`](packages/main/src/main.jsx): 
	  The root entry point of React components, which users never need to touch.
   2. [`RapierWorker.jsx`](packages/main/src/RapierWorker.jsx):
	  Launch a worker that uses [the Rapier 3D physics engine](https://rapier.rs/) to
	  calculate object movement.
   3. [`LoadUrdf.jsx`](packages/main/src/LoadUrdf.jsx):
      loads a robot model(URDF with modifiers, glTF) from a directory
      with the robot name and places it on a a-entity(a-plane) with a unique
      name.The robot is registered in a global registry and managed
      by this name.

2. User-defined module  
   1. [`App.jsx`](packages/main/src/App.jsx): 
	  The root component of React. This is where users write
	  user-defined AFRAME views and behaviors that are not related to Rapier,
	  but depending on your application you may want to separate them
	  out in a different location, such as `Home.jsx`.
   2. [`physicalObj.config.js`](packages/rapier-worker/src/physicalObj.config.js): definition file of objects, joints, and user defined functions in Rapier
	  simulation environ
   2. [`ButtonUI.jsx`](packages/main/src/ButtonUI.jsx): 
	  In this sample, we define **the appearance and functionality of
	  the three spheres** that start and stop the Rapier physics engine.
   2. [`VrControllerComponents.jsx`](packages/main/src/VrControllerComponents.jsx):
      Definitions of the VR controller operations

3. Download cite of `rapier-worker`  
   You can download this worker's package by adding the following to your `package.json`   
   ```
   "dependencies": {
     "@ucl-nuee/rapier-worker": "https://github.com/TSUSAKA-ucl/AFrameRapierWorker/releases/download/ver.0.1.0/ucl-nuee-rapier-worker-0.1.0.tgz"
   }
   ```
   Please remove `pnpm pnpm-lock.yaml` and `pnpm-workspace.yaml` before `pnpm intall`

********************************  
CURRENTLY, ONLY AXIS INFORMATION can be obtained directly from robot_registry,
but in the future it would be better to be able to obtain
the END EFFECTOR's el directly as well.
