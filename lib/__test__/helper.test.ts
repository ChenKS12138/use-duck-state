import { createToPayload, reduceFromPayload } from "../helper";

describe("createToPayload", () => {
  it("is a function", (done) => {
    expect(createToPayload).toBeInstanceOf(Function);
    done();
  });
  it("return a function", (done) => {
    expect(createToPayload("SET_COUNT")).toBeInstanceOf(Function);
    done();
  });
  it("return a function that return a payload", (done) => {
    expect(createToPayload("SET_COUNT")(123)).toEqual({
      type: "SET_COUNT",
      payload: 123,
    });
    done();
  });
});

describe("reduceFromPayload", () => {
  it("is a function ", (done) => {
    expect(reduceFromPayload).toBeInstanceOf(Function);
    done();
  });
  it("return a reducer", (done) => {
    expect(reduceFromPayload("SET_COUNT", 0)).toBeInstanceOf(Function);
    done();
  });
  describe("reducer", () => {
    const reducer = reduceFromPayload("SET_COUNT", 0);
    it("return default state when default state not set and type not match", (done) => {
      expect(reducer(undefined, { type: "NOT_SET_COUNT", payload: 1 })).toBe(0);
      done();
    });
    it("return prev state when type not match", (done) => {
      expect(reducer(3, { type: "NOT_SET_COUNT", payload: 4 })).toBe(3);
      done();
    });
    it("change state when type match", (done) => {
      expect(reducer(3, { type: "SET_COUNT", payload: 4 })).toBe(4);
      done();
    });
  });
});
