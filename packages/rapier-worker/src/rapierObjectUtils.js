export const storedBodies = {};
export const storedJoints = {};
export const storedFunctions = {};
export function getRigidBody(name) {
  return storedBodies[name];
}
export function getJoint(name) {
  return storedJoints[name];
}
//
let storedStepTime = 0;
export function setStepTime(t) {
  storedStepTime = t;
}
export function getStepTime() {
  return storedStepTime;
}
