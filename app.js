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
  // UMD loaded via <script> in index.html exposes 'supabase' global
  if (!window.supabase) {
    console.error('Supabase SDK not loaded via script tag');
    alert('Erro: A biblioteca do Supabase não foi carregada. Verifique sua conexão ou se bloqueadores de anúncios estão ativos.');
    throw new Error('Supabase SDK not loaded');
  }
  const { createClient } = window.supabase;
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
  // Register Service Worker (PWA offline + installability)
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // Trigger update check in the background
        registration.update().catch(() => { });
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}

// ----------------------
// Home (app.html) logic
// ----------------------

// Translation Dictionary
import { i18n } from './locales.js?v=5';

function initHome() {
  const refreshIcons = () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };
  refreshIcons();

  const isHomePage = document.body.classList.contains('home-page');
  if (!isHomePage) return; // Only run home logic if body has home-page class

  // Header da home (tema e idioma)
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = themeToggle?.querySelector('svg');

  // Theme Logic
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === null || savedTheme === 'dark';

  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  updateThemeIcon(); // Sync icon on load

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

  function normalizeCountryToKey(country) {
    if (!country) return null;
    if (typeof country !== 'string') return null;

    const raw = country.trim();
    if (!raw) return null;

    // If DB already stores the i18n key (e.g., "BRAZIL"), keep it.
    if (i18n?.pt?.[raw] || i18n?.es?.[raw] || i18n?.en?.[raw]) return raw;

    const normalized = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const map = {
      BRAZIL: ['brasil', 'brazil', 'br'],
      MEXICO: ['mexico', 'mx'],
      CHILE: ['chile', 'cl'],
      ARGENTINA: ['argentina', 'ar'],
      COLOMBIA: ['colombia', 'co'],
      ECUADOR: ['ecuador', 'ec'],
      PERU: ['peru', 'pe'],
      URUGUAY: ['uruguay', 'uy'],
      USA: ['usa', 'eua', 'eeuu', 'us', 'united states', 'estados unidos'],
    };

    for (const [key, variants] of Object.entries(map)) {
      if (variants.includes(normalized)) return key;
    }

    return null;
  }

  function getParticipantLocation(participant) {
    if (!participant) return 'LATAM';

    const city = (participant.city || '').trim();
    const countryKey = participant.countryKey || null;
    const countryRaw = (participant.countryRaw || '').trim();

    const countryLabel = countryKey
      ? (i18n?.[currentLang]?.[countryKey] || i18n?.pt?.[countryKey] || countryKey)
      : countryRaw;

    if (city && countryLabel) return `${city}, ${countryLabel}`;
    if (countryLabel) return countryLabel;
    if (city) return city;
    return 'LATAM';
  }

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

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (texts[key]) {
        el.placeholder = texts[key];
      }
    });

    // Re-render dynamic content (Notices & Agenda)
    renderNotices();
    renderSchedule(activeDay);
    renderLocations(); // Update map translations

    // Re-render Photos (placeholder + save hint) if present
    if (typeof renderPhotos === 'function') {
      const activePhotoDay = document.querySelector('.photo-tabs .day-pill.is-active')?.dataset?.photoDay || 'all';
      renderPhotos(activePhotoDay);
    }

    // Re-render Networking if it exists (using current search term if any)
    if (typeof renderNetworking === 'function' && typeof participants !== 'undefined') {
      const searchInput = document.querySelector('#networking-search');
      const term = searchInput ? searchInput.value.toLowerCase() : '';
      const filtered = term
        ? participants.filter(p =>
          p.name.toLowerCase().includes(term) ||
          getParticipantLocation(p).toLowerCase().includes(term) ||
          p.department.toLowerCase().includes(term))
        : participants;
      renderNetworking(filtered);
    }
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

  // Agenda por dia (somente tabs da agenda; não inclui tabs de fotos)
  const dayPills = document.querySelectorAll('.day-tabs:not(.photo-tabs) .day-pill');
  const scheduleList = document.querySelector('#schedule-list');

  // Helper to get translated string or fallback
  const t = (key) => i18n[currentLang][key] || key;

  // Dados da home (Keys map to i18n)
  const importantNotices = [
    { id: 1, icon: 'lightbulb', titleKey: 'noticeInnovationTitle', descKey: 'noticeInnovationDesc' },
    { id: 2, icon: 'gamepad', titleKey: 'noticeGamificationTitle', descKey: 'noticeGamificationDesc' },
    { id: 3, icon: 'log-out', titleKey: 'noticeCheckoutTitle', descKey: 'noticeCheckoutDesc' },
    { id: 4, icon: 'camera', titleKey: 'noticeReliveTitle', descKey: 'noticeReliveDesc' },
    { id: 5, icon: 'share-2', titleKey: 'noticeShareTitle', descKey: 'noticeShareDesc' },
  ];

  const agendaByDay = {
    // DOM 25/01
    sunday: [
      {
        id: 101,
        time: 'ALL DAY',
        titleKey: 'sunLeadershipArrivalsTitle',
        descriptionKey: 'sunLeadershipArrivalsDesc',
        participants: 'Liderança LATAM, Marketing, Produto, P&D, Diretores de Vendas',
      },
    ],
    // SEG 26/01
    monday: [
      {
        id: 201,
        time: '08h30 – 17h00',
        titleKey: 'monAlignmentTitle',
        locationKey: 'locChile',
        descriptionKey: 'monAlignmentDesc',
        participants: 'Marketing LATAM, Produto LATAM, P&D, Diretores de Vendas',
      },
      {
        id: 202,
        time: '16h00 – 18h00',
        titleKey: 'monArrivalsTitle',
        locationKey: 'locReception',
        descriptionKey: 'monArrivalsDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 203,
        time: '18h30 – 22h00',
        titleKey: 'welcomeDrinkTitle',
        locationKey: 'locHallCosmo',
        descriptionKey: 'monWelcomeDesc',
        participants: 'Todos os participantes',
      },
    ],
    // TER 27/01
    tuesday: [
      {
        id: 301,
        time: '08h30 – 09h00',
        titleKey: 'tueOpeningTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueOpeningDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 302,
        time: '09h00 – 10h00',
        titleKey: 'tueDojoTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueDojoDesc',
        participants: 'Liderança Global e LATAM',
      },
      {
        id: 303,
        time: '10h00 – 10h30',
        titleKey: 'tueFinanceTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueFinanceDesc',
      },
      {
        id: 304,
        time: '10h30 – 10h45',
        titleKey: 'coffeeBreakTitle',
        locationKey: 'locPlenary',
        descriptionKey: 'tueCoffeeBreakDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 305,
        time: '10h45 – 13h00',
        titleKey: 'tueSalesDirectorsPanelTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueSalesDirectorsPanelDesc',
        participants: 'Diretores de Vendas, Liderança',
      },
      {
        id: 306,
        time: '13h00 – 14h00',
        titleKey: 'lunchTitle',
        locationKey: 'locPedraBela',
        descriptionKey: 'tueLunchDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 307,
        time: '14h00 – 14h30',
        titleKey: 'functionalCoatingsTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueFunctionalCoatingsDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 308,
        time: '14h30 – 15h00',
        titleKey: 'tueHRTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueHRDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 309,
        time: '15h00 – 15h30',
        titleKey: 'tueTechPMTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueTechPMDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 310,
        time: '15h30 – 16h00',
        titleKey: 'coffeeBreakTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueCoffeeBreakDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 311,
        time: '16h00 – 16h30',
        titleKey: 'salesExcellenceTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueSalesExcellenceDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 312,
        time: '16h30 – 17h30',
        titleKey: 'tueSegmentMarketingTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueSegmentMarketingDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 313,
        time: '17h30 – 17h40',
        titleKey: 'tueClosingTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'tueClosingDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 314,
        time: '18h30 – 22h00',
        titleKey: 'tueDinnerTitle',
        locationKey: 'locFirehouse',
        descriptionKey: 'tueDinnerDesc',
        participants: 'Todos os participantes',
      },
    ],
    // QUA 28/01
    wednesday: [
      {
        id: 401,
        time: '08h30 – 09h00',
        titleKey: 'wedOpeningTitle',
        locationKey: 'locSaoPaulo',
        descriptionKey: 'wedOpeningDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 402,
        time: '09h00 – 10h30',
        titleKey: 'wedInnovationTitle',
        locationKey: 'locManaus',
        descriptionKey: 'wedInnovationDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 403,
        time: '10h30 – 11h00',
        titleKey: 'coffeeBreakTitle',
        locationKey: 'locManaus',
        descriptionKey: 'wedCoffeeBreakDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 404,
        time: '12h00 – 13h00',
        titleKey: 'wedWrapUpTitle',
        locationKey: 'locPlenary',
        descriptionKey: 'wedWrapUpDesc',
        participants: 'Todos os participantes',
      },
      {
        id: 405,
        time: '14h00 – 17h00',
        titleKey: 'businessReviewMeetingTitle',
        locationKey: 'locChile',
        descriptionKey: 'wedBusinessReviewDesc',
        participants: 'Liderança Global e LATAM',
      },
    ],
  };

  const noticesContainer = document.querySelector('#announcement-list');

  // --- NETWORKING LOGIC ---
  const networkingList = document.querySelector('#networking-list');
  const networkingSearch = document.querySelector('#networking-search');
  const networkingCounter = document.querySelector('#networking-counter');

  let participants = []; // Dynamic list

  function buildUserPhotoUrl(userRow) {
    if (!userRow) return null;
    if (userRow.photo_url) return userRow.photo_url;

    // Optional future-proof field: store only the path in DB and build public URL here.
    // Bucket name from your Supabase Storage: team
    if (userRow.photo_path) {
      const baseUrl = (supabaseConfig && supabaseConfig.url) ? supabaseConfig.url.replace(/\/$/, '') : '';
      if (!baseUrl) return null;
      return `${baseUrl}/storage/v1/object/public/team/${String(userRow.photo_path).replace(/^\//, '')}`;
    }

    return null;
  }

  async function fetchParticipants() {
    if (!networkingList) return;

    // Show skeleton or loading state if desired (omitted for brevity)

    try {
      const client = await getSupabaseClient();

      // Attempt to select columns. If they don't exist, this might error.
      // We select simple cols first. If user hasn't added photo_url/role, this query might fail 
      // if we explicitly ask for them and they don't exist.
      // However, Supabase PostgREST tolerates selecting non-existent columns sometimes? No, it errors 400.

      // SAFE STRATEGY: Select * (all) and map fields manually
      const { data, error } = await client
        .from('users')
        .select('*');

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      // Map DB fields to App structure
      participants = data.map(u => {
        // Handle name combination
        const fullName = [u.name, u.last_name].filter(Boolean).join(' ') || u.email.split('@')[0];

        const city = (u.city || '').trim();
        const countryRaw = (u.country || '').trim();
        const countryKey = normalizeCountryToKey(countryRaw);

        return {
          id: u.id,
          name: fullName,
          role: u.role || 'Participante', // Column not yet in DB, default value
          department: u.department || 'Sherwin-Williams', // Column not yet in DB, default value
          city,
          countryRaw,
          countryKey,
          email: u.email,
          linkedin: '',
          initials: getInitials(fullName),
          photo_url: buildUserPhotoUrl(u)
        };
      });

      // Sort alpha
      participants.sort((a, b) => a.name.localeCompare(b.name));

      renderNetworking(participants);

    } catch (err) {
      console.error('Networking Load Error:', err);
    }
  }

  function getInitials(name) {
    if (!name) return 'SW';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }


  // Helper: Toast Notification
  function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Helper: Title Case
  function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      // Handle prepositions if desired, for now simple capitalize first letter
      if (word.length > 2 || word === 'de' || word === 'da' || word === 'do') return word.charAt(0).toUpperCase() + word.slice(1);
      return word; // e.g. "e"
    }).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function renderNetworking(listData) {
    if (!networkingList) return;
    networkingList.innerHTML = '';

    // Update counter
    if (networkingCounter) {
      networkingCounter.textContent = `${listData.length} ${t('participants') || 'participantes'}`;
    }

    listData.forEach(p => {
      const loc = getParticipantLocation(p);
      const formattedName = toTitleCase(p.name);

      const avatarHtml = p.photo_url
        ? `<img src="${p.photo_url}" alt="Foto de ${formattedName}" loading="lazy" />`
        : `${p.initials}`;

      const card = document.createElement('div');
      card.className = 'participant-card';
      card.innerHTML = `
        <div class="participant-avatar">${avatarHtml}</div>
        <div class="participant-info">
          <h3 class="participant-name">${formattedName}</h3>
          <div class="participant-meta">
            <span class="meta-item">
              <i data-lucide="map-pin"></i> ${loc}
            </span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openModal({
          type: 'profile',
          data: { ...p, name: formattedName, location: loc } // Pass formatted data to modal
        });
      });

      networkingList.appendChild(card);
    });

    refreshIcons();
  }

  // Search Logic
  networkingSearch?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = participants.filter(p =>
      p.name.toLowerCase().includes(term) ||
      getParticipantLocation(p).toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term)
    );
    renderNetworking(filtered);
  });

  // Initial Render
  if (networkingList) {
    // renderNetworking(participants); // Old static way
    fetchParticipants(); // New DB way
  }

  // --- MODAL LOGIC ---
  const modal = document.querySelector('#app-modal');
  const modalTitle = document.querySelector('#modal-title');
  const modalTime = document.querySelector('#modal-time');
  const modalTimeText = document.querySelector('#modal-time-text');
  const modalLoc = document.querySelector('#modal-location');
  const modalLocText = document.querySelector('#modal-location-text');
  const modalDesc = document.querySelector('#modal-description');
  const modalParticipants = document.querySelector('#modal-participants');
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

    // Always reset modal layout/state first.
    // This prevents content from a previous "profile" modal from leaking into
    // a subsequent "session" modal (e.g., Agenda clicks showing a user card).
    if (modalTime) modalTime.style.display = 'block';
    if (modalLoc) modalLoc.style.display = 'block';
    if (modalDesc) modalDesc.style.display = 'block';
    if (modalParticipants) modalParticipants.style.display = 'block';
    const existingProfileContainer = modal.querySelector('#modal-profile-content');
    if (existingProfileContainer) {
      existingProfileContainer.style.display = 'none';
      existingProfileContainer.innerHTML = '';
    }

    // Reset fields
    modalTitle.textContent = data.title || '';
    if (modalTimeText) modalTimeText.textContent = data.time || '';
    if (modalLocText) {
      modalLocText.textContent = '';
      if (data.location) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'modal-meta-label';
        labelSpan.textContent = `${t('labelLocation')}:`;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'modal-meta-value';
        valueSpan.textContent = String(data.location);

        modalLocText.appendChild(labelSpan);
        modalLocText.appendChild(document.createTextNode(' '));
        modalLocText.appendChild(valueSpan);
      }
    }
    modalDesc.textContent = data.description || '';
    if (modalParticipants) {
      modalParticipants.textContent = '';
      if (data.participants) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'modal-meta-label';
        labelSpan.textContent = `${t('labelParticipants')}:`;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'modal-meta-value';
        valueSpan.textContent = String(data.participants);

        modalParticipants.appendChild(labelSpan);
        modalParticipants.appendChild(document.createTextNode(' '));
        modalParticipants.appendChild(valueSpan);
      }
      if (!data.participants) {
        modalParticipants.style.display = 'none';
      }
    }

    if (modalTime && !data.time) modalTime.style.display = 'none';
    if (modalLoc && !data.location) modalLoc.style.display = 'none';
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
    } else if (data.type === 'profile') {
      const p = data.data;

      // Custom Profile Layout in Modal Body overrides info/desc
      // We hide the default info elements and inject custom HTML
      modalTime.style.display = 'none';
      modalLoc.style.display = 'none';
      modalDesc.style.display = 'none';
      if (modalParticipants) modalParticipants.style.display = 'none';

      // Use a custom container inside this modal (scoped) so it doesn't leak
      // across other dialogs/contexts.
      let profileContainer = modal.querySelector('#modal-profile-content');
      if (!profileContainer) {
        profileContainer = document.createElement('div');
        profileContainer.id = 'modal-profile-content';
        modal.querySelector('.modal-body')?.appendChild(profileContainer);
      }
      profileContainer.style.display = 'block';

      // Clear previous content
      const profileAvatarHtml = p.photo_url
        ? `<img src="${p.photo_url}" alt="Foto de ${p.name}" loading="lazy" />`
        : `${p.initials}`;

      profileContainer.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar-large">${profileAvatarHtml}</div>
          <div>
            <h3 class="profile-name">${p.name}</h3>
            <div class="profile-meta">
              <span class="meta-item"><i data-lucide="map-pin"></i> ${p.location}</span>
            </div>
          </div>
        </div>
        
        <div class="contact-info-block">
          <label class="contact-label">Email</label>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="contact-value" style="margin-bottom: 0;">${p.email}</span>
            <button class="copy-btn" id="btn-copy-email" type="button" aria-label="Copiar email" style="background:none; border:none; color:var(--color-primary); cursor:pointer; padding: 4px;">
              <i data-lucide="copy"></i>
            </button>
          </div>
        </div>
      `;

      // Attach copy event listener
      const copyBtn = profileContainer.querySelector('#btn-copy-email');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          copyToClipboard(p.email, e.currentTarget);
        });
      }

      // Update title to be generic or hidden
      modalTitle.textContent = t('profileTitle');

      // Re-trigger icon scan for the new content injected
      setTimeout(refreshIcons, 0);

    } else {
      // Restore defaults for other types
      modalTime.style.display = 'block';
      modalLoc.style.display = 'block';
      modalDesc.style.display = 'block';
      const profileContainer = modal.querySelector('#modal-profile-content');
      if (profileContainer) profileContainer.style.display = 'none';
    }

    modal.showModal();

    // iOS Safari frequentemente foca o primeiro botão (X), deixando-o com aparência de "selecionado".
    // Em telas touch, removemos esse foco automático; em desktop/teclado, mantemos para acessibilidade.
    try {
      if (modalClose && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        requestAnimationFrame(() => modalClose.blur());
      }
    } catch (_) {
      // no-op
    }
  }

  function parseSessionText(rawText) {
    const text = (rawText || '').trim();
    if (!text) return { description: '', participants: '' };

    const participantMarkers = [
      { marker: 'Quem participa:', stopMarkers: ['Obs.:', 'Observação:', 'Observacoes:', 'Observações:'] },
      { marker: 'Who participates:', stopMarkers: ['Obs.:', 'Notes:', 'Note:'] },
      { marker: 'Quién participa:', stopMarkers: ['Obs.:', 'Notas:', 'Nota:'] },
      { marker: 'Quien participa:', stopMarkers: ['Obs.:', 'Notas:', 'Nota:'] },
    ];

    for (const { marker, stopMarkers } of participantMarkers) {
      const idx = text.toLowerCase().indexOf(marker.toLowerCase());
      if (idx === -1) continue;

      const before = text.slice(0, idx).trim();
      const after = text.slice(idx + marker.length).trim();

      // Split "participants" from any trailing notes (e.g. "Obs.: ...")
      let participantsChunk = after;
      let trailing = '';
      let earliestStopIdx = -1;

      for (const stop of stopMarkers) {
        const stopIdx = after.toLowerCase().indexOf(stop.toLowerCase());
        if (stopIdx === -1) continue;
        if (earliestStopIdx === -1 || stopIdx < earliestStopIdx) {
          earliestStopIdx = stopIdx;
        }
      }

      if (earliestStopIdx !== -1) {
        participantsChunk = after.slice(0, earliestStopIdx).trim();
        trailing = after.slice(earliestStopIdx).trim();
      }

      // If participants ends with a sentence terminator, drop it.
      participantsChunk = participantsChunk.replace(/^[\s\-–—:]+/, '').replace(/[\s\.]+$/, '').trim();

      // Remove the participants portion from the description to avoid duplication.
      let description = [before, trailing].filter(Boolean).join(' ').trim();
      if (!description) {
        description = trailing || '';
      }

      return { description, participants: participantsChunk };
    }

    return { description: text, participants: '' };
  }

  // --- RENDER FUNCTIONS ---

  function renderNotices() {
    if (!noticesContainer) return;
    noticesContainer.innerHTML = '';

    importantNotices.forEach((notice, index) => {
      const article = document.createElement('article');
      article.className = 'announcement-card';
      // article.style.cursor = 'pointer'; // Removed clickable indication indicating
      const title = notice.titleKey ? t(notice.titleKey) : '';
      const desc = notice.descKey ? t(notice.descKey) : '';
      const icon = notice.icon || 'bell';

      article.innerHTML = `
        <div class="announcement-header">
          <span class="announcement-icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
          <h3 class="announcement-title">${title}</h3>
        </div>
        <p class="announcement-desc">${desc}</p>
      `;

      // Click event for modal removed
      /*
      article.addEventListener('click', () => {
        openModal({
          type: 'notice',
          title: t(notice.textKey),
          description: t(`notice${index + 1} Desc`) || 'Detalhes adicionais em breve.' // Fallback or map keys
        });
      });
      */

      noticesContainer.appendChild(article);
    });

    refreshIcons();
  }


  function getSessionStatus(timeStr, dayKey) {
    // Status baseado na DATA real do evento, não só no dia da semana.
    // dayKey: 'sunday', 'monday', etc. mapeados para as datas oficiais da convenção.

    const EVENT_YEAR = 2026;
    const EVENT_MONTH_INDEX = 0; // Janeiro = 0 no JS
    const dayOfMonthMap = {
      sunday: 25,   // DOM 25/01
      monday: 26,   // SEG 26/01
      tuesday: 27,  // TER 27/01
      wednesday: 28 // QUA 28/01 (agrupando também a saída de 29/01)
    };

    const dayOfMonth = dayOfMonthMap[dayKey];
    if (!dayOfMonth) return null;

    const now = new Date();

    // Datas normalizadas (sem horas) para comparação de dia
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(EVENT_YEAR, EVENT_MONTH_INDEX, dayOfMonth);

    // Se hoje for depois do dia do evento, tudo desse dia está "concluído"
    if (todayDate > eventDate) {
      return 'finished';
    }

    // Se hoje ainda não chegou nesse dia, não mostra status
    if (todayDate < eventDate) {
      return null;
    }

    // A partir daqui: hoje é exatamente o dia do evento correspondente ao tab.

    // Sessão de dia inteiro
    if (timeStr === 'ALL DAY') {
      return 'now';
    }

    // Parse de horários (aceita "HH:MM - HH:MM", "08h30 – 17h00", etc.)
    const normalizedRange = String(timeStr)
      .replace(/[\u2013\u2014]/g, '-') // en dash/em dash
      .replace(/\s*–\s*/g, '-')
      .trim();

    const parts = normalizedRange.split(/\s*-\s*/).filter(Boolean);
    const [startStr, endStr] = parts;
    if (!startStr) return null;

    const normalizeTime = (str) => {
      // Aceita "9h00" ou "09:00" e converte para números
      const clean = String(str).trim().toLowerCase().replace('h', ':');
      const [h, m] = clean.split(':');
      return [Number(h), Number(m || 0)];
    };

    const [startH, startM] = normalizeTime(startStr);
    const [endH, endM] = endStr ? normalizeTime(endStr) : [startH + 1, startM];

    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const currentMins = now.getHours() * 60 + now.getMinutes();

    // "Finished": horário final já passou hoje
    if (currentMins >= endMins) {
      return 'finished';
    }

    // "Now": dentro da janela da sessão
    if (currentMins >= startMins && currentMins < endMins) {
      return 'now';
    }

    // "Next": começa nas próximas 2 horas (120 min)
    if (startMins > currentMins && (startMins - currentMins) <= 120) {
      return 'next';
    }

    return null;
  }

  const EVENT_YEAR = 2026;
  const EVENT_MONTH_INDEX = 0; // Janeiro = 0 no JS
  const agendaDayOfMonthMap = {
    sunday: 25,
    monday: 26,
    tuesday: 27,
    wednesday: 28,
  };

  function getDefaultAgendaDay() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If we're not in the event month/year, fall back to Monday (legacy default).
    if (today.getFullYear() !== EVENT_YEAR || today.getMonth() !== EVENT_MONTH_INDEX) {
      return 'monday';
    }

    const entries = Object.entries(agendaDayOfMonthMap)
      .map(([dayKey, dayOfMonth]) => ({ dayKey, date: new Date(EVENT_YEAR, EVENT_MONTH_INDEX, dayOfMonth) }))
      .sort((a, b) => a.date - b.date);

    // Exact match
    for (const entry of entries) {
      if (today.getTime() === entry.date.getTime()) return entry.dayKey;
    }

    // Before event: first day; after event: last day
    if (today < entries[0].date) return entries[0].dayKey;
    if (today > entries[entries.length - 1].date) return entries[entries.length - 1].dayKey;

    // During event but not matching a tab day (shouldn't happen): choose closest future day.
    for (const entry of entries) {
      if (today < entry.date) return entry.dayKey;
    }

    return 'monday';
  }

  function setActiveAgendaDay(day) {
    if (!day || !agendaByDay[day]) return;
    activeDay = day;
    dayPills.forEach((p) => {
      const isActive = p.dataset.day === day;
      p.classList.toggle('is-active', isActive);
      p.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    renderSchedule(day);
  }

  function renderSchedule(day) {
    if (!scheduleList) return;
    const sessions = agendaByDay[day] || [];
    scheduleList.innerHTML = '';

    if (sessions.length === 0) {
      scheduleList.innerHTML = `<p class="empty-state">${t('emptySchedule')}</p>`;
      return;
    }

    sessions.forEach((session) => {
      // Logic for status
      const realStatus = getSessionStatus(session.time, day);

      const sessionTitle = session.titleKey ? t(session.titleKey) : (session.title || '');
      const sessionLocation = session.locationKey ? t(session.locationKey) : (session.location || '');
      const sessionDescription = session.descriptionKey
        ? t(session.descriptionKey)
        : (session.description || t(`session${session.id}Desc`) || 'Descrição da atividade indisponível no momento.');

      // Modal content priority:
      // 1) explicit session fields (description/participants)
      // 2) i18n descriptionKey
      // 3) legacy detailed i18n session{ID}Desc (operational script)
      // 4) computed sessionDescription fallback
      const detailedDescKey = `session${session.id}Desc`;
      const detailedDescCandidate = t(detailedDescKey);
      const hasDetailedDesc = detailedDescCandidate && detailedDescCandidate !== detailedDescKey;

      const explicitDescription = session.modalDescriptionKey
        ? t(session.modalDescriptionKey)
        : (session.modalDescription || session.description || '');
      const explicitParticipants = session.participantsKey
        ? t(session.participantsKey)
        : (session.participants || '');

      const rawModalText = explicitDescription
        ? explicitDescription
        : (session.descriptionKey
          ? t(session.descriptionKey)
          : (hasDetailedDesc ? detailedDescCandidate : sessionDescription));

      const parsed = explicitParticipants
        ? { description: rawModalText, participants: explicitParticipants }
        : parseSessionText(rawModalText);

      const metaHtml = sessionLocation
        ? `
        <div class="session-meta">
          <span class="session-meta-icon" aria-hidden="true">
            <i data-lucide="map-pin"></i>
          </span>
          <span>${sessionLocation}</span>
        </div>
      `
        : '';

      const article = document.createElement('article');
      article.className = 'session-card';

      // Apply finished class if needed
      if (realStatus === 'finished') {
        article.classList.add('is-finished');
      }

      const statusHtml = realStatus === 'now'
        ? `<span class="session-status"><span class="session-status-dot"></span>${t('now')}</span>`
        : realStatus === 'next'
          ? `<span class="session-status session-status-next">${t('next')}</span>`
          : ''; // No tag for finished, just styling

      const timeLabel = session.time === 'ALL DAY' ? t('allDay') : session.time;

      article.innerHTML = `
        <div class="session-header">
          <span class="session-time">${timeLabel}</span>
          ${statusHtml}
        </div>
        <h3 class="session-title">${sessionTitle}</h3>
        ${metaHtml}
      `;

      // Re-activate click on Agenda items to show details.
      article.classList.add('is-clickable');
      article.tabIndex = 0;
      article.setAttribute('role', 'button');
      article.setAttribute('aria-label', `${sessionTitle}. ${timeLabel}`);

      const openSession = () => {
        openModal({
          type: 'session',
          title: sessionTitle,
          time: timeLabel,
          location: sessionLocation,
          description: parsed.description || sessionDescription,
          participants: parsed.participants || '',
        });
      };

      article.addEventListener('click', openSession);
      article.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSession();
        }
      });

      scheduleList.appendChild(article);
    });
    refreshIcons(); // Render icons for the new list
  }

  // --- MAP LOGIC ---
  const locationsData = [
    // Coordenadas normalizadas (0-1). Estão aproximadas e podem ser ajustadas.
    { titleKey: 'locWelcome', descKey: 'locWelcomeDesc', icon: 'glass-water', x: 0.18, y: 0.12 },
    { titleKey: 'awardsDinnerTitle', descKey: 'locAwardsDinnerDesc', icon: 'award', x: 0.28, y: 0.22 },
    { titleKey: 'locCheckin', descKey: 'locCheckinDesc', icon: 'user-check', x: 0.68, y: 0.55 },
    { titleKey: 'locRest', descKey: 'locRestDesc', icon: 'utensils', x: 0.30, y: 0.65 },
    { titleKey: 'locLuggage', descKey: 'locLuggageDesc', icon: 'briefcase', x: 0.60, y: 0.76 },
    { titleKey: 'locPlenary', descKey: 'locPlenaryDesc', icon: 'mic-2', x: 0.60, y: 0.83 },
  ];

  // Map Vars
  let mapImage = new Image();
  let mapLoaded = false;
  let scale = 0.4; // 40% padrão
  const BASE_ZOOM = 0.4;
  // Mínimo dinâmico (fit-to-width): o menor zoom é o que faz a imagem preencher a largura
  // do container. Assim o zoom-out sempre volta para a visão "largura total".
  let MIN_ZOOM = 0.4;
  // Permite upscale (útil quando a imagem é menor que o container).
  const MAX_ZOOM = 6.0;
  const ZOOM_STEP = 0.05; // 5%

  const canvas = document.querySelector('#pdf-render');
  const ctx = canvas?.getContext('2d');
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  const zoomIndicator = document.querySelector('.zoom-indicator');

  function computeFitScale() {
    if (!canvasWrapper || !mapImage?.width) return BASE_ZOOM;
    const containerWidth = canvasWrapper.clientWidth;
    if (!containerWidth) return BASE_ZOOM;
    return containerWidth / mapImage.width;
  }

  function updateMinZoom() {
    // Clamp para evitar valores inválidos e respeitar o máximo.
    const fit = computeFitScale();
    MIN_ZOOM = Math.min(MAX_ZOOM, Math.max(0.1, fit));
  }

  function renderMap() {
    if (!ctx || !mapLoaded) return;

    // Set canvas dimensions based on scale
    canvas.width = mapImage.width * scale;
    canvas.height = mapImage.height * scale;

    // Draw image
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    if (zoomIndicator) {
      zoomIndicator.textContent = `${Math.round(scale * 100)}% `;
    }
  }

  function focusLocation(loc) {
    if (!mapLoaded || !canvasWrapper) return;
    // Removed: scale = BASE_ZOOM - maintain current user zoom (or auto-fit)
    // Removed: renderMap() - no need to re-render if scale doesn't change

    // Scroll to center the location
    // loc.x, loc.y are normalized 0-1
    const targetX = loc.x * canvas.width;
    const targetY = loc.y * canvas.height;

    const wrapperW = canvasWrapper.clientWidth;
    const wrapperH = canvasWrapper.clientHeight;

    // Scroll coordinates
    const scrollX = targetX - (wrapperW / 2);
    const scrollY = targetY - (wrapperH / 2);

    canvasWrapper.scrollTo({
      left: scrollX,
      top: scrollY,
      behavior: 'smooth'
    });
  }

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

      // Click to zoom
      card.addEventListener('click', () => {
        focusLocation(loc);

        // Scroll map into view if needed (mobile UX)
        // document.querySelector('.map-viewer-container').scrollIntoView({ behavior: 'smooth' });
      });

      locationsGrid.appendChild(card);
    });
    refreshIcons();
  }

  function loadMapImage() {
    mapImage.src = './assets/mapa-evento.png';
    mapImage.onload = () => {
      mapLoaded = true;

      // Fit-to-width inicial
      updateMinZoom();
      scale = MIN_ZOOM;

      renderMap();

      // Começa mostrando o topo centralizado horizontalmente (se houver sobra) ou alinhado
      if (canvasWrapper) {
        canvasWrapper.scrollTop = 0;
        canvasWrapper.scrollLeft = 0;
      }
    };

    mapImage.onerror = () => {
      console.error("Erro ao carregar imagem do mapa.");
    };
  }

  // Map Controls
  const zoomInBtn = document.querySelector('#zoom-in');
  const zoomOutBtn = document.querySelector('#zoom-out');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      updateMinZoom();
      scale = Math.min(MAX_ZOOM, scale + ZOOM_STEP);
      renderMap();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      updateMinZoom();
      if (scale <= MIN_ZOOM) {
        // Já está no fit-to-width
        return;
      }
      scale = Math.max(MIN_ZOOM, scale - ZOOM_STEP);
      renderMap();

      // Quando volta ao mínimo (fit), alinha o scroll para o começo.
      if (canvasWrapper && Math.abs(scale - MIN_ZOOM) < 0.0001) {
        canvasWrapper.scrollLeft = 0;
      }
    });
  }

  // Se o container mudar (orientação/resize), recalcula o fit e mantém a visão "largura total"
  // quando o usuário estiver no mínimo.
  window.addEventListener('resize', () => {
    if (!mapLoaded) return;
    const prevMin = MIN_ZOOM;
    updateMinZoom();
    const wasAtMin = Math.abs(scale - prevMin) < 0.0001;
    if (wasAtMin) {
      scale = MIN_ZOOM;
      renderMap();
      if (canvasWrapper) canvasWrapper.scrollLeft = 0;
    } else if (scale < MIN_ZOOM) {
      scale = MIN_ZOOM;
      renderMap();
    }
  });

  renderLocations();
  loadMapImage();

  renderNotices();

  let activeDay = getDefaultAgendaDay();
  setActiveAgendaDay(activeDay);

  dayPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const day = pill.dataset.day;
      if (!day || day === activeDay) return;
      setActiveAgendaDay(day);
    });
  });

  // Navegação inferior (Agenda / Mapa / Fotos)
  // --- PHOTOS LOGIC ---
  const GALLERY_BUCKET = 'gallery';
  const GALLERY_DAYS = ['monday', 'tuesday', 'wednesday'];
  const PHOTOS_PAGE_SIZE = 6;
  let photoAutoLoadObserver = null;

  const PHOTOS_CACHE_KEY = 'photos_gallery_index_v1';
  const PHOTOS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min: fast repeat opens, still updates frequently.
  let photosInitialized = false;
  let photosLoadInFlight = null;

  let photosData = [
    // Para ativar as fotos reais, basta apontar as URLs
    // para arquivos estáticos em ./assets/photos
    // Exemplo sugerido de nomes de arquivo:
    //  ./assets/photos/segunda-01.jpg
    //  ./assets/photos/terca-01.jpg
    //  ./assets/photos/quarta-01.jpg
    // Enquanto url for null, a aba exibirá apenas o texto "em breve".
    { id: 1, day: 'monday', url: null },
    { id: 2, day: 'monday', url: null },
    { id: 3, day: 'monday', url: null },
    { id: 4, day: 'tuesday', url: null },
    { id: 5, day: 'tuesday', url: null },
    { id: 6, day: 'wednesday', url: null },
    { id: 7, day: 'wednesday', url: null },
  ];

  function buildGalleryPublicUrl(storagePath) {
    if (!storagePath) return null;
    const baseUrl = (supabaseConfig && supabaseConfig.url) ? supabaseConfig.url.replace(/\/$/, '') : '';
    if (!baseUrl) return null;
    const cleanPath = String(storagePath).replace(/^\//, '');
    const encodedPath = cleanPath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${baseUrl}/storage/v1/object/public/${GALLERY_BUCKET}/${encodedPath}`;
  }

  function buildGalleryThumbUrl(storagePath, { width = 600, height = 600, quality = 60 } = {}) {
    // Supabase Storage Image Transformations endpoint.
    // Ref: /storage/v1/render/image/public/<bucket>/<path>?width=..&height=..&resize=cover&quality=..
    // If the project doesn't have image transformations enabled, the request may 404;
    // we fall back to the full URL on <img> error.
    if (!storagePath) return null;
    const baseUrl = (supabaseConfig && supabaseConfig.url) ? supabaseConfig.url.replace(/\/$/, '') : '';
    if (!baseUrl) return null;
    const cleanPath = String(storagePath).replace(/^\//, '');
    const encodedPath = cleanPath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      resize: 'cover',
      quality: String(quality),
    });
    return `${baseUrl}/storage/v1/render/image/public/${GALLERY_BUCKET}/${encodedPath}?${params.toString()}`;
  }

  function getPhotosCache() {
    try {
      const raw = localStorage.getItem(PHOTOS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.data)) return null;
      if (typeof parsed.savedAt !== 'number') return null;
      if ((Date.now() - parsed.savedAt) > PHOTOS_CACHE_TTL_MS) return null;
      const sanitized = parsed.data
        .filter((p) => p && typeof p === 'object')
        .map((p) => ({
          id: Number(p.id) || 0,
          day: p.day,
          url: p.url,
          thumb_url: p.thumb_url,
          filename: p.filename,
          storage_path: p.storage_path,
          share_url: p.share_url || null,
          og_url: p.og_url || null,
        }))
        .filter((p) => !!p.url && !!p.day);
      return sanitized.length ? sanitized : null;
    } catch (_) {
      return null;
    }
  }

  function setPhotosCache(list) {
    try {
      if (!Array.isArray(list) || list.length === 0) return;
      localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        data: list,
      }));
    } catch (_) {
      // no-op (quota / private mode)
    }
  }

  function getPhotosSignature(list) {
    if (!Array.isArray(list) || list.length === 0) return '0';
    const first = list[0]?.storage_path || list[0]?.url || '';
    const last = list[list.length - 1]?.storage_path || list[list.length - 1]?.url || '';
    return `${list.length}:${first}:${last}`;
  }

  async function tryLoadPhotosFromStorage() {
    const photosGrid = document.querySelector('#photos-grid');
    if (!photosGrid) return false;

    try {
      const client = await getSupabaseClient();
      const storage = client.storage.from(GALLERY_BUCKET);

      const pageSize = 100;
      const listDay = async (day) => {
        const dayPhotos = [];
        let offset = 0;
        while (true) {
          const { data, error } = await storage.list(day, {
            limit: pageSize,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          });

          if (error) {
            console.error(`Error listing storage folder ${day}:`, error);
            return null;
          }

          const items = Array.isArray(data) ? data : [];

          const imageItems = items.filter((it) => {
            const name = String(it?.name || '');
            if (!name) return false;
            const lower = name.toLowerCase();
            return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.avif');
          });

          for (const it of imageItems) {
            const name = String(it.name);
            const storage_path = `${day}/${name}`;
            dayPhotos.push({
              day,
              storage_path,
              filename: name,
              url: buildGalleryPublicUrl(storage_path),
              thumb_url: buildGalleryThumbUrl(storage_path),
            });
          }

          if (items.length < pageSize) break;
          offset += pageSize;

          // Yield to the UI between pages.
          await new Promise((r) => setTimeout(r, 0));
        }
        return dayPhotos;
      };

      const perDay = await Promise.all(GALLERY_DAYS.map((d) => listDay(d)));
      if (perDay.some((d) => d === null)) return false;
      const allPhotos = perDay.flat();

      if (allPhotos.length === 0) return false;

      // Assign numeric IDs for existing download/share code paths.
      let nextId = 1;
      const nextPhotosData = allPhotos.map((p) => ({
        id: nextId++,
        day: p.day,
        url: p.url,
        thumb_url: p.thumb_url,
        filename: p.filename,
        storage_path: p.storage_path,
        share_url: null,
        og_url: null,
      }));

      const prevSig = getPhotosSignature(getPhotosWithUrl('all'));
      const nextSig = getPhotosSignature(nextPhotosData);
      photosData = nextPhotosData;
      setPhotosCache(nextPhotosData);

      if (prevSig !== nextSig) {
        renderPhotos(document.querySelector('.photo-tabs .day-pill.is-active')?.dataset?.photoDay || 'all');
      }
      return true;
    } catch (err) {
      console.error('Photos Storage Load Error:', err);
      return false;
    }
  }

  function getPhotosWithUrl(filterDay) {
    const filtered = filterDay === 'all'
      ? photosData
      : photosData.filter((p) => p.day === filterDay);
    return filtered.filter((p) => !!p.url);
  }

  function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';

    const wrapper = document.createElement('div');
    wrapper.className = 'photo-image-wrapper';

    const img = document.createElement('img');
    img.className = 'photo-image';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.setAttribute('fetchpriority', 'low');
    img.setAttribute('draggable', 'false');
    img.dataset.loaded = '0';
    img.src = photo.thumb_url || photo.url;
    img.alt = '';
    img.addEventListener('load', () => {
      img.dataset.loaded = '1';
      img.classList.add('is-loaded');
    }, { once: true });
    img.onerror = () => {
      // Fallback: if thumb endpoint isn't available, show the original.
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = '1';
      img.src = photo.url;
    };

    wrapper.appendChild(img);
    card.appendChild(wrapper);
    return card;
  }

  function ensurePhotosInitialized() {
    if (photosInitialized) return;
    photosInitialized = true;

    // Render fast from cache (if any), then refresh from storage in the background.
    const activeDay = document.querySelector('.photo-tabs .day-pill.is-active')?.dataset?.photoDay || 'all';
    const cached = getPhotosCache();
    if (cached && cached.length) {
      photosData = cached;
    }
    renderPhotos(activeDay);

    if (!photosLoadInFlight) {
      photosLoadInFlight = tryLoadPhotosFromStorage().finally(() => {
        photosLoadInFlight = null;
      });
    }
  }

  function removeExistingLoadMore(photosGrid) {
    photosGrid.querySelectorAll('[data-photos-load-more="true"]').forEach((el) => el.remove());
  }

  function appendLoadMoreButton({ photosGrid, filterDay, nextOffset, total }) {
    if (!photosGrid) return;
    removeExistingLoadMore(photosGrid);

    if (nextOffset >= total) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photos-load-more';
    btn.dataset.photosLoadMore = 'true';
    btn.dataset.photoDay = filterDay;
    btn.dataset.offset = String(nextOffset);
    btn.textContent = t('photosLoadMore') || 'Carregar mais';

    btn.addEventListener('click', () => {
      const day = btn.dataset.photoDay || 'all';
      const offset = Number(btn.dataset.offset || 0);
      const list = getPhotosWithUrl(day);

      const next = list.slice(offset, offset + PHOTOS_PAGE_SIZE);
      next.forEach((photo) => {
        // Keep the button as the last element: insert new cards before it.
        photosGrid.insertBefore(createPhotoCard(photo), btn);
      });

      const newOffset = offset + next.length;
      btn.dataset.offset = String(newOffset);

      if (newOffset >= list.length) {
        btn.remove();
      }
    });

    photosGrid.appendChild(btn);

    // Optional: auto-load when the button enters the viewport (infinite scroll feel).
    // Keeps the button for manual use as well.
    try {
      if ('IntersectionObserver' in window) {
        if (!photoAutoLoadObserver) {
          photoAutoLoadObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
              const targetBtn = entry.target;
              // Trigger only once per visibility cycle (enter viewport -> click -> wait until it leaves).
              if (!entry.isIntersecting) {
                targetBtn.dataset.autoLoadedOnce = '0';
                continue;
              }
              if (targetBtn.dataset.autoLoadedOnce === '1') continue;
              targetBtn.dataset.autoLoadedOnce = '1';
              targetBtn.click();
            }
          }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });
        }
        photoAutoLoadObserver.observe(btn);
      }
    } catch (_) {
      // no-op
    }
  }

  function renderPhotos(filterDay = 'all') {
    const photosGrid = document.querySelector('#photos-grid');
    if (!photosGrid) return;
    photosGrid.innerHTML = '';

    // Se não houver nenhuma foto cadastrada (url preenchida) para o filtro atual,
    // exibir mensagem "em breve" usando o texto de i18n.
    const photosWithUrl = getPhotosWithUrl(filterDay);

    if (photosWithUrl.length === 0) {
      photosGrid.innerHTML = `<p class="empty-state" style="grid-column: 1/-1;">${t('photosPlaceholder')}</p>`;
      return;
    }

    const saveHint = document.createElement('p');
    saveHint.className = 'photos-save-hint';
    saveHint.style.gridColumn = '1 / -1';

    const saveHintIcon = document.createElement('span');
    saveHintIcon.className = 'photos-save-hint__icon';
    saveHintIcon.innerHTML = '<i data-lucide="lightbulb"></i>';

    const saveHintText = document.createElement('span');
    saveHintText.className = 'photos-save-hint__text';
    saveHintText.textContent = t('photosSaveHint');

    saveHint.appendChild(saveHintIcon);
    saveHint.appendChild(saveHintText);
    photosGrid.appendChild(saveHint);

    const initial = photosWithUrl.slice(0, PHOTOS_PAGE_SIZE);
    initial.forEach((photo) => {
      photosGrid.appendChild(createPhotoCard(photo));
    });

    appendLoadMoreButton({
      photosGrid,
      filterDay,
      nextOffset: initial.length,
      total: photosWithUrl.length,
    });

    refreshIcons();
  }

  const photoTabs = document.querySelectorAll('.photo-tabs .day-pill');
  if (photoTabs.length > 0) {
    photoTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        ensurePhotosInitialized();
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
    fotos: { titleKey: 'photosTitle', subtitleKey: 'photosSubtitle' },
    networking: { titleKey: 'networkingTitle', subtitleKey: 'homeDate' }
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

      if (target === 'fotos') {
        ensurePhotosInitialized();
      }

      // Se mudou para o mapa, recalcula o zoom para preencher a largura
      // Precisamos de um pequeno delay ou requestAnimationFrame para que o "display: flex" tenha efeito no DOM
      if (target === 'mapa' && mapLoaded && canvasWrapper && mapImage) {
        requestAnimationFrame(() => {
          const w = canvasWrapper.clientWidth;
          if (w > 0) {
            scale = w / mapImage.width;
            // Garante que não fique minúsculo, mas respeita a largura
            if (scale < 0.1) scale = 0.4;
            renderMap();
          }
        });
      }

      // Update Header
      updateHeader(target);

      // Always keep Agenda focused on "today" when entering that tab.
      if (target === 'agenda') {
        setActiveAgendaDay(getDefaultAgendaDay());
      }
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

async function copyToClipboard(text, triggerBtn = null) {
  let success = false;

  // 1. Tentar API moderna (navigator.clipboard) se estiver em contexto seguro
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (err) {
      console.error('Clipboard API falhou, tentando fallback...', err);
    }
  }

  // 2. Fallback robusto se a API falhou
  if (!success) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Invisível mas selecionável
    textArea.style.position = "fixed";
    textArea.style.left = "0";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    textArea.style.zIndex = "-1";
    textArea.contentEditable = true;
    textArea.readOnly = false;

    document.body.appendChild(textArea);

    try {
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        // Seleção especial para iOS
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }

      success = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback execCommand falhou', err);
    } finally {
      document.body.removeChild(textArea);
      window.getSelection()?.removeAllRanges();
    }
  }

  // 3. Feedback Visual (Toast + Button Animation)
  if (success) {
    showToast('Email copiado!');

    if (triggerBtn) {
      const originalHTML = triggerBtn.innerHTML;
      // Change to check icon
      triggerBtn.innerHTML = `<i data-lucide="check"></i>`;
      triggerBtn.classList.add('success');

      // Re-render icon on this button
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons({
          root: triggerBtn
        });
      }

      setTimeout(() => {
        triggerBtn.classList.remove('success');
        triggerBtn.innerHTML = originalHTML;
        // Re-render original icon
        if (window.lucide && window.lucide.createIcons) {
          window.lucide.createIcons({
            root: triggerBtn
          });
        }
      }, 2000);
    }
  } else {
    showToast('Erro ao copiar. Selecione manualmente.');
  }
}

