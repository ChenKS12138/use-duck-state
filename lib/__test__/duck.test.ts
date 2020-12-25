// tslint:disable: max-classes-per-file

import { Duck } from "../duck";

class SubDuck extends Duck {
  get quickTypes() {
    enum Type {
      INVOKE,
      SET_SECOND,
    }
    return {
      ...Type,
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
    return null;
  }
}
class TestDuck extends Duck {
  get quickTypes() {
    enum Types {
      SET_COUNT,
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
    return null;
  }
}

class NamingConflictDuck extends Duck {
  get quickTypes() {
    enum Types {
      SET_VALUE,
    }
    return {
      ...Types,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      conflictName(state = 0, action: { type: string; payload: number }) {
        if (action.type === types.SET_VALUE) {
          return action.payload;
        }
        return state;
      },
    };
  }
  get quickDucks() {
    return {
      conflictName: SubDuck,
    };
  }
  *saga() {
    return null;
  }
}

describe("Class Duck", () => {
  it("is a class duck", (done) => {
    expect(TestDuck).toBeInstanceOf(Function);
    done();
  });
  const duck = new TestDuck();

  describe("quickDucks and reducers conflict name check", () => {
    it("when not in production mode", (done) => {
      const prevNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      expect(() => {
        // tslint:disable-next-line: no-unused-expression
        new NamingConflictDuck();
      }).toThrowError("quickDucks and reducers have duplicate attributes!");
      process.env.NODE_ENV = prevNodeEnv;
      done();
    });
    it("when in production mode", (done) => {
      const prevNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const spy = jest.spyOn(console, "error").mockImplementation();
      // tslint:disable-next-line: no-unused-expression
      new NamingConflictDuck();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith(
        "quickDucks and reducers have duplicate attributes!"
      );
      spy.mockRestore();
      process.env.NODE_ENV = prevNodeEnv;
      done();
    });
  });

  describe("instance's essential property", () => {
    it("_prefix", (done) => {
      expect(duck).toHaveProperty("_prefix", undefined);
      expect(duck.ducks.sub1).toHaveProperty("_prefix", "sub1");
      expect(duck.ducks.sub2).toHaveProperty("_prefix", "sub2");
      done();
    });

    describe("saga", () => {
      expect(duck).toHaveProperty("saga");
      const iter = duck.saga();
      it("saga is a generator", (done) => {
        expect(duck.saga).toBeInstanceOf(Function);
        expect(iter.next).toBeInstanceOf(Function);
        const result = (iter as any).next();
        expect(result).toHaveProperty("done");
        expect(result).toHaveProperty("value");
        done();
      });
    });

    describe("ducks", () => {
      expect(duck).toHaveProperty("ducks");
      it("sub duck is instanceof Duck", (done) => {
        expect(duck.ducks.sub1).toBeInstanceOf(Duck);
        expect(duck.ducks.sub2).toBeInstanceOf(Duck);
        done();
      });
    });

    describe("selectors", () => {
      expect(duck).toHaveProperty("selectors");
      it("read state", (done) => {
        const store = { count: 3 };
        const state = duck.selectors(store);
        expect(state).toHaveProperty("count", 3);
        expect(state).toHaveProperty("doubleCount", 6);
        done();
      });
    });

    describe("reducer", () => {
      expect(duck).toHaveProperty("reducer");
      it("is a function", (done) => {
        expect(duck.reducer).toBeInstanceOf(Function);
        done();
      });
      it("reducer reduce well", (done) => {
        const store = {
          count: 3,
          sub1: {
            second: 0,
          },
          sub2: {
            second: 0,
          },
        };
        expect(
          duck.reducer(store, { type: "NOT_A_MATCHED_TYPE" })
        ).toStrictEqual(store);
        expect(
          duck.reducer(store, { type: duck.types.SET_COUNT, payload: 4 })
        ).toStrictEqual({
          ...store,
          count: 4,
        });
        expect(
          duck.reducer(store, {
            type: duck.ducks.sub1.types.SET_SECOND,
            payload: 1,
          })
        ).toStrictEqual({
          ...store,
          sub1: {
            ...store.sub1,
            second: 1,
          },
        });
        expect(
          duck.reducer(store, {
            type: duck.ducks.sub2.types.SET_SECOND,
            payload: 2,
          })
        ).toStrictEqual({
          ...store,
          sub2: {
            ...store.sub2,
            second: 2,
          },
        });
        done();
      });
    });

    describe("initialState", () => {
      expect(duck).toHaveProperty("initialState");
      it("get initial state", (done) => {
        expect(duck.initialState).toStrictEqual({
          count: 0,
          sub1: {
            second: 0,
          },
          sub2: {
            second: 0,
          },
        });
        done();
      });
    });
  });
});
