import { h } from "preact";
import AppDuck from "./App.duck";
import { useDuckState, DuckProps } from "./util";
import "./app.css";

import CutdownDuck from "./cutdown.duck";

export default App;

/**
 * page component
 */
function App() {
  const { dispatch, duck, store } = useDuckState(AppDuck, "app");
  const { count, doubleCount } = duck.selectors(store);

  return (
    <div>
      <div className="counter">
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
        </div>
        <div className="tip">Double Count Is: {doubleCount}</div>
      </div>
      <div className="cutdown">
        <Cutdown dispatch={dispatch} duck={duck.ducks.cutdown} store={store} />
        <div className="tip">Press Reset To Invoke Cutdown</div>
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
      <span>Rest: {second}s </span>
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
