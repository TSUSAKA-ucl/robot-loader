# Animating objects in A-Frame using Rapier

## Installation and Startup

1. `pnpm install`
2. `cd packages/main/ && pnpm build`
3. `cd ../rapier-worker/ && pnpm build`
4. `cd ../main && pnpm dev` or  
   `cd ../main/dist/ && <START HTTPS SERVER>`

## How to Use this Sample Scene

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
