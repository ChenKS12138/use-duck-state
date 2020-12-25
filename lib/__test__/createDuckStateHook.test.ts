// tslint:disable: max-classes-per-file

import { createDuckStateHook } from "../createDuckStateHook";
import { Duck } from "../duck";
import React, { useState, useEffect, useRef, useMemo } from "react";
import createSagaMiddleware from "redux-saga";
import { renderHook, act } from "@testing-library/react-hooks";
import { call, fork, put, takeLatest } from "redux-saga/effects";

function asyncRequest<T = any>(payload: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(payload);
    }, 500);
  });
}

class SubDuck extends Duck {
  get quickTypes() {
    enum Type {
      INVOKE,
      SET_SECOND,
      FETCH_ASYNC_SECOND,
    }
    return {
      ...Type,
    };
  }
  get creators() {
    const { types } = this;
    return {
      setSecond(payload: number) {
        return { type: types.SET_SECOND, payload };
      },
    };
  }
  get reducers() {
    const { types } = this;
    return {
      second(state = 0, action: { type: string; payload: number }): number {
        if (action.type === types.SET_SECOND) {
          return action.payload;
        }
        return state;
      },
    };
  }
  *saga() {
    yield fork([this, this.watchToFetchSecond]);
  }
  *watchToFetchSecond() {
    const { types, creators } = this;
    yield takeLatest([types.FETCH_ASYNC_SECOND], function* (action) {
      const newSecond = yield call(asyncRequest, (action as any).payload);
      yield put(creators.setSecond(newSecond));
    });
  }
}
class TestDuck extends Duck {
  get quickTypes() {
    enum Types {
      SET_COUNT,
      FETCH_ASYNC_COUNT,
      SET_COUNT_TO_SEVEN,
      INVOKE_FETCH_ASYNC_COUNT,
    }
    return {
      ...Types,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      count(state = 0, action: { type: string; payload: number }): number {
        if (action.type === types.SET_COUNT) {
          return action.payload;
        }
        return state;
      },
    };
  }
  get creators() {
    const { types } = this;
    return {
      setCount(payload: number) {
        return { type: types.SET_COUNT, payload };
      },
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
  get quickDucks() {
    return {
      sub1: SubDuck,
      sub2: SubDuck,
    };
  }
  *saga() {
    yield fork([this, this.watchToFetchCount]);
    yield fork([this, this.watchToSetCountToSeven]);
    yield fork([this, this.watchToInvokeFetchCount]);
  }
  *watchToFetchCount() {
    const { types, creators } = this;
    yield takeLatest([types.FETCH_ASYNC_COUNT], function* (action) {
      const newCount = yield call(asyncRequest, (action as any).payload);
      yield put(creators.setCount(newCount));
    });
  }
  *watchToSetCountToSeven() {
    const { types, creators } = this;
    yield takeLatest([types.SET_COUNT_TO_SEVEN], function* () {
      yield put(creators.setCount(7));
    });
  }
  *watchToInvokeFetchCount() {
    const { types } = this;
    yield takeLatest([types.INVOKE_FETCH_ASYNC_COUNT], function* (action) {
      yield put({ ...action, type: types.FETCH_ASYNC_COUNT });
    });
  }
}

describe("createDuckStateHook", () => {
  expect(createDuckStateHook).toBeInstanceOf(Function);
  describe("useDuckState", () => {
    const useDuckState = createDuckStateHook({
      createSagaMiddleware,
      useEffect,
      useMemo,
      useRef,
      useState,
    });
    it("is a function", (done) => {
      expect(useDuckState).toBeInstanceOf(Function);
      done();
    });

    describe("useDuckState", () => {
      describe("essential property", () => {
        const { result } = renderHook(() => useDuckState(TestDuck));
        const { dispatch, duck, store } = result.current;
        it("dispatch", (done) => {
          expect(dispatch).toBeInstanceOf(Function);
          done();
        });
        it("duck", (done) => {
          expect(duck).toBeInstanceOf(Duck);
          expect(duck).toBeInstanceOf(TestDuck);
          done();
        });
        it("store", (done) => {
          expect(store).toBeInstanceOf(Object);
          expect(store).toStrictEqual({
            count: 0,
            sub1: { second: 0 },
            sub2: { second: 0 },
          });
          done();
        });
      });

      describe("synchronously", () => {
        it("parent duck", (done) => {
          const { result } = renderHook(() => useDuckState(TestDuck));
          expect(result.current.store).toHaveProperty("count", 0);
          act(() => {
            result.current.dispatch(result.current.duck.creators.setCount(1));
          });
          expect(result.current.store).toHaveProperty("count", 1);
          done();
        });
        it("sub duck", (done) => {
          const { result } = renderHook(() => useDuckState(TestDuck));
          expect(result.current.store).toHaveProperty("count", 0);
          act(() => {
            result.current.dispatch(
              result.current.duck.ducks.sub1.creators.setSecond(123)
            );
            result.current.dispatch(
              result.current.duck.ducks.sub2.creators.setSecond(456)
            );
          });
          expect(result.current.store.sub1).toHaveProperty("second", 123);
          expect(result.current.store.sub2).toHaveProperty("second", 456);
          done();
        });
      });
      describe("asynchronously", () => {
        it("parent duck", async (done) => {
          const { result, waitForNextUpdate } = renderHook(() =>
            useDuckState(TestDuck)
          );
          expect(result.current.store).toHaveProperty("count", 0);
          act(() => {
            result.current.dispatch({
              type: result.current.duck.types.FETCH_ASYNC_COUNT,
              payload: 234,
            });
          });
          await waitForNextUpdate();
          expect(result.current.store).toHaveProperty("count", 234);
          done();
        });
        it("sub duck", async (done) => {
          const { result, waitForNextUpdate } = renderHook(() =>
            useDuckState(TestDuck)
          );
          expect(result.current.store.sub1).toHaveProperty("second", 0);
          act(() => {
            result.current.dispatch({
              type: result.current.duck.ducks.sub1.types.FETCH_ASYNC_SECOND,
              payload: 345,
            });
            result.current.dispatch({
              type: result.current.duck.ducks.sub2.types.FETCH_ASYNC_SECOND,
              payload: 567,
            });
          });
          await waitForNextUpdate();
          expect(result.current.store.sub1).toHaveProperty("second", 345);
          expect(result.current.store.sub2).toHaveProperty("second", 567);
          done();
        });
      });

      describe("put effect work well", () => {
        it("synchronously side effect", (done) => {
          const { result } = renderHook(() => useDuckState(TestDuck));
          expect(result.current.store).toHaveProperty("count", 0);
          act(() => {
            result.current.dispatch({
              type: result.current.duck.types.SET_COUNT_TO_SEVEN,
            });
          });
          expect(result.current.store).toHaveProperty("count", 7);
          done();
        });
        it("asynchronously side effect", async (done) => {
          const { result, waitForNextUpdate } = renderHook(() =>
            useDuckState(TestDuck)
          );
          expect(result.current.store).toHaveProperty("count", 0);
          act(() => {
            result.current.dispatch({
              type: result.current.duck.types.FETCH_ASYNC_COUNT,
              payload: 123456,
            });
          });
          await waitForNextUpdate();
          expect(result.current.store).toHaveProperty("count", 123456);
          done();
        });
      });
    });
  });
});
