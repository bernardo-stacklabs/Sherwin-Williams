const form = document.querySelector('#login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const passwordField = document.querySelector('.password-field');
const passwordToggle = document.querySelector('.password-toggle');
const submitButton = document.querySelector('.primary-button');
const forgotPasswordButton = document.querySelector('#forgot-password');
const resetForm = document.querySelector('#reset-form');
const resetEmailInput = document.querySelector('#reset-email');
const newPasswordInput = document.querySelector('#new-password');
const confirmPasswordInput = document.querySelector('#confirm-password');
const backToLoginButton = document.querySelector('#back-to-login');
const resetSubmitButton = document.querySelector('#reset-submit');
const loginCard = document.querySelector('.login-card');

// Provedor de autenticação: iremos usar apenas Supabase
const AUTH_PROVIDER = 'supabase';

// CONFIGURAÇÃO SUPABASE (substitua pelos dados reais do seu projeto)
// Painel Supabase: Project settings -> API
//  - url  = Project URL
//  - anon = anon public key
const supabaseConfig = {
  url: 'https://kjwlboqqdufrkhcxjppf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2xib3FxZHVmcmtoY3hqcHBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyOTU2OCwiZXhwIjoyMDc4OTA1NTY4fQ.t30eEhmv9uVv-FEDoDKKwrgb6lfj6NUYEnTl47bydsw',
};

let supabaseClient = null;

function setError(input, message) {
  const errorElement = document.querySelector(`.field-error[data-error-for="${input.id}"]`);
  if (errorElement) {
    errorElement.textContent = message || '';
  }
}

function validateEmail(value) {
  if (!value) return 'Informe seu e-mail corporativo';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) return 'Digite um e-mail válido';
  return '';
}

function validatePassword(value) {
  if (!value) return 'Informe sua senha';
  return '';
}

function setLoading(isLoading, button = submitButton) {
  if (!button) return;
  button.disabled = isLoading;
  if (isLoading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}

passwordToggle?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  passwordField.classList.toggle('password-visible', isPassword);
});

emailInput?.addEventListener('input', () => setError(emailInput, ''));
passwordInput?.addEventListener('input', () => setError(passwordInput, ''));
resetEmailInput?.addEventListener('input', () => setError(resetEmailInput, ''));
newPasswordInput?.addEventListener('input', () => setError(newPasswordInput, ''));
confirmPasswordInput?.addEventListener('input', () => setError(confirmPasswordInput, ''));

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!supabaseConfig.url || !supabaseConfig.anonKey ||
    supabaseConfig.url.includes('SEU_PROJETO') ||
    supabaseConfig.anonKey === 'SUA_CHAVE_ANON') {
    throw new Error('Supabase não configurado: preencha url e anonKey em app.js.');
  }

  // ESM build oficial via CDN (funciona direto no browser)
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  return supabaseClient;
}

async function authenticate(email, password) {
  if (AUTH_PROVIDER === 'supabase') {
    const client = await getSupabaseClient();
    // Validação na tabela public.users (email + senha) direto no Supabase
    const { data, error } = await client
      .from('users')
      .select('id, email')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error('Erro Supabase auth:', error);
      throw error;
    }

    if (!data) {
      // Não encontrou registro com esse email+senha
      throw new Error('INVALID_CREDENTIALS');
    }

    return { ok: true, user: { id: data.id, email: data.email } };
  }

  throw new Error('Provedor de autenticação não configurado corretamente.');
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  setError(emailInput, emailError);
  setError(passwordInput, passwordError);

  if (emailError || passwordError) return;

  try {
    setLoading(true);
    await authenticate(email, password);

    // Redireciona para o App principal após login bem-sucedido
    window.location.href = './app.html';
  } catch (error) {
    console.error(error);
    if (error && error.message === 'INVALID_CREDENTIALS') {
      setError(passwordInput, 'E-mail ou senha inválidos');
    } else {
      setError(passwordInput, 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
      alert('Erro ao tentar fazer login. Veja detalhes no console do navegador (F12 -> Console).');
    }
  } finally {
    setLoading(false, submitButton);
  }
});

function switchToResetMode() {
  if (!loginCard || !resetForm) return;
  loginCard.classList.add('reset-mode');
  resetForm.hidden = false;
  const currentEmail = emailInput.value.trim();
  if (currentEmail && resetEmailInput) {
    resetEmailInput.value = currentEmail;
  }
}

function switchToLoginMode() {
  if (!loginCard || !resetForm) return;
  loginCard.classList.remove('reset-mode');
  resetForm.hidden = true;
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  setError(resetEmailInput, '');
  setError(newPasswordInput, '');
  setError(confirmPasswordInput, '');
}

forgotPasswordButton?.addEventListener('click', () => {
  switchToResetMode();
});

backToLoginButton?.addEventListener('click', () => {
  switchToLoginMode();
});

resetForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = resetEmailInput.value.trim();
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  const emailError = validateEmail(email);
  setError(resetEmailInput, emailError);

  let newPasswordError = '';
  if (!newPassword) {
    newPasswordError = 'Informe a nova senha';
  }

  let confirmPasswordError = '';
  if (!confirmPassword) {
    confirmPasswordError = 'Confirme a nova senha';
  } else if (newPassword && newPassword !== confirmPassword) {
    confirmPasswordError = 'As senhas não conferem';
  }

  setError(newPasswordInput, newPasswordError);
  setError(confirmPasswordInput, confirmPasswordError);

  if (emailError || newPasswordError || confirmPasswordError) return;

  try {
    setLoading(true, resetSubmitButton);
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .update({ password: newPassword })
      .eq('email', email)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      alert('Não foi possível redefinir a senha. Tente novamente.');
      return;
    }

    if (!data) {
      setError(resetEmailInput, 'E-mail não encontrado');
      return;
    }

    alert('Senha redefinida com sucesso! Use a nova senha para entrar.');
    emailInput.value = email;
    passwordInput.value = '';
    switchToLoginMode();
    passwordInput.focus();
  } catch (error) {
    console.error(error);
    alert('Não foi possível redefinir a senha. Tente novamente.');
  } finally {
    setLoading(false, resetSubmitButton);
  }
});

if ('serviceWorker' in navigator) {
  // Unregister existing service workers to ensure code updates are seen immediately
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// ----------------------
// Home (app.html) logic
// ----------------------

// Translation Dictionary
import { i18n } from './locales.js';

function initHome() {
  const refreshIcons = () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };
  refreshIcons();

  const appCard = document.querySelector('.app-card');
  if (!appCard) return; // não estamos na home do app

  // Header da home (tema e idioma)
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = themeToggle?.querySelector('svg');

  // Theme Logic
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  if (isDark) {
    document.body.classList.add('dark-mode');
  }

  function updateThemeIcon() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const iconWrapper = themeToggle?.querySelector('.theme-toggle-icon');

    if (iconWrapper) {
      // Re-create the i tag so Lucide can process it again
      iconWrapper.innerHTML = `<i data-lucide="${isDarkMode ? 'moon' : 'sun'}"></i>`;
      refreshIcons();
    }
  }

  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkNow = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    updateThemeIcon();
  });

  // Language Logic
  let currentLang = 'pt';
  const langPills = document.querySelectorAll('.lang-pill');

  function updateTexts(lang) {
    currentLang = lang;
    const texts = i18n[lang];
    if (!texts) return;

    // Update static keyed elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (texts[key]) {
        el.textContent = texts[key];
      }
    });

    // Re-render dynamic content (Notices & Agenda)
    renderNotices();
    renderSchedule(activeDay);
  }

  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      langPills.forEach(p => {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');

      const selectedLang = pill.textContent.trim().toLowerCase();
      updateTexts(selectedLang);
    });
  });

  // Logic for Notices Toggle
  const noticesSection = document.querySelector('.notices-section');
  const noticesToggle = document.querySelector('.notices-toggle');

  if (noticesToggle && noticesSection) {
    noticesToggle.addEventListener('click', () => {
      noticesSection.classList.toggle('is-collapsed');
      // Rotate icon - Lucide replaces i with svg, so we target svg directly or the class .lucide
      const icon = noticesToggle.querySelector('svg');
      if (noticesSection.classList.contains('is-collapsed')) {
        icon.style.transform = 'rotate(-90deg)';
      } else {
        icon.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Agenda por dia
  const dayPills = document.querySelectorAll('.day-pill');
  const scheduleList = document.querySelector('#schedule-list');

  // Helper to get translated string or fallback
  const t = (key) => i18n[currentLang][key] || key;

  // Dados da home (Keys map to i18n)
  const importantNotices = [
    { id: 1, textKey: 'notice1' },
    { id: 2, textKey: 'notice2' },
    { id: 3, textKey: 'notice3' },
  ];

  const agendaByDay = {
    sunday: [
      {
        id: 101, // New Breakfast
        time: '07:30 - 09:30',
        titleKey: 'sessionBreakfast',
        locationKey: 'locRest',
        status: null,
      },
      {
        id: 1,
        time: '10:00 - 11:00', // Finished
        titleKey: 'session1Title',
        locationKey: 'session1Loc',
        status: null,
      },
      {
        id: 2,
        time: '11:00 - 13:00', // Now
        titleKey: 'session2Title',
        locationKey: 'session2Loc',
        status: null,
        isFavorite: true,
      },
      {
        id: 99,
        time: '12:15 - 13:15',
        titleKey: 'session3Title',
        locationKey: 'session1Loc',
        status: null,
      },
      {
        id: 102, // New Check-in
        time: '14:00 - 18:00',
        titleKey: 'sessionCheckin',
        locationKey: 'session1Loc',
        status: null,
      }
    ],
    monday: [
      {
        id: 3,
        time: '09:00 - 10:30',
        titleKey: 'session3Title',
        locationKey: 'session1Loc',
        status: null,
      },
      {
        id: 4,
        time: '11:00 - 12:30',
        titleKey: 'session4Title',
        locationKey: 'session1Loc',
        status: null,
      },
      {
        id: 103, // New Lunch
        time: '12:30 - 14:00',
        titleKey: 'sessionLunch',
        locationKey: 'locRest',
        status: null,
      },
      {
        id: 104, // New Happy Hour
        time: '18:00 - 20:00',
        titleKey: 'sessionHappyHour',
        locationKey: 'session2Loc',
        status: null,
      }
    ],
    tuesday: [
      {
        id: 5,
        time: '09:30 - 11:00',
        titleKey: 'session5Title',
        locationKey: 'session5Loc',
        status: null,
      },
      {
        id: 6,
        time: '19:30 - 22:00',
        titleKey: 'session6Title',
        locationKey: 'session2Loc',
        status: null,
      },
    ],
    wednesday: [
      {
        id: 7,
        time: '10:00 - 12:00',
        titleKey: 'session7Title',
        locationKey: 'session1Loc',
        status: null,
      },
    ],
  };

  const noticesContainer = document.querySelector('#announcement-list');

  // --- MODAL LOGIC ---
  const modal = document.querySelector('#app-modal');
  const modalTitle = document.querySelector('#modal-title');
  const modalTime = document.querySelector('#modal-time');
  const modalLoc = document.querySelector('#modal-location');
  const modalDesc = document.querySelector('#modal-description');
  const modalActions = document.querySelector('#modal-actions');
  const modalClose = document.querySelector('.modal-close');

  if (modalClose && modal) {
    modalClose.addEventListener('click', () => {
      modal.close();
    });
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });
  }

  function openModal(data) {
    if (!modal) return;

    // Reset fields
    modalTitle.textContent = data.title || '';
    modalTime.textContent = data.time || '';
    modalLoc.textContent = data.location ? `Local: ${data.location}` : '';
    modalDesc.textContent = data.description || '';
    modalActions.innerHTML = '';

    // Action Buttons
    if (data.type === 'session') {
      // "Ver no mapa" button
      const btnMap = document.createElement('button');
      btnMap.className = 'action-btn btn-primary';
      btnMap.innerHTML = `
        <i data-lucide="map-pin" style="margin-right: 8px;"></i>
        ${t('btnMap') || 'Ver no mapa'}
      `;
      // We need to refresh icons after adding this button to DOM, 
      // but since we appendChild immediately after, we can do it then or rely on a MutationObserver (too complex).
      // We'll call createIcons() right after append.
      btnMap.onclick = () => {
        // Logic to switch to map view could go here
        modal.close();
        const mapBtn = document.querySelector('[data-view-target="mapa"]');
        if (mapBtn) mapBtn.click();
      };
      modalActions.appendChild(btnMap);
      refreshIcons(); // Render the icon in the new button
    }

    modal.showModal();
  }

  // --- RENDER FUNCTIONS ---

  function renderNotices() {
    if (!noticesContainer) return;
    noticesContainer.innerHTML = '';

    // Limit to 2 items
    importantNotices.slice(0, 2).forEach((notice, index) => {
      const article = document.createElement('article');
      article.className = 'announcement-card';
      article.style.cursor = 'pointer'; // Indicate clickable
      article.innerHTML = `<p>${t(notice.textKey)}</p>`;

      // Click event for modal
      article.addEventListener('click', () => {
        openModal({
          type: 'notice',
          title: t(notice.textKey),
          description: t(`notice${index + 1}Desc`) || 'Detalhes adicionais em breve.' // Fallback or map keys
        });
      });

      noticesContainer.appendChild(article);
    });
  }


  function getSessionStatus(timeStr, dayKey) {
    // dayKey: 'sunday', 'monday', etc.
    // timeStr: "14:00 - 18:00"

    const now = new Date();
    // Helper to get today's day index for testing "Sunday" as "Today"
    // We map 'sunday' to proper Today index so it shows active tags
    // Other days will mismatch and show no tags, proving the fix
    const todayIndex = now.getDay();

    // Map 'sunday' (0), 'monday' (1), etc.
    // MODIFIED FOR TESTING: sunday = todayIndex
    const daysMap = { sunday: todayIndex, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = daysMap[dayKey];

    // Check if right day
    if (now.getDay() !== targetDay) return null;

    // Parse times
    const [startStr, endStr] = timeStr.split(' - ');
    if (!startStr) return null;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr ? endStr.split(':').map(Number) : [startH + 1, startM]; // Default 1h if no end

    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentMins = currentH * 60 + currentM;

    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    // "Finished": End time has passed
    if (currentMins >= endMins) {
      return 'finished';
    }

    // "Now": Current time is between start and end
    if (currentMins >= startMins && currentMins < endMins) {
      return 'now';
    }

    // "Next": Starts within the next 120 mins (2 hours)
    if (startMins > currentMins && startMins - currentMins <= 120) {
      return 'next';
    }

    return null;
  }

  function renderSchedule(day) {
    if (!scheduleList) return;
    const sessions = agendaByDay[day] || [];
    scheduleList.innerHTML = '';

    if (sessions.length === 0) {
      scheduleList.innerHTML = '<p class="empty-state">Nenhuma atividade programada.</p>';
      return;
    }

    sessions.forEach((session) => {
      // Logic for status
      const realStatus = getSessionStatus(session.time, day);

      const article = document.createElement('article');
      article.className = 'session-card';
      // Make it interactive
      article.style.cursor = 'pointer';

      // Apply finished class if needed
      if (realStatus === 'finished') {
        article.classList.add('is-finished');
      }

      const statusHtml = realStatus === 'now'
        ? `<span class="session-status"><span class="session-status-dot"></span>${t('now')}</span>`
        : realStatus === 'next'
          ? `<span class="session-status session-status-next">${t('next')}</span>`
          : ''; // No tag for finished, just styling

      article.innerHTML = `
        <div class="session-header">
          <span class="session-time">${session.time}</span>
          ${statusHtml}
        </div>
        <h3 class="session-title">${t(session.titleKey)}</h3>
        <div class="session-meta">
          <span class="session-meta-icon" aria-hidden="true">
            <i data-lucide="map-pin"></i>
          </span>
          <span>${t(session.locationKey)}</span>
        </div>
      `;

      // Click event for modal
      article.addEventListener('click', () => {
        openModal({
          type: 'session',
          title: t(session.titleKey),
          time: session.time,
          location: t(session.locationKey),
          // Fallback description logic
          description: t(`session${session.id}Desc`) || 'Descrição da atividade indisponível no momento.'
        });
      });

      scheduleList.appendChild(article);
    });
    refreshIcons(); // Render icons for the new list
  }

  // --- MAP LOGIC ---
  const locationsData = [
    { titleKey: 'locPlenary', descKey: 'locPlenaryDesc', icon: 'mic-2' },
    { titleKey: 'locRoom1', descKey: 'locRoom1Desc', icon: 'presentation' },
    { titleKey: 'locRoom2', descKey: 'locRoom2Desc', icon: 'presentation' },
    { titleKey: 'locRest', descKey: 'locRestDesc', icon: 'utensils' },
  ];

  function renderLocations() {
    const locationsGrid = document.querySelector('#locations-grid');
    if (!locationsGrid) return;
    locationsGrid.innerHTML = '';

    locationsData.forEach(loc => {
      const card = document.createElement('div');
      card.className = 'location-card';
      card.innerHTML = `
        <div class="location-icon">
          <i data-lucide="${loc.icon}"></i>
        </div>
        <div class="location-info">
          <h4>${t(loc.titleKey)}</h4>
          <p>${t(loc.descKey)}</p>
        </div>
      `;
      locationsGrid.appendChild(card);
    });
    refreshIcons();
  }

  // PDF Viewer Vars
  let pdfDoc = null;
  let pageNum = 1;
  let scale = 1.0;
  const canvas = document.querySelector('#pdf-render');
  const ctx = canvas?.getContext('2d');
  const zoomIndicator = document.querySelector('.zoom-indicator');

  function renderPage(num) {
    if (!pdfDoc || !canvas) return;

    pdfDoc.getPage(num).then(page => {
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      // Wait for render to finish
      renderTask.promise.then(function () {
        if (zoomIndicator) {
          zoomIndicator.textContent = `${Math.round(scale * 100)}%`;
        }
      });

    }).catch(err => {
      console.error("Error rendering page: ", err);
    });
  }

  function queueRenderPage(num) {
    renderPage(num);
  }

  function loadMapPdf() {
    if (!canvas) return; // Not on page
    const url = './assets/map.pdf'; // Placeholder path

    // If PDF.js is loaded
    if (window.pdfjsLib) {
      pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDoc = pdf;
        renderPage(pageNum);
      }).catch(err => {
        console.warn("Map PDF not found or error loading:", err);
        // Optional: Draw text on canvas saying "Map not available"
        if (ctx) {
          ctx.font = "14px Inter";
          ctx.fillStyle = "#666";
          ctx.fillText("PDF não encontrado (./assets/map.pdf)", 20, 50);
        }
      });
    }
  }

  // Map Controls
  const zoomInBtn = document.querySelector('#zoom-in');
  const zoomOutBtn = document.querySelector('#zoom-out');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      scale += 0.2;
      queueRenderPage(pageNum);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (scale <= 0.4) return;
      scale -= 0.2;
      queueRenderPage(pageNum);
    });
  }

  renderLocations();
  loadMapPdf(); // Try loading PDF logic

  renderNotices();

  let activeDay = 'sunday';
  renderSchedule(activeDay);

  dayPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const day = pill.dataset.day;
      if (!day || day === activeDay) return;
      activeDay = day;
      dayPills.forEach((p) => {
        p.classList.toggle('is-active', p === pill);
        p.setAttribute('aria-selected', p === pill ? 'true' : 'false');
      });
      renderSchedule(day);
    });
  });

  // Navegação inferior (Agenda / Mapa / Fotos)
  // --- PHOTOS LOGIC ---
  const photosData = [
    { id: 1, day: 'sunday', url: null },
    { id: 2, day: 'sunday', url: null },
    { id: 3, day: 'monday', url: null },
    { id: 4, day: 'monday', url: null },
    { id: 5, day: 'monday', url: null },
    { id: 6, day: 'tuesday', url: null },
    { id: 7, day: 'tuesday', url: null },
    { id: 8, day: 'wednesday', url: null },
    { id: 9, day: 'wednesday', url: null },
  ];

  function renderPhotos(filterDay = 'all') {
    const photosGrid = document.querySelector('#photos-grid');
    if (!photosGrid) return;
    photosGrid.innerHTML = '';

    const filtered = filterDay === 'all'
      ? photosData
      : photosData.filter(p => p.day === filterDay);

    if (filtered.length === 0) {
      photosGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">Nenhuma foto encontrada.</p>';
      return;
    }

    filtered.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      // Placeholder structure
      card.innerHTML = `
        <div class="photo-placeholder">
          Foto ${photo.id}
        </div>
        <button type="button" class="photo-download-btn" aria-label="${t('download')}">
          <i data-lucide="download"></i>
        </button>
      `;

      // Mock Download
      const btn = card.querySelector('.photo-download-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Foto%20Placeholder%20' + photo.id;
        link.download = `photo-${photo.id}.txt`; // Dummy download
        link.click();
      });

      photosGrid.appendChild(card);
    });
    refreshIcons();
  }

  const photoTabs = document.querySelectorAll('.photo-tabs .day-pill');
  if (photoTabs.length > 0) {
    // Initial Render
    renderPhotos('all');

    photoTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Toggle Active
        photoTabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        const day = tab.dataset.photoDay;
        renderPhotos(day);
      });
    });
  }


  // Navegação inferior e Header Dinâmico
  const navItems = document.querySelectorAll('.bottom-nav-item');
  const views = document.querySelectorAll('.home-section[data-view]');
  const headerTitle = document.querySelector('.home-title');
  const headerSubtitle = document.querySelector('.home-date');

  const viewConfig = {
    agenda: { titleKey: 'homeTitle', subtitleKey: 'homeDate' },
    mapa: { titleKey: 'mapTitle', subtitleKey: 'mapSubtitle' },
    fotos: { titleKey: 'photosTitle', subtitleKey: 'photosSubtitle' }
  };

  function updateHeader(viewName) {
    const config = viewConfig[viewName];
    if (!config) return;

    if (headerTitle) {
      headerTitle.setAttribute('data-i18n', config.titleKey);
      headerTitle.textContent = t(config.titleKey);
    }
    if (headerSubtitle) {
      headerSubtitle.setAttribute('data-i18n', config.subtitleKey);
      headerSubtitle.textContent = t(config.subtitleKey);
    }
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.viewTarget;
      if (!target) return;

      navItems.forEach((n) => n.classList.remove('is-active'));
      item.classList.add('is-active');

      views.forEach((section) => {
        const view = section.dataset.view;
        section.classList.toggle('is-hidden', view !== target);
      });

      // Update Header
      updateHeader(target);
    });
  });

  // Drag to Scroll Logic
  function enableDragScroll(el) {
    if (!el) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.classList.add('active');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    el.addEventListener('mouseleave', () => {
      isDown = false;
      el.classList.remove('active');
    });

    el.addEventListener('mouseup', () => {
      isDown = false;
      el.classList.remove('active');
    });

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault(); // Prevent selection
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-fast
      el.scrollLeft = scrollLeft - walk;
    });
  }

  // Apply to all day-tabs containers (Agenda and Photos)
  document.querySelectorAll('.day-tabs').forEach(enableDragScroll);
}

document.addEventListener('DOMContentLoaded', initHome);
