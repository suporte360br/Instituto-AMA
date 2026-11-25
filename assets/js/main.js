// Garante HTTPS no domínio oficial (se o navegador abrir uma cópia antiga em http)
if (location.protocol === 'http:' && location.hostname.endsWith('institutoama.social.br')) {
  location.replace('https://institutoama.social.br' + location.pathname + location.search + location.hash);
}

// Menu mobile
const botaoMenu = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
if (botaoMenu && menu) {
  botaoMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', aberto);
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') menu.classList.remove('aberto');
  });
}

// Formulário de contato: monta um e-mail pronto (o site é estático, sem servidor)
const EMAIL_DESTINO = 'contato@institutoama.social.br';
const form = document.getElementById('form-contato');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const assunto = `Contato pelo site - ${d.get('nome')}`;
    const corpo = [
      `Nome: ${d.get('nome')}`,
      `Telefone: ${d.get('telefone')}`,
      `E-mail: ${d.get('email')}`,
      '',
      d.get('mensagem'),
    ].join('\n');
    window.location.href = `mailto:${EMAIL_DESTINO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  });
}

const ano = document.getElementById('ano');
if (ano) ano.textContent = new Date().getFullYear();

// Blog: filtro de temas e busca (índice em blog/busca.json)
const filtros = document.querySelectorAll('.filtro');
const campoBusca = document.getElementById('busca-q');
const infoBusca = document.getElementById('busca-info');
let catAtual = '';
let indice = null;
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const carregarIndice = () => indice || (indice = fetch('busca.json').then((r) => r.json()).catch(() => []));
async function aplicarFiltros() {
  const cartoes = document.querySelectorAll('#materias .cartao');
  const termo = campoBusca ? semAcento(campoBusca.value.trim()) : '';
  const palavras = termo.split(/s+/).filter((p) => p.length > 1);
  let mapa = null;
  if (palavras.length) {
    const lista = await carregarIndice();
    mapa = {};
    lista.forEach((m) => { mapa[m.s] = { topo: semAcento(m.t), meio: semAcento(m.c + ' ' + m.r), corpo: m.x }; });
  }
  const grade = document.getElementById('materias');
  if (grade && !grade.dataset.ordem) cartoes.forEach((c, i) => { c.dataset.ordem = i; grade.dataset.ordem = '1'; });
  const conta = (txt, p) => txt.split(p).length - 1;
  let visiveis = 0;
  cartoes.forEach((c) => {
    const slug = (c.getAttribute('href') || '').replace(/.html$/, '');
    const okCat = catAtual === '' || c.dataset.cat === catAtual;
    let pontos = 0;
    let okBusca = true;
    if (mapa) {
      const m = mapa[slug] || { topo: semAcento(c.textContent), meio: '', corpo: '' };
      okBusca = palavras.every((p) => m.topo.includes(p) || m.meio.includes(p) || m.corpo.includes(p));
      palavras.forEach((p) => { pontos += conta(m.topo, p) * 100 + conta(m.meio, p) * 30 + Math.min(conta(m.corpo, p), 20); });
    }
    c.dataset.pontos = pontos;
    c.hidden = !(okCat && okBusca);
    if (!c.hidden) visiveis++;
  });
  if (grade) {
    [...cartoes].sort((a, b) => (mapa ? b.dataset.pontos - a.dataset.pontos : 0) || a.dataset.ordem - b.dataset.ordem)
      .forEach((c) => grade.appendChild(c));
  }
  if (infoBusca) {
    infoBusca.textContent = palavras.length
      ? (visiveis ? `${visiveis} matéria${visiveis > 1 ? 's' : ''} encontrada${visiveis > 1 ? 's' : ''} para “${campoBusca.value.trim()}”.` : `Nenhuma matéria encontrada para “${campoBusca.value.trim()}”. Tente outra palavra.`)
      : '';
  }
}
filtros.forEach((botao) => {
  botao.addEventListener('click', () => {
    filtros.forEach((b) => b.classList.toggle('ativo', b === botao));
    catAtual = botao.dataset.cat;
    aplicarFiltros();
  });
});
if (campoBusca) {
  let espera;
  campoBusca.addEventListener('focus', carregarIndice, { once: true });
  campoBusca.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(aplicarFiltros, 200); });
  campoBusca.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = new URL(location.href);
    if (campoBusca.value.trim()) url.searchParams.set('q', campoBusca.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    aplicarFiltros();
  });
  const q = new URLSearchParams(location.search).get('q');
  if (q) { campoBusca.value = q; aplicarFiltros(); }
}

// Campanhas: selo de situação pela data e carrossel
const hoje = new Date().toISOString().slice(0, 10);
document.querySelectorAll('.campanha').forEach((c) => {
  const selo = c.querySelector('.status');
  if (!selo) return;
  if (c.dataset.fim && hoje > c.dataset.fim) { selo.textContent = 'Encerrada'; selo.className = 'status encerrada'; }
  else if (c.dataset.inicio && hoje < c.dataset.inicio) { selo.textContent = 'Em breve'; selo.className = 'status em-breve'; }
  else { selo.textContent = 'Ativa'; selo.className = 'status'; }
});

document.querySelectorAll('.carrossel').forEach((car) => {
  const trilho = car.querySelector('.carrossel-trilho');
  const slides = [...trilho.children];
  const pontos = car.querySelector('.carrossel-pontos');
  const [antes, depois] = car.querySelectorAll('.carrossel-btn');
  const pos = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
  let idx = 0;
  const atualizar = () => {
    [...pontos.children].forEach((b, j) => b.setAttribute('aria-selected', idx === j));
    antes.disabled = idx === 0;
    depois.disabled = idx >= slides.length - 1;
  };
  const ir = (i) => {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    trilho.scrollTo({ left: pos(idx) });
    atualizar();
  };
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Campanha ${i + 1} de ${slides.length}`);
    b.addEventListener('click', () => ir(i));
    pontos.appendChild(b);
  });
  antes.addEventListener('click', () => ir(idx - 1));
  depois.addEventListener('click', () => ir(idx + 1));
  // Arrastar com o dedo: descobre o slide mais próximo quando a rolagem para
  let espera;
  trilho.addEventListener('scroll', () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      idx = slides.reduce((m, s, i) => (Math.abs(pos(i) - trilho.scrollLeft) < Math.abs(pos(m) - trilho.scrollLeft) ? i : m), 0);
      atualizar();
    }, 120);
  });
  trilho.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') ir(idx + 1);
    if (e.key === 'ArrowLeft') ir(idx - 1);
  });
  if (slides.length < 2) car.querySelector('.carrossel-controles').hidden = true;
  atualizar();
});

// Referências: mostra só os primeiros itens de cada bloco, com botão "Ver todos"
document.querySelectorAll('.grade[data-limite]').forEach((grade) => {
  const limite = Number(grade.dataset.limite);
  const itens = [...grade.children];
  if (itens.length <= limite) return;
  const extras = itens.slice(limite);
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'ver-todos';
  const fechar = () => { extras.forEach((i) => { i.hidden = true; }); botao.textContent = `Ver todos (${itens.length})`; botao.setAttribute('aria-expanded', 'false'); };
  botao.addEventListener('click', () => {
    if (botao.getAttribute('aria-expanded') === 'true') { fechar(); grade.scrollIntoView({ block: 'start' }); }
    else { extras.forEach((i) => { i.hidden = false; }); botao.textContent = 'Ver menos'; botao.setAttribute('aria-expanded', 'true'); }
  });
  grade.after(botao);
  fechar();
});

// Referências: destaca no menu de atalhos a seção que está na tela
const atalhos = document.querySelectorAll('.atalhos a');
if (atalhos.length && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) atalhos.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  atalhos.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
}
// ao clicar, o atalho escolhido já fica destacado
atalhos.forEach((a) => a.addEventListener('click', () => atalhos.forEach((b) => b.classList.toggle('ativo', b === a))));

// Orações: botão "Imprimir ou salvar em PDF"
document.querySelectorAll('[data-imprimir]').forEach((b) => b.addEventListener('click', () => window.print()));
