// Catálogo de cenas e textos alternativos usados na galeria.
let cenas=[
{
  id:1, title:'Good vibes', category:'sunset', alt:'Ilustração de uma mulher à beira da piscina em tons rosa e lilás'
},
{
  id:2, title:'Two against the world', category:'sunset', alt:'Lucia e Jason usando bandanas diante de um posto ao pôr do sol'
},
{
  id:3, title:'O universo em cores', category:'sunset', alt:'Colagem ilustrada com personagens, veículos e o título Grand Theft Auto VI'
},
{
  id:4, title:'Nas ruas', category:'action', alt:'Lucia com uma bolsa rosa e roxa diante de uma loja'
},
{
  id:5, title:'Lucia / luz e atitude', category:'action', alt:'Lucia sentada em uma academia iluminada pelo sol'
},
{
  id:6, title:'Tudo ou nada', category:'action', alt:'Uma dupla com equipamentos táticos diante de um cofre'
},
{
  id:7, title:'After hours', category:'action', alt:'Dois personagens diante de um carro em chamas em um galpão'
},
{
  id:8, title:'Jason / sob pressão', category:'action', alt:'Jason atrás de uma cerca sob luzes vermelhas e azuis'
},
{
  id:9, title:'Um verão sem fim', category:'sunset', alt:'Casal sentado junto a um carro clássico entre palmeiras'
},
{
  id:10, title:'O último raio de sol', category:'sunset', alt:'Casal junto a um carro ao pôr do sol com uma cidade e palmeiras ao fundo'
},
{
  id:11, title:'Entre sol e sombra', category:'sunset', alt:'Casal relaxando em cadeiras de vime diante de uma fonte em uma praça tropical'
},
{
  id:12, title:'A noite é jovem', category:'action', alt:'Mulher com uma taça em uma festa noturna sob as luzes da cidade'
}]
;
let personagensPorCena= {
  1:['lucia'], 2:['lucia', 'jason'], 3:['lucia', 'jason'], 4:['lucia'], 5:['lucia'], 6:['lucia', 'jason'], 7:['lucia', 'jason'], 8:['jason'], 9:['lucia', 'jason'], 10:['lucia', 'jason'], 11:['lucia', 'jason'], 12:['lucia']
};
const gradeGaleria=document.querySelector('#gallery-grid'), modalCena=document.querySelector('#lightbox');
let categoriaSelecionada='all', indiceCena=0, focoDeRetorno;
function caminhoDaImagem(id, miniatura=false) {
  const scene=cenas.find(item=>Number(item.id)===Number(id));
  const custom=miniatura?scene?.thumbnail:scene?.image;
  if(typeof custom==='string') {
    if(/^assets\/[a-z0-9/_-]+\.(?:webp|png|jpe?g|avif)$/i.test(custom))return custom;
    try {
      const url=new URL(custom,location.origin);
      if(url.origin===location.origin||url.protocol==='https:'&&url.hostname==='res.cloudinary.com')return url.href;
    } catch {}
  }
  return `assets/${miniatura?'thumb':'scene'}-${String(id).padStart(2,'0')}.webp`
}
const chaveFavoritos='sunset-favorites';
let favoritos=new Set();
try {
  favoritos=new Set(JSON.parse(localStorage.getItem(chaveFavoritos)||'[]').filter(id=>cenas.some(s=>s.id===id)))
}
catch {
}
const toast=document.querySelector('#toast');
let toastTimer;
function mostrarAviso(message) {
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'), 3200)
}
function baixarImagem(id) {
  const scene=cenas.find(item=>item.id===Number(id));
  if(!scene)return;
  const link=document.createElement('a');
  const origem=caminhoDaImagem(scene.id);
  link.href=origem.includes('res.cloudinary.com')?origem.replace('/upload/','/upload/fl_attachment/'):origem;
  link.download=`sunset-stories-${scene.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.webp`;
  document.body.append(link);
  link.click();
  link.remove();
  mostrarAviso(`Imagem baixada: ${scene.title}.`)
}
function notificarSincronizacao() {
  window.dispatchEvent(new CustomEvent('sunset-data-change', {
    detail: {
      state:window.sunsetData?.getState?.()
    }
  })
  )
}
function sincronizarFavoritos() {
  document.querySelector('#favorite-count').textContent=favoritos.size;
  const settingsCount=document.querySelector('#settings-favorite-count');
  if(settingsCount)settingsCount.textContent=favoritos.size;
  document.querySelectorAll('.favorite-toggle').forEach(b=> {
    const on=favoritos.has(Number(b.dataset.favorite));b.setAttribute('aria-pressed', String(on));b.setAttribute('aria-label', on?'Remover das favoritas':'Salvar nas favoritas');b.innerHTML=on?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>'
  })
  ;
  try {
    localStorage.setItem(chaveFavoritos, JSON.stringify([...favoritos]))
  }
  catch {
  };
  atualizarFiltros()
}
let filtroPersonagem='all', termoBusca='', ordemGaleria='curated';
function renderizarCenas() {
  gradeGaleria.replaceChildren();
  cenas.filter(scene=>scene.published!==false).forEach((scene, index)=> {
    const article=document.createElement('article');article.style.setProperty('--ordem', index);article.className='gallery-item';article.dataset.category=scene.category;article.dataset.sceneId=scene.id;const open=document.createElement('button');open.className='gallery-open';open.setAttribute('aria-label', `Ampliar: ${scene.title}`);const img=new Image();img.src=caminhoDaImagem(scene.id, true);img.alt=scene.alt;img.loading='lazy';img.width=720;img.height=405;open.append(img);const span=document.createElement('span');span.textContent=scene.title.toUpperCase();const arrow=document.createElement('b');arrow.textContent='↗';span.append(arrow);open.append(span);open.addEventListener('click', ()=>abrirCena(scene.id, open));const favorite=document.createElement('button');favorite.type='button';favorite.className='favorite-toggle';favorite.dataset.favorite=scene.id;favorite.setAttribute('aria-pressed', 'false');favorite.setAttribute('aria-label', 'Salvar nas favoritas');favorite.addEventListener('click', ()=> {
      const adding=!favoritos.has(scene.id);adding?favoritos.add(scene.id):favoritos.delete(scene.id);sincronizarFavoritos();notificarSincronizacao();mostrarAviso(adding?'Salvo na coleção.':'Removido da coleção.')
    })
    ;const download=document.createElement('button');download.type='button';download.className='download-card';download.setAttribute('aria-label', `Baixar imagem: ${scene.title}`);download.title='Baixar imagem';download.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3"/></svg><span>BAIXAR</span>';download.addEventListener('click', ()=>baixarImagem(scene.id));article.append(open, favorite, download);gradeGaleria.append(article)
  })
  ;
  const total=document.querySelector('[data-filter="all"] sup');
  if(total)total.textContent=cenas.filter(scene=>scene.published!==false).length
}
renderizarCenas();
function cenasFiltradas() {
  let list=cenas.filter(s=>(categoriaSelecionada==='favorites'?favoritos.has(s.id):categoriaSelecionada==='all'||s.category===categoriaSelecionada)&& (filtroPersonagem==='all'||(filtroPersonagem==='duo'?(personagensPorCena[s.id]||[]).length===2:(personagensPorCena[s.id]||[]).includes(filtroPersonagem))) && (!termoBusca||`${s.title} ${s.alt} ${s.category} ${(personagensPorCena[s.id]||[]).join(' ')}`.toLocaleLowerCase('pt-BR').includes(termoBusca)));
  if(ordemGaleria==='az')list.sort((a, b)=>a.title.localeCompare(b.title, 'pt-BR'));
  if(ordemGaleria==='za')list.sort((a, b)=>b.title.localeCompare(a.title, 'pt-BR'));
  return list
}
function mostrarCena() {
  const list=cenasFiltradas(), s=list[indiceCena];
  const img=document.querySelector('#lightbox-image');
  img.src=caminhoDaImagem(s.id);
  img.alt=s.alt;
  document.querySelector('#scene-title').textContent=s.title;
  document.querySelector('#scene-count').textContent=`${String(indiceCena+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')} — ${s.category.toUpperCase()}`;
  document.querySelector('#download-scene').dataset.sceneId=s.id
}
function abrirCena(id, trigger) {
  if(!cenasFiltradas().some(s=>s.id===id)) {
    categoriaSelecionada='all';
    termoBusca='';
    filtroPersonagem='all';
    ordemGaleria='curated';
    const q=document.querySelector('#gallery-search');
    if(q)q.value='';
    const cf=document.querySelector('#character-filter');
    if(cf)cf.value='all';
    const sf=document.querySelector('#gallery-sort');
    if(sf)sf.value='curated';
    atualizarFiltros()
  }
  indiceCena=cenasFiltradas().findIndex(s=>s.id===id);
  focoDeRetorno=trigger;
  mostrarCena();
  modalCena.showModal();
  document.body.style.overflow='hidden';
  window.lenis?.stop()
}
function navegarCena(n) {
  indiceCena=(indiceCena+n+cenasFiltradas().length)%cenasFiltradas().length;
  mostrarCena()
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click', ()=>abrirCena(Number(b.dataset.scene), b)));
document.querySelector('#prev').onclick=()=>navegarCena(-1);
document.querySelector('#next').onclick=()=>navegarCena(1);
document.querySelector('#close-lightbox').onclick=()=>modalCena.close();
modalCena.addEventListener('close', ()=> {
  document.body.style.overflow='';window.lenis?.start();focoDeRetorno?.focus()
})
;
modalCena.addEventListener('click', e=> {
  if(e.target===modalCena) {
    const r=modalCena.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modalCena.close()
  }
})
;
modalCena.addEventListener('keydown', e=> {
  if(e.key==='ArrowRight')navegarCena(1);if(e.key==='ArrowLeft')navegarCena(-1)
})
;
document.querySelector('#download-scene').addEventListener('click', ()=>baixarImagem(document.querySelector('#download-scene').dataset.sceneId));
function atualizarFiltros() {
  document.querySelectorAll('[data-filter]').forEach(b=> {
    const on=b.dataset.filter===categoriaSelecionada;b.classList.toggle('active', on);b.setAttribute('aria-pressed', on)
  })
  ;
  const list=cenasFiltradas(), visible=new Set(list.map(x=>x.id));
  document.querySelectorAll('.gallery-item').forEach(card=>card.hidden=!visible.has(Number(card.dataset.sceneId)));
  const noFavorites=categoriaSelecionada==='favorites'&&favoritos.size===0, emptyFavorites=document.querySelector('#empty-favorites'), emptySearch=document.querySelector('#empty-search');
  emptyFavorites.hidden=!noFavorites;
  emptySearch.hidden=noFavorites||list.length>0;
  gradeGaleria.hidden=noFavorites||list.length===0;
  const status=document.querySelector('#search-status');
  status.textContent=`${list.length} ${list.length===1?'cena encontrada':'cenas encontradas'}${categoriaSelecionada==='favorites'?' na sua coleção':''}.`;
  const favoriteCount=document.querySelector('#settings-favorite-count');
  if(favoriteCount)favoriteCount.textContent=favoritos.size;
  const clear=document.querySelector('#clear-search');
  if(clear)clear.disabled=categoriaSelecionada==='all'&&!termoBusca&&filtroPersonagem==='all'&&ordemGaleria==='curated'
}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=> {
  categoriaSelecionada=b.dataset.filter;atualizarFiltros()
})
;
const campoBusca=document.querySelector('#gallery-search'), seletorPersonagem=document.querySelector('#character-filter'), seletorOrdem=document.querySelector('#gallery-sort');
campoBusca.addEventListener('input', ()=> {
  termoBusca=campoBusca.value.trim().toLocaleLowerCase('pt-BR');atualizarFiltros()
})
;
seletorPersonagem.addEventListener('change', ()=> {
  filtroPersonagem=seletorPersonagem.value;atualizarFiltros()
})
;
seletorOrdem.addEventListener('change', ()=> {
  ordemGaleria=seletorOrdem.value;atualizarFiltros()
})
;
document.querySelector('#clear-search').addEventListener('click', ()=> {
  categoriaSelecionada='all';termoBusca='';filtroPersonagem='all';ordemGaleria='curated';campoBusca.value='';seletorPersonagem.value='all';seletorOrdem.value='curated';atualizarFiltros();campoBusca.focus()
})
;
document.addEventListener('keydown', e=> {
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!modalCena.open&&!document.querySelector('#account-dialog').open&&!document.querySelector('#settings-dialog').open) {
    e.preventDefault();document.querySelector('#gallery-search').focus();document.querySelector('#galeria').scrollIntoView( {
      behavior:reduced?'auto':'smooth'
    })
  }
})
;
sincronizarFavoritos();
const dialogoAcesso=document.querySelector('#account-dialog'), camposAcesso=document.querySelector('#auth-fields');
let focoRetornoAcesso=null;
const modosAcesso= {
  login: {
    title:'ENTRE NA<br><em>HISTÓRIA.</em>', fields:[['E-MAIL', 'email', 'email'], ['SENHA', 'password', 'password']]
  },
  register: {
    title:'CRIE SEU<br><em>ACESSO.</em>', fields:[['APELIDO', 'text', 'displayName'], ['E-MAIL', 'email', 'email'], ['SENHA', 'password', 'password'], ['CONFIRMAR SENHA', 'password', 'confirmPassword']]
  },
  forgot: {
    title:'RECUPERE O<br><em>ACESSO.</em>', fields:[['E-MAIL', 'email', 'email']]
  }
};
function definirModoAcesso(mode) {
  const config=modosAcesso[mode]||modosAcesso.login;
  document.querySelector('#account-title').innerHTML=config.title;
  camposAcesso.replaceChildren();
  const form=document.querySelector('#auth-form');
  form.dataset.authMode=mode;
  form.hidden=false;
  document.querySelector('#auth-session').hidden=true;
  document.querySelector('.auth-preview').hidden=false;
  document.querySelector('.auth-tabs').hidden=mode==='forgot';
  document.querySelector('#auth-status').textContent='';
  document.querySelector('#auth-status').classList.remove('error');
  config.fields.forEach(([label, type, name])=> {
    const wrap=document.createElement('div');wrap.className='auth-field';const caption=document.createElement('label');caption.htmlFor=`auth-${name}`;caption.textContent=label;wrap.append(caption);const input=document.createElement('input');input.id=`auth-${name}`;input.type=type;input.name=name;input.required=true;input.placeholder=type==='email'?'voce@exemplo.com':type==='password'?'Mínimo de 8 caracteres':'Seu apelido';input.autocomplete=name==='email'?(mode==='register'?'email':'username'):type==='password'?(mode==='login'?'current-password':'new-password'):'nickname';if(type==='password'&&mode==='register')input.minLength=8;if(name==='displayName')input.maxLength=24;if(type==='password') {
      const control=document.createElement('span');control.className='password-control';const toggle=document.createElement('button');toggle.type='button';toggle.className='password-toggle';toggle.setAttribute('aria-label', 'Mostrar senha');toggle.setAttribute('aria-pressed', 'false');toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';control.append(input, toggle);wrap.append(control)
    }
    else wrap.append(input);camposAcesso.append(wrap)
  })
  ;
  document.querySelectorAll('[data-auth-mode]').forEach(b=> {
    if(b.getAttribute('role')==='tab')b.setAttribute('aria-selected', String(b.dataset.authMode===mode))
  })
  ;
  document.querySelector('.forgot-link').hidden=mode==='forgot';
  document.querySelector('.back-login').hidden=mode!=='forgot';
  const submit=document.querySelector('.auth-submit');
  submit.disabled=!window.sunsetAuth;
  submit.textContent=mode==='forgot'?'ENVIAR LINK DE RECUPERAÇÃO':'CONTINUAR ↗';
  window.sunsetAuth?.render()
}
document.addEventListener('click', event=> {
  const toggle=event.target.closest('.password-toggle');if(!toggle)return;const input=toggle.parentElement.querySelector('input');const visible=input.type==='password';input.type=visible?'text':'password';toggle.setAttribute('aria-pressed', String(visible));toggle.setAttribute('aria-label', visible?'Ocultar senha':'Mostrar senha');toggle.innerHTML=visible?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.2 3.9M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
})
;
definirModoAcesso('login');
const rotasAcesso= {
  login:'#login', register:'#cadastro', forgot:'#recuperar'
};
function abrirAcessoPeloEndereco() {
  const mode=Object.keys(rotasAcesso).find(key=>rotasAcesso[key]===location.hash);
  if(!mode)return;
  definirModoAcesso(mode);
  if(!dialogoAcesso.open) {
    focoRetornoAcesso=document.querySelector('[data-account-open]');
    dialogoAcesso.showModal();
    window.lenis?.stop()
  }
}
window.addEventListener('hashchange', abrirAcessoPeloEndereco);
abrirAcessoPeloEndereco();
document.querySelectorAll('[data-account-close]').forEach(b=>b.addEventListener('click', ()=>dialogoAcesso.close()));
document.querySelectorAll('button[data-auth-mode]').forEach(b=>b.addEventListener('click', e=> {
  e.preventDefault();const mode=b.dataset.authMode;definirModoAcesso(mode);history.replaceState(null, '', `${location.pathname}${location.search}${rotasAcesso[mode]||'#login'}`)
})
);
document.querySelector('#auth-form').addEventListener('submit', e=>e.preventDefault());
dialogoAcesso.addEventListener('close', ()=> {
  if(Object.values(rotasAcesso).includes(location.hash))history.replaceState(null, '', `${location.pathname}${location.search}`);if(!modalCena.open)window.lenis?.start();focoRetornoAcesso?.focus()
})
;
dialogoAcesso.addEventListener('click', e=> {
  if(e.target===dialogoAcesso) {
    const r=dialogoAcesso.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialogoAcesso.close()
  }
})
;
document.querySelector('#play-trailer').addEventListener('click', e=> {
  const frame=document.createElement('iframe');const videoId=e.currentTarget.dataset.videoId||'VQRLujxTm3c';frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;frame.title=e.currentTarget.dataset.videoTitle||'Grand Theft Auto VI — Trailer 2 oficial';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;const player=e.currentTarget;player.replaceChildren(frame);player.classList.add('is-playing');player.removeAttribute('aria-label')
})
;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try {
  reduced=localStorage.getItem('sunset-motion')===null?reduced:localStorage.getItem('sunset-motion')==='off'
}
catch {
}
const motion=document.querySelector('#motion');
function definirPreferenciaMovimento() {
  document.body.classList.toggle('reduced', reduced);
  motion.setAttribute('aria-pressed', String(reduced));
  motion.setAttribute('aria-label', reduced?'Ativar animações':'Reduzir animações');
  motion.querySelector('span').textContent=reduced?'OFF':'ON';
  if(reduced&&window.lenis) {
    window.lenis.destroy();
    window.lenis=null
  }
  else if(!reduced&&window.Lenis&&!window.lenis) {
    window.lenis=new Lenis( {
      autoRaf:true, anchors:true, lerp:.085, smoothWheel:true, respectReducedMotion:true
    })
  }
}
definirPreferenciaMovimento();
motion.onclick=()=> {
  reduced=!reduced;
  definirPreferenciaMovimento();
  try {
    localStorage.setItem('sunset-motion', reduced?'off':'on')
  }
  catch {
  };
  if(typeof aplicarConfiguracoesSite==='function')aplicarConfiguracoesSite()
};
if('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=> {
    if(e.isIntersecting) {
      e.target.classList.add('visible');observer.unobserve(e.target)
    }
  })
  , {
    threshold:.08
  })
  ;
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  const cta=document.querySelector('.mobile-cta');
  const footerObserver=new IntersectionObserver(entries=>cta.classList.toggle('hidden', entries[0].isIntersecting));
  footerObserver.observe(document.querySelector('footer'))
}
let ticking=false;
const hero=document.querySelector('.hero-art'), siteHeader=document.querySelector('.site-header');
function atualizarAoRolar() {
  const max=document.documentElement.scrollHeight-innerHeight;
  document.querySelector('.progress').style.width=`${max>0?scrollY/max*100:0}%`;
  siteHeader.classList.toggle('is-scrolled', scrollY>24);
  if(!reduced&&innerWidth>900&&scrollY<innerHeight)hero.style.transform=`translateY(${scrollY*.18}px)`;
  else hero.style.transform='';
  ticking=false
}
addEventListener('scroll', ()=> {
  if(!ticking) {
    requestAnimationFrame(atualizarAoRolar);ticking=true
  }
},
{
  passive:true
})
;
atualizarAoRolar();
// Perfil e preferências ficam neste dispositivo e sincronizam com o Firebase quando a conta está conectada.
const dialogoConfiguracoes=document.querySelector('#settings-dialog'), abrirConfiguracoesBotao=document.querySelector('#settings-open');
let focoRetornoConfiguracoes=null;
function abrirConfiguracoes() {
  focoRetornoConfiguracoes=document.activeElement;
  dialogoConfiguracoes.showModal();
  window.lenis?.stop();
  document.querySelector('#profile-name').focus()
}
abrirConfiguracoesBotao.addEventListener('click', abrirConfiguracoes);
document.querySelectorAll('[data-settings-close]').forEach(b=>b.addEventListener('click', ()=>dialogoConfiguracoes.close()));
dialogoConfiguracoes.addEventListener('close', ()=> {
  if(!modalCena.open&&!dialogoAcesso.open)window.lenis?.start();focoRetornoConfiguracoes?.focus()
})
;
dialogoConfiguracoes.addEventListener('click', e=> {
  if(e.target===dialogoConfiguracoes) {
    const r=dialogoConfiguracoes.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialogoConfiguracoes.close()
  }
})
;
function selecionarAbaConfiguracoes(name) {
  document.querySelectorAll('[data-settings-tab]').forEach(b=> {
    const active=b.dataset.settingsTab===name;b.setAttribute('aria-selected', String(active));b.tabIndex=active?0:-1
  })
  ;
  document.querySelectorAll('[data-settings-panel]').forEach(p=>p.hidden=p.dataset.settingsPanel!==name)
}
document.querySelectorAll('[data-settings-tab]').forEach(b=>b.addEventListener('click', ()=>selecionarAbaConfiguracoes(b.dataset.settingsTab)));
selecionarAbaConfiguracoes('profile');
let configuracoesSite= {
  contrast:false, largeText:false
};
try {
  configuracoesSite= {
    ...configuracoesSite, ...JSON.parse(localStorage.getItem('sunset-settings-v1')||'{}')
  }
}
catch {
}
function aplicarConfiguracoesSite() {
  document.body.classList.toggle('high-contrast', configuracoesSite.contrast);
  document.body.classList.toggle('large-text', configuracoesSite.largeText);
  document.querySelector('#setting-motion').checked=reduced;
  document.querySelector('#setting-contrast').checked=!!configuracoesSite.contrast;
  document.querySelector('#setting-large-text').checked=!!configuracoesSite.largeText
}
aplicarConfiguracoesSite();
document.querySelector('#setting-motion').addEventListener('change', e=> {
  reduced=e.target.checked;definirPreferenciaMovimento();try {
    localStorage.setItem('sunset-motion', reduced?'off':'on')
  }
  catch {
  };
  configuracoesSite.motion=reduced;aplicarConfiguracoesSite();notificarSincronizacao()
})
;
document.querySelector('#setting-contrast').addEventListener('change', e=> {
  configuracoesSite.contrast=e.target.checked;aplicarConfiguracoesSite()
})
;
document.querySelector('#setting-large-text').addEventListener('change', e=> {
  configuracoesSite.largeText=e.target.checked;aplicarConfiguracoesSite()
})
;
document.querySelector('#save-display').addEventListener('click', ()=> {
  try {
    localStorage.setItem('sunset-settings-v1', JSON.stringify(configuracoesSite))
  }
  catch {
  }
  notificarSincronizacao();mostrarAviso('Preferências salvas na sua conta e neste dispositivo.')
})
;
const nomePerfil=document.querySelector('#profile-name'), avatarPerfil=document.querySelector('#profile-avatar');
let perfilLocal= {
  name:'', avatar:'none'
};
try {
  perfilLocal= {
    ...perfilLocal, ...JSON.parse(localStorage.getItem('sunset-profile-v1')||'{}')
  }
}
catch {
}
nomePerfil.value=perfilLocal.name;
avatarPerfil.value=perfilLocal.avatar;
function desenharPerfil() {
  const name=nomePerfil.value.trim()||'Viajante de Leonida';
  document.querySelector('#profile-name-preview').textContent=name;
  const avatar=document.querySelector('#profile-avatar-preview');
  avatar.textContent=avatarPerfil.value==='none'?'VI':avatarPerfil.value==='lucia'?'L':'J';
  avatar.dataset.avatar=avatarPerfil.value
}
nomePerfil.addEventListener('input', desenharPerfil);
avatarPerfil.addEventListener('change', desenharPerfil);
desenharPerfil();
document.querySelector('#save-profile').addEventListener('click', ()=> {
  perfilLocal= {
    name:nomePerfil.value.trim(), avatar:avatarPerfil.value
  };
  try {
    localStorage.setItem('sunset-profile-v1', JSON.stringify(perfilLocal))
  }
  catch {
  };
  notificarSincronizacao();mostrarAviso('Perfil atualizado na sua conta e neste dispositivo.')
})
;
document.querySelector('#export-data').addEventListener('click', ()=> {
  const data= {
    profile:perfilLocal, preferences: {
      contrast:!!configuracoesSite.contrast, largeText:!!configuracoesSite.largeText, motion:reduced
    },
    collection:[...favoritos], exportedAt:new Date().toISOString()
  };
  const blob=new Blob([JSON.stringify(data, null, 2)], {
    type:'application/json'
  })
  ;const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='sunset-stories-meus-dados.json';a.click();URL.revokeObjectURL(url);mostrarAviso('Cópia dos seus dados baixada.')
})
;
document.querySelector('#clear-data').addEventListener('click', ()=> {
  if(!confirm('Apagar perfil, favoritos e preferências salvos neste navegador e na sua conta? Esta ação não pode ser desfeita.'))return;['sunset-profile-v1', 'sunset-settings-v1', 'sunset-motion', 'sunset-analytics-consent', chaveFavoritos].forEach(key=> {
    try {
      localStorage.removeItem(key)
    }
    catch {
    }
  })
  ;favoritos.clear();perfilLocal= {
    name:'', avatar:'none'
  };
  configuracoesSite= {
    contrast:false, largeText:false
  };
  reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;nomePerfil.value='';avatarPerfil.value='none';desenharPerfil();definirPreferenciaMovimento();aplicarConfiguracoesSite();sincronizarFavoritos();definirConsentimentoMetricas(null);window.dispatchEvent(new CustomEvent('sunset-data-change', {
    detail: {
      clear:true
    }
  })
  );mostrarAviso('Dados apagados deste dispositivo e da sua conta.')
})
;
const avisoPrivacidade=document.querySelector('#consent-banner'), controleMetricas=document.querySelector('#setting-analytics');
let escolhaMetricas=null;
try {
  escolhaMetricas=localStorage.getItem('sunset-analytics-consent')
}
catch {
}
function definirConsentimentoMetricas(choice) {
  escolhaMetricas=choice;
  try {
    if(choice===null)localStorage.removeItem('sunset-analytics-consent');
    else localStorage.setItem('sunset-analytics-consent', choice)
  }
  catch {
  };
  avisoPrivacidade.hidden=choice!==null;
  document.body.classList.toggle('consent-visible', choice===null);
  controleMetricas.checked=choice==='granted';
  window.dispatchEvent(new CustomEvent('sunset-analytics-consent', {
    detail: {
      choice
    }
  })
  )
}
definirConsentimentoMetricas(escolhaMetricas);
document.querySelector('#consent-accept').addEventListener('click', ()=>definirConsentimentoMetricas('granted'));
document.querySelector('#consent-reject').addEventListener('click', ()=>definirConsentimentoMetricas('denied'));
controleMetricas.addEventListener('change', e=>definirConsentimentoMetricas(e.target.checked?'granted':'denied'));
function obterDadosUsuario() {
  return {
    profile: {
      name:perfilLocal.name||'', avatar:['none', 'lucia', 'jason'].includes(perfilLocal.avatar)?perfilLocal.avatar:'none'
    },
    favoritos:[...favoritos].filter(id=>cenas.some(scene=>scene.id===id)), preferences: {
      contrast:!!configuracoesSite.contrast, largeText:!!configuracoesSite.largeText, motion:!!reduced
    }
  }
}
function aplicarDadosUsuario(data= {
})
{
  const profile=data.profile&&typeof data.profile==='object'?data.profile: {
  };
  const preferences=data.preferences&&typeof data.preferences==='object'?data.preferences: {
  };
  perfilLocal= {
    name:typeof profile.name==='string'?profile.name.slice(0, 24):'', avatar:['none', 'lucia', 'jason'].includes(profile.avatar)?profile.avatar:'none'
  };
  configuracoesSite= {
    contrast:preferences.contrast===true, largeText:preferences.largeText===true
  };
  reduced=preferences.motion===true;
  favoritos=new Set(Array.isArray(data.favorites)?data.favorites.map(Number).filter(id=>cenas.some(scene=>scene.id===id)):[]);
  nomePerfil.value=perfilLocal.name;
  avatarPerfil.value=perfilLocal.avatar;
  desenharPerfil();
  try {
    localStorage.setItem('sunset-profile-v1', JSON.stringify(perfilLocal));
    localStorage.setItem('sunset-settings-v1', JSON.stringify(configuracoesSite));
    localStorage.setItem('sunset-motion', reduced?'off':'on')
  }
  catch {
  }
  definirPreferenciaMovimento();
  aplicarConfiguracoesSite();
  sincronizarFavoritos()
}
window.sunsetData= {
  getState:obterDadosUsuario, apply:aplicarDadosUsuario, reset() {
    perfilLocal= {
      name:'', avatar:'none'
    };
    configuracoesSite= {
      contrast:false, largeText:false
    };
    reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    favoritos=new Set();
    ['sunset-profile-v1', 'sunset-settings-v1', 'sunset-motion', 'sunset-cloud-user', chaveFavoritos].forEach(key=> {
      try {
        localStorage.removeItem(key)
      }
      catch {
      }
    })
    ;
    nomePerfil.value='';
    avatarPerfil.value='none';
    desenharPerfil();
    definirPreferenciaMovimento();
    aplicarConfiguracoesSite();
    sincronizarFavoritos()
  },
  setCloudStatus(message, kind='info') {
    const node=document.querySelector('#cloud-status');
    node.textContent=message;
    node.dataset.state=kind
  }
};
window.dispatchEvent(new Event('sunset-data-ready'));
function aplicarSecaoCms(section, data) {
  if(!data)return;
  if(section==='gallery'&&Array.isArray(data.items)&&data.items.length) {
    cenas=data.items.map(item=>( {
      ...item, id:Number(item.id), category:['sunset', 'action'].includes(item.category)?item.category:'sunset', characters:Array.isArray(item.characters)?item.characters:[]
    })
    );
    personagensPorCena=Object.fromEntries(cenas.map(item=>[item.id, item.characters]));
    favoritos=new Set([...favoritos].filter(id=>cenas.some(item=>item.id===id&&item.published!==false)));
    renderizarCenas();
    sincronizarFavoritos();
    return
  }
  if(section==='faqs'&&Array.isArray(data.items)) {
    const list=document.querySelector('.faq-layout>div');
    if(!list)return;
    list.replaceChildren();
    data.items.forEach(item=> {
      if(!item.question||!item.answer)return;const details=document.createElement('details'), summary=document.createElement('summary'), mark=document.createElement('span'), answer=document.createElement('p');summary.append(document.createTextNode(item.question));mark.textContent='+';answer.textContent=item.answer;summary.append(mark);details.append(summary, answer);list.append(details)
    })
    ;
    return
  }
  if(section==='home') {
    const title=document.querySelector('.hero-content h1'), description=document.querySelector('.hero-content .intro');
    if(title&&data.title) {
      title.replaceChildren();
      const lines=String(data.title).split('\n');
      lines.forEach((line, index)=> {
        if(index)title.append(document.createElement('br'));const node=document.createElement(index===lines.length-1?'em':'span');node.textContent=line;title.append(node)
      })
    }
    if(description&&data.description)description.textContent=data.description;
    const notice=document.querySelector('#site-announcement');
    if(notice) {
      notice.textContent=data.notice||'';
      notice.hidden=data.noticeActive!==true||!data.notice
    }
  }
  if(section==='trailer') {
    const button=document.querySelector('#play-trailer');
    if(button&&data.videoUrl) {
      let id='';
      let linkSeguro='';
      try {
        const url=new URL(data.videoUrl);
        const hostsPermitidos=['youtu.be', 'youtube.com', 'www.youtube.com', 'm.youtube.com'];
        if(url.protocol==='https:'&&hostsPermitidos.includes(url.hostname)) {
          linkSeguro=url.href;
          id=url.hostname==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1]||''
        }
      }
      catch {
      }
      if(id) {
        button.dataset.videoId=id;
        button.dataset.videoTitle=data.title||'Trailer de GTA VI';
        button.querySelector('.trailer-caption b').textContent=data.title||'TRAILER EM DESTAQUE';
        const img=button.querySelector('img');
        if(data.thumbnail)img.src=data.thumbnail;
        img.alt=`Capa do vídeo: ${data.title||'trailer em destaque'}`;
        const note=document.querySelector('.trailer-note a');
        if(note&&linkSeguro)note.href=linkSeguro
      }
    }
    return
  }
  if(section==='settings') {
    if(data.title)document.title=data.title;
    if(data.description) {
      const description=document.querySelector('meta[name="description"]');
      if(description)description.content=data.description;
      const ogDescription=document.querySelector('meta[property="og:description"]');
      if(ogDescription)ogDescription.content=data.description
    }
    if(data.ogImage) {
      const image=document.querySelector('meta[property="og:image"]');
      if(image)image.content=new URL(data.ogImage, location.href).href
    }
  }
}
function conectarConteudoPublico() {
  if(!window.sunsetCms||window.__sunsetCmsConnected)return;
  window.__sunsetCmsConnected=true;
  window.sunsetCmsUnsubscribe=window.sunsetCms.listen(aplicarSecaoCms)
}
window.addEventListener('sunset-cms-ready', conectarConteudoPublico);
conectarConteudoPublico();
let idCenaDestaqueCms=10;
function sincronizarCenaDestaque() {
  const scene=cenas.find(item=>Number(item.id)===Number(idCenaDestaqueCms)), image=document.querySelector('.wide-image img'), caption=document.querySelector('.wide-image>span');
  if(!scene||!image)return;
  image.src=caminhoDaImagem(scene.id);
  image.alt=scene.alt;
  if(caption?.firstChild?.nodeType===Node.TEXT_NODE)caption.firstChild.nodeValue=`${scene.title.toUpperCase()}. `
}
window.addEventListener('sunset-cms-section', event=> {
  const {
    section, data
  }
  =event.detail|| {
  };
  if(section==='home') {
    idCenaDestaqueCms=Number(data?.featuredSceneId)||idCenaDestaqueCms;sincronizarCenaDestaque()
  }
  if(section==='gallery')sincronizarCenaDestaque()
})
;
