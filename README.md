# RIME React

RIME React is a [React](https://reactjs.org) Component for the [RIME Input Method Engine](https://rime.im). It is compiled to [WebAssembly](https://webassembly.org) with [Emscripten](https://emscripten.org) and runs purely on client-side.

## Installation

- **npm:** `npm i rime-react`

## Usage

See the [RIME React Demo repo](https://github.com/CanCLID/rime-react-demo).

## Example (CDN Demo)

This repo includes a Vite demo app under `example/` that loads schema files from the
`librime` CDN. To run it:

```sh
npm install
npm run build
cd example
npm install
npm run start
```

The demo copies `dist/rime.js` and `dist/rime.wasm` into `example/assets/` during
the Vite build, while schema files are fetched from the CDN.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) (npm is required; CI uses Node 22)
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
  Common setup options:

  ```sh
  # macOS (Homebrew)
  brew install emscripten
  ```

  ```sh
  # emsdk (all platforms)
  git clone https://github.com/emscripten-core/emsdk.git
  cd emsdk
  ./emsdk install latest
  ./emsdk activate latest
  source ./emsdk_env.sh
  ```

  You must have `emcmake` and `em++` available in the same shell that runs the build.

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
npm install
npm run boost
npm run native
npm run lib
npm run wasm
```

If you see `spawn emcmake ENOENT`, Emscripten is not installed or not on `PATH`.

### Building the Project

```sh
npm run build
```
