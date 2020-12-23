import { createDuckStateHook } from "../../../lib";

import { useRef, useMemo, useEffect, useState } from "preact/compat";
import createSagaMiddleware from "redux-saga";
import { createLogger } from "redux-logger";

const loggerMiddleware = createLogger({
  collapsed: false,
});

export {
  reduceFromPayload,
  createToPayload,
  Duck,
  DuckProps,
} from "../../../lib";

export const useDuckState = createDuckStateHook(
  {
    createSagaMiddleware,
    useEffect,
    useMemo,
    useState,
    useRef,
  },
  [loggerMiddleware]
);
