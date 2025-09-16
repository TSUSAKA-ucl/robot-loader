# Animating objects in A-Frame using Rapier

## Installation and Startup
```
pnpm install
```
```
cd packages/main/ && pnpm build
```
```
cd ../rapier-worker/ && pnpm build
```
```
cd ../main && pnpm dev
```
or
```
cd ../main/dist/ && <START HTTPS SERVER>
```
## How to Operate this Sample Scene

1. The three spheres and the light green cylinder are only present
   in the A-frame and are not present in the Rapier model.
2. Pushing the thumbstick toggles the ray on and off.
3. When the ray is displayed, the three spheres are push buttons
   that can be clicked with a ray. The largest sphere is for start/stop,
   and the second sphere is for stepping.
4. When the ray is not displayed, the red object moves as usual while
   the trigger is being pulled, following the movement of the VR controller.
5. The light yellow object is not fixed, and will be thrown off when
   the red object hits it. The blue object is fixed in space only by its base.

### Explanation of the Sample Scene Creation in the Main Thread

1. Modules that users do not need to touch  
   1. [`main.jsx`](packages/main/src/main.jsx): 
	  The root entry point of React components, which users never need to touch.
   2. [`RapierWorker.jsx`](packages/main/src/RapierWorker.jsx):
	  Launch a worker that uses [the Rapier 3D physics engine](https://rapier.rs/) to
	  calculate object movement.

2. User-defined module  
   1. [`App.jsx`](packages/main/src/App.jsx): 
	  The root component of React. In this sample, we define **the appearance
	  and functionality of the three spheres** here, but depending on your
	  application you may want to separate them out in a different location,
	  such as Home.jsx.
   2. [`VrControllerComponents.jsx`](packages/main/src/VrControllerComponents.jsx):
      Definitions of the VR controller operations
