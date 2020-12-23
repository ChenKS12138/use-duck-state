import { Duck } from "./duck";

/**
 * @param actionType
 * @param initialState
 */
export function reduceFromPayload<TState, TType = string>(
  actionType: TType,
  initialState: TState
) {
  return function (
    state: TState = initialState,
    aciton: { type: TType; payload: TState }
  ) {
    if (aciton.type === actionType) {
      return aciton.payload;
    }
    return state;
  };
}

/**
 * @param actionType
 */
export function createToPayload<TState, TType = string>(actionType: TType) {
  return function (
    payload: TState
  ): {
    type: TType;
    payload: TState;
  } {
    return {
      type: actionType,
      payload,
    };
  };
}
