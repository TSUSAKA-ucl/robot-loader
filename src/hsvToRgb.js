// https://ja.wikipedia.org/wiki/HSV%E8%89%B2%E7%A9%BA%E9%96%93
export function hsvToRgb(H,S,V) {
  let C = V * S;
  let Hp = H*360 / 60;
  let X = C * (1 - Math.abs(Hp % 2 - 1));

  let R, G, B;
  if (0 <= Hp && Hp < 1) {[R,G,B]=[C,X,0]};
  if (1 <= Hp && Hp < 2) {[R,G,B]=[X,C,0]};
  if (2 <= Hp && Hp < 3) {[R,G,B]=[0,C,X]};
  if (3 <= Hp && Hp < 4) {[R,G,B]=[0,X,C]};
  if (4 <= Hp && Hp < 5) {[R,G,B]=[X,0,C]};
  if (5 <= Hp && Hp < 6) {[R,G,B]=[C,0,X]};

  let m = V - C;
  [R, G, B] = [R+m, G+m, B+m];

  // const crop = x => x>=1 ? 255 : Math.floor(x * 256);
  return [R ,G, B]; // .map(crop);
}

export function rgbToHsv(r,g,b) {
  [r,g,b] = [r,g,b].map((x)=>{
    // x = x/256;
    if (x<0) x=0;
    if (x>1) x=1;
    return x;
  });
  let max = r > g ? r : g;
  max = max > b ? max : b;
  let min = r < g ? r : g;
  min = min < b ? min : b;
  let h = max - min;
  if (h > 0.0) {
    if (max === r) {
      h = (g - b) / h;
      if (h < 0.0) {
        h += 6.0;
      }
    } else if (max == g) {
      h = 2.0 + (b - r) / h;
    } else {
      h = 4.0 + (r - g) / h;
    }
  }
  h /= 6.0;
  let s = (max - min);
  if (max != 0.0)
    s /= max;
  let v = max;
  return [h,s,v];
}
