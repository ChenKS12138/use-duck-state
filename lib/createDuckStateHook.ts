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
  useReducer,
  createSagaMiddleware,
}) {
  return function useDuckState<TDuck extends Duck>(
    MyDuck: new () => TDuck
  ): { store: any; dispatch: (action: any) => void; duck: TDuck } {
    const duckRef = useRef(new MyDuck());
    const sagaMiddlewareRef = useRef(createSagaMiddleware());
    const [state, dispatch] = useReducer(
      process.env.NODE_ENV === "development"
        ? logger(duckRef.current.reducer)
        : duckRef.current.reducer,
      duckRef.current.initialState
    );

    useEffect(() => {
      const task = sagaMiddlewareRef.current.run(
        duckRef.current.saga.bind(duckRef.current)
      );
      return () => {
        task.cancel();
      };
    }, []);

    const stateRef = useRef(state);
    stateRef.current = state;

    const nextStore = useMemo(() => {
      const nextStore = enhanceStore(
        {
          getState() {
            return stateRef.current;
          },
          dispatch,
        },
        sagaMiddlewareRef.current
      );
      return nextStore;
    }, [sagaMiddlewareRef, dispatch, stateRef]);

    return {
      store: state,
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
