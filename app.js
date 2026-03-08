// function applyBackground() {
//   const bg = state.data.settings.background || 'sunset';
//   const theme = state.data.theme;
//   const hasCustom = bg === 'custom' && state.bgImageUrl;
//   const brightness = hasCustom
//     ? state.data.settings.backgroundImageBrightness
//     : (window.BG_BRIGHTNESS[bg] || 0.5);
//   const overlayBase = theme === 'dark' ? 0.38 : 0.24;
//   const overlayOpacity = Math.max(0.2, Math.min(0.6, overlayBase + (0.6 - brightness) * 0.35));

//   const lut = window.THEME_LUT_FILTERS[bg] || window.THEME_LUT_FILTERS.sunset;

//   let backgroundValue;
//   if (hasCustom) {
//     backgroundValue = `url("${state.bgImageUrl}")`;
//   } else if (window.isLowEndDeviceState() || !state.data.settings.useHdImages) {
//     backgroundValue = window.BG_GRADIENTS[bg] || window.BG_GRADIENTS.sunset;
//   } else if (window.isImagePreloaded(bg)) {
//     backgroundValue = `url("${window.THEME_BACKGROUND_IMAGES[bg]}")`;
//   } else {
//     backgroundValue = window.BG_GRADIENTS[bg] || window.BG_GRADIENTS.sunset;
//   }

//   const filterValue = window.isLowEndDeviceState()
//     ? `brightness(${theme === 'dark' ? 0.85 : 1.0})`
//     : `brightness(${lut.brightness}) contrast(${lut.contrast}) saturate(${lut.saturate}) hue-rotate(${lut.hueRotate}deg)`;

//   document.documentElement.style.setProperty('--bg-image', backgroundValue);
//   document.documentElement.style.setProperty('--bg-overlay', `rgba(0,0,0,${overlayOpacity})`);
//   document.documentElement.style.setProperty('--bg-filter', filterValue);

//   // 强制触发浏览器重排，使伪元素重新计算样式
//   document.body.offsetHeight;

//   window.updateParticlesForTheme(bg, true);
// }

(function() {
  'use strict';

  const STORAGE_KEY = 'todaybingo_data';
  const BG_DB_NAME = 'todaybingo_bg';
  const BG_DB_STORE = 'images';
  const BG_CUSTOM_KEY = 'custom';
  const MAX_CHARS = 8;

  const state = {
    data: loadData(),
    bgImageUrl: null,
    editId: null,
    deleteTargetId: null,
    get activeTable() {
      if (!this.data.activeId) return null;
      return this.data.tables.find(t => t.id === this.data.activeId) || null;
    }
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {
        tables: [],
        activeId: null,
        theme: 'light',
        settings: {
          cellOpacity: 50,
          appTheme: 'classic',
          background: 'sunset',
          backgroundImageBrightness: 0.5,
          useHdImages: true
        }
      };
    } catch (e) {
      return {
        tables: [],
        activeId: null,
        theme: 'light',
        settings: {
          cellOpacity: 50,
          appTheme: 'classic',
          background: 'sunset',
          backgroundImageBrightness: 0.5,
          useHdImages: true
        }
      };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uid() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function parseWords(text) {
    return text.split(/\n/).map(s => (s.trim().slice(0, MAX_CHARS))).filter(Boolean);
  }

  function adaptiveFontSize(text, cellSize) {
    const trimmed = (text || '').trim();
    const length = trimmed.length;
    const base = Math.max(12, Math.round(cellSize * 0.26));
    const min = Math.max(10, Math.round(cellSize * 0.16));
    if (!trimmed) return Math.round(cellSize * 0.2);
    if (/^\d+$/.test(trimmed) && trimmed.length <= 2) return base;
    if (length <= 2) return base;
    const steps = Math.min(length - 2, 6);
    return Math.round(base - (base - min) * (steps / 6));
  }

  function openBackgroundDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(BG_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BG_DB_STORE)) {
          db.createObjectStore(BG_DB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function withBackgroundStore(mode, handler) {
    return openBackgroundDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(BG_DB_STORE, mode);
      const store = tx.objectStore(BG_DB_STORE);
      handler(store, resolve, reject);
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
    }));
  }

  function loadBackgroundBlob() {
    return withBackgroundStore('readonly', (store, resolve, reject) => {
      const req = store.get(BG_CUSTOM_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function saveBackgroundBlob(blob) {
    return withBackgroundStore('readwrite', (store, resolve, reject) => {
      const req = store.put(blob, BG_CUSTOM_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function clearBackgroundBlob() {
    return withBackgroundStore('readwrite', (store, resolve, reject) => {
      const req = store.delete(BG_CUSTOM_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function sampleBrightness(canvas) {
    const ctx = canvas.getContext('2d');
    const size = 40;
    const sample = document.createElement('canvas');
    sample.width = size;
    sample.height = size;
    const sampleCtx = sample.getContext('2d');
    sampleCtx.drawImage(canvas, 0, 0, size, size);
    const data = sampleCtx.getImageData(0, 0, size, size).data;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }
    return total / (data.length / 4);
  }

  async function processBackgroundFile(file) {
    const img = await loadImageFromFile(file);
    const size = Math.min(img.width, img.height);
    const outputSize = Math.min(1440, size);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    const sx = Math.round((img.width - size) / 2);
    const sy = Math.round((img.height - size) / 2);
    ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);
    const brightness = sampleBrightness(canvas);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return { blob, brightness };
  }

  function cardGradient(index, opacity = 0.5) {
    const colors = [
      ['#FF6B6B', '#FF8E8E'],
      ['#4ECDC4', '#6EE7DE'],
      ['#45B7D1', '#6BC9DE'],
      ['#96CEB4', '#B4DFC9'],
      ['#FFEAA7', '#FFF3C7'],
      ['#DDA0DD', '#E8B8E8'],
      ['#98D8C8', '#B4E4D8'],
      ['#F7DC6F', '#F9E79F'],
      ['#BB8FCE', '#D2B4DE'],
      ['#85C1E9', '#AED6F1'],
      ['#F1948A', '#F5B7B1'],
      ['#82E0AA', '#A9DFBF'],
      ['#F8C471', '#FAD7A0'],
      ['#D7BDE2', '#E8DAEF'],
      ['#A3E4D7', '#B9F1E8'],
      ['#FADBD8', '#FDEDEC'],
      ['#D5F5E3', '#E9F7EF'],
      ['#FCF3CF', '#FEF9E7'],
      ['#EBDEF0', '#F5EEF8'],
      ['#D6EAF8', '#EBF5FB'],
      ['#FDEBD0', '#FEF5E7'],
      ['#E8DAEF', '#F4ECF7'],
      ['#D1F2EB', '#E8F8F5'],
      ['#FAD7A0', '#FDEBD0'],
      ['#D5DBDB', '#EAEDED']
    ];
    const color = colors[index % colors.length];
    return `linear-gradient(135deg, ${hexToRgba(color[0], opacity)}, ${hexToRgba(color[1], opacity)})`;
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function applyBackground() {
    const bg = state.data.settings.background || 'sunset';
    const theme = state.data.theme;
    const hasCustom = bg === 'custom' && state.bgImageUrl;
    const brightness = hasCustom
      ? state.data.settings.backgroundImageBrightness
      : (window.BG_BRIGHTNESS[bg] || 0.5);
    const overlayBase = theme === 'dark' ? 0.38 : 0.24;
    const overlayOpacity = Math.max(0.2, Math.min(0.6, overlayBase + (0.6 - brightness) * 0.35));

    const lut = window.THEME_LUT_FILTERS[bg] || window.THEME_LUT_FILTERS.sunset;

    let backgroundValue;
    if (hasCustom) {
      backgroundValue = `url("${state.bgImageUrl}")`;
    } else if (window.isLowEndDeviceState() || !state.data.settings.useHdImages) {
      backgroundValue = window.BG_GRADIENTS[bg] || window.BG_GRADIENTS.sunset;
    } else if (window.isImagePreloaded(bg)) {
      backgroundValue = `url("${window.THEME_BACKGROUND_IMAGES[bg]}")`;
    } else {
      backgroundValue = window.BG_GRADIENTS[bg] || window.BG_GRADIENTS.sunset;
    }

    const filterValue = window.isLowEndDeviceState()
      ? `brightness(${theme === 'dark' ? 0.85 : 1.0})`
      : `brightness(${lut.brightness}) contrast(${lut.contrast}) saturate(${lut.saturate}) hue-rotate(${lut.hueRotate}deg)`;

    document.documentElement.style.setProperty('--bg-image', backgroundValue);
    document.documentElement.style.setProperty('--bg-overlay', `rgba(0,0,0,${overlayOpacity})`);
    document.documentElement.style.setProperty('--bg-filter', filterValue);

    window.updateParticlesForTheme(bg, true);
  }

  async function preloadAndApplyTheme(theme) {
    if (window.isLowEndDeviceState() || theme === 'custom') return;

    if (window.isImagePreloaded(theme)) {
      applyBackground();
      return;
    }

    const url = window.THEME_BACKGROUND_IMAGES[theme];
    if (!url) return;

    try {
      const newImg = new Image();
      newImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        newImg.onload = resolve;
        newImg.onerror = reject;
        newImg.src = url;
      });
      window.getPreloadedImage(theme);
      applyBackground();
    } catch (e) {
      console.warn('Failed to preload background:', theme);
    }
  }

  async function setBackgroundWithTransition(bg) {
    if (bg === 'custom' && !state.bgImageUrl) {
      openBackgroundPicker();
      return;
    }

    const transitionLayer = document.getElementById('bgTransitionLayer');
    const oldBg = state.data.settings.background;

    if (transitionLayer && oldBg !== bg) {
      const oldBgValue = oldBg === 'custom' && state.bgImageUrl
        ? `url("${state.bgImageUrl}")`
        : (window.BG_GRADIENTS[oldBg] || window.BG_GRADIENTS.sunset);

      transitionLayer.style.backgroundImage = oldBgValue;
      transitionLayer.classList.add('visible');

      await new Promise(resolve => setTimeout(resolve, 50));

      state.data.settings.background = bg;
      saveData(state.data);
      applyBackground();

      await new Promise(resolve => setTimeout(resolve, 800));
      transitionLayer.classList.remove('visible');
    } else {
      state.data.settings.background = bg;
      saveData(state.data);
      applyBackground();
    }

    updateBackgroundUI();
  }

  function setBackground(bg) {
    if (bg === 'custom' && !state.bgImageUrl) {
      openBackgroundPicker();
      return;
    }
    state.data.settings.background = bg;
    saveData(state.data);
    applyBackground();
    updateBackgroundUI();
  }

  function setAppTheme(theme) {
    state.data.settings.appTheme = theme;
    document.documentElement.dataset.appTheme = theme;
    saveData(state.data);

    const bgSelector = document.getElementById('bgSelectorItem');
    if (bgSelector) {
      bgSelector.style.display = theme === 'glass' ? 'block' : 'none';
    }

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });

    if (theme === 'glass') {
      const currentBg = state.data.settings.background || 'sunset';
      if (!window.isLowEndDeviceState()) {
        preloadAndApplyTheme(currentBg);
      }
    }

    applyBackground();
    updateBackgroundUI();
  }

  function advanceBackgroundTheme() {
    const current = state.data.settings.background || 'sunset';
    const idx = window.BG_SEQUENCE.indexOf(current);
    const next = window.BG_SEQUENCE[(idx + 1 + window.BG_SEQUENCE.length) % window.BG_SEQUENCE.length] || window.BG_SEQUENCE[0];
    setBackground(next);
  }

  function updateBackgroundUI() {
    const customOption = document.getElementById('customBgOption');
    const customPreview = document.getElementById('customBgPreview');
    if (customOption && customPreview) {
      if (state.bgImageUrl) {
        customPreview.src = state.bgImageUrl;
        customOption.classList.add('has-image');
      } else {
        customPreview.removeAttribute('src');
        customOption.classList.remove('has-image');
      }
    }
    document.querySelectorAll('.bg-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.bg === (state.data.settings.background || 'sunset'));
    });
  }

  function openBackgroundPicker() {
    const input = document.getElementById('bgFileInput');
    if (input) input.click();
  }

  function updateThemeIcon() {
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    if (state.data.theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }
  }

  function toggleTheme() {
    state.data.theme = state.data.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = state.data.theme;
    saveData(state.data);
    updateThemeIcon();
    applyBackground();
  }

  function openDrawer() {
    document.getElementById('drawerOverlay').classList.add('visible');
    document.getElementById('drawer').classList.add('visible');
    renderDrawerList();
  }

  function closeDrawer() {
    document.getElementById('drawerOverlay').classList.remove('visible');
    document.getElementById('drawer').classList.remove('visible');
  }

  function renderDrawerList() {
    const { tables, activeId } = state.data;
    const list = document.getElementById('drawerList');
    list.innerHTML = '';

    tables.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drawer-item' + (t.id === activeId ? ' active' : '');
      btn.innerHTML = `
        <span>${t.name || '未命名'}</span>
        <span class="drawer-item-delete">删除</span>
      `;
      btn.addEventListener('click', (e) => {
        if (e.target.classList.contains('drawer-item-delete')) {
          showDeleteConfirm(t.id, t.name);
        } else {
          switchTable(t.id);
          closeDrawer();
        }
      });
      list.appendChild(btn);
    });
  }

  function openSettings() {
    const settings = state.data.settings;
    document.getElementById('opacitySlider').value = settings.cellOpacity;
    document.getElementById('opacityValue').textContent = settings.cellOpacity + '%';

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === settings.appTheme);
    });

    const bgSelector = document.getElementById('bgSelectorItem');
    if (bgSelector) {
      bgSelector.style.display = settings.appTheme === 'glass' ? 'block' : 'none';
    }

    updateBackgroundUI();

    document.getElementById('settingsSheetOverlay').classList.add('visible');
  }

  function closeSettings() {
    document.getElementById('settingsSheetOverlay').classList.remove('visible');
  }

  function updateSettings() {
    state.data.settings.cellOpacity = parseInt(document.getElementById('opacitySlider').value);
    saveData(state.data);
    renderBoard();
  }

  function showScreen(name) {
    document.getElementById('screenEmpty').classList.toggle('active', name === 'empty');
    document.getElementById('screenCreate').classList.toggle('active', name === 'create');
    document.getElementById('screenBoard').classList.toggle('active', name === 'board');
    document.getElementById('bottomBar').style.display = name === 'board' ? 'flex' : 'none';
  }

  function getSelectedSize() {
    const active = document.querySelector('.size-option.active');
    return active ? parseInt(active.dataset.size, 10) : 5;
  }

  function setSelectedSize(size) {
    document.querySelectorAll('.size-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.dataset.size, 10) === size);
    });
    updateWordsHints();
  }

  function updateWordsHints() {
    const wordsInput = document.getElementById('wordsInput');
    const lines = parseWords(wordsInput.value);
    const uniqueCount = new Set(lines).size;
    const size = getSelectedSize();
    const required = size * size;
    const countHint = document.getElementById('wordsCountHint');
    if (uniqueCount >= required) {
      countHint.textContent = `已输入 ${uniqueCount} 条，将随机抽取 ${required} 条生成 ${size}×${size}。`;
    } else {
      countHint.textContent = `已输入 ${uniqueCount} 条，还需至少 ${required - uniqueCount} 条生成 ${size}×${size}。`;
    }
    const over = lines.filter(l => l.length > MAX_CHARS);
    const hint = document.getElementById('wordsCharHint');
    if (over.length) hint.textContent = '有 ' + over.length + ' 行超过 ' + MAX_CHARS + ' 字，将自动截断。';
    else hint.textContent = '';
  }

  function openCreate(editId) {
    state.editId = editId || null;
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    btnCancelEdit.style.display = editId ? 'block' : 'none';
    const tableName = document.getElementById('tableName');
    const wordsInput = document.getElementById('wordsInput');
    if (editId) {
      const t = state.data.tables.find(x => x.id === editId);
      if (t) {
        tableName.value = t.name || '';
        wordsInput.value = (t.wordPool || t.words || []).join('\n');
        setSelectedSize(t.size || 5);
      }
    } else {
      tableName.value = '';
      wordsInput.value = '';
      setSelectedSize(5);
    }
    updateWordsHints();
    showScreen('create');
    closeDrawer();
  }

  function switchTable(id) {
    state.data.activeId = id;
    saveData(state.data);
    renderBoard();
    showScreen('board');
  }

  function createOrUpdateTable() {
    const tableName = document.getElementById('tableName');
    const wordsInput = document.getElementById('wordsInput');
    const name = tableName.value.trim() || '未命名';
    const size = getSelectedSize();
    const required = size * size;
    const words = parseWords(wordsInput.value);
    const uniqueWords = Array.from(new Set(words));
    if (uniqueWords.length < required) {
      alert(`请至少输入 ${required} 个不重复词条（每行一个）。当前：${uniqueWords.length} 个。`);
      return;
    }
    const selectedWords = shuffleArray(uniqueWords).slice(0, required);
    const order = shuffleArray(selectedWords.map((_, i) => i));
    const completed = [];

    if (state.editId) {
      const t = state.data.tables.find(x => x.id === state.editId);
      if (t) {
        t.name = name;
        t.size = size;
        t.wordPool = uniqueWords;
        t.words = selectedWords;
        t.order = order;
        t.completed = [];
        state.data.activeId = t.id;
      }
    } else {
      const table = {
        id: uid(),
        name,
        size,
        wordPool: uniqueWords,
        words: selectedWords,
        order,
        completed
      };
      state.data.tables.push(table);
      state.data.activeId = table.id;
    }
    saveData(state.data);
    renderBoard();
    showScreen('board');
  }

  const BINGO_LINES_CACHE = {};

  function getBingoLines(size) {
    if (BINGO_LINES_CACHE[size]) return BINGO_LINES_CACHE[size];
    const lines = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push(r * size + c);
      lines.push(row);
    }
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(r * size + c);
      lines.push(col);
    }
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < size; i++) {
      diag1.push(i * size + i);
      diag2.push(i * size + (size - 1 - i));
    }
    lines.push(diag1, diag2);
    BINGO_LINES_CACHE[size] = lines;
    return lines;
  }

  function checkBingoLine(completedSet, size) {
    return getBingoLines(size).some(line => line.every(i => completedSet.has(i)));
  }

  function runConfetti() {
    const duration = 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.3 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.3 },
        colors: colors
      });
    }, 100);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  }

  function toggleCell(table, index) {
    if (navigator.vibrate) navigator.vibrate(10);
    const completed = table.completed || [];
    const i = completed.indexOf(index);
    if (i === -1) completed.push(index);
    else completed.splice(i, 1);
    table.completed = completed;
    saveData(state.data);
    const board = document.getElementById('board');
    const cell = board.querySelector(`[data-index="${index}"]`);
    if (cell) {
      cell.classList.toggle('done', completed.includes(index));
      if (!completed.includes(index)) {
        const settings = state.data.settings;
        const opacity = settings.cellOpacity / 100;
        if (settings.appTheme !== 'glass') {
          cell.style.background = cardGradient(table.order[index], opacity);
        }
      }
    }

    const set = new Set(completed.map(Number));
    if (checkBingoLine(set, table.size || 5)) {
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      runConfetti();
    }
  }

  function renderBoard() {
    const t = state.activeTable;
    const board = document.getElementById('board');
    const boardTableName = document.getElementById('boardTableName');

    if (!t || !t.words || !t.order) {
      board.innerHTML = '';
      boardTableName.textContent = '';
      return;
    }

    boardTableName.textContent = t.name || '未命名';

    const size = t.size || 5;

    document.querySelectorAll('#boardGridSizeSelector .grid-size-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.dataset.size, 10) === size);
    });

    const total = size * size;
    const words = (t.words || []).slice(0, total);
    const order = (t.order && t.order.length === total)
      ? t.order
      : shuffleArray(words.map((_, i) => i));
    if (order !== t.order) {
      t.order = order;
      saveData(state.data);
    }
    const completedSet = new Set((t.completed || []).map(Number));
    const settings = state.data.settings;
    const opacity = settings.cellOpacity / 100;
    const isGlass = settings.appTheme === 'glass';

    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    const boardStyle = getComputedStyle(board);
    const gap = parseFloat(boardStyle.gap || boardStyle.gridGap || 0);
    const boardWidth = board.getBoundingClientRect().width || board.clientWidth || 300;
    const cellSize = (boardWidth - gap * (size - 1)) / size;

    for (let i = 0; i < total; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell' + (completedSet.has(i) ? ' done' : '');
      const wordIndex = order[i];
      const text = words[wordIndex] || '';
      cell.dataset.index = String(i);

      if (!completedSet.has(i) && !isGlass) {
        cell.style.background = cardGradient(wordIndex, opacity);
      }

      cell.style.fontSize = adaptiveFontSize(text, cellSize) + 'px';
      const span = document.createElement('span');
      span.className = 'cell-text';
      span.textContent = text;
      cell.appendChild(span);
      cell.addEventListener('click', () => toggleCell(t, i));
      board.appendChild(cell);
    }
    applyBackground();
  }

  function shuffleBoard() {
    const t = state.activeTable;
    if (!t || !t.words) return;
    const oldOrder = (t.order && t.order.length === t.words.length)
      ? t.order
      : shuffleArray(t.words.map((_, i) => i));
    t.order = oldOrder;
    const newOrder = shuffleArray(t.words.map((_, i) => i));

    const completedWords = (t.completed || []).map(idx => oldOrder[idx]);
    t.completed = [];
    completedWords.forEach(wordIdx => {
      const newPos = newOrder.indexOf(wordIdx);
      if (newPos !== -1) t.completed.push(newPos);
    });

    t.order = newOrder;
    saveData(state.data);
    renderBoard();
  }

  function resetBoard() {
    const t = state.activeTable;
    if (t) {
      t.completed = [];
      saveData(state.data);
      renderBoard();
    }
  }

  function showDeleteConfirm(id, name) {
    state.deleteTargetId = id;
    document.getElementById('deleteConfirmText').textContent = `确定要删除「${name || '未命名'}」吗？`;
    document.getElementById('deleteConfirm').classList.add('visible');
  }

  function hideDeleteConfirm() {
    document.getElementById('deleteConfirm').classList.remove('visible');
    state.deleteTargetId = null;
  }

  function deleteTable() {
    const id = state.deleteTargetId;
    if (!id) return;
    const index = state.data.tables.findIndex(t => t.id === id);
    if (index > -1) {
      state.data.tables.splice(index, 1);
      if (state.data.activeId === id) {
        state.data.activeId = state.data.tables.length > 0 ? state.data.tables[0].id : null;
      }
      saveData(state.data);
      if (state.data.tables.length === 0) {
        showScreen('empty');
      } else {
        renderBoard();
        showScreen('board');
      }
    }
    hideDeleteConfirm();
    closeDrawer();
  }

  async function initializeBackground() {
    try {
      const blob = await loadBackgroundBlob();
      if (blob) {
        state.bgImageUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Failed to load custom background:', e);
    }

    applyBackground();
    updateBackgroundUI();

    if (!window.isLowEndDeviceState() && state.data.settings.appTheme === 'glass') {
      const currentBg = state.data.settings.background;
      if (currentBg !== 'custom') {
        preloadAndApplyTheme(currentBg);
      }

      const otherThemes = Object.keys(window.THEME_BACKGROUND_IMAGES).filter(t => t !== currentBg);
      for (const theme of otherThemes) {
        await new Promise(r => setTimeout(r, 100));
        preloadAndApplyTheme(theme);
      }
    }
  }

  function init() {
    state.data.theme = state.data.theme || 'light';
    state.data.settings = state.data.settings || {
      cellOpacity: 50,
      appTheme: 'classic',
      background: 'sunset',
      backgroundImageBrightness: 0.5,
      useHdImages: true
    };
    state.data.settings.appTheme = state.data.settings.appTheme || 'classic';
    state.data.settings.background = state.data.settings.background || 'sunset';
    state.data.settings.backgroundImageBrightness = typeof state.data.settings.backgroundImageBrightness === 'number' ? state.data.settings.backgroundImageBrightness : 0.5;
    state.data.settings.useHdImages = state.data.settings.useHdImages !== false;

    document.documentElement.dataset.theme = state.data.theme;
    document.documentElement.dataset.appTheme = state.data.settings.appTheme;
    updateThemeIcon();

    window.initParticleSystem();

    initializeBackground();

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('menuBtn').addEventListener('click', openDrawer);
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('settingsSheetOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('settingsSheetOverlay')) closeSettings();
    });
    document.getElementById('opacitySlider').addEventListener('input', (e) => {
      document.getElementById('opacityValue').textContent = e.target.value + '%';
      updateSettings();
    });
    document.getElementById('bgImportBtn').addEventListener('click', openBackgroundPicker);
    document.getElementById('bgResetBtn').addEventListener('click', async () => {
      if (state.bgImageUrl) {
        URL.revokeObjectURL(state.bgImageUrl);
        state.bgImageUrl = null;
      }
      await clearBackgroundBlob().catch(() => {});
      state.data.settings.background = 'sunset';
      state.data.settings.backgroundImageBrightness = 0.5;
      saveData(state.data);
      applyBackground();
      updateBackgroundUI();
    });
    document.getElementById('bgFileInput').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const result = await processBackgroundFile(file).catch(() => null);
      if (!result || !result.blob) return;
      await saveBackgroundBlob(result.blob).catch(() => {});
      if (state.bgImageUrl) URL.revokeObjectURL(state.bgImageUrl);
      state.bgImageUrl = URL.createObjectURL(result.blob);
      state.data.settings.background = 'custom';
      state.data.settings.backgroundImageBrightness = result.brightness;
      saveData(state.data);
      applyBackground();
      updateBackgroundUI();
      e.target.value = '';
    });

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setAppTheme(opt.dataset.theme);
      });
    });

    document.querySelectorAll('.bg-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setBackgroundWithTransition(opt.dataset.bg);
      });
    });

    document.querySelectorAll('#boardGridSizeSelector .grid-size-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const newSize = parseInt(opt.dataset.size, 10);
        const t = state.activeTable;
        if (t) {
          const required = newSize * newSize;
          const wordPool = t.wordPool || t.words || [];
          if (wordPool.length < required) {
            alert(`词条不足，需要至少 ${required} 个词条才能切换到 ${newSize}×${newSize}。当前词库：${wordPool.length} 个。`);
            return;
          }
          const selectedWords = shuffleArray(wordPool).slice(0, required);
          const order = shuffleArray(selectedWords.map((_, i) => i));
          t.size = newSize;
          t.words = selectedWords;
          t.order = order;
          t.completed = [];
          saveData(state.data);
          renderBoard();
        }
      });
    });

    document.querySelectorAll('.size-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setSelectedSize(parseInt(opt.dataset.size, 10));
      });
    });

    document.getElementById('btnCancelEdit').addEventListener('click', () => {
      state.editId = null;
      renderBoard();
      showScreen('board');
    });

    document.getElementById('drawerAdd').addEventListener('click', () => openCreate(null));

    document.getElementById('btnGenerate').addEventListener('click', createOrUpdateTable);
    document.getElementById('btnCreateFirst').addEventListener('click', () => openCreate(null));
    document.getElementById('btnReset').addEventListener('click', resetBoard);
    document.getElementById('btnShuffle').addEventListener('click', shuffleBoard);
    document.getElementById('btnEdit').addEventListener('click', () => {
      const id = state.data.activeId;
      if (id) openCreate(id);
    });
    document.getElementById('btnDelete').addEventListener('click', () => {
      const t = state.activeTable;
      if (t) showDeleteConfirm(t.id, t.name);
    });
    document.getElementById('wordsInput').addEventListener('input', updateWordsHints);

    document.getElementById('deleteCancel').addEventListener('click', hideDeleteConfirm);
    document.getElementById('deleteConfirmBtn').addEventListener('click', deleteTable);

    if (state.data.tables.length === 0) {
      showScreen('empty');
      return;
    }
    if (state.data.activeId && state.data.tables.some(t => t.id === state.data.activeId)) {
      renderBoard();
      showScreen('board');
    } else {
      state.data.activeId = state.data.tables[0].id;
      saveData(state.data);
      renderBoard();
      showScreen('board');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
