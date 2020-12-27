/**
 * @author ChenKS12138
 * inspired from saga-duck
 * @see  https://github.com/cyrilluce/saga-duck
 */
type BASE_REDUCERS = {
  [key: string]: (args?: any) => any;
};

type STATE_OF_REDUCERS<REDUCERS extends BASE_REDUCERS> = {
  [key in keyof REDUCERS]: ReturnType<REDUCERS[key]>;
};

type BASE_DUCKS = {
  [key: string]: Duck;
};

type STATE_OF_DUCKS<DUCKS extends BASE_DUCKS> = {
  [key in keyof DUCKS]: DUCKS[key]["initialState"];
};

export interface DuckProps<T extends Duck> {
  store: any;
  dispatch: (args: any) => void;
  duck: T;
}

const DUPLICATE_ATTRIBUTE_MSG =
  "quickDucks and reducers have duplicate attributes!";

export abstract class Duck {
  State!: STATE_OF_REDUCERS<this["reducers"]>;
  constructor(prefix?: string[]) {
    this._prefixs = prefix ?? [];
    if (
      Object.keys({ ...this.quickDucks, ...this.reducers }).length !==
      Object.keys(this.quickDucks).length + Object.keys(this.reducers).length
    ) {
      if (process.env.NODE_ENV === "production") {
        // tslint:disable-next-line: no-console
        console.error(DUPLICATE_ATTRIBUTE_MSG);
      } else {
        throw new Error(DUPLICATE_ATTRIBUTE_MSG);
      }
    }
  }
  protected _prefixs: string[];
  private _cacheTypes: {
    readonly [P in keyof this["quickTypes"]]: string;
  } = undefined as any;
  private _cacheDucks: {
    readonly [P in keyof this["quickDucks"]]: InstanceType<
      this["quickDucks"][P]
    >;
  } = undefined as any;
  private _makeReducer<TState extends object, TType = string>(
    state: TState,
    action: TType
  ): TState {
    return Object.entries(this.reducers)
      .map(([key, value]) => {
        return [key, (value as any)((state as any)[key], action)];
      })
      .reduce((accumulate, current) => {
        const [key, value] = current;
        (accumulate as any)[key] = value;
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
  get quickDucks(): {
    [key: string]: any;
  } {
    return {};
  }
  get types() {
    if (!this._cacheTypes) {
      this._cacheTypes = Object.entries(this.quickTypes)
        .filter(([_key, value]) => typeof value === "number")
        .map(([key, _value]) => key)
        .reduce((accumulate, current) => {
          accumulate[current] =
            (this._prefixs?.length ? this._prefixs.join("/") + "/" : "") +
            current;
          return accumulate;
        }, Object.create(null));
    }
    return this._cacheTypes;
  }
  get ducks() {
    const duckSelf = this;
    if (!this._cacheDucks) {
      this._cacheDucks = Object.entries(this.quickDucks).reduce(
        (accumulate, current) => {
          const [key, CurrentDuck] = current;
          accumulate[key] = new CurrentDuck([...duckSelf._prefixs, key]);
          return accumulate;
        },
        Object.create(null)
      );
    }
    return this._cacheDucks;
  }
  get selectors() {
    type duckSelf = this;
    const selfDuck = this;
    const _reducerKey = Object.keys(this.reducers);
    return (state: any) => {
      state =
        selfDuck?._prefixs?.reduce?.((accumulate: any, current: any) => {
          return accumulate?.[current];
        }, state) ?? state;
      const newState = Object.create(null);
      _reducerKey.forEach((key) => {
        newState[key] = state[key];
      });
      Object.entries(selfDuck.rawSelectors).forEach(([key, value]) => {
        Object.defineProperty(newState, key, {
          get() {
            return value(newState);
          },
        });
      });
      return newState as STATE_OF_REDUCERS<duckSelf["reducers"]> &
        STATE_OF_REDUCERS<duckSelf["rawSelectors"]>;
    };
  }
  get reducer() {
    type Self = this;
    const selfDuck = this;
    const childrenDuck = Object.values(this.ducks);
    return (state: STATE_OF_REDUCERS<Self["reducers"]>, action: any) => {
      return {
        ...selfDuck._makeReducer(state, action),
        ...childrenDuck
          .map((duck) => {
            const key = duck._prefixs[duck._prefixs?.length - 1];
            return [key, duck.reducer((state as any)[key], action)];
          })
          .reduce((accumulate, current) => {
            const [key, value] = current;
            accumulate[key] = value;
            return accumulate;
          }, Object.create(null)),
      };
    };
  }
  get initialState() {
    return {
      ...this._makeState(this.reducers),
      ...Object.entries(this.ducks)
        .map(([key, duck]) => {
          return [key, duck.initialState];
        })
        .reduce((accumulate, current) => {
          const [key, value] = current;
          accumulate[key] = value;
          return accumulate;
        }, Object.create(null)),
    };
  }
  get _composeSaga(): (() => Generator<any, void, any>)[] {
    return [
      ...Object.values(this.ducks).reduce(
        (accumulate, duck: Duck) => [...accumulate, ...duck._composeSaga],
        []
      ),
      this.saga.bind(this),
    ];
  }
  abstract saga(): Generator<any, void, any>;
}
