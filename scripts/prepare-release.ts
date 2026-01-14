#!/usr/bin/env bun

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

// ============================================================================
// TYPES
// ============================================================================

interface ExecOptions {
  silent?: boolean;
  encoding?: BufferEncoding;
  stdio?: 'pipe' | 'inherit';
}

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

interface TauriConfig {
  version: string;
  bundle?: {
    createUpdaterArtifacts?: boolean;
  };
  plugins?: {
    updater?: {
      pubkey?: string;
    };
  };
  [key: string]: unknown;
}

// ============================================================================
// CONFIG - Paths relative to monorepo root
// ============================================================================

const APP_DIR = 'apps/app';
const APP_PKG_PATH = `${APP_DIR}/package.json`;
const CARGO_PATH = `${APP_DIR}/src-tauri/Cargo.toml`;
const TAURI_CONFIG_PATH = `${APP_DIR}/src-tauri/tauri.conf.json`;

// ============================================================================
// UTILS
// ============================================================================

function exec(command: string, options: ExecOptions = {}): string {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    }) as string;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Command failed: ${command}\n${message}`);
  }
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const version = process.argv[2];

  if (!version || !version.match(/^v?\d+\.\d+\.\d+$/)) {
    console.error('Usage: bun scripts/prepare-release.ts v1.0.0');
    console.error('   or: bun release:prepare v1.0.0');
    process.exit(1);
  }

  const cleanVersion = version.replace('v', '');
  const tagVersion = version.startsWith('v') ? version : `v${version}`;

  console.log(`Preparing release ${tagVersion}...\n`);

  try {
    //////////////////////////////////////////////////////////////////////

    console.log('Checking git status...');
    const gitStatus = exec('git status --porcelain', { silent: true });
    if (gitStatus.trim()) {
      console.error(
        'Working directory is not clean. Please commit or stash changes first.',
      );
      console.log('Uncommitted changes:');
      console.log(gitStatus);
      process.exit(1);
    }
    console.log('Working directory is clean');

    //////////////////////////////////////////////////////////////////////

    console.log('\nRunning pre-release checks...');
    exec('bun check:all');
    exec('bun --filter @moa/app check:all');
    console.log('All checks passed');

    //////////////////////////////////////////////////////////////////////

    console.log('\nUpdating app package.json...');
    const pkg: PackageJson = JSON.parse(fs.readFileSync(APP_PKG_PATH, 'utf8'));
    const oldPkgVersion = pkg.version;
    pkg.version = cleanVersion;
    fs.writeFileSync(APP_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`   ${oldPkgVersion} -> ${cleanVersion}`);

    //////////////////////////////////////////////////////////////////////

    console.log('Updating Cargo.toml...');
    const cargoToml = fs.readFileSync(CARGO_PATH, 'utf8');
    const oldCargoVersion = cargoToml.match(/version = "([^"]*)"/);
    const updatedCargo = cargoToml.replace(
      /version = "[^"]*"/,
      `version = "${cleanVersion}"`,
    );
    fs.writeFileSync(CARGO_PATH, updatedCargo);
    console.log(
      `   ${oldCargoVersion ? oldCargoVersion[1] : 'unknown'} -> ${cleanVersion}`,
    );

    //////////////////////////////////////////////////////////////////////

    console.log('Updating tauri.conf.json...');
    const tauriConfig: TauriConfig = JSON.parse(
      fs.readFileSync(TAURI_CONFIG_PATH, 'utf8'),
    );
    const oldTauriVersion = tauriConfig.version;
    tauriConfig.version = cleanVersion;
    fs.writeFileSync(
      TAURI_CONFIG_PATH,
      JSON.stringify(tauriConfig, null, 2) + '\n',
    );
    console.log(`   ${oldTauriVersion} -> ${cleanVersion}`);

    //////////////////////////////////////////////////////////////////////

    console.log('\nUpdating lock files...');
    exec('bun install', { silent: true });
    console.log('Lock files updated');

    //////////////////////////////////////////////////////////////////////

    console.log('\nVerifying configurations...');

    if (!tauriConfig.bundle?.createUpdaterArtifacts) {
      console.warn(
        'Warning: createUpdaterArtifacts not enabled in tauri.conf.json',
      );
    } else {
      console.log('Updater artifacts enabled');
    }

    if (!tauriConfig.plugins?.updater?.pubkey) {
      console.warn('Warning: Updater public key not configured');
    } else {
      console.log('Updater public key configured');
    }

    //////////////////////////////////////////////////////////////////////

    console.log('\nRunning final compilation check...');
    exec(`cd ${APP_DIR}/src-tauri && cargo check`);
    console.log('Rust compilation check passed');

    console.log(`\nSuccessfully prepared release ${tagVersion}!`);
    console.log('\nGit commands to execute:');
    console.log('   git add .');
    console.log(`   git commit -m "chore: release ${tagVersion}"`);
    console.log(`   git tag ${tagVersion}`);
    console.log('   git push origin main --tags');

    console.log('\nAfter pushing:');
    console.log('   - GitHub Actions will automatically build the release');
    console.log('   - A draft release will be created on GitHub');
    console.log("   - You'll need to manually publish the draft release");
    console.log('   - Users will receive auto-update notifications');

    //////////////////////////////////////////////////////////////////////

    const answer = await askQuestion(
      '\nWould you like me to execute these git commands? (y/N): ',
    );

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\nExecuting git commands...');

      console.log('Adding changes...');
      exec('git add .');

      console.log('Creating commit...');
      exec(`git commit -m "chore: release ${tagVersion}"`);

      console.log('Creating tag...');
      exec(`git tag ${tagVersion}`);

      console.log('Pushing to remote...');
      exec('git push origin main --tags');

      console.log(`\nRelease ${tagVersion} has been published!`);
      console.log(
        'Check GitHub Actions: https://github.com/nexters/moa/actions',
      );
      console.log(
        'Draft release will appear at: https://github.com/nexters/moa/releases',
      );
      console.log(
        '\nRemember: You need to manually publish the draft release on GitHub!',
      );
    } else {
      console.log('\nGit commands saved for manual execution.');
      console.log("Run them when you're ready to release.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\nPre-release preparation failed:', message);
    process.exit(1);
  }
}

void main();
