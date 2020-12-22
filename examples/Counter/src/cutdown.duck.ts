import { Duck, reduceFromPayload, createToPayload } from "./util";
import { select, takeLatest, put, take, fork } from "redux-saga/effects";
import { eventChannel, EventChannel } from "redux-saga";

export default class CutdownDuck extends Duck {
  get quickTypes() {
    enum Types {
      SET_SECOND,

      RESET,
      INVOKE,
    }
    return {
      ...super.quickTypes,
      ...Types,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      second: reduceFromPayload<number>(types.SET_SECOND, 0),
    };
  }
  get creators() {
    const { types } = this;
    return {
      setSecond: createToPayload<number>(types.SET_SECOND),
    };
  }
  *saga() {
    yield fork([this, this.watchToReset]);
  }
  *watchToReset() {
    const { types, creators } = this;
    yield takeLatest([types.RESET], function* () {
      yield put(creators.setSecond(5));
      yield put({
        type: types.INVOKE,
      });
    });
  }
  *watchToInvoke() {
    const { types } = this;
    yield takeLatest([types.INVOKE], function* () {
      console.log("invoke");
    });
  }
  createCutdownChannel(second: number): EventChannel<number> {
    return eventChannel((emit) => {
      let rest = second;
      const timer = setInterval(() => {
        emit(rest--);
        console.log(rest);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
  }
}
