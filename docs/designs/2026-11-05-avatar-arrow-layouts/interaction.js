  const root = document.getElementById('avatar-arrow-layouts');
  const settings = [
    { id: 'hair', label: 'Hairstyle', short: 'Hair', group: 'appearance' },
    { id: 'hairColor', label: 'Hair color', short: 'Hair color', group: 'appearance' },
    { id: 'skin', label: 'Skin tone', short: 'Skin', group: 'appearance' },
    { id: 'eyes', label: 'Eyes', short: 'Eyes', group: 'details' },
    { id: 'expression', label: 'Expression', short: 'Mood', group: 'details' },
    { id: 'prop', label: 'Prop', short: 'Prop', group: 'details' }
  ];
  const initialLook = { hair: 'buns', hairColor: 'teal', skin: 'mint', eyes: 'almond', expression: 'surprised', prop: 'chopper' };
  const views = [...root.querySelectorAll(':scope > [data-variant]')].map(section => ({
    section,
    name: section.dataset.variant,
    portrait: section.querySelector('[data-avatar]'),
    look: { ...initialLook },
    group: 'appearance',
    active: 'prop',
    rows: new Map()
  }));
  let artworkReady = false;

  function selectedIndex(view, setting) {
    return choices[setting.id].findIndex(([value]) => value === view.look[setting.id]);
  }

  function saveLook(view) {
    if (!window.openai?.setWidgetState) return;
    const looks = Object.fromEntries(views.map(item => [item.name, { ...item.look }]));
    Promise.resolve(window.openai.setWidgetState({
      modelContent: { design: view.name, look: { ...view.look } },
      privateContent: { kind: 'avatar-arrow-layouts', looks }
    })).catch(() => {});
  }

  function restoreLooks(saved) {
    if (saved?.kind !== 'avatar-arrow-layouts') return;
    for (const view of views) {
      const look = saved.looks?.[view.name];
      if (!look) continue;
      for (const setting of settings) {
        const value = look[setting.id];
        if (choices[setting.id].some(([id]) => id === value)) view.look[setting.id] = value;
      }
    }
  }

  function cycle(view, setting, direction) {
    const options = choices[setting.id];
    const next = (selectedIndex(view, setting) + direction + options.length) % options.length;
    view.look[setting.id] = options[next][0];
    view.active = setting.id;
    view.section.querySelector('[data-result]').textContent = '';
    render(view);
    saveLook(view);
  }

  function makeArrow(view, setting, direction, showLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = showLabel ? 'arrow labeled-arrow' : 'arrow';
    button.dataset.direction = String(direction);
    const verb = direction < 0 ? 'Previous ' : 'Next ';
    button.setAttribute('aria-label', verb + setting.label.toLowerCase());

    const icon = document.createElement('span');
    icon.className = 'chevron';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = direction < 0 ? '‹' : '›';
    button.append(icon);
    if (showLabel) {
      const caption = document.createElement('span');
      caption.className = 'short-label';
      caption.textContent = setting.short;
      button.append(caption);
    }
    button.addEventListener('click', () => cycle(view, setting, direction));
    return button;
  }

  function makeRowCopy(setting) {
    const copy = document.createElement('div');
    copy.className = 'row-copy';
    const label = document.createElement('span');
    label.textContent = setting.label;
    const value = document.createElement('div');
    value.className = 'row-value';
    value.setAttribute('aria-live', 'polite');
    const text = document.createElement('span');
    text.dataset.value = '';
    let swatch;
    if (palettes[setting.id]) {
      swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.setAttribute('aria-hidden', 'true');
      value.append(swatch);
    }
    value.append(text);
    copy.append(label, value);
    return { copy, text, swatch };
  }

  function connectRows(view) {
    const sideStacks = view.name === 'Side stacks';
    const controls = view.section.querySelector('[data-controls]');
    for (const [index, setting] of settings.entries()) {
      const row = document.createElement('div');
      row.className = sideStacks ? 'side-pair' : 'row';
      row.dataset.setting = setting.id;
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', setting.label);
      const previous = makeArrow(view, setting, -1, sideStacks);
      const next = makeArrow(view, setting, 1, false);
      if (sideStacks) {
        previous.style.gridRow = index + 1;
        next.style.gridRow = index + 1;
        row.append(previous, next);
        view.rows.set(setting.id, { row });
      } else {
        const { copy, text, swatch } = makeRowCopy(setting);
        row.append(previous, copy, next);
        view.rows.set(setting.id, { row, text, swatch });
      }
      controls.append(row);
    }
  }

  function render(view) {
    if (artworkReady) drawAvatar(view.portrait, view.look);
    for (const setting of settings) {
      const index = selectedIndex(view, setting);
      const [value, label] = choices[setting.id][index];
      const { row, text, swatch } = view.rows.get(setting.id);
      if (view.name === 'Side stacks') {
        row.dataset.active = String(setting.id === view.active);
        if (setting.id === view.active) {
          view.section.querySelector('[data-current]').textContent = setting.label + ' · ' + label + ' · ' + (index + 1) + ' of ' + choices[setting.id].length;
        }
      } else {
        if (text.textContent !== label) text.textContent = label;
        if (swatch) swatch.style.backgroundColor = 'rgb(' + palettes[setting.id][value].rgb.join(', ') + ')';
        row.hidden = view.name === 'Grouped rows' && setting.group !== view.group;
      }
    }
    for (const button of view.section.querySelectorAll('[data-group]')) {
      button.setAttribute('aria-pressed', String(button.dataset.group === view.group));
    }
  }

  function connectEntry(view) {
    const input = view.section.querySelector('[name="nickname"]');
    const result = view.section.querySelector('[data-result]');
    const confirm = () => {
      const nickname = input.value.trim();
      result.textContent = nickname ? 'Preview ready for ' + nickname : 'Enter a nickname';
    };
    view.section.querySelector('.join').addEventListener('click', confirm);
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      confirm();
    });
    for (const button of view.section.querySelectorAll('[data-group]')) {
      button.addEventListener('click', () => {
        view.group = button.dataset.group;
        render(view);
      });
    }
  }

  function connectDesignControls(view) {
    if (!globalThis.Tweak) return;
    const tray = view.section.querySelector('.portrait');
    const size = Number.parseInt(getComputedStyle(tray).getPropertyValue('--portrait-size'), 10) || 192;
    const design = { size };
    const tweak = new globalThis.Tweak({ container: view.section.querySelector('form'), onChange: () => {
      tray.style.setProperty('--portrait-size', design.size + 'px');
    } });
    tweak.addSlider(design, 'size', { label: 'Portrait size', min: size - 16, max: size + 12, unit: 'px' });
  }

  async function initialize() {
    restoreLooks(window.openai?.widgetState?.privateContent);
    for (const view of views) {
      connectRows(view);
      connectEntry(view);
      render(view);
      connectDesignControls(view);
    }
    window.addEventListener('openai:set_globals', event => {
      restoreLooks(event.detail?.globals?.widgetState?.privateContent);
      for (const view of views) render(view);
    });

    try {
      await loadAvatarArtwork();
      artworkReady = true;
      for (const view of views) render(view);
      root.dataset.ready = 'true';
    } catch (error) {
      for (const view of views) view.section.querySelector('[data-result]').textContent = error.message;
    }
  }

  initialize();
