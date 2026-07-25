/**
 * state.js - Functional Reactive UI State Stream
 * Models state updates as immutable transformations driven by actions.
 * 
 *   Action -> State -> State
 */

const PaymentStates = {
  INIT: 'INIT',
  AUTH_PENDING: 'AUTH_PENDING',
  VERIFYING: 'VERIFYING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

// Pure state transition reducer
function paymentReducer(state, action) {
  switch (action.type) {
    case 'TRIGGER_PAY':
      if (state.status !== PaymentStates.INIT) return state;
      return {
        ...state,
        status: PaymentStates.AUTH_PENDING,
        selectedOption: action.payload.option,
        config: action.payload.config,
        error: null
      };

    case 'SUBMIT_OTP':
      if (state.status !== PaymentStates.AUTH_PENDING) return state;
      return {
        ...state,
        status: PaymentStates.VERIFYING,
        otp: action.payload.otp
      };

    case 'TRANSACTION_SUCCESS':
      if (state.status !== PaymentStates.VERIFYING) return state;
      return {
        ...state,
        status: PaymentStates.SUCCESS,
        txnId: 'TXN_' + Math.floor(1000000 + Math.random() * 9000000)
      };

    case 'TRANSACTION_FAILURE':
      return {
        ...state,
        status: PaymentStates.FAILURE,
        error: action.payload.error
      };

    case 'RESET_STATE':
      return {
        status: PaymentStates.INIT,
        selectedOption: null,
        config: null,
        otp: '',
        txnId: null,
        error: null
      };

    default:
      return state;
  }
}

// FRP-style State Store (Observable)
class StateStore {
  constructor(initialState) {
    this.state = initialState;
    this.subscribers = [];
  }

  getState() {
    return this.state;
  }

  // Subscribe a listener function to state updates
  subscribe(fn) {
    this.subscribers.push(fn);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  // Dispatch an action to trigger transition
  dispatch(action) {
    const nextState = paymentReducer(this.state, action);
    if (nextState !== this.state) {
      this.state = nextState;
      this.notify();
    }
  }

  notify() {
    this.subscribers.forEach(fn => fn(this.state));
  }
}

// Export states
window.PrestoState = {
  States: PaymentStates,
  createStore: () => new StateStore({
    status: PaymentStates.INIT,
    selectedOption: null,
    config: null,
    otp: '',
    txnId: null,
    error: null
  })
};
