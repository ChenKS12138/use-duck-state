/**
 * @author ChenKS12138
 * inspired from saga-duck
 * @see  https://github.com/cyrilluce/saga-duck
 */

import { Duck } from "./duck";

export function createDuckStateHook({
  useRef,
  useMemo,
  useEffect,
  useState,
  createSagaMiddleware,
}) {
  const useStoreRef = createStoreRefHook({ useRef, useState });
  return function useDuckState<TDuck extends Duck>(
    MyDuck: new (args?: any) => TDuck
  ): { store: any; dispatch: (action: any) => void; duck: TDuck } {
    const duckRef = useRef(new MyDuck());
    const sagaMiddlewareRef = useRef(createSagaMiddleware());

    const storeRef = useStoreRef(
      process.env.NODE_ENV === "development"
        ? logger(duckRef.current.reducer)
        : duckRef.current.reducer,
      duckRef.current.initialState
    );

    useEffect(() => {
      const tasks = duckRef.current._composeSaga.map((saga) => {
        return sagaMiddlewareRef.current.run(saga);
      });

      return () => {
        tasks.forEach((task) => {
          task.cancel();
        });
      };
    }, []);

    const nextStore = useMemo(() => {
      const nextStore = enhanceStore(
        storeRef.current,
        sagaMiddlewareRef.current
      );
      return nextStore;
    }, [sagaMiddlewareRef, storeRef]);

    return {
      store: storeRef.current.getState(),
      duck: duckRef.current,
      dispatch: nextStore.dispatch,
    };
  };
}

function enhanceStore(store, ...middlewares) {
  const chains = middlewares.map((middleware) =>
    middleware({
      getState: store.getState,
      dispatch: (action, ...args) => store.dispatch(action, ...args),
    })
  );
  store.dispatch = chains.reduce((a, b) => (...args) => a(b(...args)))(
    store.dispatch
  );
  return store;
}

const getCurrentTimeFormatted = () => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const milliseconds = currentTime.getMilliseconds();
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

function logger(next) {
  return function (state, action) {
    const nextState = next(state, action);
    console.groupCollapsed(
      `%cAction: %c${action.type} %cat ${getCurrentTimeFormatted()}`,
      "color: black; font-weight: bold;",
      "color: bl; font-weight: bold;",
      "color: grey; font-weight: lighter;"
    );
    console.log(
      "%cPrevious State:",
      "color: #9E9E9E; font-weight: 700;",
      state
    );
    console.log("%cAction:", "color: #00A7F7; font-weight: 700;", action);
    console.log(
      "%cNext State:",
      "color: #47B04B; font-weight: 700;",
      nextState
    );
    console.groupEnd();
    return nextState;
  };
}

function createStoreRefHook({ useRef, useState }) {
  return function useStoreRef(reducer, initialState) {
    const [_, forceUpdate] = useState({});
    const storeRef = useRef({
      _state: initialState,
      dispatch(action) {
        storeRef.current._state = reducer(storeRef.current._state, action);
        forceUpdate({});
      },
      getState() {
        return storeRef.current._state;
      },
    });
    return storeRef;
  };
}
