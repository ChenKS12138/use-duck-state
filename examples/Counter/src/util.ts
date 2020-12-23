import { createDuckStateHook } from "../../../lib";

import { useRef, useMemo, useEffect, useState } from "preact/compat";
import createSagaMiddleware from "redux-saga";

export {
  reduceFromPayload,
  createToPayload,
  Duck,
  DuckProps,
} from "../../../lib";

export const useDuckState = createDuckStateHook({
  createSagaMiddleware,
  useEffect,
  useMemo,
  useState,
  useRef,
});
