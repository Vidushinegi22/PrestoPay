/**
 * parser.js - A Functional Parser Combinator Library
 * Designed from first principles to parse the PrestoPay Checkout DSL.
 * 
 * In Functional Programming, a Parser is a pure function:
 *   type Parser a = String -> Either Error (a, String)
 */

class Parser {
  constructor(parseFn) {
    this.parseFn = parseFn;
  }

  // Runs the parser on an input string
  run(input) {
    return this.parseFn(input);
  }

  // Functor map: Transforms the parsed output value using a pure function
  map(fn) {
    return new Parser(input => {
      const result = this.run(input);
      if (!result.success) return result;
      return {
        success: true,
        value: fn(result.value),
        rest: result.rest
      };
    });
  }

  // Monadic chain (bind): Chains another parser depending on the parsed value
  chain(fn) {
    return new Parser(input => {
      const result = this.run(input);
      if (!result.success) return result;
      const nextParser = fn(result.value);
      return nextParser.run(result.rest);
    });
  }
}

// --- BASIC PARSER COMBINATORS ---

// Parse a single character matching a predicate
const satisfy = predicate => {
  return new Parser(input => {
    if (input.length === 0) {
      return { success: false, error: 'Unexpected end of input' };
    }
    const char = input[0];
    if (predicate(char)) {
      return { success: true, value: char, rest: input.slice(1) };
    }
    return { success: false, error: `Unexpected character: '${char}'` };
  });
};

// Parse a specific character
const char = c => satisfy(x => x === c);

// Parse any character from a given string
const oneOf = charsStr => satisfy(x => charsStr.includes(x));

// Parse a regex match at the start of string
const regex = (pattern, name = 'regex') => {
  return new Parser(input => {
    const match = input.match(pattern);
    if (match && match.index === 0) {
      return {
        success: true,
        value: match[0],
        rest: input.slice(match[0].length)
      };
    }
    return { success: false, error: `Expected match for ${name}` };
  });
};

// Parse zero or more occurrences of a parser
const many = parser => {
  return new Parser(input => {
    const values = [];
    let currentInput = input;
    while (true) {
      const result = parser.run(currentInput);
      if (!result.success) break;
      values.push(result.value);
      currentInput = result.rest;
    }
    return { success: true, value: values, rest: currentInput };
  });
};

// Parse one or more occurrences of a parser
const many1 = parser => {
  return new Parser(input => {
    const firstResult = parser.run(input);
    if (!firstResult.success) return firstResult;

    const restResult = many(parser).run(firstResult.rest);
    return {
      success: true,
      value: [firstResult.value, ...restResult.value],
      rest: restResult.rest
    };
  });
};

// Try multiple parsers in sequence, returning choice of the first success
const choice = parsers => {
  return new Parser(input => {
    for (const parser of parsers) {
      const result = parser.run(input);
      if (result.success) return result;
    }
    return { success: false, error: 'None of the choices matched' };
  });
};

// Sequence: Run a list of parsers in order and return their collected values
const sequence = parsers => {
  return new Parser(input => {
    const values = [];
    let currentInput = input;
    for (const parser of parsers) {
      const result = parser.run(currentInput);
      if (!result.success) return result;
      values.push(result.value);
      currentInput = result.rest;
    }
    return { success: true, value: values, rest: currentInput };
  });
};

// --- DOMAIN SPECIFIC HELPERS ---

const whitespace = many(oneOf(' \t\n\r'));

const lexeme = parser => {
  return new Parser(input => {
    const result = parser.run(input);
    if (!result.success) return result;
    const wsResult = whitespace.run(result.rest);
    return {
      success: true,
      value: result.value,
      rest: wsResult.rest
    };
  });
};

// Parse a specific word (keyword) followed by whitespace
const keyword = str => lexeme(new Parser(input => {
  if (input.startsWith(str)) {
    return { success: true, value: str, rest: input.slice(str.length) };
  }
  return { success: false, error: `Expected keyword: '${str}'` };
}));

// Parse strings inside parentheses: e.g. "(HDFC Visa)"
const insideParens = new Parser(input => {
  if (input[0] !== '(') return { success: false, error: 'Expected opening parenthesis' };
  let count = 1;
  let i = 1;
  while (i < input.length && count > 0) {
    if (input[i] === '(') count++;
    else if (input[i] === ')') count--;
    i++;
  }
  if (count > 0) return { success: false, error: 'Unbalanced parentheses' };
  return {
    success: true,
    value: input.slice(1, i - 1),
    rest: input.slice(i)
  };
});

// --- PRESTOPAY DSL PARSER IMPLEMENTATION ---

// Syntax to parse: 
//   checkout AmazeCart {
//     theme: #7e22ce
//     amount: INR 1499.00
//     options: [ Card(HDFC), UPI(vidushi) ]
//   }

const parseHexColor = lexeme(regex(/^#[0-9a-fA-F]{6}/, 'Hex Color'));
const parseAmount = lexeme(regex(/^[A-Z]{3}\s\d+(\.\d{2})?/, 'Amount'));
const parseIdentifier = lexeme(regex(/^[a-zA-Z_][a-zA-Z0-9_]*/, 'Identifier'));

// Parse single payment method: Card(detail), UPI(detail), Netbanking(detail)
const parsePaymentOption = lexeme(new Parser(input => {
  const typeResult = parseIdentifier.run(input);
  if (!typeResult.success) return typeResult;

  const type = typeResult.value;
  const detailsResult = insideParens.run(typeResult.rest);
  
  if (!detailsResult.success) {
    return { success: false, error: `Expected details inside parens for payment method ${type}` };
  }

  // Assign standard emojis/icons based on type
  let icon = '💸';
  if (type.toLowerCase().includes('card')) icon = '💳';
  if (type.toLowerCase().includes('upi')) icon = '⚡';
  if (type.toLowerCase().includes('netbanking') || type.toLowerCase().includes('bank')) icon = '🏦';

  return {
    success: true,
    value: { id: type.toLowerCase() + '_' + Math.random().toString(36).substr(2, 4), type, details: detailsResult.value, icon },
    rest: detailsResult.rest
  };
}));

// Parse options list: [ Option, Option ]
const parseOptionsList = new Parser(input => {
  if (input[0] !== '[') return { success: false, error: 'Expected opening bracket for options list' };
  
  let rest = input.slice(1);
  const options = [];
  
  const wsRes = whitespace.run(rest);
  rest = wsRes.rest;

  while (rest.length > 0 && rest[0] !== ']') {
    const optRes = parsePaymentOption.run(rest);
    if (!optRes.success) return optRes;
    options.push(optRes.value);
    rest = optRes.rest;

    // Skip comma if exists
    const checkComma = char(',').run(rest);
    if (checkComma.success) {
      rest = whitespace.run(checkComma.rest).rest;
    }
  }

  if (rest.length === 0) return { success: false, error: 'Unbalanced bracket in options list' };
  return {
    success: true,
    value: options,
    rest: rest.slice(1)
  };
});

// Full compiler configuration parser
const parseCheckoutDSL = new Parser(input => {
  let rest = whitespace.run(input).rest;

  // 1. keyword "checkout"
  const kWordRes = keyword('checkout').run(rest);
  if (!kWordRes.success) return kWordRes;

  // 2. Merchant Name
  const merchantRes = parseIdentifier.run(kWordRes.rest);
  if (!merchantRes.success) return merchantRes;
  const merchantName = merchantRes.value;

  // 3. Opening curly brace
  const openBrace = lexeme(char('{')).run(merchantRes.rest);
  if (!openBrace.success) return openBrace;
  rest = openBrace.rest;

  const config = { merchantName, themeColor: '#7e22ce', amount: 'INR 0.00', options: [] };

  // Parse inner properties
  while (rest.length > 0 && rest[0] !== '}') {
    const propRes = parseIdentifier.run(rest);
    if (!propRes.success) return propRes;
    
    const propName = propRes.value;

    const colonRes = lexeme(char(':')).run(propRes.rest);
    if (!colonRes.success) return colonRes;
    rest = colonRes.rest;

    if (propName === 'theme') {
      const colorRes = parseHexColor.run(rest);
      if (!colorRes.success) return colorRes;
      config.themeColor = colorRes.value;
      rest = colorRes.rest;
    } else if (propName === 'amount') {
      const amtRes = parseAmount.run(rest);
      if (!amtRes.success) return amtRes;
      config.amount = amtRes.value;
      rest = amtRes.rest;
    } else if (propName === 'options') {
      const listRes = lexeme(parseOptionsList).run(rest);
      if (!listRes.success) return listRes;
      config.options = listRes.value;
      rest = listRes.rest;
    } else {
      return { success: false, error: `Unknown property: '${propName}'` };
    }
  }

  const closeBrace = lexeme(char('}')).run(rest);
  if (!closeBrace.success) return closeBrace;

  return {
    success: true,
    value: config,
    rest: closeBrace.rest
  };
});

// Export parser functions
window.PrestoParser = {
  parse: (input) => parseCheckoutDSL.run(input)
};
