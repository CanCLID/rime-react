import { createRoot } from "react-dom/client";
import { Preferences, RimeReact, Toolbar, useRimeContext } from "rime-react";

const NO_AUTO_FILL = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: "false",
} as const;

const assetsPrefix = process.env.NODE_ENV === "production" ? "" : "/assets/";
// Schema files live in example/public/schema. Update hashes when those files change.
const schemaFilesFetchPrefix = new URL(
  "schema/",
  window.location.href
).toString();

function Loading() {
  return (
    useRimeContext().isLoading && (
      <>
        <span id="loading-dots"></span>
        <span id="loading-label">Loading…</span>
      </>
    )
  );
}

function Controls() {
  const { isLoading, isDeploying, runAsyncTask } = useRimeContext();
  return (
    <section id="demo-controls">
      <div className="panel toolbar-panel">
        <h2>Toolbar</h2>
        <Toolbar
          loading={isLoading || isDeploying}
          runAsyncTask={runAsyncTask}
        />
      </div>
      <div className="panel preferences-panel">
        <h2>Preferences</h2>
        <Preferences runAsyncTask={runAsyncTask} />
      </div>
    </section>
  );
}

function Demo() {
  return (
    <RimeReact
      pathToRimeJS={`${assetsPrefix}rime.js`}
      pathToRimeWASM={`${assetsPrefix}rime.wasm`}
      schemaFilesFetchPrefix={schemaFilesFetchPrefix}
      schemaFilesToSHA256={{
        "build/cangjie5.prism.bin":
          "e22397bf276ef1f0fae0770263ac4b5887a704559b4c02c177e1bfaca4606bbe",
        "build/cangjie5.reverse.bin":
          "55418bd912ed2622dfe02cb57d30355b85de631283fcc14889338f32e8f0cc24",
        "build/cangjie5.schema.yaml":
          "d8e4d2ca763456ac5030670ebb52a0fd822882bdaf75e1060e1857e5998802d4",
        "build/cangjie5.table.bin":
          "10b44a6dee3c4ae93f127b7337c7cfa8efbc950ac994f9301f37b64a7265ac68",
        "build/default.yaml":
          "ee788f6de79b4930d1a6e40a6970afafe56d9c4fc2e093b919a342761d93ab8e",
        "build/luna_pinyin.prism.bin":
          "988dc1adc08f71eee903622fc8140fad8a0baf629f62831005b8a8295713cdbc",
        "build/luna_pinyin.reverse.bin":
          "82e775596e751bfbd4b41c85e2369d27ca91615fd13dad03e253efb0fb41a05c",
        "build/luna_pinyin.schema.yaml":
          "ecc555df727628e15dff4e7cc9be679e7773fba988111489cca03faa650b10ec",
        "build/luna_pinyin.table.bin":
          "3e6b0b4ca6bea497941435d697763a01865643ae5a02fc3df6e7bc33e9c135c7",
        "build/suantau.prism.bin":
          "0e729018e7d3bf8af0304bf95cc56266fec8f031dc17acd3425c7efea3e66202",
        "build/suantau.prism.txt":
          "d5e635f7b9904ff828bf86411921610de67f7922def980fc48cfc0175bf728aa",
        "build/suantau.reverse.bin":
          "b5fcce636bfd874b61b1f774890e6018c2e60bae310b77c5e79779d4b3e0aa0a",
        "build/suantau.schema.yaml":
          "58f2cc0b01b37faecc06c12b274a20870368fb89bf6799c0ce3d076a89df7ae7",
        "build/suantau.table.bin":
          "e978e3c0484bb3b2925b39623f6d168a8a1ae560d936d6299238d95896e3c3b8",
        "build/suantau.table.txt":
          "0765afe6da4796eef264873538a65c390a1d1e14dda855d53fa7badea2a15eb5",
        "cangjie5.dict.yaml":
          "2dbc120d838ea1e30286f565060d6f84c11623ff1798fd52c97d50e370b833dd",
        "cangjie5.schema.yaml":
          "e112cc9624923befde28be408222d3bc3ca95df7c270c508d735570403e8b272",
        "default.yaml":
          "bd83ebdbe2fb577801597af0901d9152ccc6d2a8b12aff895450b1445e354935",
        "essay.txt":
          "3d11a425aa14a47f536812bc60021138bf6aacbe7da69fc0c4fb04f85811173e",
        "installation.yaml":
          "7ed5a38e3360bf3733db4deb644e32669c66f4fb0a54106547ae2dd5a874eb13",
        "luna_pinyin.dict.yaml":
          "971baa1f38a42d3d82f858b5bbdcad6482371f8d93a2f5d5c4ab341046419e3b",
        "luna_pinyin.schema.yaml":
          "33ae5531d6e220089edd14a9e8a52e38b6dee13eb51795aa93ba5ff97140ab38",
        "opencc/HKVariants.ocd2":
          "62750cb79eef18a407030b05bd4abe0e102bec2254d04b2d2310792f44519321",
        "opencc/HKVariantsRev.ocd2":
          "87d4483565860dc96ea5af26f0716864966c4600cc03d5dde73b9487d826021a",
        "opencc/HKVariantsRevPhrases.ocd2":
          "0fd9bc1f9e9250224b0737e320a850fc630f37b7c475a1dcb1081416ade13efa",
        "opencc/JPShinjitaiCharacters.ocd2":
          "970d1ff54460ed4ef3c0e7dab7cd176c917ded0aaeef4299e77de32d94995914",
        "opencc/JPShinjitaiPhrases.ocd2":
          "e3d06b628271327797fa57528a7eef8830f4a1f153e1c5a588f89d77831f7259",
        "opencc/JPVariants.ocd2":
          "384c073d6a53bbeed6016c5a5d54cc4ab209163288b0a61b0276e4f0797f7462",
        "opencc/JPVariantsRev.ocd2":
          "ca3f4ec8ff7178c8314d30c18d9f0eacf9b531337ab2545df8e277fae3fe234c",
        "opencc/STCharacters.ocd2":
          "1ec2298310ca5a9151a554ea57bd86a6296ce917e4cdd1dd0884f789c477641b",
        "opencc/STPhrases.ocd2":
          "74399d1754ba9d174e8ad7047b2714ec95253d213e74a7a71f890c00d90c0e2d",
        "opencc/TSCharacters.ocd2":
          "85291e0173e972bbca58c848fb90b3bb41c79674cb61a75645e01bd884ad5927",
        "opencc/TSPhrases.ocd2":
          "eea69e525e01b8475a1b1ad45f78f25e5aa78986305f185ef6f85e11f5325387",
        "opencc/TWPhrases.ocd2":
          "5053d76b38b3ed0758411f7a062f698217bdb24d3fe92ebda371071cbe615f62",
        "opencc/TWPhrasesRev.ocd2":
          "01c81982f2871361ce11b8cca4f9a3539f1b6e1f28de254dedef6352a0b5c26d",
        "opencc/TWVariants.ocd2":
          "390f07a1867ad56aa60a7af23b6e4b3acc96ea48d893c06ede3dffb1c576c2bc",
        "opencc/TWVariantsRev.ocd2":
          "663471398c79400db4485df5e92b709ac174c5e393f4fe0e3d5b02034024d609",
        "opencc/TWVariantsRevPhrases.ocd2":
          "ea51dde3e45fdaf9349473ae19b3567fe5da59b01aeff2f4e9eae50c9baf2c24",
        "opencc/hk2s.json":
          "eb651448d8b536d6131e53e254e8ca2c158c9ced50fd55ee88a76e606dd32efa",
        "opencc/hk2t.json":
          "1e5df53815d42a9ff5a1c6333b3987c072e27a27376d33f1864dc7b302751bb1",
        "opencc/jp2t.json":
          "3f9b091520ba0d55ecfe6fca719a672bb2691b1eb9b0c0a43a4aa4326b15fd9e",
        "opencc/s2hk.json":
          "3708e756ea01783e9cf6b3cce527580810b3d539b8c7fcc3594dd1517aa05bff",
        "opencc/s2t.json":
          "710bb970e406d9c0a3dd33c609248686cf1c5578d064b7b7fc89e70fbb9ea75d",
        "opencc/s2tw.json":
          "67ce1f5aa3d6b21ebb523084b40e66f80bec27bb2dc6b540d44dac2e27f7194e",
        "opencc/s2twp.json":
          "72d187574510542be608c862d5359d29480ee61f137082df8a06d74f7bcfc79c",
        "opencc/t2hk.json":
          "a8531beb7430fe1afed0294a893af529c7b7fd2ad41567b5daccb8399c8ef2f0",
        "opencc/t2jp.json":
          "4fb22429d63173715fec30524111ec141c0577b66c9f090513ea8bac4741ad77",
        "opencc/t2s.json":
          "b818534194f27c2d95f01001edb0a5ec49b9050119892cb30a0504bb202cc07c",
        "opencc/t2tw.json":
          "11495bf144cd932a9568810822a5af0fbba2db9c2e06a2bb2871583423fac24a",
        "opencc/tw2s.json":
          "fd3e758691a87c9246d081612021c7f9186ce7abe845cd4eff3e7326c300434d",
        "opencc/tw2sp.json":
          "d107837817e7704cec83a9ff7b876c289eb0ae752722c790c9bf967509c9eaa6",
        "opencc/tw2t.json":
          "046fbdf089388d11d51e5ac415e82564ff71b6e9add008cce7488e845d798c57",
        "suantau.dict.yaml":
          "c8d7ea05b89c6d0180248b0cecf980022d03c022bbfff29bb694dd970814919b",
        "suantau.schema.yaml":
          "20718ec45ed423e4a4f3dd7944e2dc7feb69348cb64f2336ac808f5bd1429e1e",
        "symbols.yaml":
          "e4cda5663039e284ce62d7febe207bf6b788df6a9705ca174fabd7f8c140ed30",
        "user.yaml":
          "d186a85061ee7e55fde6403cdcbb5101af053e67d77723dab8ddf82d83d0047a",
      }}
      onError={console.error}
    >
      <main>
        <div id="heading">
          <h1>Rime React Demo</h1>

          <Loading />
        </div>
        <p>
          This is a demo of the{" "}
          <a href="https://github.com/CanCLID/rime-react">Rime React</a>{" "}
          component library. You can hit <kbd>F4</kbd> or <kbd>Ctrl</kbd> +{" "}
          <kbd>`</kbd> to open the menu. There are 3 schemas available in this
          demo: 朙月拼音、倉頡五代、潮語拼音汕頭. Hit <kbd>`</kbd> to reverse
          lookup (反查).
        </p>
        <textarea
          className="text-field"
          {...NO_AUTO_FILL}
          defaultValue="Type anything"
        />{" "}
        <Controls />
      </main>
    </RimeReact>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
