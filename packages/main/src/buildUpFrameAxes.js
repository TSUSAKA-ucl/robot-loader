// **** Not Currently Used ****
// visibleがうまく行かなかったので、当面はJSX版でいく
const sqrt0_5 = 0.7071067811865476;

function buildUpFrameAxes(parent) {
  // definition of the controller axes marker
  const conAxisLength = 0.100;
  const conLength = (conAxisLength/2).toString();
  const conHeight = (conAxisLength).toString();
  const conRadius = '0.0035';

  const sphere = document.createElement('a-sphere');
  sphere.object3D.visible = true;
  sphere.setAttribute('scale', '0.052 0.052 0.052');
  sphere.setAttribute('color', 'white');
  parent.appendChild(sphere);
  const xAxis = document.createElement('a-cylinder');
  xAxis.setAttribute('height', '0.5'); ///`${conHeight}`);
  xAxis.setAttribute('radius', '0.2'); // `${conRadius*10}`);
  xAxis.setAttribute('color', 'red');
  xAxis.setAttribute('position', `${conLength} 0 0`);
  xAxis.setAttribute('rotation', '0 0 -90');
  xAxis.object3D.visible = true;
  sphere.appendChild(xAxis);
  const yAxis = document.createElement('a-cylinder');
  sphere.appendChild(yAxis);
  yAxis.setAttribute('height', conHeight);
  yAxis.setAttribute('radius', conRadius);
  yAxis.setAttribute('color', '#00ff00');
  yAxis.object3D.position.set(0, conLength, 0);
  // yAxis.object3D.quaternion.set(0, 0, 0);
  const zAxis = document.createElement('a-cylinder');
  sphere.appendChild(zAxis);
  zAxis.setAttribute('height', conHeight);
  zAxis.setAttribute('radius', conRadius);
  zAxis.setAttribute('color', 'blue');
  zAxis.object3D.position.set(0, 0, conLength);
  zAxis.object3D.quaternion.set(sqrt0_5, 0, 0, sqrt0_5);
  return sphere;
}

