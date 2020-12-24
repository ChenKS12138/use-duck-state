import { Duck } from "./duck";

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
  middlewares?: any[]
) {
  return function useDuckState<TDuck extends Duck>(
    MyDuck: new (args?: any) => TDuck
  ): { store: any; dispatch: (action: any) => void; duck: TDuck } {
    const duckRef = useRef(new MyDuck());
    const sagaMiddlewareRef = useRef(createSagaMiddleware());
    const mountedRef = useRef(true);

    const [_, forceUpdate] = useState({});
    const storeRef = useRef({
      _state: duckRef.current.initialState,
      dispatch(action: any) {
        storeRef.current._state = duckRef.current.reducer(
          storeRef.current._state,
          action
        );
        if (mountedRef.current) {
          forceUpdate({});
        }
      },
      getState() {
        return storeRef.current._state;
      },
    });

    useEffect(() => {
      const tasks = duckRef.current._composeSaga.map((saga: any) => {
        return sagaMiddlewareRef.current.run(saga);
      });

      return () => {
        mountedRef.current = false;
        tasks.forEach((task: any) => {
          task.cancel();
        });
      };
    }, []);

    const nextStore = useMemo(() => {
      const enhancedStore = enhanceStore(
        storeRef.current,
        middlewares?.length
          ? [sagaMiddlewareRef.current, ...middlewares]
          : [sagaMiddlewareRef.current]
      );
      return enhancedStore;
    }, [sagaMiddlewareRef, storeRef]);

    return {
      store: storeRef.current.getState(),
      duck: duckRef.current,
      dispatch: nextStore.dispatch,
    };
  };
}

function enhanceStore(store: any, middlewares: any[]) {
  const chains = middlewares.map((middleware) =>
    middleware({
      getState: store.getState,
      dispatch: (action: any, ...args: any[]) =>
        store.dispatch(action, ...args),
    })
  );
  store.dispatch = chains.reduce((a, b) => (...args: any[]) => a(b(...args)))(
    store.dispatch
  );
  return store;
}
