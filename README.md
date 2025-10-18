# A-Frame components for animating robot arms in A-Frame using ik-cd-worker

## Installation and Startup of the example [`App.jsx`](./src/App.jsx)
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
## library registry

This package is not registered in `npmjs.org`, but can be intalled from tar ball
in [github release](https://github.com/TSUSAKA-ucl/robot-loader/releases).

When using this library, you will need the assets in addition to the library code.
The frontend must be able to fetch `ik-cd-worker` and the robot's assets, such as `urdf.json` and meshes.
They can be copied from other packages in `node_modules` by `viteStaticCopy`. 
They will **not be bound** by a JavaScript binder such as Rollup.
Please see [`vite.config.mjs`](./vite.config.mjs) and [`package.json`](./package.json).

## A-Frame components in this repository
The components in the table below are defined in this repository

| A-Frame components | file name |
|--------------------|-----------|
|`arm-motion-ui`        |       `armMotionUI.js`|
|`add-frameObject`      |       `axesFrame.js`|
|`a-axes-frame` |       `axesFrame.js`|
|`ik-worker`    |       `ikWorker.js`|
|`set-joints-directly-in-degree`        |       `reflectWorkerJoints.js`|
|`reflect-worker-joints`        |       `reflectWorkerJoints.js`|
|`robot-loader` |       `robotLoader.js`|
|`robot-registry`       |       `robotRegistry.js`|
|`event-distributor`    |       `robotRegistry.js`|
|`target-selector`      |       `robotRegistry.js`|
|`thumbstick-menu`      |       `vrControllerThumbMenu.js`|
|`thumbmenu-event-handler`      |       `vrControllerThumbMenu.js`|
