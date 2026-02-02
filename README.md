# RIME React

RIME React is a [React](https://reactjs.org) Component for the [RIME Input Method Engine](https://rime.im). It is compiled to [WebAssembly](https://webassembly.org) with [Emscripten](https://emscripten.org) and runs purely on client-side.

## Installation

- **npm:** `npm i rime-react`

## Usage

See the [RIME React Demo repo](https://github.com/CanCLID/rime-react-demo).

## Example (Local Schema Demo)

This repo includes a Vite demo app under `example/` that loads prebuilt schema files
from `example/public/schema/`. To run it:

```sh
npm install
npm run build
cd example
npm install
npm run start
```

The demo copies `dist/rime.js` and `dist/rime.wasm` into `example/assets/` during
the Vite build, while schema files are served from `example/public/schema/`.

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

### Building Schema Binaries

Use the native `rime_deployer` tool to compile `.schema.yaml` + `.dict.yaml` into
the `.bin` artifacts used by the web runtime.

1. Build native tools (once):

```sh
npm install
npm run native
```

This produces `build/librime_native/bin/rime_deployer`.

2. Prepare a data directory containing your schema and dictionary:

```sh
mkdir -p /tmp/rime-data
cp /path/to/my.schema.yaml /path/to/my.dict.yaml /tmp/rime-data/
# include any referenced files (e.g. symbols.yaml, *.txt, custom configs)
```

3. Compile the schema:

```sh
./build/librime_native/bin/rime_deployer --compile \
  /tmp/rime-data/my.schema.yaml \
  /tmp/rime-data /tmp/rime-data /tmp/rime-data/build
```

Outputs land in `/tmp/rime-data/build/` (for example `my.schema.yaml`,
`my.table.bin`, `my.prism.bin`, and `my.reverse.bin` if enabled).

If you maintain a `default.yaml` with `schema_list`, you can compile all schemas
with `rime_deployer --build <user_data_dir> <shared_data_dir> <staging_dir>`.

Copy the source YAMLs plus `build/*` into `example/public/schema/` (or your app’s
public assets) and update `schemaFilesToSHA256` in `example/index.tsx`.

### Building the Project

```sh
npm run build
```
