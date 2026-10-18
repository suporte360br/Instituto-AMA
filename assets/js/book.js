// Montador de book de preces: escolhe orações e fotos e monta páginas A4 para imprimir/salvar em PDF.
// As fotos são lidas só no navegador (URL.createObjectURL); nada é enviado para servidor.
(() => {
  const ORACOES = window.ORACOES || [];
  const PADRAO = ['pai-nosso', 'ave-maria', 'prece-de-caritas', 'oracao-do-perdao', 'oracao-de-sao-francisco'];
  const MENSAGENS = [
    { texto: 'Fora da caridade não há salvação.', autor: 'Allan Kardec' },
    { texto: 'Estude a si mesmo, observando que o autoconhecimento traz humildade, e sem humildade é impossível ser feliz.', autor: '' },
    { texto: 'Perdoe quem te ofendeu, quem não te ajudou, quem pouco se importou, quem tentou te prejudicar. Perdoe para que tudo te vá bem, e continue a sua vida sem fardos desnecessários. O perdão é liberta(dor).', autor: '' },
  ];
  const EXEMPLO = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ src: `../assets/img/book/exemplo-${n}.svg`, exemplo: true }));
  const W = 794, H = 1123; // A4 a 96 dpi

  const $ = (id) => document.getElementById(id);
  const lista = $('b-lista'), book = $('book'), miniaturas = $('b-miniaturas');
  if (!lista || !book) return;

  // ordem e seleção das orações
  let ordem = ORACOES.map((o) => ({ ...o, marcada: PADRAO.includes(o.slug) }));
  let fotos = [];

  function desenharLista() {
    lista.innerHTML = '';
    ordem.forEach((o, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<label><input type="checkbox"${o.marcada ? ' checked' : ''}> <span></span></label>
        <span class="b-setas"><button type="button" aria-label="Subir">&uarr;</button><button type="button" aria-label="Descer">&darr;</button></span>`;
      li.querySelector('span').textContent = o.titulo;
      li.querySelector('input').addEventListener('change', (e) => { o.marcada = e.target.checked; montar(); });
      const [sobe, desce] = li.querySelectorAll('.b-setas button');
      sobe.disabled = i === 0; desce.disabled = i === ordem.length - 1;
      sobe.addEventListener('click', () => mover(i, -1));
      desce.addEventListener('click', () => mover(i, 1));
      lista.appendChild(li);
    });
  }
  function mover(i, d) {
    const [o] = ordem.splice(i, 1); ordem.splice(i + d, 0, o);
    desenharLista(); montar();
    lista.children[i + d].querySelectorAll('.b-setas button')[d < 0 ? 0 : 1].focus();
  }
  $('b-todas').addEventListener('click', () => { ordem.forEach((o) => { o.marcada = true; }); desenharLista(); montar(); });
  $('b-nenhuma').addEventListener('click', () => { ordem.forEach((o) => { o.marcada = false; }); desenharLista(); montar(); });

  function desenharMiniaturas() {
    miniaturas.innerHTML = '';
    fotos.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<img alt=""><button type="button" aria-label="Remover foto">&times;</button>';
      li.querySelector('img').src = f.src;
      li.querySelector('button').addEventListener('click', () => {
        if (!f.exemplo) URL.revokeObjectURL(f.src);
        fotos.splice(i, 1); desenharMiniaturas(); montar();
      });
      miniaturas.appendChild(li);
    });
  }
  $('b-fotos').addEventListener('change', (e) => {
    [...e.target.files].filter((a) => a.type.startsWith('image/')).forEach((a) => fotos.push({ src: URL.createObjectURL(a) }));
    e.target.value = '';
    desenharMiniaturas(); montar();
  });

  function carregarExemplo() {
    fotos.filter((f) => !f.exemplo).forEach((f) => URL.revokeObjectURL(f.src));
    fotos = EXEMPLO.map((f) => ({ ...f }));
    ordem.forEach((o) => { o.marcada = true; });
    $('b-titulo').value = 'Book de Preces';
    $('b-sub').value = 'Família Exemplo';
    desenharLista(); desenharMiniaturas(); montar();
  }
  $('b-exemplo').addEventListener('click', carregarExemplo);
  ['b-titulo', 'b-sub', 'b-mensagens'].forEach((id) => $(id).addEventListener('input', montar));
  $('b-mensagens').addEventListener('change', montar);

  // ----- montagem das páginas -----
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function novaPagina(tipo) {
    const folha = el('div', 'folha');
    const pag = el('div', `pagina pagina-${tipo}`);
    const miolo = el('div', 'miolo');
    pag.appendChild(miolo); folha.appendChild(pag);
    return { folha, miolo };
  }
  function grade(fs) {
    const g = el('div', `fotos fotos-${Math.min(fs.length, 5)}`);
    fs.forEach((f) => { const img = el('img'); img.src = f.src; img.alt = ''; g.appendChild(img); });
    return g;
  }
  const transborda = (m) => m.scrollHeight > m.clientHeight + 1;

  function montar() {
    book.innerHTML = '';
    const paginas = [];
    const titulo = $('b-titulo').value.trim() || 'Book de Preces';
    const sub = $('b-sub').value.trim();

    // capa
    const capa = novaPagina('capa');
    const cab = el('div', 'capa-texto');
    cab.appendChild(el('h1')).textContent = titulo;
    if (sub) cab.appendChild(el('p')).textContent = sub;
    capa.miolo.appendChild(cab);
    const naCapa = fotos.slice(0, Math.min(5, fotos.length));
    if (naCapa.length) capa.miolo.appendChild(grade(naCapa));
    else capa.miolo.appendChild(el('div', 'capa-enfeite', '&#10047;'));
    book.appendChild(capa.folha); paginas.push(capa.folha);

    // orações: preenche a página e passa para a próxima quando não couber (divide por parágrafo)
    const escolhidas = ordem.filter((o) => o.marcada);
    const paginasOracao = [];
    let atual = null;
    const abrir = () => { atual = novaPagina('oracao'); book.appendChild(atual.folha); paginasOracao.push(atual.folha); };
    escolhidas.forEach((o) => {
      if (!atual) abrir();
      const bloco = el('section', 'b-oracao');
      bloco.appendChild(el('h2')).textContent = o.titulo;
      if (o.autoria) bloco.appendChild(el('p', 'b-autoria')).textContent = o.autoria;
      atual.miolo.appendChild(bloco);
      const partes = [...el('div', null, o.html).children];
      // título não fica sozinho no pé da página
      bloco.appendChild(partes[0]);
      if (transborda(atual.miolo) && atual.miolo.children.length > 1) {
        bloco.remove(); abrir(); atual.miolo.appendChild(bloco);
      }
      let destino = bloco;
      for (const p of partes.slice(1)) {
        destino.appendChild(p);
        if (transborda(atual.miolo)) {
          // não coube: o parágrafo abre a próxima página, num bloco de continuação
          p.remove();
          abrir();
          destino = el('section', 'b-oracao b-continua');
          destino.appendChild(p);
          atual.miolo.appendChild(destino);
        }
      }
    });
    paginas.push(...paginasOracao);

    // fotos restantes em páginas de até 4, intercaladas entre as orações
    const resto = fotos.slice(naCapa.length);
    const paginasFoto = [];
    for (let i = 0; i < resto.length; i += 4) {
      const p = novaPagina('fotos');
      p.miolo.appendChild(grade(resto.slice(i, i + 4)));
      paginasFoto.push(p.folha);
    }
    const passo = (paginasOracao.length + 1) / (paginasFoto.length + 1);
    paginasFoto.forEach((pf, i) => {
      const alvo = paginasOracao[Math.round(passo * (i + 1))];
      if (alvo) book.insertBefore(pf, alvo); else book.appendChild(pf);
    });

    // mensagens e contracapa
    if ($('b-mensagens').checked) {
      const m = novaPagina('mensagens');
      MENSAGENS.forEach((x) => {
        const q = el('blockquote', 'b-mensagem');
        q.appendChild(el('p')).textContent = x.texto;
        if (x.autor) q.appendChild(el('cite')).textContent = x.autor;
        m.miolo.appendChild(q);
      });
      book.appendChild(m.folha);
    }
    const fim = novaPagina('fim');
    fim.miolo.innerHTML = '<p>Montado com carinho no site do<br><strong>Instituto AMA</strong><br>institutoama.social.br</p>';
    book.appendChild(fim.folha);

    const total = book.children.length;
    $('b-contagem').textContent = `${total} páginas · ${escolhidas.length} ${escolhidas.length === 1 ? 'oração' : 'orações'} · ${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`;
    escala();
  }

  function escala() {
    const k = Math.min(1, book.clientWidth / W);
    book.style.setProperty('--k', k);
  }
  window.addEventListener('resize', escala);

  // impressão: copia as páginas para um contêiner direto no <body>
  // (também no Ctrl+P, pelo evento beforeprint)
  const tituloPagina = document.title;
  function prepararImpressao() {
    let imp = $('impressao');
    if (imp) imp.remove();
    imp = el('div'); imp.id = 'impressao';
    [...book.querySelectorAll('.pagina')].forEach((p) => imp.appendChild(p.cloneNode(true)));
    document.body.appendChild(imp);
    document.title = ($('b-titulo').value.trim() || 'Book de Preces') + ($('b-sub').value.trim() ? ` - ${$('b-sub').value.trim()}` : '');
    return imp;
  }
  window.addEventListener('beforeprint', prepararImpressao);
  window.addEventListener('afterprint', () => { document.title = tituloPagina; });
  $('b-imprimir').addEventListener('click', () => {
    const imgs = [...prepararImpressao().querySelectorAll('img')];
    Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => window.print());
  });

  desenharLista();
  if (new URLSearchParams(location.search).has('exemplo')) carregarExemplo(); else montar();
})();
