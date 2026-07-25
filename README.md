# PrestoPay SDK Layout Compiler & FRP Simulator

A high-fidelity layout compiler and interactive payment SDK simulator demonstrating **monadic parser combinators**, **Abstract Syntax Tree (AST) compilation**, and **Functional Reactive state transitions**.

This project is built from first principles (zero dependencies) to align with the core engineering values of **Juspay's SDK CoE**.

---

## ⚡ Core Architecture

The application is structured into four functional layers, keeping state pure and processing pipeline-oriented:

```
[ DSL Source Code ]
       │
       ▼ (parser.js) ── Using Parser Combinators (e.g., satisfy, many, choice)
  [ AST Config ]
       │
       ▼ (compiler.js) ── Dynamic DOM Node Generation
[ Mobile Checkout UI ] <─── Reactive Event Binding
       │
       ▼ (state.js) ── Monadic Dispatcher (State -> Action -> State)
  [ Payment Success ]
```

### 1. Functional Parser Combinators (`parser.js`)
Instead of regex-splitting or imperative loops, parsing is modeled as a sequence of pure parser functions:
* **The Parser Monad**: A wrapper class holding a parser function: `run :: String -> Result (Value, String)`.
* **Combinators**: Exposes pure functional building blocks:
  * `satisfy(predicate)`: Parses single characters matching predicates.
  * `many(parser)`: Runs a parser greedily 0 or more times.
  * `sequence(parsers)`: Runs a chain of parsers, collecting results.
  * `choice(parsers)`: Standard choice combinator (tries alternative parsers in order).
  * `lexeme(parser)`: Strips trailing whitespaces cleanly.

### 2. AST Compiler (`compiler.js`)
* Translates the parsed configurations (JSON schema representing the merchant name, theme color, transaction amount, and card/UPI options list) into stylized native mobile representations.

### 3. FRP State Stream (`state.js`)
* Models payment updates as immutable state transformations. 
* Employs a state store dispatch system representing the payment lifecycle:
  $$\text{INIT} \rightarrow \text{AUTH\_PENDING} \rightarrow \text{VERIFYING} \rightarrow \text{SUCCESS}$$
* Subscribes the mobile preview thread to the store, updating layout templates instantly when states update.

---

## 🔧 How to Run and Test Locally

This project is fully self-contained (HTML, CSS, and vanilla JS) with zero dependencies.

### Option 1: Run with Python's HTTP server
1. Open your terminal or PowerShell.
2. Navigate to the project folder:
   ```bash
   cd C:\Users\lenovo\.gemini\antigravity\scratch\prestopay-sdk
   ```
3. Launch a lightweight local server:
   ```bash
   python -m http-server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000`.

### Option 2: Run with NodeJS http-server
If you have node installed:
1. Navigate to the directory:
   ```bash
   cd C:\Users\lenovo\.gemini\antigravity\scratch\prestopay-sdk
   ```
2. Start the server:
   ```bash
   npx http-server -p 8000
   ```
3. Open `http://localhost:8000` in your web browser.

### Option 3: Double-Click index.html
Simply navigate to the directory in File Explorer and double-click `index.html` to open it directly in Chrome, Edge, or Safari.

---

## 💡 Technical Interview Pitch (For Juspay Recruiters)

When discussing this project in recruitment rounds, highlight these details:
* **First-Principles Parsing**: "I built a monadic parser combinator framework in JavaScript inspired by Haskell's Parsec to parse UI layout declarations into structural AST representations."
* **State Management**: "Instead of mutating state or using React's default hooks, I managed UI transitions using an immutable State Dispatcher and Observable streams to replicate a Functional Reactive Programming model."
