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
