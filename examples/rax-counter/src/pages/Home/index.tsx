import { createElement } from 'rax';
import { DuckProps } from 'use-duck-state';
import { useDuckState } from '@/utils';

import styles from './index.module.css';
import HomeDuck from './index.duck';
import CutdownDuck from './cutdown.duck';

/**
 * page component
 */
export default function Home() {
  const { dispatch, duck, store } = useDuckState(HomeDuck, 'Home');
  const { count, doubleCount } = duck.selectors(store);

  return (
    <div>
      <div className={styles.counter}>
        <div>
          <button
            onClick={() => {
              dispatch(duck.creators.setCount(count - 1));
            }}
          >
            {'-'}
          </button>
          <span>{count}</span>
          <button
            onClick={() => {
              dispatch(duck.creators.setCount(count + 1));
            }}
          >
            {'+'}
          </button>
        </div>
        <div className={styles.tip}>Double Count Is: {doubleCount}</div>
      </div>
      <div className={styles.cutdown}>
        <Cutdown dispatch={dispatch} duck={duck.ducks.cutdown} store={store} />
        <div className={styles.tip}>Press Reset To Invoke Cutdown</div>
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
