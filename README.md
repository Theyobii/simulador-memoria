# VRAM Translation Simulator · [![NodeJS CI](https://github.com/Theyobii/simulador-memoria/actions/workflows/node-ci.yaml/badge.svg)](https://github.com/Theyobii/simulador-memoria/actions/workflows/node-ci.yaml) [![Rust CI](https://github.com/Theyobii/simulador-memoria/actions/workflows/rust-ci.yml/badge.svg)](https://github.com/Theyobii/simulador-memoria/actions/workflows/rust-ci.yml)

A translation simulator of logical to physical addresses under a paging and virtual memory scheme. It accepts a sequence of page references and processes them with the FIFO and LRU replacement algorithms, calculating and displaying the page‑fault rate of each algorithm to facilitate performance analysis.

---

<img alt="image" src="https://github.com/user-attachments/assets/a275463a-05f7-44df-a153-42e60f4fa8f1" />

---

## Table of Contents

- [Technologies](#technologies)
- [Build](#build)
  - [Prerequisites for Building and Running](#prerequisites-for-building-and-running)
  - [Development Requirements](#development-requirements)
  - [Steps](#steps)
- [Code Quality](#code-quality)
- [Downloads](#downloads)
- [License](#license)

---

## Technologies

This project uses various technologies from the Rust and NodeJS ecosystem, but its main ones are:

- **[React](https://github.com/facebook/react)** - "The library for web and native user interfaces".
- **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** - "A utility-first CSS framework for rapid UI development.".
- **[Wry](https://github.com/tauri-apps/wry)** - "Cross-platform WebView library in Rust for Tauri".
- **[Tao](https://github.com/tauri-apps/tao)** - "The TAO of cross-platform windowing. A library in Rust built for Tauri.".

---

## Build

### Prerequisites for Building and Running

- **Linux**: Install the following system dependencies via `apt`:

  ```bash
  sudo apt-get update
  sudo apt-get install -y \
      libglib2.0-dev \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      libappindicator3-dev \
      librsvg2-dev \
      build-essential \
      pkg-config
  ```

- **Windows**: Ensure the **WebView2** runtime is installed. You can download it from [Microsoft's official page](https://developer.microsoft.com/microsoft-edge/webview2).

### Development Requirements

- **Rust** 1.90.0 or higher.
- **NodeJS** 22.21.1 or higher.
- **PNPM** 10.28.0 or higher.

### Steps

1. **Clone the repository and enter it:**

   ```bash
   git clone https://github.com/Theyobii/simulador-memoria.git
   cd simulador-memoria
   ```

2. **Install the dependencies and compile the binary:**

   ```bash
   pnpm install
   pnpm package:release
   ```

   The binary is usually saved in the `./package` directory (within the repository).

---

## Code Quality

This project includes comprehensive code quality tools:

- **[Clippy](https://github.com/rust-lang/rust-clippy)** - "A collection of lints to catch common mistakes and improve your Rust code".
- **[rustfmt](https://github.com/rust-lang/rustfmt)** - "A tool for formatting Rust code according to style guidelines".
- **[TypeScript](https://github.com/microsoft/TypeScript)** - "TypeScript is a superset of JavaScript that compiles to clean JavaScript output".
- **[ESLint](https://github.com/eslint/eslint)** - "Find and fix problems in your JavaScript code.".
- **[Prettier](https://github.com/prettier/prettier)** - "Prettier is an opinionated code formatter".

---

## Downloads

You can get the latest release from this repository's [releases page](https://github.com/Theyobii/simulador-memoria/releases). The binaries are automatically compiled through GitHub Actions and are available for the following platforms: Windows (32-bit and 64-bit) and Linux (64-bit only).

**Note:** To run the application, you must first install the system prerequisites listed in the [Build](#build) section.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
