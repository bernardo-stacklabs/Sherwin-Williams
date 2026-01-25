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
import { i18n } from './locales.js';

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

    // Re-render Networking if it exists (using current search term if any)
    if (typeof renderNetworking === 'function' && typeof participants !== 'undefined') {
      const searchInput = document.querySelector('#networking-search');
      const term = searchInput ? searchInput.value.toLowerCase() : '';
      const filtered = term
        ? participants.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term) ||
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
    { id: 1, textKey: 'notice1' },
    { id: 2, textKey: 'notice2' },
    { id: 3, textKey: 'notice3' },
  ];

  const agendaByDay = {
    // SEG 26/01
    // Calendário de segunda (staff / produção) conforme planilha
    monday: [
      {
        id: 201,
        time: '08:20 - 08:30',
        title: 'Mestre de Cerimônia',
        location: 'Chile e Peru',
        description: 'O que acontece: Chamada (10 min antes) para Regional Aligment Meeting. Quem participa: MC.',
      },
      {
        id: 202,
        time: '08:30 - 19:00',
        title: 'Regional Aligment Meeting',
        location: 'Chile e Peru',
        description: 'O que acontece: Recepcionar na executiva, apresentar sala, pontos energia, controles, tv/painel etc; alguém para orientar receptivo. Quem participa: Latam Marketing Team, Latam Product Managament, R&D and Sales Directors.',
      },
      {
        id: 203,
        time: '19:00 - 19:10',
        title: 'Mestre de Cerimônia',
        location: 'Chile e Peru',
        description: 'O que acontece: Encerramento de Regional Aligment Meeting + chamada para Coffe Break. Quem participa: MC.',
      },
      {
        id: 204,
        time: '10:30 - 11:00',
        title: 'Coffe Break',
        location: 'Hall Chile e Peru',
        description: 'O que acontece: Diretoria da sala executiva.',
      },
      {
        id: 205,
        time: '11:00 - 11:10',
        title: 'Mestre de Cerimônia',
        location: 'Chile e Peru',
        description: 'O que acontece: Encerramento de Coffe Break + chamada para Almoço. Quem participa: MC.',
      },
      {
        id: 206,
        time: '12:00 - 13:00',
        title: 'Almoço',
        location: 'Pedra Bela',
        description: 'O que acontece: Almoço Staff.',
      },
      {
        id: 207,
        time: '13:00 - 14:00',
        title: 'Ensaio MC',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Ensaio completo com a Vanessa (mín. 2 vezes). Quem participa: MC/Produção.',
      },
      {
        id: 208,
        time: '14:00 - 15:00',
        title: 'Ensaio Líderes Globais',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Ensaiar cerimônia de entrada dos líderes globais (produção e MC acompanha). Quem participa: MC/Produção/Liderança.',
      },
      {
        id: 209,
        time: '15:30 - 16:00',
        title: 'Coffe Break Executivos',
        location: 'Hall Chile e Peru',
        description: 'O que acontece: Diretoria da sala executiva.',
      },
      {
        id: 210,
        time: '16:00 - 16:10',
        title: 'Mestre de Cerimônia',
        location: 'Hall Chile e Peru',
        description: 'O que acontece: Encerramento de Coffe Break Executivos + chamada para Welcome Drink. Quem participa: MC.',
      },
      {
        id: 211,
        time: '18:30 - 22:00',
        title: 'Welcome Drink',
        location: 'Hall do Cosmo',
        description: 'O que acontece: Reception for integration and welcoming of event participants. Quem participa: Everyone. Obs.: dinâmica e roteiro / abertura / boas-vindas / falas ainda não definidas.',
      },
      {
        id: 212,
        time: '22:00 - 22:10',
        title: 'Mestre de Cerimônia',
        location: 'Hall do Cosmo',
        description: 'O que acontece: Encerramento do dia. Quem participa: MC.',
      },
    ],
    // TER 27/01
    tuesday: [
      {
        id: 301,
        time: '08:20 - 08:30',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Chamada (10 min antes) para Abertura Open Meeting. Quem participa: MC.',
      },
      {
        id: 302,
        time: '08:30 - 08:32',
        title: 'Abertura Open Meeting',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Apagam-se as luzes da plenária. Quem participa: Produção | AV.',
      },
      {
        id: 303,
        time: '08:32 - 08:35',
        title: 'Abertura Open Meeting',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Execução do vídeo de abertura FORGE AHEAD. Quem participa: AV | Produção.',
      },
      {
        id: 304,
        time: '08:35 - 08:38',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Abertura Open Meeting + chamada para Abertura Open Meeting. Quem participa: MC.',
      },
      {
        id: 305,
        time: '08:38 - 08:45',
        title: 'Abertura Open Meeting',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: MC apresenta contexto do evento e chama líderes globais. Quem participa: MC | Público.',
      },
      {
        id: 306,
        time: '08:45 - 09:00',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Abertura Open Meeting + chamada para Global Perspective and Expectation. Quem participa: MC.',
      },
      {
        id: 307,
        time: '09:00 - 10:00',
        title: 'Global Perspective and Expectation',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Entrada dos líderes globais no palco | conteúdo inicial em inglês com tradução ativa. Quem participa: Joe / Rebecca / Marcelo / Mike / Matt / Michelle / Steve / Paul / Allen.',
      },
      {
        id: 308,
        time: '10:00 - 10:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Global Perspective and Expectation + chamada para Finance Overview. Quem participa: MC.',
      },
      {
        id: 309,
        time: '10:00 - 10:30',
        title: 'Finance Overview',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: 3 top priorities per segment.',
      },
      {
        id: 310,
        time: '10:30 - 10:35',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Finance Overview + chamada para Coffe Break. Quem participa: MC.',
      },
      {
        id: 311,
        time: '10:30 - 11:00',
        title: 'Coffe Break',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Liberar público + checar reposição do coffee.',
      },
      {
        id: 312,
        time: '11:00 - 11:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Coffe Break + chamada para Leadership - Sales Director Pannel. Quem participa: MC.',
      },
      {
        id: 313,
        time: '11:00 - 13:00',
        title: 'Leadership - Sales Director Pannel',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Operação de sessão (tempo, microfone, slides, transições). Quem participa: Enrique Goycochea / Fernando Tuñas / Patricio Chacon / Carlos Ruiz / Diretor Brazil / Dani Silva - Marcelo Amaral.',
      },
      {
        id: 314,
        time: '13:00 - 13:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Leadership - Sales Director Pannel + chamada para Lunch. Quem participa: MC.',
      },
      {
        id: 315,
        time: '13:00 - 14:00',
        title: 'Lunch',
        location: 'Pedra Bela',
        description: 'O que acontece: Transição para alimentação + controle de tempo.',
      },
      {
        id: 316,
        time: '14:00 - 14:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Lunch + chamada para Fuctional Coatings. Quem participa: MC.',
      },
      {
        id: 317,
        time: '14:00 - 14:30',
        title: 'Fuctional Coatings',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Painéis globais, finanças e liderança. Quem participa: Mizael Palacios / Marcia Oliveira.',
      },
      {
        id: 318,
        time: '14:30 - 14:35',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Fuctional Coatings + chamada para HR. Quem participa: MC.',
      },
      {
        id: 319,
        time: '14:30 - 15:00',
        title: 'HR',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Coffee + networking. Quem participa: Daniela Macko.',
      },
      {
        id: 320,
        time: '15:00 - 15:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de HR + chamada para Technical and Product Management Overview. Quem participa: MC.',
      },
      {
        id: 321,
        time: '15:00 - 15:30',
        title: 'Technical and Product Management Overview',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Foto e vídeo (espontâneas e posadas).',
      },
      {
        id: 322,
        time: '15:30 - 15:35',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Technical and Product Management Overview + chamada para Coffee Break. Quem participa: MC.',
      },
      {
        id: 323,
        time: '15:30 - 16:00',
        title: 'Coffee Break',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Liberar público + checar reposição do coffee.',
      },
      {
        id: 324,
        time: '16:00 - 16:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Coffee Break + chamada para Sales Excellence. Quem participa: MC.',
      },
      {
        id: 325,
        time: '16:00 - 16:30',
        title: 'Sales Excellence',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Segmentos, excelência comercial e marcom. Quem participa: Carlos Olivera.',
      },
      {
        id: 326,
        time: '16:30 - 16:35',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Sales Excellence + chamada para Market Segment Strategy / Marcom. Quem participa: MC.',
      },
      {
        id: 327,
        time: '16:30 - 17:30',
        title: 'Market Segment Strategy / Marcom',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Foto e vídeo contínuos (plenária e intervalos). Quem participa: Dani Silva / Lorena Uribe / Pedro Piñedo / Mauro Di Fraia / Marcel Picheli.',
      },
      {
        id: 328,
        time: '17:30 - 17:31',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Market Segment Strategy / Marcom + chamada para Closing of the day and outlook for the next day. Quem participa: MC.',
      },
      {
        id: 329,
        time: '17:30 - 17:40',
        title: 'Closing of the day and outlook for the next day.',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Fotos no espaço instagramável. Quem participa: Marcel Picheli / Dani Silva.',
      },
      {
        id: 330,
        time: '17:40 - 17:45',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento do Closing + chamada para Break - Preparação Cerimônia. Quem participa: MC.',
      },
      {
        id: 331,
        time: '17:40 - 18:00',
        title: 'Break - Preparação Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Transição para quartos + preparação para o dinner.',
      },
    ],
    // QUA 28/01
    wednesday: [
      {
        id: 401,
        time: '08:20 - 08:30',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Chamada (10 min antes) para Open Meeting. Quem participa: MC.',
      },
      {
        id: 402,
        time: '08:30 - 08:40',
        title: 'Open Meeting',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Overview do dia anterior. Quem participa: Marcelo Amaral / Dani Silva / Marcel Picheli.',
      },
      {
        id: 403,
        time: '08:40 - 09:00',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Open Meeting + chamada para Innovation Session. Quem participa: MC.',
      },
      {
        id: 404,
        time: '09:00 - 10:30',
        title: 'Innovation Session',
        location: 'Manaus',
        description: 'O que acontece: Rodadas 10 min + transição 5 min (timer manda). Quem participa: Todos.',
      },
      {
        id: 405,
        time: '10:30 - 10:35',
        title: 'Mestre de Cerimônia',
        location: 'Manaus',
        description: 'O que acontece: Encerramento de Innovation Session + chamada para Break. Quem participa: MC.',
      },
      {
        id: 406,
        time: '10:30 - 11:00',
        title: 'Break',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerrar e direcionar público ao coffee. Quem participa: Todos.',
      },
      {
        id: 407,
        time: '11:00 - 11:30',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Break + chamada para Final Game (Gamification). Quem participa: MC.',
      },
      {
        id: 408,
        time: '11:30 - 12:00',
        title: 'Final Game (Gamification)',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: MC conduz quiz (Mentimeter) + premiação. Quem participa: Todos.',
      },
      {
        id: 409,
        time: '12:00 - 12:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Final Game + chamada para Wrap Up and Final Message. Quem participa: MC.',
      },
      {
        id: 410,
        time: '12:00 - 13:00',
        title: 'Wrap Up and Final Message',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento oficial + vídeo. Quem participa: Leadership + Todos.',
      },
      {
        id: 411,
        time: '13:00 - 13:05',
        title: 'Mestre de Cerimônia',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: Encerramento de Wrap Up + chamada para LATAM Team - Check Out - Departures. Quem participa: MC.',
      },
      {
        id: 412,
        time: '13:00 - 13:30',
        title: 'LATAM Team - Check Out - Departures',
        location: 'Plenária – Sala São Paulo',
        description: 'O que acontece: MC finaliza dinâmica e orienta checkout. Quem participa: Everyone, exceto a leadership team (Business Review).',
      },
      {
        id: 413,
        time: '13:00 - 14:00',
        title: 'Lunch',
        location: 'Pedra Bela',
        description: 'O que acontece: Direcionar para almoço. Quem participa: Todos.',
      },
      {
        id: 414,
        time: '14:00 - 14:05',
        title: 'Mestre de Cerimônia',
        location: 'Chile e Peru',
        description: 'O que acontece: Encerramento de Lunch + chamada para Business Review Meeting. Quem participa: MC.',
      },
      {
        id: 415,
        time: '14:00 - 17:00',
        title: 'Business Review Meeting',
        location: 'Chile e Peru',
        description: 'O que acontece: Reunião executiva. Quem participa: Joe Laehu / Matt Burnett / Steve Howington / Allen Farris / Rebecca Dolton / Paul Mccory / Marcelo Amaral / Lizbeth Santana / Daniele Silva / Enrique Goycochea / Patricio Chacon / Fernando Tuñas.',
      },
      {
        id: 416,
        time: '18:30',
        title: 'Jantar de Premiação',
        location: '',
        description: 'Pendente: times e dinâmicas.',
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

        // Handle location combination
        const locArgs = [u.city, u.country].filter(Boolean);
        const locationStr = locArgs.length > 0 ? locArgs.join(', ') : 'LATAM';

        return {
          id: u.id,
          name: fullName,
          role: u.role || 'Participante', // Column not yet in DB, default value
          department: u.department || 'Sherwin-Williams', // Column not yet in DB, default value
          location: locationStr,
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
      // Use translation for location if available, otherwise raw
      const loc = t(p.location) || p.location;
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
      p.location.toLowerCase().includes(term) ||
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

    // Always reset modal layout/state first.
    // This prevents content from a previous "profile" modal from leaking into
    // a subsequent "session" modal (e.g., Agenda clicks showing a user card).
    if (modalTime) modalTime.style.display = 'block';
    if (modalLoc) modalLoc.style.display = 'block';
    if (modalDesc) modalDesc.style.display = 'block';
    const existingProfileContainer = modal.querySelector('#modal-profile-content');
    if (existingProfileContainer) {
      existingProfileContainer.style.display = 'none';
      existingProfileContainer.innerHTML = '';
    }

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
    } else if (data.type === 'profile') {
      const p = data.data;

      // Custom Profile Layout in Modal Body overrides info/desc
      // We hide the default info elements and inject custom HTML
      modalTime.style.display = 'none';
      modalLoc.style.display = 'none';
      modalDesc.style.display = 'none';

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
      modalTitle.textContent = 'Perfil';

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

  // --- RENDER FUNCTIONS ---

  function renderNotices() {
    if (!noticesContainer) return;
    noticesContainer.innerHTML = '';

    // Limit to 2 items
    importantNotices.slice(0, 2).forEach((notice, index) => {
      const article = document.createElement('article');
      article.className = 'announcement-card';
      // article.style.cursor = 'pointer'; // Removed clickable indication indicating
      article.innerHTML = `<p>${t(notice.textKey)}</p>`;

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

      const sessionTitle = session.titleKey ? t(session.titleKey) : (session.title || '');
      const sessionLocation = session.locationKey ? t(session.locationKey) : (session.location || '');
      const sessionDescription = session.descriptionKey
        ? t(session.descriptionKey)
        : (session.description || t(`session${session.id} Desc`) || 'Descrição da atividade indisponível no momento.');

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
        <h3 class="session-title">${sessionTitle}</h3>
        <div class="session-meta">
          <span class="session-meta-icon" aria-hidden="true">
            <i data-lucide="map-pin"></i>
          </span>
          <span>${sessionLocation}</span>
        </div>
      `;

      // Click event for modal
      article.addEventListener('click', () => {
        openModal({
          type: 'session',
          title: sessionTitle,
          time: session.time,
          location: sessionLocation,
          description: sessionDescription,
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

      // Fit Width Logic
      if (canvasWrapper) {
        // Calculate scale to fit the wrapper width
        // We subtract a small buffer (e.g. 1px) to avoid rounding pixel scroll issues
        const containerWidth = canvasWrapper.clientWidth;

        if (containerWidth > 0) {
          scale = containerWidth / mapImage.width;
        } else {
          // Fallback if hidden
          scale = BASE_ZOOM;
        }

        // Update MIN_ZOOM constraint logic if needed would go here
      } else {
        scale = BASE_ZOOM;
      }

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

  let activeDay = document.querySelector('.day-tabs:not(.photo-tabs) .day-pill.is-active')?.dataset?.day || 'monday';
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
  const GALLERY_BUCKET = 'gallery';
  const GALLERY_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday'];

  let photosData = [
    // Para ativar as fotos reais, basta apontar as URLs
    // para arquivos estáticos em ./assets/photos
    // Exemplo sugerido de nomes de arquivo:
    //  ./assets/photos/domingo-01.jpg
    //  ./assets/photos/segunda-01.jpg
    //  ./assets/photos/terca-01.jpg
    //  ./assets/photos/quarta-01.jpg
    // Enquanto url for null, a aba exibirá apenas o texto "em breve".
    { id: 1, day: 'sunday', url: './assets/photos/template.png' },
    { id: 2, day: 'sunday', url: null },
    { id: 3, day: 'monday', url: null },
    { id: 4, day: 'monday', url: null },
    { id: 5, day: 'monday', url: null },
    { id: 6, day: 'tuesday', url: null },
    { id: 7, day: 'tuesday', url: null },
    { id: 8, day: 'wednesday', url: null },
    { id: 9, day: 'wednesday', url: null },
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

  async function tryLoadPhotosFromStorage() {
    const photosGrid = document.querySelector('#photos-grid');
    if (!photosGrid) return false;

    try {
      const client = await getSupabaseClient();
      const storage = client.storage.from(GALLERY_BUCKET);

      const pageSize = 100;
      const allPhotos = [];

      for (const day of GALLERY_DAYS) {
        let offset = 0;
        while (true) {
          const { data, error } = await storage.list(day, {
            limit: pageSize,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          });

          if (error) {
            console.error(`Error listing storage folder ${day}:`, error);
            return false;
          }

          const items = Array.isArray(data) ? data : [];

          // Filter to common image types; ignore placeholder/folders.
          const imageItems = items.filter((it) => {
            const name = String(it?.name || '');
            if (!name) return false;
            const lower = name.toLowerCase();
            return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
          });

          for (const it of imageItems) {
            const name = String(it.name);
            const storage_path = `${day}/${name}`;
            allPhotos.push({
              day,
              storage_path,
              filename: name,
              url: buildGalleryPublicUrl(storage_path),
            });
          }

          if (items.length < pageSize) break;
          offset += pageSize;
        }
      }

      if (allPhotos.length === 0) return false;

      // Assign numeric IDs for existing download/share code paths.
      let nextId = 1;
      photosData = allPhotos.map((p) => ({
        id: nextId++,
        day: p.day,
        url: p.url,
        filename: p.filename,
        storage_path: p.storage_path,
        share_url: null,
        og_url: null,
      }));

      renderPhotos(document.querySelector('.photo-tabs .day-pill.is-active')?.dataset?.photoDay || 'all');
      return true;
    } catch (err) {
      console.error('Photos Storage Load Error:', err);
      return false;
    }
  }

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

    const saveHint = document.createElement('p');
    saveHint.className = 'photos-save-hint';
    saveHint.style.gridColumn = '1 / -1';
    saveHint.textContent = t('photosSaveHint');
    photosGrid.appendChild(saveHint);

    photosWithUrl.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      // Quando houver URL, usamos a foto real como background do card
      card.innerHTML = `
        <div class="photo-image-wrapper">
          <img src="${photo.url}" alt="Foto ${photo.id}" class="photo-image" loading="lazy" />
        </div>
      `;

      photosGrid.appendChild(card);
    });
    refreshIcons();
  }

  const photoTabs = document.querySelectorAll('.photo-tabs .day-pill');
  if (photoTabs.length > 0) {
    // Initial Render
    renderPhotos('all');

    // Storage-only mode: photos appear automatically when uploaded into the correct day folder.
    // If listing fails (policy / permissions), the UI will keep showing the placeholder.
    tryLoadPhotosFromStorage();

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

