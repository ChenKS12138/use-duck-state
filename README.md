# use-duck-state

![Build](https://github.com/ChenKS12138/use-duck-state/workflows/Build/badge.svg) ![Testing](https://github.com/ChenKS12138/use-duck-state/workflows/Testing/badge.svg) ![Language](https://img.shields.io/badge/language-typescript-blue.svg?label=language) [![npm version](https://badge.fury.io/js/use-duck-state.svg)](https://badge.fury.io/js/use-duck-state)

A React Hooks Library To Manage Component State.

`use-duck-state`是受[saga-duck](https://github.com/cyrilluce/saga-duck)启发的基于`redux-saga`和`hook`的组件状态管理的方案

## Example

![example](https://github.com/ChenKS12138/use-duck-state/raw/master/images/example.gif)

<a href="https://codesandbox.io/s/couter-example-woy5l?file=/src/App.tsx" ><img src="https://codesandbox.io/static/img/play-codesandbox.svg" /></a>

## Usage

```typescript
import {
  createDuckStateHook,
  Duck,
  reduceFromPayload,
  createToPayload,
} from "use-duck-state";
import createSagaMiddleware from "redux-saga";
import { useEffect, useMemo, useState, useRef } from "react";

import { createLogger } from "redux-logger";

const loggerMiddleware = createLogger({
  collapsed: false,
});

const useDuckState = createDuckStateHook(
  {
    createSagaMiddleware,
    useEffect,
    useMemo,
    useState,
    useRef,
  },
  [loggerMiddleware]
);

class AppDuck extends Duck {
  get quickTypes() {
    enum Type {
      SET_COUNT,
    }
    return {
      ...super.quickTypes,
      ...Type,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      count: reduceFromPayload<number>(types.SET_COUNT, 0),
    };
  }
  get creators() {
    const { types } = this;
    return {
      setCount: createToPayload<number>(types.SET_COUNT),
    };
  }
  get rawSelectors() {
    type State = this["State"];
    return {
      doubleCount(state: State) {
        return state.count * 2;
      },
    };
  }
  *saga() {
    yield fork([this, this.watchCount]);
  }
  *watchCount() {
    const { types, selectors } = this;
    yield takeLatest([types.SET_COUNT], function* (action) {
      const { count } = selectors(yield select());
      console.log(`types.SET_COUNT changed, now count is ${count}`, action);
    });
  }
}

function App() {
  const { dispatch, duck, store } = useDuckState(AppDuck);
  const { count, doubleCount } = duck.selectors(store);
  return (
    <div>
      <button
        onClick={() => {
          dispatch(duck.creators.setCount(count - 1));
        }}
      >
        {"-"}
      </button>
      <span>{count}</span>
      <button
        onClick={() => {
          dispatch(duck.creators.setCount(count + 1));
        }}
      >
        {"+"}
      </button>
      <div>double count is: {doubleCount}</div>
    </div>
  );
}
```
