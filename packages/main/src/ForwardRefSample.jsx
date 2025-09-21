// **** Not Used **** SAMPLE CODE 
// ****************************************************************
// ex.1
// ****************************************************************
// worker component
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const CustomComponent = forwardRef((props, ref) => {
  const objRef = useRef(null);

  useEffect(() => {
    // マウント時にオブジェクト生成
    objRef.current = new SomeObject();

    return () => {
      // アンマウント時に破棄
      if (objRef.current) {
        objRef.current.dispose();
        objRef.current = null;
      }
    };
  }, []);

  // ref 経由で外部に公開
  useImperativeHandle(ref, () => ({
    get object() {
      return objRef.current;
    }
  }));

  return <div>コンポーネントの内容</div>;
});

export default CustomComponent;

// ****************************************************************
// user side
import React, { useRef, useEffect } from 'react';
import CustomComponent from './CustomComponent';

function App() {
  const compRef = useRef(null);

  useEffect(() => {
    if (compRef.current) {
      const obj = compRef.current.object;
      console.log('参照できるオブジェクト:', obj);
      obj.doSomething();
    }
  }, []);

  return (
    <div>
      <CustomComponent ref={compRef} />
    </div>
  );
}

export default App;
// ****************************************************************
// code for explanation
// child component
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const Child = forwardRef((props, ref) => {
  const localValue = useRef(0);

  useImperativeHandle(ref, () => ({
    increment() {
      localValue.current++;
      console.log('localValue:', localValue.current);
    }
  }));

  return <div>Child Component</div>;
});

export default Child;
// ****************************************************************
// parent component
import React, { useRef } from 'react';
import Child from './Child';

function App() {
  const childRef = useRef(null);

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={() => childRef.current.increment()}>
        Increment in Child
      </button>
    </div>
  );
}
// ****************************************************************
// KinematicsWorkerは以下の4個を親コンポーネント(user component)に返す必要がある
// workerRefは通常のkey/value、他の3個はgetterで都度最新の値をとってくる
//https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/get

// const workerRef = useRef(null);
// const workerLastJoints = useRef(null);
// const workerLastStatus = useRef(null);
// const workerLastPose = useRef(null);
//

