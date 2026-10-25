import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const dockerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tag = "sha-" + "a".repeat(40);
const originalEnv = "TAG=bootstrap-20261024-01\nJWT_SECRET=keep-this-$literal\nHTTP_PORT=8081\n";
const originalCompose = "name: screenwright\n# previous version\n";
const fakeDocker = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').trim().split('\\n').map(line => { const i=line.indexOf('='); return [line.slice(0,i),line.slice(i+1)]; }));
const currentTag = process.env.TAG || env.TAG;
const state = fs.existsSync(process.env.TEST_STATE) ? JSON.parse(fs.readFileSync(process.env.TEST_STATE,'utf8')) : {};
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({args, tag: currentTag})+'\\n');
const fail = stage => { if (process.env.TEST_FAIL === stage) { console.error('simulated '+stage+' failure'); process.exit(1); } };
if (args[0] === 'login') { fs.readFileSync(0,'utf8'); process.exit(0); }
if (args[0] === 'pull') process.exit(0);
if (args[0] !== 'compose') process.exit(2);
if (args[1] === 'exec') { fail('backup'); process.stdout.write('PGDMP-test-backup'); }
else if (args[1] === 'run') fail('migration');
else if (args[1] === 'up') {
  if (args.includes('api')) state.server = currentTag;
  if (args.includes('web')) state.web = currentTag;
  fs.writeFileSync(process.env.TEST_STATE,JSON.stringify(state));
}
else if (args[1] === 'port') process.stdout.write('0.0.0.0:8081\\n');
`;

function runDeployment(t, fail = "") {
  const root = mkdtempSync(path.join(os.tmpdir(), "funbi-deployment-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const release = path.join(root, "release");
  const bin = path.join(root, "bin");
  mkdirSync(release);
  mkdirSync(bin);
  for (const file of ["deploy-registry.sh", "backup.sh"]) copyFileSync(path.join(dockerDir, file), path.join(release, file));
  writeFileSync(path.join(release, "docker-compose.yml"), "name: screenwright\n# next version\n");
  writeFileSync(path.join(root, ".env"), originalEnv);
  writeFileSync(path.join(root, "docker-compose.yml"), originalCompose);
  writeFileSync(path.join(bin, "docker"), fakeDocker);
  writeFileSync(path.join(bin, "curl"), '#!/usr/bin/env bash\n[[ "$TEST_FAIL" != health ]]\n');
  chmodSync(path.join(bin, "docker"), 0o755);
  chmodSync(path.join(bin, "curl"), 0o755);
  const log = path.join(root, "commands.jsonl");
  const stateFile = path.join(root, "state.json");
  const result = spawnSync("bash", [path.join(release, "deploy-registry.sh"), "example/screenwright", tag, "ci-user"], {
    cwd: root,
    env: { ...process.env, DEPLOY_DIR: root, PATH: bin + path.delimiter + process.env.PATH, TEST_FAIL: fail, TEST_LOG: log, TEST_STATE: stateFile },
    input: "test-token\n",
    encoding: "utf8"
  });
  assert.ifError(result.error);
  return {
    result,
    env: readFileSync(path.join(root, ".env"), "utf8"),
    compose: readFileSync(path.join(root, "docker-compose.yml"), "utf8"),
    state: readdirSync(root).includes("state.json") ? JSON.parse(readFileSync(stateFile, "utf8")) : {},
    commands: readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line)),
    backup: readdirSync(path.join(root, "backups"), { recursive: true }).some(file => String(file).endsWith("database.dump")),
    authDirectories: readdirSync(root).filter(file => file.startsWith(".docker-auth."))
  };
}

test("successful deployment persists both image names and version while preserving other configuration", t => {
  const actual = runDeployment(t);
  assert.equal(actual.result.status, 0, actual.result.stderr);
  assert.match(actual.env, new RegExp("TAG=" + tag));
  assert.match(actual.env, /SERVER_IMAGE=ghcr.io\/example\/screenwright\/server/);
  assert.match(actual.env, /WEB_IMAGE=ghcr.io\/example\/screenwright\/web/);
  assert.match(actual.env, /JWT_SECRET=keep-this-\$literal/);
  assert.deepEqual(actual.state, { server: tag, web: tag });
  assert.equal(actual.backup, true);
  assert.deepEqual(actual.authDirectories, []);
});

test("backup failure leaves the running applications and configuration untouched", t => {
  const actual = runDeployment(t, "backup");
  assert.notEqual(actual.result.status, 0);
  assert.equal(actual.env, originalEnv);
  assert.equal(actual.compose, originalCompose);
  assert.deepEqual(actual.state, {});
  assert.deepEqual(actual.authDirectories, []);
});

test("migration failure restores configuration without restarting the existing applications", t => {
  const actual = runDeployment(t, "migration");
  assert.notEqual(actual.result.status, 0);
  assert.equal(actual.env, originalEnv);
  assert.equal(actual.compose, originalCompose);
  assert.deepEqual(actual.state, {});
  assert.equal(actual.backup, true);
});

test("failed HTTP health check returns both applications to the previous version and retains the database backup", t => {
  const actual = runDeployment(t, "health");
  assert.notEqual(actual.result.status, 0);
  assert.equal(actual.env, originalEnv);
  assert.equal(actual.compose, originalCompose);
  assert.deepEqual(actual.state, { server: "bootstrap-20261024-01", web: "bootstrap-20261024-01" });
  assert.equal(actual.backup, true);
  assert.equal(actual.commands.some(command => command.args.includes("down")), false);
  assert.deepEqual(actual.authDirectories, []);
});
