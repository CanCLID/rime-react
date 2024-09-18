# RIME React

RIME React is a [React](https://reactjs.org) Component for the [RIME Input Method Engine](https://rime.im). It is compiled to [WebAssembly](https://webassembly.org) with [Emscripten](https://emscripten.org) and runs purely on client-side.

## Installation

- **npm:** `npm i rime-react`
- **bun:** `bun i rime-react`

## Usage

See the [RIME React Demo repo](https://github.com/CanCLID/rime-react-demo).

## Development

### Prerequisites

- [Bun](https://bun.sh)

  Execute the command provided on the website to install Bun. Alternatively, you may install it with npm:

  ```sh
  npm i -g bun
  ```

- [CMake](https://cmake.org)
- [Ninja](https://ninja-build.org)
- [LLVM](https://llvm.org) (Windows only)

  You may install the above prerequisites with the following commands:

  ```sh
  # Ubuntu
  sudo apt install -y cmake ninja-build
  # macOS
  brew install cmake ninja
  # Windows
  choco install -y cmake --ia "ADD_CMAKE_TO_PATH=System"
  choco install -y ninja llvm
  ```

  On Windows, you may skip the installation above and execute subsequent commands in _Developer PowerShell for Visual Studio_ if you have Visual Studio installed.

- [Emscripten](https://emscripten.org)

  Follow the [installation guide](https://emscripten.org/docs/getting_started/downloads.html) to install Emscripten.

### Compilation

On Ubuntu, the following additional packages should be pre-installed:

```sh
sudo apt install -y \
    libboost-dev \
    libboost-regex-dev \
    libyaml-cpp-dev \
    libleveldb-dev \
    libmarisa-dev \
    libopencc-dev
```

Then, execute the following commands in order:

```sh
bun run boost
bun run native
bun run lib
bun run wasm
```

### Building the Project

```sh
bun run build
```
