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
  const sagaMiddleware = createSagaMiddleware();
  const globalStore = enhanceStore(
    {
      _state: {},
      getState() {
        return globalStore._state;
      },
      reducers: [],
      _listeners: [],
      subscribe(listener: any) {
        globalStore._listeners.push(listener);
      },
      unSubscribe(listener: any) {
        globalStore._listeners = globalStore._listeners.filter(
          (one: any) => one !== listener
        );
      },
      dispatch(action: any) {
        const prevState = globalStore._state;
        globalStore._state = globalStore.reducers.reduce(
          (accumulate: any, current: any) => {
            const { namespace, reducer } = current;
            accumulate[namespace] = reducer(prevState[namespace], action);
            return accumulate;
          },
          {} as any
        );
        globalStore._listeners.forEach((listener: any) => {
          listener();
        });
      },
    },
    middlewares?.length ? [...middlewares, sagaMiddleware] : [sagaMiddleware]
  );

  return function useDuckState<TDuck extends Duck>(
    MyDuck: new (args?: any) => TDuck,
    namespace?: string
  ): { store: any; dispatch: (action: any) => void; duck: TDuck } {
    const namespaceRef = useRef(
      namespace ?? Math.random().toString(16).slice(2)
    );
    const duckRef = useRef(new MyDuck([namespaceRef.current]));
    const mountedRef = useRef(true);
    const [_, forceUpdate] = useState({});
    const listenerRef = useRef(() => {
      if (mountedRef.current) {
        forceUpdate({});
      }
    });

    useEffect(() => {
      const tasks = duckRef.current._composeSaga.map((saga: any) => {
        return sagaMiddleware.run(saga);
      });

      return () => {
        mountedRef.current = false;
        globalStore.reducers = globalStore.reducers.filter(
          (one: any) => one.namespace !== namespaceRef.current
        );
        globalStore.unSubscribe(listenerRef.current);
        tasks.forEach((task: any) => {
          task.cancel();
        });
      };
    }, []);

    const wrapDispatch = useMemo(() => {
      globalStore.reducers.push({
        namespace: namespaceRef.current,
        reducer: duckRef.current.reducer,
      });
      globalStore._state[namespaceRef.current] = duckRef.current.initialState;
      globalStore.subscribe(listenerRef.current);
      return (action: any) => {
        globalStore.dispatch(action);
      };
    }, [forceUpdate, mountedRef, globalStore]);

    return {
      store: globalStore.getState(),
      duck: duckRef.current,
      dispatch: wrapDispatch,
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
