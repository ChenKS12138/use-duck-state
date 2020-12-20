import { h } from "preact";
import AppDuck from "./App.duck";
import { useDuckState } from "./util";

export default App;

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
