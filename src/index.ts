import * as core from '@actions/core';
import { exec } from '@actions/exec';


const image = 'ghcr.io/cross-rs/aarch64-unknown-linux-gnu:latest';

async function run() {
  await exec('docker', ['pull', image]);
  await exec('docker', ['run', '--rm', image]);
}

run().then(null, (error) => core.setFailed(error.message));
