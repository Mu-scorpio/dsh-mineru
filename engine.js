/**
 * MinerU PDF parsing — Host half.
 *
 * Exposes an authenticated plugin RPC channel (`/mineru`) and an authenticated
 * streaming upload route (`/api/mineru/upload`), performs the MinerU v4 parse
 * flow on the Node side, saves results into a user-chosen directory, and
 * registers the `mineru_parse` agent tool.
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile, readdir, stat, rm, readFile, copyFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const BASE = 'https://mineru.net/api/v4';
const CRED_REF = 'MINERU_API_TOKEN';
const DEFAULT_CONFIG = {
  defaultModelVersion: 'vlm',
  defaultLanguage: 'ch',
  maxFileBytes: 209715200,
  chunkPages: 500,
  parseTimeoutMs: 30 * 60 * 1000,
};

/** Hard dependency: the authenticated connection bridge and the credential store. */
export const inject = ['connection', 'credentials'];

const ok = (value) => ({ ok: true, value });
const fail = (code, message, details) => ({ ok: false, error: { code, message, details: details || {} } });

function tagged(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mineruError(json) {
  const code = json && json.code !== undefined ? json.code : 'unknown';
  const message = (json && (json.msg || json.message)) || `MinerU error ${code}`;
  return tagged(`mineru_${code}`, String(message));
}

function sanitizeBaseName(name) {
  const raw = String(name || 'document');
  const trimmed = raw.replace(/\\.[^./\\]+$/, '');
  const cleaned = trimmed
    .replace(/[/\\:*?"<>|\u0000-\u001f]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120)
    .trim();
  return cleaned || 'document';
}

function extensionOf(name) {
  const match = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return match ? match[1].toLowerCase() : 'pdf';
}

function normalizeOptions(raw, config) {
  const o = raw || {};
  const extra = Array.isArray(o.extraFormats)
    ? o.extraFormats.filter((x) => x === 'docx' || x === 'html' || x === 'latex')
    : [];
  return {
    modelVersion: o.modelVersion === 'pipeline' ? 'pipeline' : (o.modelVersion === 'vlm' ? 'vlm' : (config.defaultModelVersion || 'vlm')),
    language: String(o.language || config.defaultLanguage || 'ch'),
    enableFormula: o.enableFormula !== false,
    enableTable: o.enableTable !== false,
    isOcr: !!o.isOcr,
    pageRanges: o.pageRanges ? String(o.pageRanges) : '',
    extraFormats: extra,
    chunkPages: o.chunkPages === 0 ? 0 : (Number(o.chunkPages) > 0 ? Number(o.chunkPages) : (Number(config.chunkPages) > 0 ? Number(config.chunkPages) : 500)),
  };
}

function jsonResponse(result, status) {
  return new Response(JSON.stringify(result), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => { clearTimeout(timer); reject(tagged('cancelled', '已取消')); };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    let child;
    try { child = spawn(command, args); } catch (error) { reject(error); return; }
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(0, 400)}`));
    });
  });
}

async function unzipTo(zipPath, targetDir) {
  try {
    await runCommand('unzip', ['-o', '-q', zipPath, '-d', targetDir]);
    return;
  } catch (first) {
    try {
      await runCommand('ditto', ['-x', '-k', zipPath, targetDir]);
      return;
    } catch (second) {
      throw tagged('unzip_failed', `解压失败：${second.message || first.message}`);
    }
  }
}

async function listFilesRecursive(root) {
  const out = [];
  async function walk(dir, prefix) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(full, rel);
      else out.push(rel);
    }
  }
  await walk(root, '');
  return out;
}


async function copyDirRecursive(src, dest) {
  try {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) await copyDirRecursive(s, d);
      else await copyFile(s, d);
    }
  } catch { /* ignore */ }
}

async function mergeImages(srcDir, destDir, prefix) {
  try {
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) continue;
      await copyFile(path.join(srcDir, entry.name), path.join(destDir, prefix + entry.name));
    }
  } catch { /* ignore */ }
}

/** Heuristic PDF page counter: page objects plus the Pages /Count, whichever is larger. */
function countPdfPages(buffer) {
  let count = 0;
  let idx = 0;
  while (true) {
    idx = buffer.indexOf('/Type', idx);
    if (idx < 0) break;
    let j = idx + 5;
    while (j < buffer.length && (buffer[j] === 32 || buffer[j] === 10 || buffer[j] === 13 || buffer[j] === 9)) j++;
    if (buffer[j] === 47 && buffer[j + 1] === 80 && buffer[j + 2] === 97 && buffer[j + 3] === 103 && buffer[j + 4] === 101 && buffer[j + 5] !== 115) count++;
    idx += 5;
  }
  let maxCount = 0;
  idx = 0;
  while (true) {
    idx = buffer.indexOf('/Count', idx);
    if (idx < 0) break;
    let j = idx + 6;
    while (j < buffer.length && (buffer[j] === 32 || buffer[j] === 9 || buffer[j] === 10 || buffer[j] === 13)) j++;
    let num = 0; let got = false;
    while (j < buffer.length && buffer[j] >= 48 && buffer[j] <= 57) { num = num * 10 + (buffer[j] - 48); j++; got = true; }
    if (got && num > maxCount) maxCount = num;
    idx += 6;
  }
  return count > 0 ? count : maxCount;
}

export function apply(ctx, rawConfig) {
  const config = { ...DEFAULT_CONFIG, ...(rawConfig || {}) };
  const jobs = new Map();
  const queue = [];
  let running = false;

  async function getToken() {
    const resolved = await ctx.credentials.resolve(CRED_REF);
    return resolved && resolved.value ? resolved.value : null;
  }

  async function httpJson(pathname, token, options, signal) {
    const opts = options || {};
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${BASE}${pathname}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal,
    });
    let json = {};
    try { json = await response.json(); } catch { /* keep empty */ }
    return json;
  }

  /**
   * Download the result zip.
   *
   * The result CDN resets Node's TLS handshake (and any proxied request), while
   * `curl --noproxy '*'` succeeds. Try curl first, then a direct Node http(s)
   * request, then the environment-proxy fetch as a last resort.
   */
  async function downloadTo(url, dest) {
    const viaCurl = () => new Promise((resolve, reject) => {
      let child;
      try {
        child = spawn('curl', ['--noproxy', '*', '-sSL', '--fail', '--max-time', '180', '-o', dest, url]);
      } catch (error) { reject(error); return; }
      let stderr = '';
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(tagged('download_failed', `下载失败（curl ${code}）${stderr.slice(0, 200)}`));
      });
    });
    const viaHttps = (currentUrl, redirects) => new Promise((resolve, reject) => {
      let parsed;
      try { parsed = new URL(currentUrl); } catch { reject(tagged('download_failed', '无效下载地址')); return; }
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(parsed, { headers: { 'User-Agent': 'curl/8.0', Accept: '*/*' } }, (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirects < 5) {
          res.resume();
          resolve(viaHttps(new URL(res.headers.location, parsed).href, redirects + 1));
          return;
        }
        if (status !== 200) { res.resume(); reject(tagged('download_failed', `下载结果失败 HTTP ${status}`)); return; }
        pipeline(res, createWriteStream(dest)).then(resolve).catch((error) => reject(tagged('download_failed', `写入失败：${error.message}`)));
      });
      req.on('error', (error) => reject(tagged('download_failed', `下载失败：${error.code || error.message}`)));
      req.setTimeout(180000, () => req.destroy(new Error('download timeout')));
    });
    try { await viaCurl(); return; } catch (error) { /* try next */ }
    try { await viaHttps(url, 0); return; } catch (error) { /* try next */ }
    const response = await fetch(url);
    if (!response.ok || !response.body) throw tagged('download_failed', `下载结果失败 HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
  }

  async function resolveOutDir(job) {
    const base = path.join(job.saveDir, sanitizeBaseName(job.name));
    let candidate = base;
    let index = 1;
    for (;;) {
      try {
        await stat(candidate);
        candidate = `${base}-${index++}`;
      } catch {
        return candidate;
      }
    }
  }

  async function runBatchOnce(job, token, pageRange, outDir) {
    const fileEntry = { name: job.name, data_id: pageRange ? `${job.id}-${pageRange}` : job.id };
    if (pageRange) fileEntry.page_ranges = pageRange;
    const requestBody = {
      files: [fileEntry],
      model_version: job.options.modelVersion,
      language: job.options.language,
      enable_formula: job.options.enableFormula,
      enable_table: job.options.enableTable,
      is_ocr: job.options.isOcr,
    };
    if (pageRange) requestBody.no_cache = true;
    if (job.options.extraFormats.length) requestBody.extra_formats = job.options.extraFormats;

    let created;
    try {
      created = await httpJson('/file-urls/batch', token, { method: 'POST', body: requestBody }, job.signal);
    } catch (error) {
      throw tagged('network', `连接 MinerU 失败：${(error.cause && (error.cause.code || error.cause.message)) || error.message}`);
    }
    if (!created || created.code !== 0) throw mineruError(created);
    const batchId = created.data.batch_id;
    const uploadUrl = created.data.file_urls[0];
    job.batchId = batchId;

    const fileStat = await stat(job.tempPath);
    if (fileStat.size > config.maxFileBytes) throw tagged('too_large', '文件超过大小限制');
    job.size = fileStat.size;

    let putResponse;
    try {
      putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: Readable.toWeb(createReadStream(job.tempPath)),
        duplex: 'half',
        headers: { 'Content-Length': String(fileStat.size) },
      });
    } catch (error) {
      throw tagged('upload_failed', `上传失败：${(error.cause && (error.cause.code || error.cause.message)) || error.message}`);
    }
    if (!putResponse.ok) throw tagged('upload_failed', `上传到 MinerU 失败 HTTP ${putResponse.status}`);

    job.state = 'parsing';
    const deadline = Date.now() + Number(config.parseTimeoutMs || DEFAULT_CONFIG.parseTimeoutMs);
    let item = null;
    for (;;) {
      if (job.signal.aborted) throw tagged('cancelled', '已取消');
      let result;
      try {
        result = await httpJson(`/extract-results/batch/${batchId}`, token, {}, job.signal);
      } catch (error) {
        throw tagged('network', `查询进度失败：${(error.cause && (error.cause.code || error.cause.message)) || error.message}`);
      }
      if (!result || result.code !== 0) throw mineruError(result);
      const list = (result.data && result.data.extract_result) || [];
      item = list.find((entry) => entry.file_name === job.name) || list[0] || null;
      if (item) {
        if (item.extract_progress) {
          if (typeof item.extract_progress.extracted_pages === 'number') job._chunkDone = item.extract_progress.extracted_pages;
          if (typeof item.extract_progress.total_pages === 'number' && !job.pages.total) job.pages.total = item.extract_progress.total_pages;
        }
        if (item.state === 'done') break;
        if (item.state === 'failed') throw tagged('mineru_failed', item.err_msg || '解析失败');
      }
      if (Date.now() > deadline) throw tagged('timeout', '解析超时');
      await sleep(3000, job.signal);
    }

    if (!item.full_zip_url) throw tagged('no_result', '结果缺少下载地址');
    job.state = 'downloading';
    await downloadTo(item.full_zip_url, job.zipPath);
    job.state = 'saving';
    await mkdir(outDir, { recursive: true });
    await unzipTo(job.zipPath, outDir);
    return await listFilesRecursive(outDir);
  }

  async function executeJob(job) {
    const cleanup = async () => {
      if (job.isTemp) { try { await rm(job.tempPath, { force: true }); } catch { /* ignore */ } }
      try { await rm(job.zipPath, { force: true }); } catch { /* ignore */ }
    };
    try {
      job.state = 'uploading';
      const token = await getToken();
      if (!token) throw tagged('no_token', '未配置 MinerU API 密钥');

      const fileStat = await stat(job.tempPath);
      if (fileStat.size > config.maxFileBytes) throw tagged('too_large', '文件超过大小限制');
      job.size = fileStat.size;

      let pageCount = 0;
      try { pageCount = countPdfPages(await readFile(job.tempPath)); } catch { pageCount = 0; }
      const chunkPages = Number(job.options.chunkPages || config.chunkPages || 0);
      const chunks = [];
      if (pageCount > 0 && chunkPages > 0 && pageCount > chunkPages) {
        for (let a = 1; a <= pageCount; a += chunkPages) chunks.push([a, Math.min(pageCount, a + chunkPages - 1)]);
      }
      if (pageCount > 0) job.pages.total = pageCount;

      if (chunks.length <= 1) {
        const outputDir = await resolveOutDir(job);
        const files = await runBatchOnce(job, token, '', outputDir);
        job.result = { outputDir, files, pageCount: pageCount || undefined };
      } else {
        const finalOut = await resolveOutDir(job);
        await mkdir(path.join(finalOut, 'images'), { recursive: true });
        let merged = '';
        const chunkMeta = [];
        for (let i = 0; i < chunks.length; i++) {
          const a = chunks[i][0];
          const b = chunks[i][1];
          const range = `${a}-${b}`;
          const tmp = path.join(os.tmpdir(), `dsh-mineru-${job.id}-c${i}`);
          try { await rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
          await mkdir(tmp, { recursive: true });
          job.state = 'uploading';
          await runBatchOnce(job, token, range, tmp);
          try {
            const md = await readFile(path.join(tmp, 'full.md'), 'utf8');
            merged += (merged ? '\n\n' : '') + `<!-- pages ${range} -->\n` + md;
          } catch { /* ignore */ }
          await mergeImages(path.join(tmp, 'images'), path.join(finalOut, 'images'), `p${range}-`);
          await copyDirRecursive(tmp, path.join(finalOut, 'chunks', range));
          chunkMeta.push({ range, pages: b - a + 1 });
          job.pages.done = b;
          try { await rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
        }
        await writeFile(path.join(finalOut, 'full.md'), merged, 'utf8');
        job.result = { outputDir: finalOut, files: await listFilesRecursive(finalOut), pageCount, chunks: chunkMeta, merged: true };
      }
      job.state = 'done';
    } catch (error) {
      if (error && error.code === 'cancelled') {
        job.state = 'cancelled';
        job.errMsg = '已取消';
      } else {
        job.state = 'failed';
        job.errMsg = (error && error.message) || String(error);
        job.errorCode = error && error.code;
      }
    } finally {
      await cleanup();
    }
  }

  async function pump() {
    if (running) return;
    running = true;
    try {
      while (queue.length) {
        const job = queue.shift();
        if (!job || job.state !== 'queued') continue;
        await executeJob(job);
      }
    } finally {
      running = false;
    }
  }

  function enqueue(job) {
    queue.push(job);
    void pump();
  }

  function jobView(job) {
    return {
      jobId: job.id,
      name: job.name,
      size: job.size,
      state: job.state,
      pages: { ...job.pages },
      errMsg: job.errMsg || '',
      errorCode: job.errorCode || '',
      result: job.result || undefined,
    };
  }

  function createJobRecord(payload) {
    const name = String((payload && payload.name) || 'document.pdf');
    const saveDir = String((payload && payload.saveDir) || '');
    if (!saveDir) return fail('no_save_dir', '请先选择保存位置');
    const size = Number((payload && payload.size) || 0);
    if (size > config.maxFileBytes) return fail('too_large', '文件超过 200MB 限制');
    const options = normalizeOptions(payload && payload.options, config);
    const id = randomUUID();
    const tempPath = path.join(os.tmpdir(), `dsh-mineru-${id}.${extensionOf(name)}`);
    const job = {
      id,
      name,
      size,
      saveDir,
      options,
      tempPath,
      zipPath: path.join(os.tmpdir(), `dsh-mineru-${id}.zip`),
      isTemp: true,
      state: 'awaiting_upload',
      pages: { done: 0, total: 0 },
      errMsg: '',
      result: null,
      createdAt: Date.now(),
      controller: new AbortController(),
    };
    job.signal = job.controller.signal;
    jobs.set(id, job);
    return ok({ jobId: id });
  }

  async function handleRpc(endpoint, payload, signal, peer) {
    try {
      switch (endpoint) {
        case 'key.status': {
          const info = await ctx.credentials.describe(CRED_REF);
          return ok({ configured: !!(info && info.configured), source: (info && info.source) || null });
        }
        case 'key.set': {
          const value = String((payload && payload.value) || '');
          if (!value) return fail('empty_key', '密钥不能为空');
          await ctx.credentials.set(CRED_REF, value);
          return ok({ configured: true });
        }
        case 'key.clear': {
          await ctx.credentials.unset(CRED_REF);
          return ok({ configured: false });
        }
        case 'options.get': {
          return ok({
            modelVersion: config.defaultModelVersion,
            language: config.defaultLanguage,
            enableFormula: true,
            enableTable: true,
            isOcr: false,
            pageRanges: '',
            extraFormats: [],
          });
        }
        case 'dir.default': {
          const wd = ctx.get('workingDirectory');
          return ok({ path: (wd && wd.defaultDirectory) || process.cwd() });
        }
        case 'job.create':
          return createJobRecord(payload || {});
        case 'job.status': {
          const job = jobs.get(payload && payload.jobId);
          if (!job) return fail('not_found', '任务不存在');
          return ok(jobView(job));
        }
        case 'job.list': {
          const list = Array.from(jobs.values())
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(jobView);
          return ok(list);
        }
        case 'job.cancel': {
          const job = jobs.get(payload && payload.jobId);
          if (!job) return fail('not_found', '任务不存在');
          try { job.controller.abort(); } catch { /* ignore */ }
          return ok({ cancelled: true });
        }
        case 'dir.list': {
          const home = os.homedir();
          let target = payload && payload.path ? path.resolve(String(payload.path)) : home;
          try { const st = await stat(target); if (!st.isDirectory()) target = path.dirname(target); } catch { target = home; }
          try {
            const dirents = await readdir(target, { withFileTypes: true });
            const entries = dirents
              .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
              .map((d) => ({ name: d.name, path: path.join(target, d.name) }))
              .sort((x, y) => x.name.localeCompare(y.name));
            return ok({ path: target, home, parent: path.dirname(target) === target ? null : path.dirname(target), entries });
          } catch (error) {
            return fail('dir_read', `无法读取目录：${error.message}`);
          }
        }
        case 'dir.mkdir': {
          const base = payload && payload.path ? path.resolve(String(payload.path)) : '';
          const name = payload && payload.name ? String(payload.name).replace(/[/\\]/g, '').trim() : '';
          if (!base || !name) return fail('bad_mkdir', '缺少目录名');
          const target = path.join(base, name);
          try { await mkdir(target, { recursive: true }); return ok({ path: target }); } catch (error) { return fail('dir_mkdir', `创建目录失败：${error.message}`); }
        }
        default:
          return fail('bad_endpoint', `未知操作 ${endpoint}`);
      }
    } catch (error) {
      return fail((error && error.code) || 'internal', (error && error.message) || String(error));
    }
  }

  async function handleRpcHttp(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('body is not JSON', { status: 400 });
    }
    const endpoint = body && typeof body.endpoint === 'string' ? body.endpoint : '';
    if (!endpoint) return jsonResponse(fail('bad_endpoint', '缺少 endpoint'), 400);
    const result = await handleRpc(endpoint, body && body.payload, request.signal, undefined);
    return jsonResponse(result);
  }

  async function handleUpload(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const job = jobId ? jobs.get(jobId) : undefined;
    if (!job) return jsonResponse(fail('not_found', '任务不存在'), 404);
    const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (contentType && contentType !== 'application/octet-stream') {
      return new Response('content type must be application/octet-stream', { status: 415 });
    }
    try {
      if (request.body) {
        await pipeline(Readable.fromWeb(request.body), createWriteStream(job.tempPath));
      } else {
        await writeFile(job.tempPath, Buffer.alloc(0));
      }
      const fileStat = await stat(job.tempPath);
      job.size = fileStat.size;
      if (fileStat.size > config.maxFileBytes) {
        try { await rm(job.tempPath, { force: true }); } catch { /* ignore */ }
        job.state = 'failed';
        job.errMsg = '文件超过大小限制';
        return jsonResponse(fail('too_large', '文件超过大小限制'));
      }
      job.state = 'queued';
      enqueue(job);
      return jsonResponse(ok({ jobId: job.id, size: fileStat.size }));
    } catch (error) {
      return jsonResponse(fail('upload_failed', (error && error.message) || String(error)));
    }
  }

  function buildTool() {
    return {
      name: 'mineru_parse',
      description:
        'Parse local PDF/image files with MinerU and save Markdown (plus optional docx/html/latex) into a directory. ' +
        'Accepts absolute paths or paths relative to the current working directory. Requires a configured MinerU API key.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'Local PDF/image paths to parse.' },
          saveDir: { type: 'string', description: 'Output root directory; defaults to the current working directory.' },
          modelVersion: { type: 'string', enum: ['vlm', 'pipeline'], description: 'MinerU model version.' },
          language: { type: 'string', description: 'Document language, default ch.' },
          enableFormula: { type: 'boolean', description: 'Recognize formulas (default true).' },
          enableTable: { type: 'boolean', description: 'Recognize tables (default true).' },
          isOcr: { type: 'boolean', description: 'Enable OCR for scanned documents.' },
          pageRanges: { type: 'string', description: 'Page range such as 1-10,15.' },
          extraFormats: { type: 'array', items: { type: 'string', enum: ['docx', 'html', 'latex'] } },
          chunkPages: { type: 'number', description: 'Pages per MinerU request for long PDFs (default 500; 0 disables chunking).' },
        },
        required: ['paths'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: true,
          properties: {
            results: { type: 'array', items: { type: 'object', additionalProperties: true } },
            failures: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
        render(args, value) {
          try {
            return [{ type: 'text', text: JSON.stringify(value, null, 2) }];
          } catch {
            return [{ type: 'text', text: 'done' }];
          }
        },
      },
      async execute(args) {
        const input = args || {};
        const wd = ctx.get('workingDirectory');
        const base = (wd && wd.defaultDirectory) || process.cwd();
        const saveDir = input.saveDir ? path.resolve(base, input.saveDir) : base;
        await mkdir(saveDir, { recursive: true });
        const paths = Array.isArray(input.paths) ? input.paths : (input.path ? [input.path] : []);
        const results = [];
        const failures = [];
        for (const entry of paths) {
          try {
            const absolute = path.resolve(base, entry);
            const fileStat = await stat(absolute);
            if (fileStat.size > config.maxFileBytes) { failures.push({ path: absolute, error: '文件超过大小限制' }); continue; }
            const options = normalizeOptions({
              modelVersion: input.modelVersion,
              language: input.language,
              enableFormula: input.enableFormula,
              enableTable: input.enableTable,
              isOcr: input.isOcr,
              pageRanges: input.pageRanges,
              extraFormats: input.extraFormats,
              chunkPages: input.chunkPages,
            }, config);
            const id = randomUUID();
            const job = {
              id,
              name: path.basename(absolute),
              size: fileStat.size,
              saveDir,
              options,
              tempPath: absolute,
              zipPath: path.join(os.tmpdir(), `dsh-mineru-${id}.zip`),
              isTemp: false,
              state: 'queued',
              pages: { done: 0, total: 0 },
              errMsg: '',
              result: null,
              createdAt: Date.now(),
              controller: new AbortController(),
            };
            job.signal = job.controller.signal;
            jobs.set(id, job);
            await executeJob(job);
            if (job.state === 'done' && job.result) {
              results.push({ path: absolute, outputDir: job.result.outputDir, files: job.result.files });
            } else {
              failures.push({ path: absolute, error: job.errMsg || job.state });
            }
          } catch (error) {
            failures.push({ path: String(entry), error: (error && error.message) || String(error) });
          }
        }
        return { results, failures };
      },
    };
  }

  // Authenticated control-plane route (JSON) and streaming upload route under /api.
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/mineru/rpc',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: handleRpcHttp,
  }), 'mineru: rpc route');
  ctx.effect(() => ctx.connection.fetch.register({
    path: '/api/mineru/upload',
    methods: ['POST'],
    requestBody: 'streaming',
    fetch: handleUpload,
  }), 'mineru: upload route');

  const tools = ctx.get('tools');
  if (tools && typeof tools.register === 'function') {
    try {
      ctx.effect(() => tools.register(buildTool()), 'mineru: agent tool');
    } catch (error) {
      ctx.logger && ctx.logger.warn && ctx.logger.warn(`mineru: tool registration failed: ${error && error.message}`);
    }
  }
}
