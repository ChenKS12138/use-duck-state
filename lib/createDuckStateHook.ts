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
        ? (currentState, action) => {
            const next = duckRef.current.reducer(currentState, action);
            console.groupCollapsed(
              `%cAction: %c${action.type} %cat ${getCurrentTimeFormatted()}`,
              "color: black; font-weight: bold;",
              "color: bl; font-weight: bold;",
              "color: grey; font-weight: lighter;"
            );
            console.log(
              "%cPrevious State:",
              "color: #9E9E9E; font-weight: 700;",
              currentState
            );
            console.log(
              "%cAction:",
              "color: #00A7F7; font-weight: 700;",
              action
            );
            console.log(
              "%cNext State:",
              "color: #47B04B; font-weight: 700;",
              next
            );
            console.groupEnd();
            return next;
          }
        : duckRef.current.reducer,
      duckRef.current.initialState
    );
    const storeRef = useRef(
      (function () {
        let _state = state;
        return {
          dispatch,
          getState() {
            return _state;
          },
          updateState(nextState) {
            _state = nextState;
          },
        };
      })()
    );

    useEffect(() => {
      storeRef.current.updateState(state);
    }, [state, storeRef]);

    useEffect(() => {
      const task = sagaMiddlewareRef.current.run(
        duckRef.current.saga.bind(duckRef.current)
      );
      return () => {
        task.cancel();
      };
    }, []);

    storeRef.current.dispatch = dispatch;

    const enhancedDispatch = useMemo(
      () => enhanceDispatch(storeRef.current, sagaMiddlewareRef.current),
      [storeRef, sagaMiddlewareRef]
    );

    return {
      store: state,
      duck: duckRef.current,
      dispatch: enhancedDispatch,
    };
  };
}

function enhanceDispatch(store, ...middlewares) {
  return middlewares.reduceRight((dispach, middleware) => {
    return middleware(store)(dispach);
  }, store.dispatch);
}

const getCurrentTimeFormatted = () => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const milliseconds = currentTime.getMilliseconds();
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};
