import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

// As variáveis VITE_* são públicas no navegador. Proteja os dados com as regras do Firebase.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
auth.languageCode = 'pt-BR';
const form = document.querySelector('#auth-form');
const status = document.querySelector('#auth-status');
const session = document.querySelector('#auth-session');
const headerAccount = document.querySelector('[data-account-open]');
const authDialog = document.querySelector('#account-dialog');
const firebaseError = {
  'auth/invalid-email': 'Informe um endereço de e-mail válido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/weak-password': 'A senha deve ter pelo menos 8 caracteres.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
  'auth/admin-restricted-operation': 'O cadastro por e-mail está desativado. Ative E-mail/senha em Authentication → Sign-in method no Firebase.',
  'auth/configuration-not-found': 'A configuração do Firebase Authentication está incompleta. Confira o provedor E-mail/senha no console.',
  'auth/app-not-authorized': 'Este domínio ainda não está autorizado no Firebase Authentication.',
  'auth/operation-not-allowed': 'Ative E-mail/senha em Authentication → Sign-in method no Firebase.',
  'auth/unauthorized-domain': 'Adicione vi-sunset-stories.epiccow8.chatgpt.site em Authentication → Settings → Authorized domains no Firebase.',
  'auth/too-many-requests': 'O limite de tentativas foi atingido. Aguarde alguns minutos antes de solicitar novamente.',
  'auth/network-request-failed': 'A conexão foi interrompida. Verifique sua internet e tente novamente.',
  'auth/invalid-api-key': 'A configuração do Firebase não foi aceita. Confira o app Web e a chave de API no console.'
};
const verificationError = {
  'auth/too-many-requests': 'O limite de reenvios foi atingido. Aguarde alguns minutos antes de solicitar outro e-mail.',
  'auth/network-request-failed': 'O envio foi interrompido por uma falha de conexão. Verifique sua internet e tente novamente.',
  'auth/user-token-expired': 'Sua sessão expirou. Entre novamente para solicitar um novo link.',
  'auth/requires-recent-login': 'Entre novamente para solicitar um novo link de confirmação.',
  'auth/invalid-continue-uri': 'O link de retorno não está configurado corretamente no Firebase Authentication.',
  'auth/unauthorized-continue-uri': 'Este domínio não está autorizado para links de confirmação. Revise os domínios autorizados no Firebase Authentication.',
  'auth/invalid-email': 'O endereço de e-mail da conta é inválido. Atualize seus dados antes de solicitar outro link.',
  'auth/user-disabled': 'Esta conta está desativada. Entre em contato com o administrador do projeto.'
};

function verificationMessage(error) {
  return verificationError[error?.code]
    || 'O envio do e-mail não foi concluído. Tente novamente mais tarde.';
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function setBusy(busy, label = '') {
  const button = document.querySelector('.auth-submit');
  button.disabled = busy;
  if (busy) button.textContent = label;
  else {
    const mode = form.dataset.authMode;
    button.textContent = mode === 'forgot' ? 'ENVIAR LINK DE RECUPERAÇÃO' : 'CONTINUAR ↗';
  }
}

function renderUser(user) {
  const signedIn = Boolean(user);
  form.hidden = signedIn;
  session.hidden = !signedIn;
  document.querySelector('.auth-preview').hidden = signedIn;
  document.querySelector('.auth-tabs').hidden = signedIn || form.dataset.authMode === 'forgot';
  document.querySelector('.forgot-link').hidden = signedIn || form.dataset.authMode === 'forgot';
  document.querySelector('.back-login').hidden = signedIn || form.dataset.authMode !== 'forgot';
  document.querySelector('#security-signed-out').hidden = signedIn;
  document.querySelector('#security-controls').hidden = !signedIn;
  if (signedIn) {
    document.querySelector('#session-name').textContent = user.displayName || 'Viajante de Leonida';
    document.querySelector('#session-email').textContent = user.email || '';
    document.querySelector('#session-verification').textContent = user.emailVerified
      ? 'E-mail confirmado. Sua conta está pronta.'
      : 'Enviamos um link de confirmação para seu e-mail.';
    document.querySelector('#resend-verification').hidden = user.emailVerified;
    headerAccount.textContent = 'ÁREA DO MEMBRO ↗';
  } else {
    headerAccount.textContent = 'ACESSAR ↗';
  }
}

window.sunsetAuth = { render: () => renderUser(auth.currentUser) };
document.querySelector('.auth-submit').disabled = false;
onAuthStateChanged(auth, async user => {
  if (user) {
    try { await reload(user); } catch { /* Mantém a sessão visível se a atualização falhar sem conexão. */ }
  }
  const activeUser = auth.currentUser || user;
  renderUser(activeUser);
  syncCloudData(activeUser);
});

const appDataReady = new Promise(resolve => {
  if (window.sunsetData) resolve();
  else window.addEventListener('sunset-data-ready', resolve, { once: true });
});
const localCloudUserKey = 'sunset-cloud-user';
let cloudUid = null;
let cloudEpoch = 0;
let cloudWriteTimer;
let cloudUnsubscribe = null;
const blankUserData = { profile: { name: '', avatar: 'none' }, favorites: [], preferences: { contrast: false, largeText: false, motion: false } };

function cloudDocument(uid) { return doc(db, 'users', uid); }
function setCloudStatus(message, kind = 'info') { window.sunsetData?.setCloudStatus(message, kind); }
function firestoreStatus(error) {
  if (error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied') {
    return 'A conta entrou, mas falta publicar as regras do Firestore. Abra Ajustes → Seus dados para ver o próximo passo.';
  }
  return 'Não foi possível sincronizar agora. Seus dados continuam salvos neste dispositivo.';
}

async function syncCloudData(user) {
  const epoch = ++cloudEpoch;
  clearTimeout(cloudWriteTimer);
  cloudUnsubscribe?.();
  cloudUnsubscribe = null;
  cloudUid = null;
  if (!user) {
    setCloudStatus('Entre na conta para sincronizar perfil, preferências e coleção entre dispositivos.');
    return;
  }
  await appDataReady;
  if (epoch !== cloudEpoch || !window.sunsetData) return;
  try {
    let previousUid = '';
    try { previousUid = localStorage.getItem(localCloudUserKey) || ''; } catch { /* O armazenamento local pode estar indisponível. */ }
    if (previousUid && previousUid !== user.uid) window.sunsetData.apply(blankUserData);

    const reference = cloudDocument(user.uid);
    const snapshot = await getDoc(reference);
    if (epoch !== cloudEpoch) return;
    if (snapshot.exists()) {
      window.sunsetData.apply(snapshot.data());
      setCloudStatus('Perfil, preferências e coleção sincronizados com sua conta.', 'ready');
    } else {
      await setDoc(reference, { ...window.sunsetData.getState(), updatedAt: serverTimestamp() });
      if (epoch !== cloudEpoch) return;
      setCloudStatus('Seus dados deste dispositivo foram vinculados à conta.', 'ready');
    }
    try { localStorage.setItem(localCloudUserKey, user.uid); } catch { /* A sincronização na nuvem continua disponível nesta sessão. */ }
    cloudUid = user.uid;
    cloudUnsubscribe = onSnapshot(reference, remoteSnapshot => {
      if (epoch !== cloudEpoch || !remoteSnapshot.exists() || remoteSnapshot.metadata.hasPendingWrites) return;
      window.sunsetData.apply(remoteSnapshot.data());
      setCloudStatus('Perfil, preferências e coleção sincronizados com sua conta.', 'ready');
    }, error => {
      if (epoch !== cloudEpoch) return;
      console.warn('Sunset Stories live sync is unavailable.', error);
      setCloudStatus(firestoreStatus(error), 'error');
    });
  } catch (error) {
    if (epoch !== cloudEpoch) return;
    console.warn('Sunset Stories cloud sync is unavailable.', error);
    setCloudStatus(firestoreStatus(error), 'error');
  }
}

window.addEventListener('sunset-data-change', event => {
  if (!cloudUid) return;
  const uid = cloudUid;
  const epoch = cloudEpoch;
  clearTimeout(cloudWriteTimer);
  cloudWriteTimer = setTimeout(async () => {
    try {
      const reference = cloudDocument(uid);
      if (event.detail?.clear) {
        await deleteDoc(reference);
        setCloudStatus('Dados apagados da sua conta e deste dispositivo.', 'ready');
      } else {
        await setDoc(reference, { ...window.sunsetData.getState(), updatedAt: serverTimestamp() });
        if (epoch === cloudEpoch && uid === cloudUid) setCloudStatus('Alterações sincronizadas com sua conta.', 'ready');
      }
    } catch (error) {
      console.warn('Could not save Sunset Stories user data.', error);
      setCloudStatus(firestoreStatus(error), 'error');
    }
  }, 300);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const values = new FormData(form);
  const email = String(values.get('email') || '').trim();
  const password = String(values.get('password') || '');
  const mode = form.dataset.authMode;
  const displayName = String(values.get('displayName') || '').trim();
  showStatus('');

  if (mode === 'register' && password !== values.get('confirmPassword')) {
    showStatus('As senhas não coincidem.', true);
    return;
  }
  if (mode === 'register' && displayName.length < 2) {
    showStatus('Escolha um apelido com pelo menos 2 caracteres.', true);
    return;
  }

  setBusy(true, mode === 'forgot' ? 'ENVIANDO…' : 'CONECTANDO…');
  try {
    if (mode === 'register') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      let profileUpdated = true;
      try { await updateProfile(result.user, { displayName }); }
      catch { profileUpdated = false; }
      let verificationFailure = null;
      try {
        await sendEmailVerification(result.user, { url: window.location.origin });
      } catch (error) {
        verificationFailure = error;
      }
      renderUser(result.user);
      showStatus(!profileUpdated
        ? 'Conta criada. O apelido não foi atualizado; você pode alterá-lo nas configurações do perfil.'
        : verificationFailure
          ? `Conta criada. ${verificationMessage(verificationFailure)} Use a opção “Reenviar e-mail de confirmação” quando estiver disponível.`
          : 'Conta criada. Acesse seu e-mail para confirmar o endereço.');
      window.dispatchEvent(new CustomEvent('sunset-auth-event', { detail: { name: 'sign_up' } }));
      if (!verificationFailure) window.location.assign('/obrigado.html');
    } else if (mode === 'login') {
      await signInWithEmailAndPassword(auth, email, password);
      authDialog.close();
      document.querySelector('#toast').textContent = 'Você entrou no Sunset Stories.';
      document.querySelector('#toast').classList.add('show');
      setTimeout(() => document.querySelector('#toast').classList.remove('show'), 3200);
      window.dispatchEvent(new CustomEvent('sunset-auth-event', { detail: { name: 'login' } }));
    } else {
      await sendPasswordResetEmail(auth, email, { url: window.location.origin });
      showStatus('Se esse endereço estiver cadastrado, você receberá instruções para recuperar o acesso.');
      window.dispatchEvent(new CustomEvent('sunset-auth-event', { detail: { name: 'password_reset' } }));
    }
  } catch (error) {
    console.warn('Firebase Authentication request failed:', error?.code || 'unknown');
    showStatus(firebaseError[error.code] || 'Não foi possível concluir a solicitação. Revise os dados e tente novamente.', true);
  } finally {
    setBusy(false);
  }
});

document.querySelector('#auth-signout').addEventListener('click', async () => {
  try {
    await signOut(auth);
    authDialog.close();
    document.querySelector('#toast').textContent = 'Você saiu da sua conta.';
    document.querySelector('#toast').classList.add('show');
    setTimeout(() => document.querySelector('#toast').classList.remove('show'), 3200);
  } catch (error) {
    showStatus(firebaseError[error?.code] || 'Não foi possível encerrar a sessão neste momento. Tente novamente.', true);
  }
});

document.querySelector('#resend-verification').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, { url: window.location.origin });
      showStatus('Enviamos outro link de confirmação para seu e-mail.');
    }
  } catch (error) {
    console.warn('Email verification request failed:', error?.code || 'unknown');
    showStatus(verificationMessage(error), true);
  } finally {
    button.disabled = false;
  }
});

const securityStatus = document.querySelector('#account-security-status');
function showSecurityStatus(message, isError = false) {
  securityStatus.textContent = message;
  securityStatus.classList.toggle('error', isError);
}
function securityErrorMessage(error) {
  if (['auth/wrong-password', 'auth/invalid-credential'].includes(error?.code)) return 'A senha atual não confere.';
  if (error?.code === 'auth/weak-password') return 'A nova senha precisa ter pelo menos 8 caracteres.';
  if (error?.code === 'auth/requires-recent-login' || error?.code === 'auth/user-token-expired') return 'Sua sessão expirou. Entre novamente e repita a operação.';
  if (error?.code === 'auth/too-many-requests') return 'O limite de tentativas foi atingido. Aguarde alguns minutos e tente novamente.';
  if (error?.code === 'auth/network-request-failed') return 'A conexão foi interrompida. Verifique sua internet e tente novamente.';
  if (error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied') return 'O Firebase não autorizou a remoção dos dados da conta. Revise as regras do Firestore.';
  return `Não foi possível concluir esta operação.${error?.code ? ` Código: ${error.code}.` : ''}`;
}
async function verifyCurrentPassword(user, password) {
  if (!user?.email) throw new Error('A conta atual não possui um endereço de e-mail para autenticação.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

document.querySelector('#change-password').addEventListener('click', async event => {
  const button = event.currentTarget;
  const user = auth.currentUser;
  const currentPassword = document.querySelector('#security-current').value;
  const newPassword = document.querySelector('#security-new').value;
  const confirmPassword = document.querySelector('#security-confirm').value;
  showSecurityStatus('');
  if (!user) return showSecurityStatus('Entre na sua conta para alterar a senha.', true);
  if (!currentPassword || !newPassword || !confirmPassword) return showSecurityStatus('Preencha os três campos de senha.', true);
  if (newPassword.length < 8) return showSecurityStatus('A nova senha precisa ter pelo menos 8 caracteres.', true);
  if (newPassword !== confirmPassword) return showSecurityStatus('A nova senha e a confirmação não coincidem.', true);
  if (currentPassword === newPassword) return showSecurityStatus('Escolha uma senha diferente da atual.', true);
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = 'ATUALIZANDO…';
  try {
    await verifyCurrentPassword(user, currentPassword);
    await updatePassword(user, newPassword);
    document.querySelector('#security-current').value = '';
    document.querySelector('#security-new').value = '';
    document.querySelector('#security-confirm').value = '';
    showSecurityStatus('Senha atualizada. Use a nova senha no próximo acesso.');
  } catch (error) {
    console.warn('Password update failed:', error?.code || 'unknown');
    showSecurityStatus(securityErrorMessage(error), true);
  } finally {
    button.disabled = false;
    button.innerHTML = 'ATUALIZAR SENHA <span>↗</span>';
  }
});

document.querySelector('#delete-account').addEventListener('click', async event => {
  const button = event.currentTarget;
  const user = auth.currentUser;
  const currentPassword = document.querySelector('#security-current').value;
  showSecurityStatus('');
  if (!user) return showSecurityStatus('Entre na sua conta para excluir o cadastro.', true);
  if (!currentPassword) return showSecurityStatus('Informe sua senha atual para confirmar a exclusão.', true);
  if (!window.confirm('Excluir sua conta permanentemente? O perfil, os favoritos e as preferências sincronizados também serão removidos.')) return;
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = 'EXCLUINDO…';
  let dataDeleted = false;
  try {
    await verifyCurrentPassword(user, currentPassword);
    clearTimeout(cloudWriteTimer);
    cloudUnsubscribe?.();
    cloudUnsubscribe = null;
    cloudUid = null;
    await deleteDoc(cloudDocument(user.uid));
    dataDeleted = true;
    await deleteUser(user);
    window.sunsetData?.reset();
    document.querySelector('#security-current').value = '';
    document.querySelector('#security-new').value = '';
    document.querySelector('#security-confirm').value = '';
    showSecurityStatus('Conta e dados sincronizados excluídos.');
  } catch (error) {
    console.warn('Account deletion failed:', error?.code || 'unknown');
    if (!dataDeleted && auth.currentUser?.uid === user.uid) syncCloudData(user);
    showSecurityStatus(dataDeleted
      ? `Os dados sincronizados foram removidos, mas a exclusão da conta não foi concluída. ${securityErrorMessage(error)}`
      : securityErrorMessage(error), true);
  } finally {
    button.disabled = false;
    button.textContent = 'EXCLUIR CONTA E DADOS';
  }
});

let analyticsSdk;
let analyticsInstance;
async function updateAnalyticsConsent(choice) {
  if (choice === 'granted') {
    try {
      analyticsSdk ||= await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js');
      if (!(await analyticsSdk.isSupported())) return;
      analyticsInstance ||= analyticsSdk.getAnalytics(app);
      analyticsSdk.setConsent({
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    } catch (error) {
      console.warn('Firebase Analytics is unavailable in this browser.', error);
    }
  } else if (analyticsSdk && analyticsInstance) {
    analyticsSdk.setConsent({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
}

window.addEventListener('sunset-analytics-consent', event => updateAnalyticsConsent(event.detail.choice));
window.addEventListener('sunset-auth-event', event => {
  if (analyticsSdk && analyticsInstance) analyticsSdk.logEvent(analyticsInstance, event.detail.name);
});
try {
  if (localStorage.getItem('sunset-analytics-consent') === 'granted') updateAnalyticsConsent('granted');
} catch { /* Mantém o Analytics desligado se o consentimento local não puder ser lido. */ }

// O Firestore fornece conteúdo público; o texto estático é usado como alternativa
// quando não há uma publicação ou quando a pessoa está sem conexão.
const cmsSections = ['gallery', 'faqs', 'home', 'trailer', 'settings'];
window.sunsetCms = {
  listen(callback) {
    return cmsSections.map(section => onSnapshot(doc(db, 'siteContent', section), snapshot => {
      if (snapshot.exists() && snapshot.data().published === true) {
        callback(section, snapshot.data());
        window.dispatchEvent(new CustomEvent('sunset-cms-section', { detail: { section, data: snapshot.data() } }));
      }
    }, error => console.info(`Sunset Stories content section ${section} is using its static copy.`, error?.code || 'unavailable')));
  }
};
window.dispatchEvent(new Event('sunset-cms-ready'));
