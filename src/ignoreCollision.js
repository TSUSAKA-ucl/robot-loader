// ================ 本コンポーネントの説明 ================
// ignore collisionコンポーネントで、他のロボットとの干渉チェックの除外を定義できるようにする
// schema引数は、 myLinkNumber(整数):other_entity_id(DOM ID):othersLinkNumber(整数),...
// の形。

// この引数をik-workerにpostするが、その前にまず、
// robot ID(DOM ID)===robot名文字列 からabIdを手に入れる。
// entity(el)のentity.ikWorkerReady===trueならばentity.abId(番号)が設定済。設定されていない場合は
// そのentity(のik-worker経由)ではcollision detectionはできない。
// entity.ikWorkerReadyがundefinedの場合は(可能なら)ik-worker-readyイベントがemitされるはず

// その後、[myLink(整数), abId(整数), link(整数)]の配列のignore pairの配列に変換する
// myLinkとlinkはリンク番号で0から始まる整数

// その配列をik-workerにpostMessageで送る(type新設)。
// ik-workerへは、(定義されていれば)this.el.workerRef.current.postMessage(msg);
// でpostMessageできる。msgは {type:'ignore_pairs', ignorePairs:ignorePairs} の形。ignorePairsは上記の配列の配列
// ================ 以上 aframe component内 ================

// ================ 以下(備忘録) ================
// ================ ik-worker内 ================
// ik-workerは、my_abId:my_link, abId:link型(整数4個)をパックしたtyped arrayにしてcd-workerにRPCする(command新設)
// ================ 以下 cd-worker内 ================
// cd-workerは、abId:linkをrb通し番号に変換して、ignore pairsをメンテする。
// test pairs(all)を生成した(どこで??)後にignore pairsを取り除く
// ================ 説明おわり ================

import {customLogger} from './customLogger.js'
globalThis.__customLogger = customLogger;
import AFRAME from 'aframe';

AFRAME.registerComponent('ignore-collision', {
  // example usage:
  // ignore-collision="other:g1r-unitree-r-arm; data: 0/1, 0/0, 1/0"
  // 
  schema: {
    other: { type: 'string' },
    data: { type: 'array' }
  },

  parse: function () {
    // console.log('Parsing ignore-collision schema value:', this.data);
    // DOM elと整数のペアの配列を返す。
    const otherEntity = this.data.other ? document.getElementById(this.data.other) : null;
    const linkPairArray = this.data.data.map(pairStr => {
      const [myLink, otherLink] = pairStr.split('/').map(numStr => parseInt(numStr.trim()));
      if (isNaN(myLink) || isNaN(otherLink)) {
	console.warn('Invalid link numbers in ignore-collision data:', pairStr);
	return null;
      }
      return { myLink, otherLink };
    }).filter(pair => pair !== null);
    // console.log('Parsed ignore-collision pairs:', linkPairArray);
    // 返すオブジェクトは、otherEntityとlinkPairArrayを含む形にする
    return {
      otherEntity,
      linkPairs: linkPairArray
    };
  },

  init: function () {
    // 初期化時には特に何もしない。updateでikWorkerReadyを待ってpostする
  },
  update: function () { // ikWorkerReadyを調べてpostするかaddEventListenerする
    const { otherEntity, linkPairs } = this.parse();
    const el = this.el;
    // const data = this.data;
    if (el.ikWorkerReady) {
      this.postIgnorePairs(otherEntity, linkPairs);
    }
    else {
      el.addEventListener('ik-worker-ready', () => {
	this.postIgnorePairs(otherEntity, linkPairs);
      }, { once: true });
    }
  },
  postIgnorePairs: function (otherEntity, linkPairs) {
    // console.log('$$$$$$$ enter postIgnorePairs. data:', this.data);
    const el = this.el;
    const data = this.data;
    // otherEntity.ikWorkerReadyがtrueでなければaddEventListenerして待つ
    const realPostFunc = () => {
      if (typeof otherEntity.abId !== 'number') {
	// この場合はcd-workerと関係していないので無視してよいが、とりあえず警告を出す
	console.warn(`Entity with ID ${data.other} does not have a valid abId. Skipping ignore pairs for this entity.`);
	return;
      } else {
	const ignorePairs = linkPairs.map(pair => ({
	  myLink: pair.myLink,
	  otherAbId: otherEntity.abId,
	  otherLink: pair.otherLink
	}));
	if (ignorePairs.length > 0) {
	  // console.log('$$$$$$$$$ Posting ignore pairs to ik-worker:', ignorePairs);
	  if (typeof el.workerRef?.current?.postMessage === 'function') {
	    el.workerRef.current.postMessage({ type: 'ignore_pairs', ignorePairs });
	  } else {
	    console.warn('Worker reference is not available to post ignore pairs.');
	    console.warn('this.el.workerRef:', el.workerRef);
	    console.warn('otherEntity.workerRef:', otherEntity.workerRef);
	  }
	}
      }
    };
    if (otherEntity.ikWorkerReady && this.el.ikWorkerReady) {
      realPostFunc();
    } else if (!otherEntity.ikWorkerReady && this.el.ikWorkerReady) {
      otherEntity.addEventListener('ik-worker-ready', realPostFunc, { once: true });
    } else if (otherEntity.ikWorkerReady && !this.el.ikWorkerReady) {
      this.el.addEventListener('ik-worker-ready', realPostFunc, { once: true });
    } else {
      this.el.addEventListener('ik-worker-ready', () => {
	if (otherEntity.ikWorkerReady) {
	  realPostFunc();
	} else {
	  otherEntity.addEventListener('ik-worker-ready', realPostFunc, { once: true });
	}
      }, { once: true });
    }
  }
});
