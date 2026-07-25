/**
 * compiler.js - PrestoPay Layout AST Compiler
 * Compiles a structured Abstract Syntax Tree (AST) config block
 * into structural HTML elements inside the mobile phone preview frame.
 */

window.PrestoCompiler = {
  compile: (config, container, onOptionSelect, onPayTrigger) => {
    if (!config || !container) return;

    // Reset container contents
    container.innerHTML = '';

    // Create checkout layout shell
    const layout = document.createElement('div');
    layout.style.display = 'flex';
    layout.style.flexDirection = 'column';
    layout.style.height = '100%';
    layout.style.position = 'relative';

    // 1. Merchant Brand Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '0.5rem 0';
    header.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
    header.style.marginBottom = '1.25rem';
    header.innerHTML = `
      <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Checkout</span>
      <span style="font-weight: 800; font-size: 0.85rem; color: ${config.themeColor}; font-family: var(--font-display);">${config.merchantName}</span>
    `;
    layout.appendChild(header);

    // 2. Transaction summary
    const summary = document.createElement('div');
    summary.style.display = 'flex';
    summary.style.justifyContent = 'space-between';
    summary.style.alignItems = 'center';
    summary.style.marginBottom = '1.5rem';
    summary.innerHTML = `
      <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary);">Total Amount</span>
      <span style="font-size: 1.3rem; font-weight: 800; color: var(--success); font-family: var(--font-display);">${config.amount}</span>
    `;
    layout.appendChild(summary);

    // 3. Section label
    const label = document.createElement('div');
    label.style.fontSize = '0.7rem';
    label.style.fontWeight = '700';
    label.style.color = 'var(--text-muted)';
    label.style.letterSpacing = '0.5px';
    label.style.textTransform = 'uppercase';
    label.style.marginBottom = '0.75rem';
    label.textContent = 'Select Payment Option';
    layout.appendChild(label);

    // 4. Render payment choices
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '0.75rem';
    optionsContainer.style.marginBottom = '1.5rem';
    optionsContainer.style.overflowY = 'auto';
    optionsContainer.style.maxHeight = '240px';

    if (config.options && config.options.length > 0) {
      config.options.forEach((opt, index) => {
        const optionCard = document.createElement('div');
        optionCard.className = `checkout-option-card ${index === 0 ? 'selected' : ''}`;
        optionCard.setAttribute('data-id', opt.id);
        optionCard.style.padding = '0.85rem 1rem';
        optionCard.style.borderWidth = '1px';
        optionCard.style.borderStyle = 'solid';
        
        // Dynamically style selected border
        if (index === 0) {
          optionCard.style.borderColor = config.themeColor;
          optionCard.style.background = `${config.themeColor}12`;
        } else {
          optionCard.style.borderColor = 'rgba(255,255,255,0.06)';
          optionCard.style.background = 'rgba(255,255,255,0.02)';
        }

        optionCard.innerHTML = `
          <div class="checkout-option-icon" style="background: rgba(255,255,255,0.04); font-size: 1.1rem; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            ${opt.icon}
          </div>
          <div class="checkout-option-details" style="margin-left: 0.75rem;">
            <div class="checkout-option-name" style="font-size: 0.85rem; font-weight: 600;">${opt.type}</div>
            <div class="checkout-option-sub" style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.1rem;">${opt.details}</div>
          </div>
        `;

        optionCard.addEventListener('click', () => {
          // Reset styling
          const cards = optionsContainer.querySelectorAll('.checkout-option-card');
          cards.forEach(c => {
            c.classList.remove('selected');
            c.style.borderColor = 'rgba(255,255,255,0.06)';
            c.style.background = 'rgba(255,255,255,0.02)';
          });
          
          // Select current card
          optionCard.classList.add('selected');
          optionCard.style.borderColor = config.themeColor;
          optionCard.style.background = `${config.themeColor}12`;

          onOptionSelect(opt);
        });

        optionsContainer.appendChild(optionCard);
      });
    } else {
      // Empty payment list warning
      const warning = document.createElement('div');
      warning.style.padding = '1rem';
      warning.style.textAlign = 'center';
      warning.style.fontSize = '0.8rem';
      warning.style.color = 'var(--warning)';
      warning.style.background = 'rgba(245,158,11,0.08)';
      warning.style.border = '1px solid rgba(245,158,11,0.2)';
      warning.style.borderRadius = '8px';
      warning.textContent = '⚠️ No payment options compiled. Declare [ Card(...), UPI(...) ] in code.';
      optionsContainer.appendChild(warning);
    }
    
    layout.appendChild(optionsContainer);

    // 5. Pay button at bottom of layout
    const payBtn = document.createElement('button');
    payBtn.className = 'pay-btn-native';
    payBtn.style.marginTop = 'auto';
    payBtn.style.padding = '0.9rem';
    payBtn.style.borderRadius = '10px';
    payBtn.style.fontSize = '0.9rem';
    payBtn.style.background = `linear-gradient(135deg, ${config.themeColor}, #1e1b4b)`;
    payBtn.style.borderColor = 'transparent';
    payBtn.style.boxShadow = `0 4px 15px ${config.themeColor}40`;
    payBtn.innerHTML = `🛡️ Pay Securely ${config.amount}`;

    payBtn.addEventListener('click', () => {
      // Pick currently selected option
      const selectedEl = optionsContainer.querySelector('.checkout-option-card.selected');
      const selectedId = selectedEl ? selectedEl.getAttribute('data-id') : null;
      const selectedOption = config.options.find(o => o.id === selectedId) || config.options[0];
      
      onPayTrigger(selectedOption, config);
    });

    layout.appendChild(payBtn);
    container.appendChild(layout);
  }
};
