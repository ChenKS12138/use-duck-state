interface BASE_REDUCERS {
  [key: string]: (args?: any) => any;
}

type STATE_OF_REDUCERS<REDUCERS extends BASE_REDUCERS> = {
  [key in keyof REDUCERS]: ReturnType<REDUCERS[key]>;
};

export interface DuckProps<T extends Duck> {
  store: any;
  dispatch: (args: any) => void;
  duck: T;
}

export abstract class Duck {
  State: STATE_OF_REDUCERS<this["reducers"]>;
  static INIT = "@duck/INIT";
  static END = "@duck/END";
  get quickTypes() {
    return {};
  }
  get reducers() {
    return {};
  }
  get creators() {
    return {};
  }
  get rawSelectors(): { [key: string]: (key: any) => any } {
    return {};
  }
  get types(): {
    readonly [P in keyof this["quickTypes"]]: string;
  } {
    return Object.entries(this.quickTypes)
      .filter(([_key, value]) => typeof value === "number")
      .map(([key, _value]) => key)
      .reduce((accumulate, current) => {
        accumulate[current] = current;
        return accumulate;
      }, Object.create(null));
  }
  get selectors() {
    type Duck = this;
    const duckSelf = this;
    return function (state: any) {
      const newState = { ...state };
      Object.entries(duckSelf.rawSelectors).forEach(([key, value]) => {
        Object.defineProperty(newState, key, {
          get() {
            return value(newState);
          },
        });
      });
      return newState as STATE_OF_REDUCERS<Duck["reducers"]> &
        STATE_OF_REDUCERS<Duck["rawSelectors"]>;
    };
  }
  get reducer() {
    type Self = this;
    const duckSelf = this;
    return function (
      state: STATE_OF_REDUCERS<Self["reducers"]>,
      action: any
    ): STATE_OF_REDUCERS<Self["reducers"]> {
      return duckSelf._makeReducer(state, action);
    };
  }
  get initialState(): STATE_OF_REDUCERS<this["reducers"]> {
    return this._makeState(this.reducers);
  }
  private _makeReducer<TState extends object, TType = string>(
    state: TState,
    action: TType
  ): TState {
    return Object.entries(this.reducers)
      .map(([key, value]) => {
        return [key, (value as any)(state[key], action)];
      })
      .reduce((accumulate, current) => {
        const [key, value] = current;
        accumulate[key] = value;
        return accumulate;
      }, Object.create(null) as TState);
  }
  private _makeState<T extends BASE_REDUCERS>(
    reducers: T
  ): STATE_OF_REDUCERS<T> {
    return Object.entries(reducers)
      .map(([key, value]) => {
        return [
          key,
          typeof value === "object"
            ? this._makeState(value)
            : (value as any)(undefined, Duck.INIT),
        ];
      })
      .reduce((accumulate: any, current) => {
        const [key, value] = current;
        accumulate[key] = value;
        return accumulate;
      }, Object.create(null) as STATE_OF_REDUCERS<T>);
  }
  abstract saga(): Generator<any, void, any>;
}

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
