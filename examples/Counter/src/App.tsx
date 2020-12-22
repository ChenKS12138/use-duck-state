import { h } from "preact";
import { useCallback } from "preact/compat";
import AppDuck from "./App.duck";
import { useDuckState, DuckProps } from "./util";

import CutdownDuck from "./cutdown.duck";

export default App;

/**
 * page component
 */
function App() {
  const { dispatch, duck, store } = useDuckState(AppDuck);
  const { count, doubleCount } = duck.selectors(store);

  return (
    <div>
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
      <div>
        <Cutdown dispatch={dispatch} duck={duck.ducks.cutdown} store={store} />
      </div>
    </div>
  );
}

/**
 * Cutdown - duck component
 */
function Cutdown({ dispatch, duck, store }: DuckProps<CutdownDuck>) {
  const { second } = duck.selectors(store);
  return (
    <div>
      <span>{second}</span>
      <button
        disabled={second > 0}
        onClick={() => {
          dispatch({
            type: duck.types.RESET,
          });
        }}
      >
        Reset
      </button>
    </div>
  );
}
