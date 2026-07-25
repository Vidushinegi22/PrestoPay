# ⚡ PrestoPay: Server-Driven UI Layout Compiler & Payment SDK Simulator

**PrestoPay is a tool that reads simple text-based layout instructions and instantly converts them into a fully interactive mobile payment screen.**

<div align="center">
  <a href="https://vidushinegi22.github.io/PrestoPay/"><strong>🚀 Click Here to View Live Demo</strong></a>
  <br><br>
  <h3>Built by <strong>Vidushi Negi</strong></h3>
  <p><strong>A First-Principles Showcase of Monadic Parser Combinators, Abstract Syntax Tree (AST) Compilation, and Functional Reactive UI State Streams.</strong></p>
</div>

---

> [!IMPORTANT]
> **JUSPAY REVIEWER QUICK-START:**
> This repository is built **entirely from scratch with zero dependencies**. It showcases:
> 1. A custom **Monadic Parser Combinator** library (in [parser.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/parser.js)) mimicking Haskell's Parsec.
> 2. An **AST Layout Compiler** (in [compiler.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/compiler.js)) converting DSL to responsive DOM components.
> 3. An **FRP State Stream Store** (in [state.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/state.js)) modeling state transitions as pure functions without side effects.

---

## 💡 The Core Problem: The App Store Update Bottleneck
In modern mobile payment systems, user checkout screens must remain dynamic. If a merchant wants to run a promotional discount, adjust their brand colors, or add a new checkout option (e.g., UPI Intent, Simpl PayLater):
* **The Traditional Way**: Developers modify Android/iOS code, test, build a production bundle, submit to the App Store/Google Play Store, and wait 2 to 5 days for approval. Users must then download the update before seeing changes.
* **The PrestoPay Way (Server-Driven UI)**: The merchant defines their layout rules in a simple text-based config (DSL) on their server. The checkout SDK inside the app downloads this text instruction, compiles it on-the-fly into an AST, and instantly renders the updated checkout screen to the user. **Zero app updates, zero wait time.**

---

## ⚡ Architecture Flow

The compiler pipelines the layout compilation and state management in a strictly uni-directional data flow:

```
[ DSL Source Layout ]
         │
         ▼ (parser.js) ─── Custom Parser combinators (satisfy, choice, sequence, many)
   [ AST JSON ]
         │
         ▼ (compiler.js) ─── Dynamic UI Node Generation & Color Compilation
[ Mobile Checkout Sheet ] 
         │
         ▼ (state.js) ─── Uni-directional Action Dispatcher
   [ Payment Flow ] ─── (INIT → AUTH_PENDING → VERIFYING → SUCCESS)
```

---

## 🛠️ Deep-Dive into the Modules

### 1. Monadic Parser Combinators ([parser.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/parser.js))
Rather than using regex splits or fragile index checks, parsing is modeled as a monadic execution chain.
* **The Parser Signature**: 
  $$\text{Parser } a = \text{String} \rightarrow \text{Result } (a, \text{String})$$
* **Core Combinators Implemented**:
  * `satisfy(predicate)`: Parses single characters matching conditional checks.
  * `many(parser)` / `many1(parser)`: Runs recursive parsers matching greedily.
  * `sequence(parsers)`: Runs parsers in order, building a list of outputs.
  * `choice(parsers)`: Standard choice selection (tries alternative parsers).
  * `lexeme(parser)`: Consumes trailing whitespace.
* **The DSL Grammar**:
  Parses checkout layouts matching:
  ```text
  checkout MerchantName {
    theme: #HexColor
    amount: Currency Number
    options: [ Type(Details), ... ]
  }
  ```

### 2. AST Layout Compiler ([compiler.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/compiler.js))
* Takes the AST configuration output from the parser.
* Maps variables dynamically (compiling color variables into visual gradients, and creating responsive payment nodes).
* Binds event listeners for payment clicks directly to the dispatch pipeline.

### 3. FRP UI State Stream ([state.js](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/state.js))
* Models payment state transitions as pure, immutable functions:
  $$\text{Reducer} :: \text{State} \rightarrow \text{Action} \rightarrow \text{State}$$
* The **State Store** triggers layout re-renders reactively using the Observer pattern:
  * **INIT**: Renders the compiled payment options.
  * **AUTH_PENDING**: Shows secure loader and interactive OTP inputs.
  * **VERIFYING**: Handles gateway security signatures.
  * **SUCCESS**: Displays visual success checkmark and payment metadata.

---

## 🔧 How to Run & Verify Locally

Since the project uses pure vanilla HTML/JS/CSS, it is entirely self-contained with no setup dependencies.

### Option A: Open directly in File Explorer
* Double-click [index.html](file:///C:/Users/lenovo/.gemini/antigravity/scratch/prestopay-sdk/index.html) to run it directly in your browser.

### Option B: Run a local HTTP Server
Open your terminal in the repository folder:
```bash
cd prestopay-sdk
```

* **Python Server** (Pre-installed):
  ```bash
  python -m http-server 8000
  ```
* **Node Server** (If you have NodeJS installed):
  ```bash
  npx http-server -p 8000
  ```

Open your browser and navigate to `http://localhost:8000`.

---

## 📈 Technical Pitch Guidelines (For Interviews)

> [!TIP]
> **Use these talking points during your technical interviews:**
> * **First-Principles Coding**: *"I wanted to understand Server-Driven UI, so I built a layout compiler from scratch. I wrote my own monadic parser combinator framework in JavaScript, mimicking how Haskell's Parsec parses layout instructions into AST objects."*
> * **Predictable State Transitions**: *"I modeled the payment lifecycle (OTP inputs, loaders, success) as a pure state stream. Transitions are done immutably via actions, keeping components decoupled from the core business state."*
