  const root = document.getElementById('avatar-picker-directions');
  const slotLabels = {
    hair: 'Hairstyle', hairColor: 'Hair color', skin: 'Skin tone', eyes: 'Eyes', expression: 'Expression',
    hat: 'Headwear', eyewear: 'Eyewear', headphones: 'Headphones', scarf: 'Scarf'
  };
  choices.headphones = [[false, 'None'], [true, 'Teal headphones']];
  choices.scarf = [[false, 'None'], [true, 'Red scarf']];

  const categories = {
    hair: ['hair', 'hairColor'],
    face: ['eyes', 'expression', 'skin'],
    props: ['hat', 'eyewear', 'headphones', 'scarf']
  };
  const starterNames = { moon: 'Moon DJ', pirate: 'Sky pirate', scout: 'Forest scout' };
  const views = [...root.querySelectorAll(':scope > [data-variant]')].map(section => ({
    section,
    name: section.dataset.variant,
    portrait: section.querySelector('[data-avatar]'),
    look: { ...defaultLook },
    slot: 'hair',
    category: 'hair',
    options: [],
    starterCards: []
  }));
  let artworkReady = false;

  function optionIndex(view) {
    return choices[view.slot].findIndex(([key]) => key === view.look[view.slot]);
  }

  function createButton(label, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }

  function createTile(label) {
    const button = createButton('', 'option');
    const caption = document.createElement('span');
    caption.textContent = label;
    button.append(caption);
    return button;
  }

  function thumbnail(button) {
    const canvas = newCanvas(128, 128);
    canvas.setAttribute('aria-hidden', 'true');
    button.prepend(canvas);
    return canvas;
  }

  function saveLook(view) {
    if (!window.openai?.setWidgetState) return;
    const looks = Object.fromEntries(views.map(item => [item.name, { ...item.look }]));
    Promise.resolve(window.openai.setWidgetState({
      modelContent: { design: view.name, look: { ...view.look } },
      privateContent: { kind: 'avatar-picker-directions', looks }
    })).catch(() => {});
  }

  function restoreLooks(saved) {
    if (saved?.kind !== 'avatar-picker-directions') return;
    for (const view of views) {
      const look = saved.looks?.[view.name];
      if (!look) continue;
      for (const [key, options] of Object.entries(choices)) {
        if (options.some(([value]) => value === look[key])) view.look[key] = look[key];
      }
    }
  }

  function changeLook(view, look) {
    view.look = look;
    view.section.querySelector('[data-result]').textContent = '';
    render(view);
    saveLook(view);
  }

  function changeOption(view, index) {
    const [value] = choices[view.slot][index];
    changeLook(view, { ...view.look, [view.slot]: value });
  }

  function renderArrowLabels(view) {
    const index = optionIndex(view);
    const options = choices[view.slot];
    const slotName = slotLabels[view.slot];
    view.section.querySelector('[data-current]').textContent = options[index][1] + ' · ' + (index + 1) + ' of ' + options.length;
    view.section.querySelector('[data-cycle="-1"]').setAttribute('aria-label', 'Previous ' + slotName.toLowerCase());
    view.section.querySelector('[data-cycle="1"]').setAttribute('aria-label', 'Next ' + slotName.toLowerCase());
  }

  function renderGallery(view) {
    const selected = optionIndex(view);
    for (const [index, tile] of view.options.entries()) {
      tile.button.setAttribute('aria-pressed', String(index === selected));
      if (!artworkReady || !tile.canvas) continue;
      const [value] = choices[view.slot][index];
      drawAvatar(tile.canvas, { ...view.look, [view.slot]: value });
    }
  }

  function renderStarters(view) {
    for (const { button, look } of view.starterCards) {
      const selected = Object.keys(look).every(key => look[key] === view.look[key]);
      button.setAttribute('aria-pressed', String(selected));
    }
    view.section.querySelector('[data-value]').value = optionIndex(view);
  }

  function render(view) {
    if (artworkReady) drawAvatar(view.portrait, view.look);
    if (view.name === 'Arcade arrows') renderArrowLabels(view);
    if (view.name === 'Thumbnail picker') renderGallery(view);
    if (view.name === 'Starter looks') renderStarters(view);
  }

  function connectSlotSelect(view, onChange) {
    const select = view.section.querySelector('[data-slot]');
    select.replaceChildren(...Object.entries(slotLabels).map(([key, label]) => new Option(label, key)));
    select.value = view.slot;
    select.addEventListener('change', () => {
      view.slot = select.value;
      onChange();
    });
  }

  function connectArrows(view) {
    connectSlotSelect(view, () => renderArrowLabels(view));
    for (const button of view.section.querySelectorAll('[data-cycle]')) {
      button.addEventListener('click', () => {
        const count = choices[view.slot].length;
        const next = (optionIndex(view) + Number(button.dataset.cycle) + count) % count;
        changeOption(view, next);
      });
    }
  }

  function buildGallery(view) {
    const grid = view.section.querySelector('[data-options]');
    grid.setAttribute('aria-label', slotLabels[view.slot] + ' choices');
    const palette = palettes[view.slot];
    view.options = choices[view.slot].map(([value, label], index) => {
      const button = createTile(label);
      let canvas;
      if (palette) {
        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        swatch.setAttribute('aria-hidden', 'true');
        swatch.style.backgroundColor = 'rgb(' + palette[value].rgb.join(', ') + ')';
        button.prepend(swatch);
      } else {
        canvas = thumbnail(button);
      }
      button.addEventListener('click', () => changeOption(view, index));
      return { button, canvas };
    });
    grid.replaceChildren(...view.options.map(tile => tile.button));
    renderGallery(view);
  }

  function updateSlotButtons(view) {
    for (const button of view.section.querySelectorAll('[data-gallery-slot]')) {
      button.setAttribute('aria-pressed', String(button.dataset.gallerySlot === view.slot));
    }
  }

  function changeCategory(view, category) {
    view.category = category;
    view.slot = categories[category][0];
    for (const button of view.section.querySelectorAll('[data-category]')) {
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    }
    const slots = categories[category].map(key => {
      const button = createButton(slotLabels[key], 'part-tab');
      button.dataset.gallerySlot = key;
      button.addEventListener('click', () => {
        view.slot = key;
        updateSlotButtons(view);
        buildGallery(view);
      });
      return button;
    });
    view.section.querySelector('[data-slots]').replaceChildren(...slots);
    updateSlotButtons(view);
    buildGallery(view);
  }

  function connectGallery(view) {
    for (const button of view.section.querySelectorAll('[data-category]')) {
      button.addEventListener('click', () => changeCategory(view, button.dataset.category));
    }
    changeCategory(view, view.category);
  }

  function updateFineTune(view) {
    const select = view.section.querySelector('[data-value]');
    view.section.querySelector('[data-value-label]').textContent = slotLabels[view.slot];
    select.replaceChildren(...choices[view.slot].map(([, label], index) => new Option(label, index)));
    select.value = optionIndex(view);
  }

  function connectStarters(view) {
    const cards = view.section.querySelector('[data-starters]');
    view.starterCards = Object.entries(examples).map(([id, look]) => {
      const button = createTile(starterNames[id]);
      const canvas = thumbnail(button);
      button.addEventListener('click', () => changeLook(view, { ...look }));
      return { button, canvas, look };
    });
    cards.replaceChildren(...view.starterCards.map(card => card.button));

    connectSlotSelect(view, () => updateFineTune(view));
    view.section.querySelector('[data-value]').addEventListener('change', event => changeOption(view, Number(event.target.value)));
    const fineTune = view.section.querySelector('[data-fine-tune]');
    const toggle = view.section.querySelector('[data-tune]');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      const open = fineTune.hidden;
      fineTune.hidden = !open;
      cards.hidden = open;
      toggle.textContent = open ? 'Browse starter looks' : 'Fine-tune look';
      toggle.setAttribute('aria-expanded', String(open));
    });
    updateFineTune(view);
  }

  function connectEntry(view) {
    const input = view.section.querySelector('[name="nickname"]');
    const showResult = () => {
      const nickname = input.value.trim();
      view.section.querySelector('[data-result]').textContent = nickname ? 'Preview ready for ' + nickname : 'Enter a nickname';
    };
    // The embedded preview sandbox blocks form submission. Keep the entry
    // action local and give the nickname field an equivalent keyboard action.
    view.section.querySelector('.join').addEventListener('click', showResult);
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      showResult();
    });
  }

  function connectDesignControls(view) {
    if (!globalThis.Tweak) return;
    const stage = view.section.querySelector('.picker-stage');
    const size = Number.parseInt(getComputedStyle(stage).getPropertyValue('--portrait-size'), 10);
    const design = { size };
    const tweak = new globalThis.Tweak({ container: view.section.querySelector('form'), onChange: () => {
      stage.style.setProperty('--portrait-size', design.size + 'px');
    } });
    tweak.addSlider(design, 'size', { label: 'Portrait size', min: size - 20, max: size + 12, unit: 'px' });
  }

  async function initialize() {
    restoreLooks(window.openai?.widgetState?.privateContent);
    const connections = { 'Arcade arrows': connectArrows, 'Thumbnail picker': connectGallery, 'Starter looks': connectStarters };
    for (const view of views) {
      connections[view.name](view);
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
      for (const view of views) {
        for (const card of view.starterCards) drawAvatar(card.canvas, card.look);
        render(view);
      }
      root.dataset.ready = 'true';
    } catch (error) {
      for (const view of views) view.section.querySelector('[data-result]').textContent = error.message;
    }
  }

  initialize();
