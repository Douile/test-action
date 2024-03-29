import * as core from "@actions/core";
import { exec } from "@actions/exec";
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
  await exec("bash", ["rustup.sh", "-y"]);
  await exec("cargo", ["install", "cross"]);
  await tc.cacheDir("/home/runner/.rustup", "rustup", "0");
  await tc.cacheDir("/home/runner/.cargo", "cargo", "0");
});

async function run() {
  await installRustup();
  await exec("docker", ["pull", image]);
  await exec("docker", ["run", "--rm", image]);
}

run().then(null, (error) => core.setFailed(error.message));
