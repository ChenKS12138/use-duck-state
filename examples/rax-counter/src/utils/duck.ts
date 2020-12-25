import createSagaMiddleware from 'redux-saga';
import { useState, useEffect, useMemo, useRef } from 'rax';
import { createDuckStateHook } from 'use-duck-state';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger({
  collapsed: true,
});

export const useDuckState = createDuckStateHook(
  {
    createSagaMiddleware,
    useEffect,
    useMemo,
    useRef,
    useState,
  },
  [loggerMiddleware],
);
