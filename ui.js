window.__ModuleLoader__.load({
  id: '@local/dsh-mineru',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'mineru';

    const zh = {
      panel: 'MinerU 解析',
      subtitle: '用 MinerU 把 PDF 解析成 Markdown，并保存到你选择的目录。',
      apiKey: 'API 密钥',
      apiKeyHint: '在 mineru.net 用户中心获取 Token，保存后仅存于本机凭据库。',
      apiKeyPlaceholder: '粘贴 MinerU API Token',
      save: '保存',
      clear: '清除',
      configured: '已配置',
      notConfigured: '未配置',
      files: '待解析文件',
      chooseFiles: '选择 PDF（可多选）',
      dropHint: '把 PDF 拖到这里，或点击选择',
      noFiles: '还没有选择文件',
      remove: '移除',
      options: '解析选项',
      model: '模型',
      modelVlm: 'vlm（推荐，质量更好）',
      modelPipeline: 'pipeline（更快）',
      language: '语言',
      ocr: '启用 OCR（扫描件）',
      formula: '识别公式',
      table: '识别表格',
      pageRanges: '页码范围（如 1-10,15，留空为全文）',
      extraFormats: '附加导出格式',
      saveDir: '保存位置',
      chooseDir: '选择目录',
      noDir: '尚未选择保存目录',
      start: '开始解析',
      working: '处理中…',
      jobs: '任务',
      noJobs: '暂无任务',
      pages: '页',
      output: '输出目录',
      cancel: '取消',
      needKey: '请先填写并保存 API 密钥',
      needFiles: '请先选择要解析的 PDF',
      needDir: '请先选择保存位置',
      tooLarge: '文件超过 200MB 限制',
      dropHere: '松开以添加文件',
      retry: '重试',
      failTitle: '解析失败',
      retryUnavailable: '无法自动重试，请重新选择该文件',
      dirTitle: '选择保存目录',
      dirHome: '主目录',
      dirUp: '上一级',
      dirUse: '使用此目录',
      dirCancel: '取消',
      dirEmpty: '没有子目录',
      dirLoading: '加载中…',
      chunkPages: '分片页数',
      chunkPagesHint: '长 PDF 每片页数（0=不分片，默认 200）',
      'state.awaiting_upload': '等待上传',
      'state.queued': '排队中',
      'state.uploading': '上传中',
      'state.parsing': '解析中',
      'state.downloading': '下载中',
      'state.saving': '保存中',
      'state.done': '已完成',
      'state.failed': '失败',
      'state.cancelled': '已取消',
    };

    const en = {
      panel: 'MinerU parsing',
      subtitle: 'Parse PDFs into Markdown with MinerU and save them into a folder you choose.',
      apiKey: 'API key',
      apiKeyHint: 'Create a token in your mineru.net account. It is stored only in the local credential store.',
      apiKeyPlaceholder: 'Paste your MinerU API token',
      save: 'Save',
      clear: 'Clear',
      configured: 'Configured',
      notConfigured: 'Not configured',
      files: 'Files to parse',
      chooseFiles: 'Choose PDFs (multiple)',
      dropHint: 'Drop PDFs here, or click to choose',
      noFiles: 'No files selected yet',
      remove: 'Remove',
      options: 'Parse options',
      model: 'Model',
      modelVlm: 'vlm (recommended, better quality)',
      modelPipeline: 'pipeline (faster)',
      language: 'Language',
      ocr: 'Enable OCR (scanned documents)',
      formula: 'Recognize formulas',
      table: 'Recognize tables',
      pageRanges: 'Page ranges (e.g. 1-10,15; empty = all)',
      extraFormats: 'Extra export formats',
      saveDir: 'Save to',
      chooseDir: 'Choose folder',
      noDir: 'No output folder selected',
      start: 'Start parsing',
      working: 'Working…',
      jobs: 'Jobs',
      noJobs: 'No jobs yet',
      pages: 'pages',
      output: 'Output folder',
      cancel: 'Cancel',
      needKey: 'Enter and save an API key first',
      needFiles: 'Choose at least one PDF first',
      needDir: 'Choose an output folder first',
      tooLarge: 'File exceeds the 200MB limit',
      dropHere: 'Release to add files',
      retry: 'Retry',
      failTitle: 'Parsing failed',
      retryUnavailable: 'Cannot retry automatically — select the file again',
      dirTitle: 'Choose output folder',
      dirHome: 'Home',
      dirUp: 'Up',
      dirUse: 'Use this folder',
      dirCancel: 'Cancel',
      dirEmpty: 'No subfolders',
      dirLoading: 'Loading…',
      chunkPages: 'Chunk pages',
      chunkPagesHint: 'Pages per request for long PDFs (0 = no chunking, default 200)',
      'state.awaiting_upload': 'Waiting for upload',
      'state.queued': 'Queued',
      'state.uploading': 'Uploading',
      'state.parsing': 'Parsing',
      'state.downloading': 'Downloading',
      'state.saving': 'Saving',
      'state.done': 'Done',
      'state.failed': 'Failed',
      'state.cancelled': 'Cancelled',
    };

    const C = {
      page: { height: '100%', overflow: 'auto', padding: '24px', boxSizing: 'border-box', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)' },
      wrap: { maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
      title: { fontSize: '20px', fontWeight: 600, margin: 0 },
      subtitle: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', marginTop: '4px' },
      card: { background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
      cardTitle: { fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
      badge: (color) => ({ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${color}`, color }),
      row: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
      input: { flex: 1, minWidth: '220px', background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', padding: '8px 10px', color: 'var(--dsw-alias-label-primary)', fontSize: '13px', outline: 'none' },
      select: { background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px', padding: '8px 10px', color: 'var(--dsw-alias-label-primary)', fontSize: '13px' },
      btn: { borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' },
      btnPrimary: { borderRadius: '8px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer', border: '1px solid var(--dsw-alias-brand-primary)', background: 'var(--dsw-alias-brand-primary)', color: '#fff' },
      btnDanger: { borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'transparent', color: 'var(--dsw-alias-state-error-primary)' },
      fileRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'var(--dsw-alias-bg-layer-2)', fontSize: '13px' },
      muted: { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' },
      error: { color: 'var(--dsw-alias-state-error-primary)', fontSize: '13px' },
      failBox: { border: '1px solid var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-bg-layer-2)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' },
      modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
      modalBox: { width: '520px', maxWidth: '100%', maxHeight: '76vh', overflow: 'auto', background: 'var(--dsw-alias-bg-overlay)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
      dirItem: { textAlign: 'left', padding: '7px 9px', borderRadius: '7px', border: '1px solid transparent', background: 'transparent', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', fontSize: '13px' },
      progressOuter: { height: '6px', borderRadius: '999px', background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden', width: '100%' },
      checkboxRow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
      hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px', borderRadius: '16px', background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l1)' },
      heroLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
      iconTile: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dsw-alias-brand-primary)', color: '#fff', flex: '0 0 auto' },
      section: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '14px', background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l1)' },
      sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
      sectionTitle: { fontSize: '14px', fontWeight: 600 },
      counter: { minWidth: '20px', height: '20px', borderRadius: '999px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-secondary)' },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
      field: { display: 'flex', flexDirection: 'column', gap: '6px' },
      fieldLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' },
      dropzone: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px', borderRadius: '12px', border: '1.5px dashed var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer', textAlign: 'center' },
      dropzoneActive: { borderColor: 'var(--dsw-alias-brand-primary)' },
      fileChip: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l1)' },
      fileTag: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', color: '#fff', background: 'var(--dsw-alias-brand-primary)', borderRadius: '5px', padding: '3px 6px', flex: '0 0 auto' },
      btnText: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer', fontSize: '12px', padding: '4px 6px', borderRadius: '6px' },
      btnTextDanger: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-state-error-primary)', cursor: 'pointer', fontSize: '12px', padding: '4px 6px', borderRadius: '6px' },
      chipRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
      empty: { padding: '18px', textAlign: 'center', borderRadius: '10px', border: '1px dashed var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' },
      errorBanner: { padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--dsw-alias-state-error-primary)', color: 'var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '13px' },
      actionBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px', borderRadius: '14px', background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l1)' },
      jobCard: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 14px 14px 18px', borderRadius: '12px', background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l1)', overflow: 'hidden' },
      jobBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px' },
    };

    const STATE_COLOR = {
      awaiting_upload: 'var(--dsw-alias-state-idle-primary)',
      queued: 'var(--dsw-alias-state-idle-primary)',
      uploading: 'var(--dsw-alias-brand-primary)',
      parsing: 'var(--dsw-alias-brand-primary)',
      downloading: 'var(--dsw-alias-brand-primary)',
      saving: 'var(--dsw-alias-brand-primary)',
      done: 'var(--dsw-alias-state-success-primary)',
      failed: 'var(--dsw-alias-state-error-primary)',
      cancelled: 'var(--dsw-alias-state-warn-primary)',
    };

    function Icon(props) {
      const size = props ? props.size || 20 : 20;
      const active = props ? props.active : false;
      const color = active ? 'var(--dsw-alias-brand-primary)' : 'currentColor';
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': true,
        fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        h('path', { d: 'M6.5 3h7l4 4v14h-11z' }),
        h('path', { d: 'M13.5 3v4h4' }),
        h('path', { d: 'M9.5 12.5h6' }),
        h('path', { d: 'M9.5 15.5h4' }),
        h('path', { d: 'M18.2 15.6l1.6 2.4-1.6 2.4-1.6-2.4z', fill: color, stroke: 'none' })
      );
    }

    function formatSize(bytes) {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    function Panel(props) {
      const t = props.t;
      const api = props.api;
      const [keyInput, setKeyInput] = React.useState('');
      const [keyStatus, setKeyStatus] = React.useState({ configured: false });
      const [files, setFiles] = React.useState([]);
      const savedUi = React.useMemo(() => { try { return JSON.parse(localStorage.getItem('mineru.ui') || '{}'); } catch (e) { return {}; } }, []);
      const [opts, setOpts] = React.useState({ modelVersion: 'vlm', language: 'ch', enableFormula: true, enableTable: true, isOcr: false, pageRanges: '', extraFormats: [], chunkPages: 200, ...(savedUi.options || {}) });
      const [saveDir, setSaveDir] = React.useState(typeof savedUi.saveDir === 'string' ? savedUi.saveDir : '');
      const [jobs, setJobs] = React.useState([]);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [dragging, setDragging] = React.useState(false);
      const [dirState, setDirState] = React.useState({ open: false, path: '', parent: null, home: '', entries: [], loading: false, error: '' });
      const inputRef = React.useRef(null);
      const pollRef = React.useRef(null);
      const mountedRef = React.useRef(true);
      const retryRef = React.useRef({});
      const autoDirRef = React.useRef('');

      React.useEffect(() => {
        mountedRef.current = true;
        (async () => {
          try {
            const ks = await api.rpc('key.status');
            if (mountedRef.current && ks && ks.ok) setKeyStatus(ks.value || { configured: false });
            if (!savedUi.options) {
              const og = await api.rpc('options.get');
              if (mountedRef.current && og && og.ok && og.value) setOpts((prev) => ({ ...prev, ...og.value }));
            }
            const jl = await api.rpc('job.list');
            if (mountedRef.current && jl && jl.ok) {
              const list = jl.value || [];
              setJobs(list);
              if (list.some((j) => ['awaiting_upload', 'queued', 'uploading', 'parsing', 'downloading', 'saving'].indexOf(j.state) >= 0)) startPolling();
            }
          } catch (e) { /* ignore */ }
        })();
        return () => {
          mountedRef.current = false;
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        };
      }, []);

      React.useEffect(() => {
        try { localStorage.setItem('mineru.ui', JSON.stringify({ saveDir: saveDir, options: opts })); } catch (e) { /* ignore */ }
      }, [saveDir, opts]);

      function startPolling() {
        if (pollRef.current) return;
        pollRef.current = setInterval(async () => {
          try {
            const r = await api.rpc('job.list');
            if (mountedRef.current && r && r.ok) setJobs(r.value || []);
          } catch (e) { /* ignore */ }
        }, 2000);
      }

      async function refreshJobs() {
        try {
          const r = await api.rpc('job.list');
          if (mountedRef.current && r && r.ok) setJobs(r.value || []);
        } catch (e) { /* ignore */ }
      }

      async function submitFile(file, options, targetSaveDir) {
        const created = await api.rpc('job.create', { name: file.name, size: file.size, options: options, saveDir: targetSaveDir });
        if (!created || !created.ok) throw new Error((created && created.error && created.error.message) || 'create job failed');
        const jobId = created.value.jobId;
        const target = new URL('api/mineru/upload?jobId=' + encodeURIComponent(jobId), document.baseURI).href;
        const res = await fetch(target, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: file });
        if (!res.ok) throw new Error('upload failed HTTP ' + res.status);
        retryRef.current[jobId] = { file: file, options: options, saveDir: targetSaveDir };
        return jobId;
      }

      async function retryJob(jobId) {
        const info = retryRef.current[jobId];
        if (!info) { setError(t('retryUnavailable')); return; }
        setError('');
        setBusy(true);
        try {
          await submitFile(info.file, info.options, info.saveDir);
          await refreshJobs();
          startPolling();
        } catch (e) {
          setError((e && e.message) || String(e));
        } finally {
          setBusy(false);
        }
      }

      async function saveKey() {
        setError('');
        if (!keyInput.trim()) { setError(t('needKey')); return; }
        const r = await api.rpc('key.set', { value: keyInput.trim() });
        if (r && r.ok) { setKeyStatus({ configured: true }); setKeyInput(''); }
        else setError((r && r.error && r.error.message) || 'save failed');
      }

      async function clearKey() {
        setError('');
        const r = await api.rpc('key.clear');
        if (r && r.ok) setKeyStatus({ configured: false });
      }

      function fileDirOf(file) {
        try {
          let p = '';
          if (window.__DSH_HOST_PATHS__ && typeof window.__DSH_HOST_PATHS__.pathFor === 'function') {
            p = window.__DSH_HOST_PATHS__.pathFor(file);
          }
          if (!p && file && typeof file.path === 'string') p = file.path;
          if (typeof p !== 'string' || !p) return '';
          const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
          return i > 0 ? p.slice(0, i) : '';
        } catch (e) { return ''; }
      }

      function nativePickDir() {
        try {
          if (window.__DSH_DIRECTORY_PICKER__ && typeof window.__DSH_DIRECTORY_PICKER__.pick === 'function') {
            return Promise.resolve(window.__DSH_DIRECTORY_PICKER__.pick());
          }
        } catch (e) { /* fall through */ }
        return api.pickDir();
      }

      function addFiles(list) {
        setError('');
        const incoming = Array.from(list || []);
        const accepted = [];
        for (const f of incoming) {
          if (f.size > 209715200) { setError(`${f.name}: ${t('tooLarge')}`); continue; }
          accepted.push(f);
        }
        if (!accepted.length) return;
        setFiles((prev) => prev.concat(accepted));
        const dir = fileDirOf(accepted[0]);
        if (dir) {
          setSaveDir((prev) => (!prev || prev === autoDirRef.current ? dir : prev));
          autoDirRef.current = dir;
        }
      }

      function removeFile(index) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
      }

      async function loadDir(targetPath) {
        setDirState((s) => ({ ...s, open: true, loading: true, error: '' }));
        try {
          const r = await api.rpc('dir.list', { path: targetPath || '' });
          if (r && r.ok && mountedRef.current) setDirState({ open: true, path: r.value.path, parent: r.value.parent, home: r.value.home, entries: r.value.entries || [], loading: false, error: '' });
          else setDirState((s) => ({ ...s, loading: false, error: (r && r.error && r.error.message) || '读取失败' }));
        } catch (e) {
          setDirState((s) => ({ ...s, loading: false, error: (e && e.message) || String(e) }));
        }
      }
      async function openDirBrowser() {
        try {
          const picked = await nativePickDir();
          if (picked) { setSaveDir(picked); autoDirRef.current = ''; }
        } catch (e) {
          setError((e && e.message) || String(e));
        }
      }
      function useCurrentDir() { setSaveDir(dirState.path); setDirState((s) => ({ ...s, open: false })); }

      async function cancelJob(jobId) {
        await api.rpc('job.cancel', { jobId });
        await refreshJobs();
      }

      async function start() {
        setError('');
        if (!keyStatus.configured && !keyInput.trim()) { setError(t('needKey')); return; }
        if (files.length === 0) { setError(t('needFiles')); return; }
        if (!saveDir) { setError(t('needDir')); return; }
        setBusy(true);
        try {
          if (keyInput.trim()) {
            const r = await api.rpc('key.set', { value: keyInput.trim() });
            if (r && r.ok) { setKeyStatus({ configured: true }); setKeyInput(''); }
            else { setError((r && r.error && r.error.message) || 'save key failed'); setBusy(false); return; }
          }
          for (const file of files) {
            try {
              await submitFile(file, opts, saveDir);
            } catch (e) {
              setError((e && e.message) || String(e));
            }
          }
          setFiles([]);
          await refreshJobs();
          startPolling();
        } catch (e) {
          setError((e && e.message) || String(e));
        } finally {
          setBusy(false);
        }
      }

      function toggleExtra(format) {
        setOpts((prev) => {
          const has = prev.extraFormats.indexOf(format) >= 0;
          const next = has ? prev.extraFormats.filter((x) => x !== format) : prev.extraFormats.concat(format);
          return { ...prev, extraFormats: next };
        });
      }

      const field = (labelText, control) => h('label', { style: C.field },
        h('span', { style: C.fieldLabel }, labelText),
        control
      );

      const dropzone = h('div', {
        onDragOver: (e) => { e.preventDefault(); setDragging(true); },
        onDragLeave: () => setDragging(false),
        onDrop: (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer && e.dataTransfer.files); },
        onClick: () => inputRef.current && inputRef.current.click(),
        style: dragging ? { ...C.dropzone, ...C.dropzoneActive } : C.dropzone,
      },
        h('div', { style: { fontSize: '22px', lineHeight: 1 } }, '＋'),
        h('div', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-primary)' } }, t('dropHint')),
        h('button', { type: 'button', style: { ...C.btn, marginTop: '4px' }, onClick: (e) => { e.stopPropagation(); inputRef.current && inputRef.current.click(); } }, t('chooseFiles')),
        h('input', {
          ref: inputRef, type: 'file', multiple: true, accept: '.pdf,.png,.jpg,.jpeg,.webp,image/*',
          style: { display: 'none' },
          onChange: (e) => { addFiles(e.target.files); e.target.value = ''; },
        })
      );

      const filesBlock = files.length === 0 ? null : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        files.map((f, i) => h('div', { key: i, style: C.fileChip },
          h('span', { style: C.fileTag }, 'PDF'),
          h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' } }, f.name),
          h('span', { style: C.muted }, formatSize(f.size)),
          h('button', { type: 'button', style: C.btnText, onClick: () => removeFile(i) }, t('remove'))
        ))
      );

      const checks = h('div', { style: C.chipRow },
        h('label', { style: C.checkboxRow }, h('input', { type: 'checkbox', checked: opts.enableFormula, onChange: (e) => setOpts({ ...opts, enableFormula: e.target.checked }) }), t('formula')),
        h('label', { style: C.checkboxRow }, h('input', { type: 'checkbox', checked: opts.enableTable, onChange: (e) => setOpts({ ...opts, enableTable: e.target.checked }) }), t('table')),
        h('label', { style: C.checkboxRow }, h('input', { type: 'checkbox', checked: opts.isOcr, onChange: (e) => setOpts({ ...opts, isOcr: e.target.checked }) }), t('ocr'))
      );

      const extra = h('div', { style: C.chipRow },
        h('span', { style: C.fieldLabel }, t('extraFormats')),
        ['docx', 'html', 'latex'].map((fmt) => h('label', { key: fmt, style: C.checkboxRow },
          h('input', { type: 'checkbox', checked: opts.extraFormats.indexOf(fmt) >= 0, onChange: () => toggleExtra(fmt) }),
          fmt
        ))
      );

      const optionsGrid = h('div', { style: C.grid },
        field(t('model'), h('select', { style: C.select, value: opts.modelVersion, onChange: (e) => setOpts({ ...opts, modelVersion: e.target.value }) },
          h('option', { value: 'vlm' }, t('modelVlm')),
          h('option', { value: 'pipeline' }, t('modelPipeline'))
        )),
        field(t('language'), h('input', { style: C.input, value: opts.language, onChange: (e) => setOpts({ ...opts, language: e.target.value }) })),
        field(t('pageRanges'), h('input', { style: C.input, placeholder: '1-10,15', value: opts.pageRanges, onChange: (e) => setOpts({ ...opts, pageRanges: e.target.value }) })),
        field(t('chunkPages'), h('input', {
          style: C.input, type: 'number', min: 0,
          value: opts.chunkPages === undefined ? '' : opts.chunkPages,
          onChange: (e) => setOpts({ ...opts, chunkPages: e.target.value === '' ? 0 : Number(e.target.value) }),
        }))
      );

      const jobsBlock = jobs.length === 0
        ? h('div', { style: C.empty }, t('noJobs'))
        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            jobs.map((job) => {
              const color = STATE_COLOR[job.state] || 'var(--dsw-alias-label-secondary)';
              const total = job.pages && job.pages.total ? job.pages.total : 0;
              const done = job.pages && job.pages.done ? job.pages.done : 0;
              const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : (job.state === 'done' ? 100 : 0);
              const active = ['uploading', 'parsing', 'downloading', 'saving'].indexOf(job.state) >= 0;
              return h('div', { key: job.jobId, style: C.jobCard },
                h('span', { style: { ...C.jobBar, background: color } }),
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' } },
                  h('span', { style: { fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, job.name),
                  h('span', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                    h('span', { style: C.badge(color) }, t('state.' + job.state)),
                    active ? h('button', { type: 'button', style: C.btnTextDanger, onClick: () => cancelJob(job.jobId) }, t('cancel')) : null
                  )
                ),
                (total > 0)
                  ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                      h('div', { style: C.progressOuter }, h('div', { style: { height: '100%', width: pct + '%', background: color, transition: 'width .3s' } })),
                      h('span', { style: C.muted }, done + '/' + total + ' ' + t('pages'))
                    )
                  : null,
                (job.state === 'failed' || job.state === 'cancelled')
                  ? h('div', { style: C.failBox, role: 'alert' },
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dsw-alias-state-error-primary)' } },
                        h('span', { style: { fontWeight: 600 } }, t('failTitle')),
                        job.errorCode ? h('span', { style: C.muted }, '· ' + job.errorCode) : null
                      ),
                      h('div', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-primary)', whiteSpace: 'pre-wrap' } }, job.errMsg || t('state.' + job.state)),
                      h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                        retryRef.current[job.jobId]
                          ? h('button', { type: 'button', style: C.btnPrimary, onClick: () => retryJob(job.jobId) }, t('retry'))
                          : h('span', { style: C.muted }, t('retryUnavailable'))
                      )
                    )
                  : null,
                (job.result && job.result.outputDir)
                  ? h('div', { style: { ...C.muted, wordBreak: 'break-all' } }, t('output') + ': ' + job.result.outputDir)
                  : null
              );
            })
          );

      const dirModal = dirState.open ? h('div', { style: C.modalBackdrop, onClick: () => setDirState((s) => ({ ...s, open: false })) },
        h('div', { style: C.modalBox, onClick: (e) => e.stopPropagation() },
          h('div', { style: { fontWeight: 600, fontSize: '14px' } }, t('dirTitle')),
          h('div', { style: { ...C.muted, wordBreak: 'break-all' } }, dirState.path),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '4px 0' } },
            h('button', { type: 'button', style: C.btn, onClick: () => loadDir(dirState.home) }, t('dirHome')),
            dirState.parent ? h('button', { type: 'button', style: C.btn, onClick: () => loadDir(dirState.parent) }, t('dirUp')) : null,
            h('button', { type: 'button', style: C.btnPrimary, onClick: useCurrentDir }, t('dirUse'))
          ),
          dirState.loading ? h('div', { style: C.muted }, t('dirLoading')) : null,
          dirState.error ? h('div', { style: C.error }, dirState.error) : null,
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '320px', overflow: 'auto', marginTop: '4px' } },
            (dirState.entries || []).length === 0
              ? h('div', { style: C.muted }, t('dirEmpty'))
              : dirState.entries.map((en) => h('button', { key: en.path, type: 'button', style: C.dirItem, onClick: () => loadDir(en.path) }, '\uD83D\uDCC1 ' + en.name))
          ),
          h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '6px' } },
            h('button', { type: 'button', style: C.btn, onClick: () => setDirState((s) => ({ ...s, open: false })) }, t('dirCancel'))
          )
        )
      ) : null;

      const statusPill = h('span', { style: C.badge(keyStatus.configured ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-idle-primary)') },
        keyStatus.configured ? t('configured') : t('notConfigured'));

      return h('div', { style: C.page },
        h('div', { style: C.wrap },
          h('div', { style: C.hero },
            h('div', { style: C.heroLeft },
              h('span', { style: C.iconTile }, h(Icon, { size: 26 })),
              h('div', null,
                h('h1', { style: C.title }, t('panel')),
                h('div', { style: C.subtitle }, t('subtitle'))
              )
            ),
            statusPill
          ),

          h('div', { style: C.section },
            h('div', { style: C.sectionHead }, h('span', { style: C.sectionTitle }, t('apiKey'))),
            h('div', { style: C.muted }, t('apiKeyHint')),
            h('div', { style: C.row },
              h('input', { style: { ...C.input, flex: '1 1 320px' }, type: 'password', placeholder: t('apiKeyPlaceholder'), value: keyInput, onChange: (e) => setKeyInput(e.target.value) }),
              h('button', { type: 'button', style: C.btnPrimary, onClick: saveKey }, t('save')),
              h('button', { type: 'button', style: C.btn, onClick: clearKey }, t('clear'))
            )
          ),

          h('div', { style: C.section },
            h('div', { style: C.sectionHead },
              h('span', { style: C.sectionTitle }, t('files')),
              files.length ? h('span', { style: C.counter }, String(files.length)) : null
            ),
            dropzone,
            filesBlock
          ),

          h('div', { style: C.section },
            h('div', { style: C.sectionHead }, h('span', { style: C.sectionTitle }, t('options'))),
            optionsGrid,
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, checks, extra)
          ),

          h('div', { style: C.section },
            h('div', { style: C.sectionHead }, h('span', { style: C.sectionTitle }, t('saveDir'))),
            h('div', { style: C.row },
              h('input', { style: { ...C.input, flex: '1 1 320px' }, readOnly: true, value: saveDir, placeholder: t('noDir') }),
              h('button', { type: 'button', style: C.btn, onClick: openDirBrowser }, t('chooseDir'))
            )
          ),

          error ? h('div', { style: C.errorBanner, role: 'alert' }, error) : null,

          h('div', { style: C.actionBar },
            h('div', { style: C.muted }, files.length + ' · ' + (saveDir || t('noDir'))),
            h('button', { type: 'button', style: { ...C.btnPrimary, padding: '10px 22px', fontSize: '14px', fontWeight: 600 }, disabled: busy, onClick: start }, busy ? t('working') : t('start'))
          ),

          h('div', { style: C.section },
            h('div', { style: C.sectionHead },
              h('span', { style: C.sectionTitle }, t('jobs')),
              jobs.length ? h('span', { style: C.counter }, String(jobs.length)) : null
            ),
            jobsBlock
          )
        ),
        dirModal
      );
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: zh, en: en }), 'mineru: locale dictionaries');
        const t = ctx.locale.bind(NS);
        const api = {
          rpc: async (endpoint, payload) => {
            const target = new URL('api/mineru/rpc', document.baseURI).href;
            const response = await fetch(target, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ endpoint: endpoint, payload: payload === undefined ? null : payload }),
            });
            if (!response.ok) return { ok: false, error: { code: 'http_' + response.status, message: 'HTTP ' + response.status } };
            return response.json();
          },
          pickDir: () => ctx.uiWorkspace.pickDirectory(),
        };
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: 'mineru', locale: NS, inject: () => ({ t: t, api: api }),
        }, Panel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: 'mineru', order: 20, locale: NS, label: () => t('panel'),
        }, Icon));
      },
    };
  },
});
