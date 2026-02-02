# RIME React

RIME React is a [React](https://reactjs.org) Component for the [RIME Input Method Engine](https://rime.im). It is compiled to [WebAssembly](https://webassembly.org) with [Emscripten](https://emscripten.org) and runs purely on client-side.

## Installation

- **npm:** `npm i rime-react`

## Usage

See the [RIME React Demo repo](https://github.com/CanCLID/rime-react-demo).

### Toolbar And Preferences (Optional)

`Toolbar` and `Preferences` are exposed as optional UI helpers. They require
`runAsyncTask`, which is now available from `useRimeContext()` when rendered
inside `RimeReact`.

```tsx
import { Preferences, RimeReact, Toolbar, useRimeContext } from "rime-react";

function Controls() {
  const { isLoading, isDeploying, runAsyncTask } = useRimeContext();
  return (
    <>
      <Toolbar loading={isLoading || isDeploying} runAsyncTask={runAsyncTask} />
      <Preferences runAsyncTask={runAsyncTask} />
    </>
  );
}
```

Preferences are persisted via Rime’s `*.custom.yaml` mechanism and trigger a
deploy when changed. The default page size is represented by `-1` and clears
the custom override.

### Toolbar State (Local Storage Only)

For now, toolbar option state is initialized from local storage only. This
keeps the implementation simple and responsive, but it can drift from the
actual engine state if Rime changes options internally (schema load, switcher
defaults, hotkeys, etc.).

**TODO:** Consider a future `getOption` API to initialize toolbar state from
Rime after deploy, and reconcile local storage with engine state.



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

### OpenCC Assets (Character Conversion)

Rime’s simplifier filter loads OpenCC configs and `.ocd2` dictionaries from
`opencc/` under the shared data directory. This repo ships a full OpenCC bundle
in `assets/opencc/` (configs + dictionaries for HK/TW/JP variants). To enable
conversion in your app, copy `node_modules/rime-react/assets/opencc/` into your
schema assets (for example `public/schema/opencc/`) and include those files in
`schemaFilesToSHA256`.

`.ocd2` is OpenCC’s binary dictionary format (generated from the `.txt`
dictionaries and stored as a Marisa trie for fast lookup). The JSON configs
(`t2s.json`, `t2hk.json`, etc.) reference these `.ocd2` files by name, so they
must be present for conversion to work.

## Example App

### Running Local Schema Demo

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

### One Schema + OpenCC (Step-by-Step)

Below is a minimal, end-to-end flow for a new app that has one
`my.schema.yaml` and one `my.dict.yaml`.

1. Install the package:

```sh
npm i rime-react
```

2. Create a schema assets folder in your app and copy your YAMLs:

```sh
mkdir -p public/schema
cp /path/to/my.schema.yaml /path/to/my.dict.yaml public/schema/
```

3. Build the schema binaries using `rime_deployer` (run once from this repo).
`rime_deployer --compile` takes four arguments:
`<schema_path> <user_data_dir> <shared_data_dir> <build_dir>`.
For web apps it’s common to point **user** and **shared** to the same schema
folder, which is why the path is repeated below.

```sh
# in a checkout of this repo
npm install
npm run native

./build/librime_native/bin/rime_deployer --compile \
  /absolute/path/to/your/app/public/schema/my.schema.yaml \
  /absolute/path/to/your/app/public/schema \
  /absolute/path/to/your/app/public/schema \
  /absolute/path/to/your/app/public/schema/build
```

This generates `build/my.schema.yaml`, `build/my.table.bin`, `build/my.prism.bin`,
and `build/my.reverse.bin` (if enabled).

4. Add OpenCC assets (for Simplified/HK/TW/JP variants):

```sh
cp -R node_modules/rime-react/assets/opencc public/schema/opencc
```

5. Inside the app, generate SHA-256 hashes and wire them into your app:

```sh
node - <<'NODE'
import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { join, posix } from 'path';

async function walk(dir, base) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full, base));
    else files.push(posix.normalize(full.replace(base + '/', '')));
  }
  return files;
}

const base = 'public/schema';
const files = (await walk(base, base)).sort();
const map = {};
for (const rel of files) {
  const buf = await readFile(join(base, rel));
  map[rel] = createHash('sha256').update(buf).digest('hex');
}
console.log(JSON.stringify(map, null, 2));
NODE
```

Paste the JSON into `schemaFilesToSHA256` in your app and set
`schemaFilesFetchPrefix` to your schema asset URL (e.g. `/schema/`).

### Building the Project

```sh
npm run build
```
