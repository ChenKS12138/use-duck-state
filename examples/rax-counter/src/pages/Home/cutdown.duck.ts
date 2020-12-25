import { Duck, reduceFromPayload, createToPayload } from 'use-duck-state';
import { select, takeLatest, put, take, fork } from 'redux-saga/effects';
import { eventChannel, EventChannel } from 'redux-saga';

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
    yield fork([this, this.watchToInvoke]);
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
    const { types, selectors, createCutdownChannel } = this;
    yield takeLatest([types.INVOKE], function* () {
      const { second } = selectors(yield select());
      const chan = createCutdownChannel(second);
      let rest: number = second;
      while (rest > 0) {
        rest = (yield take(chan)) - 1;
        yield put({
          type: types.SET_SECOND,
          payload: rest,
        });
      }
    });
  }
  createCutdownChannel(second: number): EventChannel<number> {
    return eventChannel((emit) => {
      let rest = second;
      const timer = setInterval(() => {
        emit(rest--);
        if (rest < 1) {
          clearInterval(timer);
        }
      }, 1000);
      return () => {};
    });
  }
}
