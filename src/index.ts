import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as tc from "@actions/tool-cache";

const image = "ghcr.io/cross-rs/aarch64-unknown-linux-gnu:latest";

/**
 * Wrap an async function in a actions group.
 * @param name Name of the actions group
 * @param func Async function
 * @returns Void promise.
 */
function groupWrap(
  name: string,
  func: () => Promise<void>,
): () => Promise<void> {
  return async function () {
    core.startGroup(name);
    try {
      await func();
    } finally {
      core.endGroup();
    }
  };
}

const installRustup = groupWrap("install toolchain", async () => {
  await tc.downloadTool("https://sh.rustup.rs", "rustup.sh");
  const rustupVersion = await getExecOutput("bash", ["rustup.sh", "--version"]);
  await exec("bash", ["rustup.sh", "-y"]);
  await tc.cacheDir("/home/runner/.rustup", "rustup", rustupVersion.stdout);
});

const installCross = groupWrap("install cross", async () => {
  await exec("cargo", ["install", "cross"]);
  const crossVersion = await getExecOutput("cross", ["--version"]);
  await tc.cacheDir("/home/runner/.cargo/bin", "cross", crossVersion.stdout);
});

const build = groupWrap("build", async () => {
  await exec("cross", ["build"]);
});

async function run() {
  await installRustup();
  await installCross();

  await exec("cargo", ["init", "--bin", "--name", "example"]);

  await build();
}

run().then(null, (error) => core.setFailed(error.message));
