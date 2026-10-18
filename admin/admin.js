import {
  initializeApp
}
from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  getAuth,  onAuthStateChanged,  signInWithEmailAndPassword,  signOut
}
from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {
  getFirestore,  doc,  getDoc,  setDoc,  serverTimestamp,  collection,  getDocs,  query,  orderBy,  limit,  writeBatch
}
from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
// Configuração pública do Firebase, injetada pelo Vite durante desenvolvimento e compilação.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'https://sunsetvi-image-api.epiccow8.chatgpt.site/api/admin';
const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const DEFAULT_GALLERY=[
{
  id:1, title:'Good vibes', category:'sunset', alt:'Ilustração de uma mulher à beira da piscina em tons rosa e lilás', image:'assets/scene-01.webp', thumbnail:'assets/thumb-01.webp', characters:['lucia'], published:true
},
{
  id:2, title:'Two against the world', category:'sunset', alt:'Lucia e Jason usando bandanas diante de um posto ao pôr do sol', image:'assets/scene-02.webp', thumbnail:'assets/thumb-02.webp', characters:['lucia', 'jason'], published:true
},
{
  id:3, title:'O universo em cores', category:'sunset', alt:'Colagem ilustrada com personagens, veículos e o título Grand Theft Auto VI', image:'assets/scene-03.webp', thumbnail:'assets/thumb-03.webp', characters:['lucia', 'jason'], published:true
},
{
  id:4, title:'Nas ruas', category:'action', alt:'Lucia com uma bolsa rosa e roxa diante de uma loja', image:'assets/scene-04.webp', thumbnail:'assets/thumb-04.webp', characters:['lucia'], published:true
},
{
  id:5, title:'Lucia / luz e atitude', category:'action', alt:'Lucia sentada em uma academia com luz do sol', image:'assets/scene-05.webp', thumbnail:'assets/thumb-05.webp', characters:['lucia'], published:true
},
{
  id:6, title:'Tudo ou nada', category:'action', alt:'Uma dupla com equipamentos táticos diante de um cofre', image:'assets/scene-06.webp', thumbnail:'assets/thumb-06.webp', characters:['lucia', 'jason'], published:true
},
{
  id:7, title:'After hours', category:'action', alt:'Dois personagens diante de um carro em chamas em um galpão', image:'assets/scene-07.webp', thumbnail:'assets/thumb-07.webp', characters:['lucia', 'jason'], published:true
},
{
  id:8, title:'Jason / sob pressão', category:'action', alt:'Jason atrás de uma cerca sob luzes vermelhas e azuis', image:'assets/scene-08.webp', thumbnail:'assets/thumb-08.webp', characters:['jason'], published:true
},
{
  id:9, title:'Um verão sem fim', category:'sunset', alt:'Casal sentado junto a um carro clássico entre palmeiras', image:'assets/scene-09.webp', thumbnail:'assets/thumb-09.webp', characters:['lucia', 'jason'], published:true
},
{
  id:10, title:'O último raio de sol', category:'sunset', alt:'Casal junto a um carro ao pôr do sol com uma cidade e palmeiras ao fundo', image:'assets/scene-10.webp', thumbnail:'assets/thumb-10.webp', characters:['lucia', 'jason'], published:true
},
{
  id:11, title:'Entre sol e sombra', category:'sunset', alt:'Casal relaxando em cadeiras de vime diante de uma fonte', image:'assets/scene-11.webp', thumbnail:'assets/thumb-11.webp', characters:['lucia', 'jason'], published:true
},
{
  id:12, title:'A noite é jovem', category:'action', alt:'Mulher com uma taça em uma festa noturna', image:'assets/scene-12.webp', thumbnail:'assets/thumb-12.webp', characters:['lucia'], published:true
}]
;
const DEFAULT_FAQ=[
{
  question:'Esta é a página oficial de GTA VI?', answer:'Não. Sunset Stories é uma experiência independente de fã e não tem vínculo com a Rockstar Games.'
},
{
  question:'As imagens representam o jogo final?', answer:'A galeria reúne imagens fornecidas como referências visuais. Este projeto não confirma a origem oficial de cada arte nem representa recursos ou cenas do jogo final.'
},
{
  question:'Posso jogar ou baixar GTA VI aqui?', answer:'Não. Esta página é uma experiência visual. Informações de compra e disponibilidade devem ser consultadas nos canais oficiais.'
},
{
  question:'Como usar a galeria?', answer:'Filtre por atmosfera, abra uma cena e use os controles para navegar ou baixar a imagem. Isso não baixa arquivos do jogo.'
},
{
  question:'Posso desligar as animações?', answer:'Sim. Use o botão Movimento no topo. A página também respeita a preferência de movimento reduzido do seu dispositivo.'
}]
;
let usuarioAtual=null, papelAtual='', podeEditar=false, rascunhoGaleria=[], rascunhoFaq=[], secoes= {
},
linhasMembros=[], apiMembrosPronta=false;
const imagensPendentes=new Map(), urlsPreviaObject=new Map();
function definirStatus(message, error=false) {
  const el=$('#panel-status');
  el.textContent=message;
  el.classList.toggle('error', error)
}
function definirStatusAcesso(message, error=false) {
  const el=$('#access-status');
  el.textContent=message;
  el.classList.toggle('error', error)
}
function textoErro(error) {
  if(error?.code==='auth/invalid-credential'||error?.code==='auth/wrong-password')return'E-mail ou senha incorretos.';
  if(error?.code==='auth/too-many-requests')return'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if(error?.code==='auth/network-request-failed')return'Falha de conexão. Verifique sua internet e tente novamente.';
  if(error?.code==='permission-denied'||error?.code==='firestore/permission-denied')return'As regras do Firestore ainda não permitem essa operação. Revise o arquivo firestore.rules do projeto.';
  return'Não foi possível concluir a operação. Tente novamente.'
}
function midiaSegura(value) {
  const text=String(value||'').trim();
  if(text.startsWith('assets/'))return true;try{const url=new URL(text, location.origin);return url.origin===location.origin||(url.protocol==='https:'&&url.hostname==='res.cloudinary.com')}catch{return false}}
  function normalizarEndereco(value) {
    const text=String(value||'').trim();return midiaSegura(text)?text:''
  }
  function mostrarAba(name) {
    $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.view===name));$$('.view').forEach(v=>v.classList.toggle('active', v.dataset.panel===name));const button=$(`.nav-item[data-view="${name}"]`);$('#view-title').textContent=button?.textContent.trim()||'Painel';if(name==='members')loadMembers();if(name==='analytics')loadAnalytics();if(name==='activity')loadActivity()
  }
  function secaoPadrao(name) {
    if(name==='gallery')return {
      items:DEFAULT_GALLERY, published:true
    };
    if(name==='faqs')return {
      items:DEFAULT_FAQ, published:true
    };
    if(name==='home')return {
      title:'O paraíso\ntem seu\nlado selvagem.', description:'Explore a atmosfera de Leonida em uma experiência visual independente inspirada em GTA VI.', featuredSceneId:10, notice:'', noticeActive:false, published:true
    };
    if(name==='trailer')return {
      title:'Trailer 2 oficial de GTA VI', videoUrl:'https://www.youtube.com/watch?v=VQRLujxTm3c', thumbnail:'assets/scene-02.webp', published:true
    };
    if(name==='settings')return {
      title:'VI — Sunset Stories | Experiência de fã de GTA VI', description:'Explore uma experiência visual independente inspirada em GTA VI: conheça Lucia e Jason, assista ao trailer oficial e baixe imagens da galeria.', ogImage:'assets/scene-10.webp', published:true
    };
    return {
      published:true
    }
  }
  async function lerSecao(name) {
    const snap=await getDoc(doc(db, 'siteContent', name));return snap.exists()?snap.data():secaoPadrao(name)
  }
  async function carregarTodasSecoes() {
    const names=['gallery', 'faqs', 'home', 'trailer', 'settings'];for(const name of names)secoes[name]=await lerSecao(name);rascunhoGaleria=structuredClone(secoes.gallery.items||DEFAULT_GALLERY);rascunhoFaq=structuredClone(secoes.faqs.items||DEFAULT_FAQ);renderEditors();fillForms();$('#stat-gallery').textContent=rascunhoGaleria.length;$('#stat-faq').textContent=rascunhoFaq.length;
  }
  function adicionarCampo(parent, labelText, key, value, type='text', full=false) {
    const label=document.createElement('label');if(full)label.className='full';label.append(document.createTextNode(labelText));let control;if(type==='textarea') {
      control=document.createElement('textarea');control.rows=2
    }
    else if(type==='select') {
      control=document.createElement('select');[['sunset', 'SUNSET'], ['action', 'AÇÃO']].forEach(([v, t])=> {
        const o=document.createElement('option');o.value=v;o.textContent=t;control.append(o)
      })
    }
    else {
      control=document.createElement('input');control.type='text'
    }
    control.value=value||'';control.dataset.field=key;label.append(control);parent.append(label);return control
  }
  function origemPreviaImagem(value) {
    return String(value||'').startsWith('assets/')?`../${value}`:value
  }
  function addImageField(parent, scene, key, labelText) {
    const label=document.createElement('label');label.className='image-field';label.append(document.createTextNode(labelText));const preview=document.createElement('img');preview.className='scene-preview';preview.dataset.imageKey=`${scene.id}:${key}`;preview.alt=`Prévia completa: ${scene.title||'nova cena'}`;preview.loading='lazy';preview.src=origemPreviaImagem(scene[key])||'../assets/scene-01.webp';const pathInput=document.createElement('input');pathInput.type='text';pathInput.value=scene[key]||'';pathInput.placeholder='assets/… ou URL HTTPS';pathInput.disabled=!podeEditar;pathInput.setAttribute('aria-label', `Caminho ou URL para ${labelText.toLocaleLowerCase('pt-BR')}`);pathInput.addEventListener('input', ()=> {
      scene[key]=pathInput.value.trim();scene.thumbnail=scene[key];const imageKey=`${scene.id}:${key}`, url=urlsPreviaObject.get(imageKey);if(url) {
        URL.revokeObjectURL(url);urlsPreviaObject.delete(imageKey);imagensPendentes.delete(imageKey)
      }
      preview.src=origemPreviaImagem(scene[key])||'../assets/scene-01.webp'
    })
    ;const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/avif';input.disabled=!podeEditar;input.setAttribute('aria-label', `Selecionar ${labelText.toLocaleLowerCase('pt-BR')}`);input.addEventListener('change', ()=> {
      const file=input.files?.[0];if(!file)return;if(!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        input.value='';definirStatus('Escolha uma imagem JPG, PNG, WebP ou AVIF.', true);return
      }
      if(file.size>8*1024*1024) {
        input.value='';definirStatus('A imagem deve ter no máximo 8 MB.', true);return
      }
      const imageKey=`${scene.id}:${key}`, oldUrl=urlsPreviaObject.get(imageKey);if(oldUrl)URL.revokeObjectURL(oldUrl);const url=URL.createObjectURL(file);urlsPreviaObject.set(imageKey, url);imagensPendentes.set(imageKey, file);preview.src=url;definirStatus(`Imagem selecionada: ${file.name}. Salve a galeria para publicar.`)
    })
    ;label.append(preview, pathInput, input);parent.append(label);return input
  }
  function renderEditors() {
    const gallery=$('#gallery-editor');gallery.replaceChildren();
    rascunhoGaleria.forEach((scene, index)=> {
      const card=document.createElement('article');card.className=`scene-card${scene.image?'':' scene-card-new'}`;card.dataset.sceneId=scene.id;
      const head=document.createElement('header'), caption=document.createElement('span');caption.textContent=`CENA ${String(scene.id).padStart(2,'0')}`;
      const remove=document.createElement('button');remove.type='button';remove.className='remove-row';remove.textContent='REMOVER';remove.disabled=!podeEditar;remove.onclick=()=> {
        const id=`${scene.id}:image`, url=urlsPreviaObject.get(id);if(url)URL.revokeObjectURL(url);urlsPreviaObject.delete(id);imagensPendentes.delete(id);rascunhoGaleria.splice(index, 1);renderEditors()
      };
      head.append(caption, remove);card.append(head);
      adicionarCampo(card, 'TÍTULO', 'title', scene.title);
      const category=adicionarCampo(card, 'CATEGORIA', 'category', scene.category, 'select');
      adicionarCampo(card, 'TEXTO ALTERNATIVO', 'alt', scene.alt, 'textarea', true);
      addImageField(card, scene, 'image', 'IMAGEM DA CENA');
      adicionarCampo(card, 'PERSONAGENS (lucia,jason)', 'characters', (scene.characters||[]).join(','));
      const liveLabel=document.createElement('label');liveLabel.className='check-label full';
      const live=document.createElement('input');live.type='checkbox';live.checked=scene.published!==false;live.dataset.field='published';live.disabled=!podeEditar;
      liveLabel.append(live, document.createTextNode(' Publicar esta cena'));card.append(liveLabel);
      card.querySelectorAll('[data-field]').forEach(input=> {
        input.disabled=!podeEditar;
        input.addEventListener('input', ()=> {
          const key=input.dataset.field;scene[key]=key==='characters'?input.value.split(',').map(v=>v.trim().toLowerCase()).filter(v=>['lucia', 'jason'].includes(v)):input.value
        })
        ;
      })
      ;
      category.addEventListener('change', ()=>scene.category=category.value);
      live.addEventListener('change', ()=>scene.published=live.checked);
      gallery.append(card);
    })
    ;
    const faq=$('#faq-editor');faq.replaceChildren();
    rascunhoFaq.forEach((item, index)=> {
      const card=document.createElement('article');card.className='faq-card';
      const head=document.createElement('header'), caption=document.createElement('span');caption.textContent=`PERGUNTA ${String(index+1).padStart(2,'0')}`;
      const remove=document.createElement('button');remove.type='button';remove.className='remove-row';remove.textContent='REMOVER';remove.disabled=!podeEditar;remove.onclick=()=> {
        rascunhoFaq.splice(index, 1);renderEditors()
      };
      head.append(caption, remove);card.append(head);
      const question=adicionarCampo(card, 'PERGUNTA', 'question', item.question, 'text', true);
      const answer=adicionarCampo(card, 'RESPOSTA', 'answer', item.answer, 'textarea', true);
      question.disabled=answer.disabled=!podeEditar;
      question.addEventListener('input', ()=>item.question=question.value);
      answer.addEventListener('input', ()=>item.answer=answer.value);
      faq.append(card);
    })
    ;
    document.querySelectorAll('.scene-preview').forEach(preview=> {
      const url=urlsPreviaObject.get(preview.dataset.imageKey);if(url)preview.src=url
    })
    ;
    const featured=$('#home-featured'), selected=featured.value||String(secoes.home?.featuredSceneId||10);featured.replaceChildren();rascunhoGaleria.forEach(scene=> {
      const option=document.createElement('option');option.value=scene.id;option.textContent=`${String(scene.id).padStart(2,'0')} — ${scene.title}`;featured.append(option)
    })
    ;featured.value=rascunhoGaleria.some(scene=>String(scene.id)===selected)?selected:String(rascunhoGaleria[0]?.id||'');
  }
  function fillForms() {
    const home=secoes.home||secaoPadrao('home'), trailer=secoes.trailer||secaoPadrao('trailer'), settings=secoes.settings||secaoPadrao('settings');$('#home-title').value=home.title||'';$('#home-description').value=home.description||'';$('#home-notice').value=home.notice||'';$('#home-notice-active').checked=home.noticeActive===true;$('#home-featured').value=String(home.featuredSceneId||10);$('#trailer-title').value=trailer.title||'';$('#trailer-url').value=trailer.videoUrl||'';$('#trailer-thumbnail').value=trailer.thumbnail||'';$('#seo-title').value=settings.title||'';$('#seo-description').value=settings.description||'';$('#seo-image').value=settings.ogImage||''
  }
  async function writeSection(name, payload, action) {
    if(!podeEditar)throw new Error('Sua permissão permite consulta, mas não edição.');const batch=writeBatch(db), activity=doc(collection(db, 'siteActivity'));batch.set(doc(db, 'siteContent', name), {
      ...payload, published:true, updatedAt:serverTimestamp(), updatedBy:usuarioAtual.uid
    })
    ;batch.set(activity, {
      action, section:name, actor:usuarioAtual.email||usuarioAtual.uid, createdAt:serverTimestamp()
    })
    ;await batch.commit();secoes[name]= {
      ...payload, published:true
    };
    definirStatus('Alterações salvas e publicadas.');await loadActivity();
  }
  async function uploadToCloudinary(file) {
    if(!file||file.size<1||file.size>8*1024*1024)throw new Error('image_too_large');
    if(!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))throw new Error('invalid_image');
    if(!usuarioAtual)throw new Error('authentication_required');
    const formData=new FormData();formData.append('file', file, file.name||'gallery-image');
    let response;
    try {
      response=await fetch(`${ADMIN_API_BASE}/upload`, {
        method:'POST',
        headers:{authorization:`Bearer ${await usuarioAtual.getIdToken()}`},
        body:formData
      });
    } catch {
      throw new Error('admin_service_unavailable');
    }
    let result={};
    try { result=await response.json(); } catch {}
    if(!response.ok)throw new Error(result.error||'admin_service_unavailable');
    if(typeof result.image!=='string'||typeof result.thumbnail!=='string')throw new Error('image_upload_failed');
    return {image:result.image, thumbnail:result.thumbnail};
  }
  async function uploadPendingGalleryImages() {
    const entries=[...imagensPendentes.entries()];for(let index=0;index<entries.length;index++) {
      const [imageKey, file]=entries[index], [sceneId]=imageKey.split(':'), scene=rascunhoGaleria.find(item=>String(item.id)===sceneId);if(!scene)continue;definirStatus(`Enviando imagem ${index+1} de ${entries.length}…`);const urls=await uploadToCloudinary(file);scene.image=urls.image;scene.thumbnail=urls.thumbnail;imagensPendentes.delete(imageKey);const url=urlsPreviaObject.get(imageKey);if(url)URL.revokeObjectURL(url);urlsPreviaObject.delete(imageKey)
    }
  }
  async function adminApi(path, {
    method='GET', body
  }
  = {
  })
  {
    if(!usuarioAtual)throw new Error('authentication_required');let response;try {
      response=await fetch(`${ADMIN_API_BASE}${path}`, {
        method, headers: {
          authorization:`Bearer ${await usuarioAtual.getIdToken()}`, ...(body? {
            'content-type':'application/json'
          }
          : {
          })
        },
        body:body?JSON.stringify(body):undefined
      })
    }
    catch {
      throw new Error('admin_service_unavailable')
    }
    let data= {
    };
    try {
      data=await response.json()
    }
    catch {
    }
    if(!response.ok)throw new Error(data.error||'admin_service_unavailable');return data
  }
  function adminApiMessage(error) {
    const messages= {
      admin_service_not_configured:'A gestão protegida ainda não foi configurada no servidor. Configure a chave de serviço Firebase como segredo FIREBASE_SERVICE_ACCOUNT_JSON.', analytics_not_configured:'Adicione o ID GA4_PROPERTY_ID e dê acesso de leitura da propriedade à conta de serviço.', service_account_permissions_required:'A conta de serviço está sem permissões necessárias no Firebase Authentication, Firestore ou Google Analytics.', owner_access_required:'Somente o owner pode gerenciar contas, permissões e relatórios.', account_not_found:'Esse e-mail ainda não tem conta. A pessoa precisa se cadastrar no site primeiro.', account_already_exists:'Já existe uma conta com esse e-mail. Use a tabela para mudar o papel ou reenviar um convite de senha pelo Firebase.', invitation_email_failed:'A conta não foi mantida porque o convite não pôde ser enviado. Verifique o modelo de redefinição de senha do Firebase e tente novamente.', last_owner_required:'Não é possível remover o último owner ativo.', owner_must_be_demoted_first:'Mude o papel deste owner antes de bloquear ou excluir a conta.', account_delete_forbidden:'Não é permitido excluir a própria conta pelo painel.', self_update_forbidden:'Não é permitido alterar a própria conta por esta ação.', invalid_email:'Informe um e-mail válido.', invalid_role:'Selecione um papel válido.', invalid_image:'Envie um arquivo de imagem JPG, PNG, WebP ou AVIF válido.', image_too_large:'A imagem precisa ter no máximo 8 MB.', image_upload_failed:'O envio da imagem não foi concluído. Tente novamente.', upload_not_configured:'O serviço de imagens está temporariamente indisponível.'
    };
    return messages[error?.message]||messages[error?.code]||'Não foi possível concluir a operação. Verifique a conexão e as permissões.'
  }
  function updateMemberControls() {
    const enabled=papelAtual==='owner'&&apiMembrosPronta;$('#create-member-form button[type="submit"]').disabled=!enabled;$('#grant-role-form button[type="submit"]').disabled=!enabled
  }
  function setMemberStatus(message, error=false) {
    const node=$('#member-status');node.textContent=message;node.classList.toggle('error', error)
  }
  function renderMembers(rows=linhasMembros) {
    const body=$('#members-table');body.replaceChildren();$('#stat-members').textContent=linhasMembros.length;const term=$('#member-search').value.trim().toLocaleLowerCase('pt-BR');rows=rows.filter(item=>`${item.email||''} ${item.profile?.name||''} ${item.profile?.avatar||''} ${item.role||''}`.toLocaleLowerCase('pt-BR').includes(term)).sort((a, b)=>(a.email||a.profile?.name||'').localeCompare(b.email||b.profile?.name||'', 'pt-BR'));if(!rows.length) {
      const tr=document.createElement('tr'), td=document.createElement('td');td.colSpan=6;td.textContent=linhasMembros.length?'Nenhum perfil corresponde à busca.':'Nenhuma conta cadastrada.';tr.append(td);body.append(tr);updateMemberControls();return
    }
    rows.forEach(item=> {
      const tr=document.createElement('tr');const profile=document.createElement('td');const name=item.profile?.name||'Viajante de Leonida';const avatar=item.profile?.avatar==='lucia'?'Lucia':item.profile?.avatar==='jason'?'Jason':'Sem personagem';profile.textContent=`${name} · ${avatar} · ${Array.isArray(item.favorites)?item.favorites.length:0} favoritas`;const email=document.createElement('td');email.textContent=item.email||'Conta sem e-mail disponível';const role=document.createElement('td');role.textContent=item.active?( {
        owner:'Owner', editor:'Editor', viewer:'Leitor'
      }
      [item.role]||'Ativo'):'Sem acesso';role.className=item.role==='owner'?'member-role-owner':item.role==='none'?'member-role-none':'';const status=document.createElement('td');status.textContent=item.disabled?'Bloqueada':item.emailVerified?'Ativa · e-mail confirmado':'Ativa · e-mail pendente';status.className=item.disabled||!item.emailVerified?'member-account-disabled':'member-account-ok';const last=document.createElement('td');last.textContent=item.lastSignInAt?new Date(Number(item.lastSignInAt)).toLocaleString('pt-BR'):'Nunca entrou';const actions=document.createElement('td');const controls=document.createElement('div');controls.className='member-actions';const editable=papelAtual==='owner'&&apiMembrosPronta&&Boolean(item.email)&&item.uid!==usuarioAtual?.uid;const select=document.createElement('select');select.setAttribute('aria-label', `Papel de ${item.email||name}`);[['none', 'Sem acesso'], ['viewer', 'Leitor'], ['editor', 'Editor'], ['owner', 'Owner']].forEach(([value, label])=> {
        const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)
      })
      ;select.value=item.active?item.role:'none';select.disabled=!editable;const save=document.createElement('button');save.type='button';save.className='member-action';save.textContent='PAPEL';save.disabled=!editable;save.addEventListener('click', async()=> {
        try {
          await adminApi('/roles', {
            method:'POST', body: {
              email:item.email, role:select.value
            }
          })
          ;setMemberStatus('Permissão atualizada.');await loadMembers()
        }
        catch(error) {
          setMemberStatus(adminApiMessage(error), true)
        }
      })
      ;const toggle=document.createElement('button');toggle.type='button';toggle.className='member-action';toggle.textContent=item.disabled?'REATIVAR':'BLOQUEAR';toggle.disabled=!editable||item.active&&item.role==='owner';toggle.addEventListener('click', async()=> {
        const verb=item.disabled?'reativar':'bloquear';if(!confirm(`Confirma ${verb} a conta ${item.email}?`))return;try {
          await adminApi('/members', {
            method:'PATCH', body: {
              uid:item.uid, disabled:!item.disabled
            }
          })
          ;setMemberStatus(`Conta ${item.disabled?'reativada':'bloqueada'}.`);await loadMembers()
        }
        catch(error) {
          setMemberStatus(adminApiMessage(error), true)
        }
      })
      ;const remove=document.createElement('button');remove.type='button';remove.className='member-action danger';remove.textContent='EXCLUIR';remove.disabled=!editable||item.active&&item.role==='owner';remove.addEventListener('click', async()=> {
        if(!confirm(`Excluir permanentemente a conta ${item.email}? O perfil, favoritos e papel administrativo também serão removidos.`))return;try {
          await adminApi('/members', {
            method:'DELETE', body: {
              uid:item.uid
            }
          })
          ;setMemberStatus('Conta excluída.');await loadMembers()
        }
        catch(error) {
          setMemberStatus(adminApiMessage(error), true)
        }
      })
      ;controls.append(select, save, toggle, remove);if(!editable) {
        const note=document.createElement('span');note.className='member-role-none';note.textContent=papelAtual!=='owner'?'Owner necessário':!apiMembrosPronta?'API pendente':item.uid===usuarioAtual?.uid?'Sua conta':'';controls.append(note)
      }
      actions.append(controls);tr.append(email, profile, role, status, last, actions);body.append(tr)
    })
    ;updateMemberControls()
  }
  async function loadMembers() {
    const body=$('#members-table');body.innerHTML='<tr><td colspan="6">Carregando contas…</td></tr>';apiMembrosPronta=false;try {
      const [profiles, accounts]=await Promise.all([getDocs(collection(db, 'users')).catch(()=>null), adminApi('/members')]);const profileByUid=new Map((profiles?.docs||[]).map(snapshot=>[snapshot.id, snapshot.data()]));linhasMembros=(accounts.users||[]).map(user=> {
        const profileDoc=profileByUid.get(user.uid)|| {
        };
        return {
          ...user, profile:profileDoc.profile|| {
          },
          favorites:profileDoc.favorites||[], updatedAt:profileDoc.updatedAt||null
        }
      })
      ;apiMembrosPronta=true;setMemberStatus(`${linhasMembros.length} conta(s) do Firebase Authentication.`)
    }
    catch(error) {
      try {
        const profiles=await getDocs(collection(db, 'users'));linhasMembros=profiles.docs.map(snapshot=> {
          const data=snapshot.data();return {
            uid:snapshot.id, profile:data.profile|| {
            },
            favorites:data.favorites||[], updatedAt:data.updatedAt||null, email:'', role:'none', active:false, disabled:false, emailVerified:false, lastSignInAt:''
          }
        })
        ;setMemberStatus(adminApiMessage(error), true)
      }
      catch(readError) {
        linhasMembros=[];setMemberStatus(adminApiMessage(error)||textoErro(readError), true)
      }
    }
    renderMembers()
  }
  function setAnalyticsStatus(message, error=false) {
    const node=$('#analytics-status');node.textContent=message;node.classList.toggle('error', error)
  }
  function renderReportList(selector, items, labelKey, valueKey) {
    const container=$(selector);container.replaceChildren();if(!items?.length) {
      const empty=document.createElement('p');empty.className='muted';empty.textContent='Sem dados neste período.';container.append(empty);return
    }
    items.forEach(item=> {
      const row=document.createElement('div');row.className='report-row';const label=document.createElement('span'), value=document.createElement('span');label.textContent=item[labelKey];value.textContent=new Intl.NumberFormat('pt-BR').format(item[valueKey]);row.append(label, value);container.append(row)
    })
  }
  async function loadAnalytics() {
    setAnalyticsStatus('Consultando Google Analytics…');try {
      const days=Number($('#analytics-range').value)||30, data=await adminApi(`/analytics?days=${days}`);const format=value=>new Intl.NumberFormat('pt-BR').format(value||0);$('#analytics-users').textContent=format(data.totals?.activeUsers);$('#analytics-sessions').textContent=format(data.totals?.sessions);$('#analytics-views').textContent=format(data.totals?.pageViews);renderReportList('#analytics-pages', data.pages, 'path', 'views');renderReportList('#analytics-sources', data.sources, 'source', 'sessions');setAnalyticsStatus(`Relatório dos últimos ${days} dias. Os dados de hoje ainda podem estar sendo processados pelo GA4.`)
    }
    catch(error) {
      $('#analytics-users').textContent=$('#analytics-sessions').textContent=$('#analytics-views').textContent='—';renderReportList('#analytics-pages', [], 'path', 'views');renderReportList('#analytics-sources', [], 'source', 'sessions');setAnalyticsStatus(adminApiMessage(error), true)
    }
  }
  async function loadActivity() {
    const body=$('#activity-table');body.innerHTML='<tr><td colspan="4">Carregando histórico…</td></tr>';try {
      const result=await getDocs(query(collection(db, 'siteActivity'), orderBy('createdAt', 'desc'), limit(40)));$('#stat-activity').textContent=result.size;body.replaceChildren();if(result.empty) {
        body.innerHTML='<tr><td colspan="4">Nenhuma alteração registrada.</td></tr>';return
      }
      result.forEach(snap=> {
        const item=snap.data(), tr=document.createElement('tr');[item.action||'Alteração', item.section||'—', item.actor||'—', item.createdAt?.toDate?item.createdAt.toDate().toLocaleString('pt-BR'):'—'].forEach(value=> {
          const td=document.createElement('td');td.textContent=value;tr.append(td)
        })
        ;body.append(tr)
      })
    }
    catch(error) {
      body.innerHTML=`<tr><td colspan="4">${textoErro(error)}</td></tr>`
    }
  }
  async function verifyAdmin(user) {
    usuarioAtual=user;$('#access-screen').hidden=true;$('#admin-app').hidden=true;$('#not-admin').hidden=true;$('#admin-logout-access').hidden=true;try {
      const snap=await getDoc(doc(db, 'admins', user.uid));if(!snap.exists()||snap.data().active!==true||!['owner', 'editor', 'viewer'].includes(snap.data().role)) {
        $('#access-screen').hidden=false;$('#admin-login').hidden=true;$('#not-admin').hidden=false;$('#admin-logout-access').hidden=false;$('#admin-uid').textContent=user.uid;$('#not-admin-copy').textContent=`A conta ${user.email||''} está autenticada, mas ainda não recebeu acesso administrativo.`;return
      }
      papelAtual=snap.data().role;podeEditar=['owner', 'editor'].includes(papelAtual);$('#admin-app').hidden=false;$('#admin-login').hidden=true;$('#admin-logout-access').hidden=true;$('#admin-email-label').textContent=user.email||'';$('#role-label').textContent=papelAtual==='owner'?'Proprietário':papelAtual==='editor'?'Editor':'Leitura';$('#permission-summary').textContent=papelAtual==='owner'?'Acesso total ao conteúdo e às configurações.':papelAtual==='editor'?'Pode editar e publicar conteúdo.':'Acesso somente para consulta.';$$('[data-panel] button[type="submit"],#save-gallery,#add-scene,#add-faq').forEach(button=>button.disabled=!podeEditar);$$('[data-view="members"],[data-view="analytics"]').forEach(button=>button.hidden=papelAtual!=='owner');updateMemberControls();await carregarTodasSecoes();await Promise.allSettled([loadActivity(), loadMembers()])
    }
    catch(error) {
      $('#access-screen').hidden=false;$('#admin-login').hidden=true;$('#not-admin').hidden=false;$('#admin-logout-access').hidden=false;$('#admin-uid').textContent=user.uid;$('#not-admin-copy').textContent=error?.code?.includes('permission-denied')?'As regras atuais do Firestore ainda não permitem verificar a lista administrativa. Publique as regras incluídas no projeto e tente novamente.':'Não foi possível verificar a permissão desta conta.';
    }
  }
  $('#admin-login').addEventListener('submit', async event=> {
    event.preventDefault();definirStatusAcesso('Validando acesso…');try {
      await signInWithEmailAndPassword(auth, $('#admin-email').value.trim(), $('#admin-password').value)
    }
    catch(error) {
      definirStatusAcesso(textoErro(error), true)
    }
  })
  ;
  $('#admin-logout').addEventListener('click', ()=>signOut(auth));$('#admin-logout-access').addEventListener('click', ()=>signOut(auth));
  onAuthStateChanged(auth, user=> {
    usuarioAtual=user;if(user)verifyAdmin(user);else {
      $('#access-screen').hidden=false;$('#admin-app').hidden=true;$('#admin-login').hidden=false;$('#not-admin').hidden=true;$('#admin-logout-access').hidden=true;definirStatusAcesso('')
    }
  })
  ;
  $('#admin-nav').addEventListener('click', event=> {
    const button=event.target.closest('[data-view]');if(button)mostrarAba(button.dataset.view)
  })
  ;$$('[data-go]').forEach(button=>button.addEventListener('click', ()=>mostrarAba(button.dataset.go)));
  $('#add-scene').addEventListener('click', ()=> {
    if(!podeEditar) {
      definirStatus('Sua permissão atual permite apenas visualizar a galeria.', true);return
    }
    const nextId=Math.max(0, ...rascunhoGaleria.map(x=>Number(x.id)||0))+1;rascunhoGaleria.unshift( {
      id:nextId, title:'Nova cena', category:'sunset', alt:'', image:'', thumbnail:'', characters:[], published:false
    })
    ;renderEditors();const card=$(`.scene-card[data-scene-id="${nextId}"]`);card?.scrollIntoView( {
      behavior:'smooth', block:'center'
    })
    ;const title=card?.querySelector('[data-field="title"]');title?.focus();title?.select();definirStatus('Nova cena adicionada. Preencha o título, a descrição e selecione uma imagem; depois salve a galeria.')
  })
  ;
  $('#save-gallery').addEventListener('click', async()=> {
    try {
      if(!rascunhoGaleria.length)throw new Error('A galeria precisa ter pelo menos uma cena.');const ids=rascunhoGaleria.map(item=>Number(item.id));if(new Set(ids).size!==ids.length)throw new Error('Cada cena precisa ter um número de identificação diferente.');for(const item of rascunhoGaleria) {
        if(!item.title?.trim()||!item.alt?.trim())throw new Error('Preencha o título e o texto alternativo de todas as cenas.');const selectedFile=imagensPendentes.has(`${item.id}:image`);if(!selectedFile&&(!midiaSegura(item.image)||!midiaSegura(item.thumbnail)))throw new Error(`Selecione ou informe a imagem da cena “${item.title.trim()}” antes de salvar.`)
      }
      if(imagensPendentes.size)await uploadPendingGalleryImages();await writeSection('gallery', {
        items:rascunhoGaleria.map(item=>( {
          ...item, title:item.title.trim(), alt:item.alt.trim(), image:normalizarEndereco(item.image), thumbnail:normalizarEndereco(item.thumbnail)
        })
        )
      },
      'Galeria atualizada');$('#stat-gallery').textContent=rascunhoGaleria.length;renderEditors()
    }
    catch(error) {
      definirStatus(error.message||textoErro(error), true)
    }
  })
  ;
  $('#add-faq').addEventListener('click', ()=> {
    rascunhoFaq.push( {
      question:'Nova pergunta', answer:'Escreva a resposta.'
    })
    ;renderEditors()
  })
  ;
  $('#faq-form').addEventListener('submit', async event=> {
    event.preventDefault();try {
      if(rascunhoFaq.some(item=>!item.question?.trim()||!item.answer?.trim()))throw new Error('Preencha todas as perguntas e respostas antes de salvar.');await writeSection('faqs', {
        items:rascunhoFaq.map(x=>( {
          question:x.question.trim(), answer:x.answer.trim()
        })
        )
      },
      'FAQ atualizada');$('#stat-faq').textContent=rascunhoFaq.length
    }
    catch(error) {
      definirStatus(error.message||textoErro(error), true)
    }
  })
  ;
  $('#home-form').addEventListener('submit', async event=> {
    event.preventDefault();try {
      await writeSection('home', {
        title:$('#home-title').value.trim(), description:$('#home-description').value.trim(), featuredSceneId:Number($('#home-featured').value)||10, notice:$('#home-notice').value.trim(), noticeActive:$('#home-notice-active').checked
      },
      'Página inicial atualizada')
    }
    catch(error) {
      definirStatus(error.message||textoErro(error), true)
    }
  })
  ;
  $('#trailer-form').addEventListener('submit', async event=> {
    event.preventDefault();try {
      const url=$('#trailer-url').value.trim(), thumb=$('#trailer-thumbnail').value.trim();if(url&&!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url))throw new Error('Use um link HTTPS do YouTube.');if(thumb&&!midiaSegura(thumb))throw new Error('A capa precisa usar assets/… ou um endereço HTTPS.');await writeSection('trailer',{title:$('#trailer-title').value.trim(),videoUrl:url,thumbnail:thumb||'assets/scene-02.webp'},'Trailer atualizado')}catch(error){definirStatus(error.message||textoErro(error),true)}});
      $('#settings-form').addEventListener('submit', async event=> {
        event.preventDefault();try {
          const image=$('#seo-image').value.trim();if(image&&!midiaSegura(image))throw new Error('A imagem precisa usar assets/… ou um endereço HTTPS.');await writeSection('settings', {
            title:$('#seo-title').value.trim(), description:$('#seo-description').value.trim(), ogImage:image||'assets/scene-10.webp'
          },
          'Configurações do site atualizadas')
        }
        catch(error) {
          definirStatus(error.message||textoErro(error), true)
        }
      })
      ;
      $('#member-search').addEventListener('input', ()=>renderMembers());$('#refresh-members').addEventListener('click', loadMembers);$('#refresh-activity').addEventListener('click', loadActivity);
      $('#create-member-form').addEventListener('submit', async event=> {
        event.preventDefault();const email=$('#create-member-email').value.trim();try {
          const result=await adminApi('/members', {
            method:'POST', body: {
              email
            }
          })
          ;setMemberStatus(`Conta criada para ${result.user.email}. O convite para definir a senha foi enviado por e-mail.`);$('#create-member-form').reset();await loadMembers()
        }
        catch(error) {
          setMemberStatus(adminApiMessage(error), true)
        }
      })
      ;
      $('#grant-role-form').addEventListener('submit', async event=> {
        event.preventDefault();const email=$('#grant-role-email').value.trim(), role=$('#grant-role-value').value;try {
          const result=await adminApi('/roles', {
            method:'POST', body: {
              email, role
            }
          })
          ;setMemberStatus(result.user.role==='none'?`Acesso administrativo removido de ${result.user.email}.`:`${result.user.email} agora tem papel ${result.user.role}.`);$('#grant-role-form').reset();await loadMembers()
        }
        catch(error) {
          setMemberStatus(adminApiMessage(error), true)
        }
      })
      ;
      $('#refresh-analytics').addEventListener('click', loadAnalytics);$('#analytics-range').addEventListener('change', loadAnalytics);
