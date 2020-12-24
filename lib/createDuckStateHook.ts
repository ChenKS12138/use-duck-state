import { Duck } from "./duck";
import * as redux from "redux";

export function createDuckStateHook(
  {
    useRef,
    useMemo,
    useEffect,
    useState,
    createSagaMiddleware,
  }: {
    useRef: any;
    useMemo: any;
    useEffect: any;
    useState: any;
    createSagaMiddleware: any;
  },
  middlewares?: redux.Middleware[]
) {
  const useStoreRef = createStoreRefHook({ useRef, useState });
  return function useDuckState<TDuck extends Duck>(
    MyDuck: new (args?: any) => TDuck
  ): { store: any; dispatch: (action: any) => void; duck: TDuck } {
    const duckRef = useRef(new MyDuck());
    const sagaMiddlewareRef = useRef(createSagaMiddleware());

    const storeRef = useStoreRef(
      duckRef.current.reducer,
      duckRef.current.initialState
    );

    useEffect(() => {
      const tasks = duckRef.current._composeSaga.map((saga: any) => {
        return sagaMiddlewareRef.current.run(saga);
      });

      return () => {
        tasks.forEach((task: any) => {
          task.cancel();
        });
      };
    }, []);

    const nextStore = useMemo(() => {
      const nextStore = enhanceStore(
        storeRef.current,
        middlewares?.length
          ? [sagaMiddlewareRef.current, ...middlewares]
          : [sagaMiddlewareRef.current]
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

function enhanceStore(store: any, middlewares: redux.Middleware[]) {
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

function createStoreRefHook({
  useRef,
  useState,
}: {
  useRef: any;
  useState: any;
}) {
  return function useStoreRef(reducer: any, initialState: any) {
    const [_, forceUpdate] = useState({});
    const storeRef = useRef({
      _state: initialState,
      dispatch(action: any) {
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
