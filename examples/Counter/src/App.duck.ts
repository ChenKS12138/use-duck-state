import { createToPayload } from "../../../lib";
import { Duck, reduceFromPayload } from "./util";
import { takeLatest, select, fork } from "redux-saga/effects";

export default class AppDuck extends Duck {
  get quickTypes() {
    enum Type {
      SET_COUNT,
    }
    return {
      ...super.quickTypes,
      ...Type,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      count: reduceFromPayload<number>(types.SET_COUNT, 0),
    };
  }
  get creators() {
    const { types } = this;
    return {
      setCount: createToPayload<number>(types.SET_COUNT),
    };
  }
  get rawSelectors() {
    type State = this["State"];
    return {
      doubleCount(state: State) {
        return state.count * 2;
      },
    };
  }
  *saga() {
    yield fork([this, this.watchCount]);
  }
  *watchCount() {
    const { types, selectors } = this;
    yield takeLatest([types.SET_COUNT], function* (action) {
      const { count } = selectors(yield select());
      console.log(`types.SET_COUNT changed, now count is ${count}`, action);
    });
  }
}
