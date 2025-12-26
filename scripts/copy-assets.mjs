import fs from 'fs';
import path from 'path';
const scanDir = path.resolve('node_modules/@ucl-nuee');
const dstDir = path.resolve('public');
// node_modules/@ucl-nueeの下のパッケージのpublicを集めてdstDirの下にコピーする
// ソースのpublicの下がディレクトリの場合はそのツリーを辿り構造を保ってコピーする
// COPY_ASSETS_IGNOREファイルが置いてあるディレクトリより下はコピーしない
// .gitignoreはコピーしない
const copyTree = (src, dst) => {
  if (fs.existsSync(path.join(src, 'COPY_ASSETS_IGNORE'))) {
    return;
  }
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const dstPath = path.join(dst, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyTree(srcPath, dstPath);
    } else {
      if (item !== '.gitignore') {
	fs.copyFileSync(srcPath, dstPath);
      }
    }
  });
};

fs.readdirSync(scanDir).forEach((pkgName) => {
  const srcDir = path.join(scanDir, pkgName, 'public');
  if (fs.existsSync(srcDir)) {
    copyTree(srcDir, dstDir); // path.join(dstDir, pkgName));
    console.log(`Copied public assets from ${pkgName}`);
  }
});
