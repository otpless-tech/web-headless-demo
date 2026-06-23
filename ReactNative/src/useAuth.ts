import { useReducer, useRef, useCallback } from 'react';
import { OtplessHeadlessModule } from 'otpless-headless-rn';
import { APP_ID } from './constants';

export type Screen = 'login' | 'otp' | 'success';

export interface LogEntry {
  id: string;
  type: string;
  statusCode?: number;
  data: any;
  timestamp: Date;
}

interface State {
  screen: Screen;
  isLoading: boolean;
  token: string | null;
  idToken: string | null;
  userId: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  detectedOtp: string | null;
  errorMessage: string | null;
  logs: LogEntry[];
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_DETECTED_OTP' }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_PHONE'; phone: string; countryCode: string }
  | { type: 'SET_DETECTED_OTP'; otp: string }
  | { type: 'NAVIGATE_OTP' }
  | { type: 'NAVIGATE_SUCCESS'; token: string | null; idToken: string | null; userId: string | null }
  | { type: 'NAVIGATE_LOGIN'; logs: LogEntry[] }
  | { type: 'ADD_LOG'; entry: LogEntry };

const initialState: State = {
  screen: 'login',
  isLoading: false,
  token: null,
  idToken: null,
  userId: null,
  phoneNumber: null,
  countryCode: null,
  detectedOtp: null,
  errorMessage: null,
  logs: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, errorMessage: null, detectedOtp: null };
    case 'STOP_LOADING':
      return { ...state, isLoading: false };
    case 'SET_ERROR':
      return { ...state, isLoading: false, errorMessage: action.message };
    case 'CLEAR_ERROR':
      return { ...state, errorMessage: null };
    case 'CLEAR_DETECTED_OTP':
      return { ...state, detectedOtp: null };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    case 'SET_PHONE':
      return { ...state, phoneNumber: action.phone, countryCode: action.countryCode };
    case 'SET_DETECTED_OTP':
      return { ...state, detectedOtp: action.otp };
    case 'NAVIGATE_OTP':
      return { ...state, isLoading: false, screen: 'otp', errorMessage: null };
    case 'NAVIGATE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        screen: 'success',
        token: action.token,
        idToken: action.idToken,
        userId: action.userId,
        errorMessage: null,
      };
    case 'NAVIGATE_LOGIN':
      return { ...initialState, logs: action.logs };
    case 'ADD_LOG':
      return { ...state, logs: [action.entry, ...state.logs].slice(0, 100) };
    default:
      return state;
  }
}

export function useAuth() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const moduleRef = useRef<OtplessHeadlessModule | null>(null);
  // Refs for phone/cc to avoid stale closures in verifyOtp
  const phoneRef = useRef<string | null>(null);
  const ccRef = useRef<string | null>(null);

  const onResponse = useCallback((result: any) => {
    moduleRef.current?.commitResponse(result);

    const responseType = result?.responseType as string;
    const statusCode = result?.statusCode as number;

    dispatch({
      type: 'ADD_LOG',
      entry: {
        id: `${Date.now()}`,
        type: responseType ?? 'UNKNOWN',
        statusCode,
        data: result,
        timestamp: new Date(),
      },
    });

    switch (responseType) {
      case 'SDK_READY':
        break;

      case 'FAILED':
        dispatch({
          type: 'SET_ERROR',
          message: result?.response?.errorMessage ?? 'SDK initialization failed',
        });
        break;

      case 'INITIATE':
        if (statusCode === 200) {
          const authType = result?.response?.authType;
          if (authType === 'OTP' || authType === 'MAGICLINK') {
            dispatch({ type: 'NAVIGATE_OTP' });
          } else {
            dispatch({ type: 'STOP_LOADING' });
          }
        } else {
          dispatch({
            type: 'SET_ERROR',
            message: result?.response?.errorMessage ?? 'Failed to send OTP',
          });
        }
        break;

      case 'OTP_AUTO_READ':
        dispatch({ type: 'SET_DETECTED_OTP', otp: result?.response?.otp ?? '' });
        break;

      case 'VERIFY':
        if (statusCode !== 200) {
          dispatch({
            type: 'SET_ERROR',
            message: result?.response?.errorMessage ?? 'Verification failed',
          });
        }
        break;

      case 'ONETAP': {
        const data = result?.response?.data;
        dispatch({
          type: 'NAVIGATE_SUCCESS',
          token: data?.token ?? null,
          idToken: data?.idToken ?? null,
          userId: data?.userId ?? null,
        });
        break;
      }

      case 'DELIVERY_STATUS':
      case 'FALLBACK_TRIGGERED':
        break;
    }
  }, []);

  const initialize = useCallback(() => {
    if (!moduleRef.current) {
      moduleRef.current = new OtplessHeadlessModule();
    }
    moduleRef.current.initialize(APP_ID);
    moduleRef.current.setResponseCallback(onResponse);
    return () => {
      moduleRef.current?.clearListener();
      moduleRef.current?.cleanup();
    };
  }, [onResponse]);

  const startWithPhone = useCallback(async (phone: string, cc: string) => {
    phoneRef.current = phone;
    ccRef.current = cc;
    dispatch({ type: 'SET_PHONE', phone, countryCode: cc });
    dispatch({ type: 'SET_LOADING' });

    const module = moduleRef.current;
    if (!module) return;

    const ready = await module.isSdkReady();
    if (!ready) {
      module.initialize(APP_ID);
      dispatch({ type: 'SET_ERROR', message: 'SDK not ready. Reinitializing — please try again.' });
      return;
    }

    module.start({ phone, countryCode: cc });
  }, []);

  const verifyOtp = useCallback((otp: string) => {
    dispatch({ type: 'SET_LOADING' });
    moduleRef.current?.start({
      phone: phoneRef.current!,
      countryCode: ccRef.current!,
      otp,
    });
  }, []);

  const goToLogin = useCallback(() => {
    dispatch({ type: 'NAVIGATE_LOGIN', logs: state.logs });
  }, [state.logs]);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const clearDetectedOtp = useCallback(() => dispatch({ type: 'CLEAR_DETECTED_OTP' }), []);
  const clearLogs = useCallback(() => dispatch({ type: 'CLEAR_LOGS' }), []);

  return {
    ...state,
    initialize,
    startWithPhone,
    verifyOtp,
    goToLogin,
    clearError,
    clearDetectedOtp,
    clearLogs,
  };
}

export type AuthHook = ReturnType<typeof useAuth>;
