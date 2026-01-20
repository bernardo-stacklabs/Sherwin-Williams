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
    // DOM 25/01 - chegada liderança
    sunday: [
      {
        id: 1,
        time: 'ALL DAY',
        titleKey: 'session1Title',
        locationKey: 'locTbd',
        status: null,
      },
    ],
    // SEG 26/01
    monday: [
      {
        id: 2,
        time: '09:00 - 19:00',
        titleKey: 'session2Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 3,
        time: '08:30 - 17:00',
        titleKey: 'session3Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 4,
        time: '08:30 - 09:00',
        titleKey: 'session4Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 5,
        time: '09:00 - 10:00',
        titleKey: 'session5Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 6,
        time: '10:00 - 10:30',
        titleKey: 'session6Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 7,
        time: '10:30 - 11:30',
        titleKey: 'session7Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 8,
        time: '11:30 - 12:30',
        titleKey: 'session8Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 9,
        time: '12:30 - 13:30',
        titleKey: 'session9Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 10,
        time: '13:30 - 14:00',
        titleKey: 'session10Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 11,
        time: '14:00 - 14:30',
        titleKey: 'session11Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 12,
        time: '14:30 - 15:00',
        titleKey: 'session12Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 13,
        time: '15:00 - 15:30',
        titleKey: 'session13Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 14,
        time: '15:30 - 16:00',
        titleKey: 'session14Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 15,
        time: '16:00 - 17:00',
        titleKey: 'session15Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 16,
        time: '20:00 - 22:00',
        titleKey: 'session16Title',
        locationKey: 'locTbd',
        status: null,
      },
    ],
    // TER 27/01
    tuesday: [
      {
        id: 17,
        time: '08:30 - 09:00',
        titleKey: 'session17Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 18,
        time: '09:00 - 10:00',
        titleKey: 'session18Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 19,
        time: '10:00 - 10:30',
        titleKey: 'session19Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 20,
        time: '10:30 - 11:30',
        titleKey: 'session20Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 21,
        time: '11:30 - 13:00',
        titleKey: 'session21Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 22,
        time: '13:00 - 14:00',
        titleKey: 'session22Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 23,
        time: '14:00 - 14:30',
        titleKey: 'session23Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 24,
        time: '14:30 - 15:00',
        titleKey: 'session24Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 25,
        time: '15:00 - 15:30',
        titleKey: 'session25Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 26,
        time: '15:30 - 16:00',
        titleKey: 'session26Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 27,
        time: '16:00 - 16:30',
        titleKey: 'session27Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 28,
        time: '16:30 - 17:30',
        titleKey: 'session28Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 29,
        time: '17:30 - 17:40',
        titleKey: 'session29Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 30,
        time: '18:30 - 22:00',
        titleKey: 'session30Title',
        locationKey: 'locTbd',
        status: null,
      },
    ],
    // QUA 28/01 (e saída em 29/01 agrupada aqui)
    wednesday: [
      {
        id: 31,
        time: '08:30 - 09:00',
        titleKey: 'session31Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 32,
        time: '09:00 - 10:30',
        titleKey: 'session32Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 33,
        time: '10:30 - 11:00',
        titleKey: 'session33Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 34,
        time: '11:30 - 12:00',
        titleKey: 'session34Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 35,
        time: '12:00 - 13:00',
        titleKey: 'session35Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 36,
        time: '13:00 - 14:00',
        titleKey: 'session36Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 37,
        time: '13:00 - 14:00',
        titleKey: 'session37Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 38,
        time: '14:00 - 17:00',
        titleKey: 'session38Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 39,
        time: '17:30 - 19:00',
        titleKey: 'session39Title',
        locationKey: 'locTbd',
        status: null,
      },
      {
        id: 40,
        time: 'ALL DAY',
        titleKey: 'session40Title',
        locationKey: 'locTbd',
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

    // Parse de horários "HH:MM - HH:MM"
    const [startStr, endStr] = timeStr.split(' - ');
    if (!startStr) return null;

    const normalizeTime = (str) => {
      // Aceita "9h00" ou "09:00" e converte para números
      const clean = str.replace('h', ':');
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
    // Parte superior do mapa (Plenária / Restaurante)
    { titleKey: 'locPlenary', descKey: 'locPlenaryDesc', icon: 'mic-2', x: 0, y: 0 },
    { titleKey: 'locRest', descKey: 'locRestDesc', icon: 'utensils', x: 0, y: 0 },
    // Parte central/abaixo (Check-in / Guarda-volumes / Chegada / Welcome Drink)
    { titleKey: 'locCheckin', descKey: 'locCheckinDesc', icon: 'user-check', x: 1, y: 0.50 },
    { titleKey: 'locLuggage', descKey: 'locLuggageDesc', icon: 'briefcase', x: 1, y: 0.70 },
    { titleKey: 'locArrival', descKey: 'locArrivalDesc', icon: 'map-pin', x: 1, y: 0.65 },
    { titleKey: 'locWelcome', descKey: 'locWelcomeDesc', icon: 'glass-water', x: 1, y: 0.70 },
  ];

  // Map Vars
  let mapImage = new Image();
  let mapLoaded = false;
  let scale = 0.4; // 40% padrão
  const BASE_ZOOM = 0.4;
  const MIN_ZOOM = 0.4; // mínimo 40%
  const MAX_ZOOM = 1.0; // não ultrapassar 100%
  const ZOOM_STEP = 0.05; // 5%

  const canvas = document.querySelector('#pdf-render');
  const ctx = canvas?.getContext('2d');
  const canvasWrapper = document.querySelector('.canvas-wrapper');
  const zoomIndicator = document.querySelector('.zoom-indicator');

  function renderMap() {
    if (!ctx || !mapLoaded) return;

    // Set canvas dimensions based on scale
    canvas.width = mapImage.width * scale;
    canvas.height = mapImage.height * scale;

    // Draw image
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    if (zoomIndicator) {
      zoomIndicator.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  function focusLocation(loc) {
    if (!mapLoaded || !canvasWrapper) return;
    // Sempre usar 40% ao focar qualquer local
    scale = BASE_ZOOM;
    renderMap();

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

      // Zoom inicial fixo em 40%, respeitando limites
      scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, BASE_ZOOM));
      renderMap();

      // Começa mostrando o topo centralizado horizontalmente
      if (canvasWrapper) {
        canvasWrapper.scrollTop = 0;
        canvasWrapper.scrollLeft = (canvas.width - canvasWrapper.clientWidth) / 2;
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
      scale = Math.min(MAX_ZOOM, scale + ZOOM_STEP);
      renderMap();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (scale <= MIN_ZOOM) return;
      scale = Math.max(MIN_ZOOM, scale - ZOOM_STEP);
      renderMap();
    });
  }

  renderLocations();
  loadMapImage();

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
    // Para ativar as fotos reais, basta apontar as URLs
    // para arquivos estáticos em ./assets/photos
    // Exemplo sugerido de nomes de arquivo:
    //  ./assets/photos/domingo-01.jpg
    //  ./assets/photos/segunda-01.jpg
    //  ./assets/photos/terca-01.jpg
    //  ./assets/photos/quarta-01.jpg
    // Enquanto url for null, a aba exibirá apenas o texto "em breve".
    { id: 1, day: 'sunday', url: null },   // ./assets/photos/domingo-01.jpg
    { id: 2, day: 'sunday', url: null },   // ./assets/photos/domingo-02.jpg
    { id: 3, day: 'monday', url: null },   // ./assets/photos/segunda-01.jpg
    { id: 4, day: 'monday', url: null },   // ./assets/photos/segunda-02.jpg
    { id: 5, day: 'monday', url: null },   // ./assets/photos/segunda-03.jpg
    { id: 6, day: 'tuesday', url: null },  // ./assets/photos/terca-01.jpg
    { id: 7, day: 'tuesday', url: null },  // ./assets/photos/terca-02.jpg
    { id: 8, day: 'wednesday', url: null },// ./assets/photos/quarta-01.jpg
    { id: 9, day: 'wednesday', url: null },// ./assets/photos/quarta-02.jpg
  ];

  function renderPhotos(filterDay = 'all') {
    const photosGrid = document.querySelector('#photos-grid');
    if (!photosGrid) return;
    photosGrid.innerHTML = '';

    const filtered = filterDay === 'all'
      ? photosData
      : photosData.filter(p => p.day === filterDay);

    // Se não houver nenhuma foto cadastrada (url preenchida) para o filtro atual,
    // exibir mensagem "em breve" usando o texto de i18n.
    const photosWithUrl = filtered.filter(p => !!p.url);

    if (photosWithUrl.length === 0) {
      photosGrid.innerHTML = `<p class="empty-state" style="grid-column: 1/-1;">${t('photosPlaceholder')}</p>`;
      return;
    }

    photosWithUrl.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      // Quando houver URL, usamos a foto real como background do card
      card.innerHTML = `
        <div class="photo-image-wrapper">
          <img src="${photo.url}" alt="Foto ${photo.id}" class="photo-image" loading="lazy" />
        </div>
        <button type="button" class="photo-download-btn" aria-label="${t('download')}">
          <i data-lucide="download"></i>
        </button>
      `;

      // Download da foto real
      const btn = card.querySelector('.photo-download-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = photo.url;
        // Sugere um nome de arquivo simples baseado no id
        link.download = `photo-${photo.id}`;
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
