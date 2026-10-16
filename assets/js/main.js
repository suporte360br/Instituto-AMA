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

// Filtro de temas no blog
const filtros = document.querySelectorAll('.filtro');
filtros.forEach((botao) => {
  botao.addEventListener('click', () => {
    filtros.forEach((b) => b.classList.toggle('ativo', b === botao));
    const cat = botao.dataset.cat;
    document.querySelectorAll('#materias .cartao').forEach((c) => {
      c.hidden = cat !== '' && c.dataset.cat !== cat;
    });
  });
});

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
