/**
 * app.js - Main Application orchestrator for PrestoPay SDK
 * Connects the CodeMirror editor mockup, compiles AST config, 
 * and handles StateStore subscriptions to reactively update the mobile frame.
 */

document.addEventListener('DOMContentLoaded', () => {
  const editorEl = document.getElementById('dsl-editor');
  const astBlock = document.getElementById('ast-code-block');
  const errorPanel = document.getElementById('error-panel');
  const errorText = document.getElementById('error-text');
  const phoneScreen = document.getElementById('phone-screen');
  const compileBtn = document.getElementById('compile-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Initialize FRP State Store
  const store = window.PrestoState.createStore();

  // Subscribe view updates to state streams
  store.subscribe(state => {
    renderMobileView(state, store, phoneScreen);
  });

  // Action: Compile Editor Input
  function compileDSL() {
    const code = editorEl.value;
    const result = window.PrestoParser.parse(code);

    if (result.success) {
      errorPanel.style.display = 'none';
      errorText.textContent = '';
      
      // Update AST view
      astBlock.textContent = JSON.stringify(result.value, null, 2);
      
      // If payment state is in progress, reset to INIT so layout redraws
      if (store.getState().status !== window.PrestoState.States.INIT) {
        store.dispatch({ type: 'RESET_STATE' });
      } else {
        // Redraw initial layout
        renderMobileView(store.getState(), store, phoneScreen);
      }
    } else {
      // Show compiler error details
      errorPanel.style.display = 'block';
      errorText.textContent = result.error || 'Parsing error occurred.';
      astBlock.textContent = '{ "error": "Compilation failed" }';
    }
  }

  // Compile on button click
  compileBtn.addEventListener('click', compileDSL);

  // Reset editor text to standard demo
  resetBtn.addEventListener('click', () => {
    editorEl.value = `checkout AmazeCart {
  theme: #7e22ce
  amount: INR 1499.00
  options: [
    Card(HDFC Mastercard •••• 4242),
    UPI(vidushi@okaxis),
    Netbanking(State Bank of India)
  ]
}`;
    compileDSL();
  });

  // Auto-compile with 300ms debounce when typing
  let debounceTimeout;
  editorEl.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(compileDSL, 400);
  });

  // Initial compile
  compileDSL();
});

// Reactive Mobile View Engine based on State Stream
function renderMobileView(state, store, container) {
  const States = window.PrestoState.States;

  // 1. INIT STATE: Render standard compiled layouts
  if (state.status === States.INIT) {
    const astText = document.getElementById('ast-code-block').textContent;
    let config;
    try {
      config = JSON.parse(astText);
      if (config.error) throw new Error();
    } catch {
      container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted);">Please fix compiler errors to load layout.</div>`;
      return;
    }

    window.PrestoCompiler.compile(
      config,
      container,
      // Option select callback
      option => {
        // Do nothing on select, compiler handles border updates
      },
      // Pay trigger callback
      (option, cfg) => {
        store.dispatch({
          type: 'TRIGGER_PAY',
          payload: { option, config: cfg }
        });
      }
    );
    return;
  }

  // 2. AUTH_PENDING STATE: Render OTP authentication form
  if (state.status === States.AUTH_PENDING) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; flex: 1; padding: 2rem 0.5rem 1rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <span style="font-size: 2rem;">🔒</span>
          <h4 style="margin-top: 1rem; font-family: var(--font-display); font-weight: 700;">Secure Auth</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">Enter OTP code sent to your device</p>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 0.4rem; margin-bottom: 2rem;">
          <input type="text" maxlength="1" value="4" readonly style="width: 38px; height: 45px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white;">
          <input type="text" maxlength="1" value="8" readonly style="width: 38px; height: 45px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white;">
          <input type="text" maxlength="1" value="1" readonly style="width: 38px; height: 45px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white;">
          <input type="text" id="otp-field-4" maxlength="1" placeholder="•" style="width: 38px; height: 45px; background: var(--bg-tertiary); border: 1px solid ${state.config.themeColor}; border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white; outline: none;">
          <input type="text" id="otp-field-5" maxlength="1" placeholder="•" disabled style="width: 38px; height: 45px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white; opacity: 0.5;">
          <input type="text" id="otp-field-6" maxlength="1" placeholder="•" disabled style="width: 38px; height: 45px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white; opacity: 0.5;">
        </div>

        <button id="submit-otp-btn" class="pay-btn-native" style="background: ${state.config.themeColor}; margin-top: auto;">Submit Verification</button>
        <button id="cancel-otp-btn" class="btn btn-secondary" style="margin-top: 0.75rem; justify-content: center; font-size: 0.8rem; padding: 0.5rem;">Cancel Payment</button>
      </div>
    `;

    // Handle interactive OTP shifting
    const f4 = document.getElementById('otp-field-4');
    const f5 = document.getElementById('otp-field-5');
    const f6 = document.getElementById('otp-field-6');
    const submitBtn = document.getElementById('submit-otp-btn');
    const cancelBtn = document.getElementById('cancel-otp-btn');

    f4.focus();
    f4.addEventListener('input', () => {
      if (f4.value) {
        f5.disabled = false;
        f5.style.background = 'var(--bg-tertiary)';
        f5.style.borderColor = state.config.themeColor;
        f5.style.opacity = '1';
        f5.focus();
      }
    });

    f5.addEventListener('input', () => {
      if (f5.value) {
        f6.disabled = false;
        f6.style.background = 'var(--bg-tertiary)';
        f6.style.borderColor = state.config.themeColor;
        f6.style.opacity = '1';
        f6.focus();
      }
    });

    submitBtn.addEventListener('click', () => {
      const otpVal = '481' + (f4.value || '0') + (f5.value || '0') + (f6.value || '0');
      store.dispatch({
        type: 'SUBMIT_OTP',
        payload: { otp: otpVal }
      });
    });

    cancelBtn.addEventListener('click', () => {
      store.dispatch({ type: 'RESET_STATE' });
    });
    return;
  }

  // 3. VERIFYING STATE: Render secure verification spinner
  if (state.status === States.VERIFYING) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center;">
        <div style="border: 4.5px solid rgba(255,255,255,0.05); border-left-color: ${state.config.themeColor}; width: 48px; height: 48px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h4 style="margin-top: 1.5rem; font-family: var(--font-display); font-weight: 700;">Verifying OTP</h4>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem;">Verifying transaction signatures...</p>
      </div>
    `;

    // Asynchronously update to success state
    setTimeout(() => {
      store.dispatch({ type: 'TRANSACTION_SUCCESS' });
    }, 1800);
    return;
  }

  // 4. SUCCESS STATE: Render success message
  if (state.status === States.SUCCESS) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; padding: 1rem;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); border: 2.5px solid var(--success); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; animation: pulseSuccess 1.5s infinite;">
          <span style="font-size: 2.2rem; color: var(--success); font-weight: 700;">✓</span>
        </div>
        <h3 style="font-weight: 800; font-size: 1.25rem; font-family: var(--font-display);">Payment Settled</h3>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Reference: ${state.txnId}</p>
        
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; width: 100%; padding: 0.85rem; margin-top: 1.5rem;">
          <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Amount Paid</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--success); margin-top: 0.15rem;">${state.config.amount}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 0.4rem;">
            Method: ${state.selectedOption.type} (${state.selectedOption.details.split(' ')[0]})
          </div>
        </div>

        <button id="success-done-btn" class="pay-btn-native" style="background: linear-gradient(135deg, #10b981, #059669); margin-top: 2rem; width: 90%;">Return to Store</button>
      </div>
    `;

    document.getElementById('success-done-btn').addEventListener('click', () => {
      store.dispatch({ type: 'RESET_STATE' });
    });
  }
}
