/*
  Jogo da Memória - javascript.js
  Arquivo corrigido: garante que os botões "Alternar Tema" e "Pedir Dica"
  funcionem corretamente. Listeners são anexados após DOMContentLoaded.
  Código comentado e organizado para facilitar manutenção.
*/

document.addEventListener("DOMContentLoaded", () => {
  // elementos do DOM (já existem no index.html)
  const tabuleiro = document.getElementById("tabuleiro");
  const resultado = document.getElementById("resultado");
  const comecar = document.getElementById("comecar");
  const btnTema = document.getElementById("btnTema") || document.querySelector("[id='btnTema']");
  const btnDica = document.getElementById("btnDica");
  const tentativasRestantesEl = document.getElementById("tentativasRestantes");

  // Configurações e estado do jogo
  const cartas = [
    { id: 1, nome: "Java" },
    { id: 2, nome: "JS" },
    { id: 3, nome: "Kotlin" },
    { id: 4, nome: "React" }
  ];

  const imagensMap = {
    1: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect fill='%23f8981d' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='40' fill='white'>Java</text></svg>",
    2: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect fill='%23f0db4f' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='%23000'>JS</text></svg>",
    3: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect fill='%237f52ff' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='32' fill='white'>Kotlin</text></svg>",
    4: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect fill='%2361dafb' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='32' fill='%23000'>React</text></svg>"
  };

  const verso = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect fill='%23ddd' width='100%25' height='100%25'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='%23666'>?</text></svg>";

  let baralho = [];         // cartas duplicadas e embaralhadas
  let primeiro = null;      // índice da primeira carta virada
  let travado = false;      // evita cliques enquanto verifica ou dica ativa
  let paresEncontrados = 0; // contador de pares
  let tentativas = 0;       // tentativas realizadas (pares testados)
  let vitorias = JSON.parse(localStorage.getItem("vitorias_memoria")) || [];

  // Funcionalidade 3: limite de tentativas
  const limiteTentativas = 20;
  let tentativasRestantes = limiteTentativas;

  // Embaralhador (Fisher-Yates)
  function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Cria o baralho duplicando e embaralhando
  function criarBaralho() {
    baralho = embaralhar([...cartas, ...cartas].map((c, idx) => ({ ...c, _idx: idx })));
    primeiro = null;
    travado = false;
    paresEncontrados = 0;
    tentativas = 0;
    tentativasRestantes = limiteTentativas;
    resultado.textContent = "0 pares encontrados";
  }

  // Monta o tabuleiro no DOM
  function criarTabuleiro() {
    tabuleiro.innerHTML = "";
    baralho.forEach((carta, i) => {
      const img = document.createElement("img");
      img.src = verso;
      img.dataset.index = i;
      img.className = "carta";
      img.addEventListener("click", virarCarta);
      tabuleiro.appendChild(img);
    });
    atualizarIndicadores();
  }

  // Atualiza placar e tentativas restantes
  function atualizarIndicadores() {
    const placarEl = document.getElementById("placar") || criarPlacar();
    const totalV = vitorias.length;
    const melhor = totalV ? Math.min(...vitorias) : "-";
    const ultima = totalV ? vitorias[totalV - 1] : "-";
    placarEl.textContent = `Vitórias: ${totalV} • Última: ${ultima} tentativas • Melhor: ${melhor}`;
    resultado.textContent = paresEncontrados === cartas.length ? "Parabéns! Você encontrou todas as cartas." : `${paresEncontrados} pares encontrados`;
    tentativasRestantesEl.textContent = `Tentativas Restantes: ${tentativasRestantes}`;
  }

  function criarPlacar() {
    const controle = document.getElementById("controle");
    const div = document.createElement("div");
    div.id = "placar";
    div.style.marginLeft = "12px";
    div.style.fontWeight = "600";
    controle.appendChild(div);
    return div;
  }

  // Função chamada ao clicar em uma carta
  function virarCarta(e) {
    if (travado) return;
    const img = e.currentTarget;
    const idx = Number(img.dataset.index);

    // ignora se já acertada ou clicou duas vezes na mesma
    if (img.classList.contains("acertou") || primeiro === idx) return;

    // mostra face
    img.src = imagensMap[baralho[idx].id];

    if (primeiro === null) {
      primeiro = idx;
      return;
    }

    // segunda carta: trava e verifica
    travado = true;
    const segundo = idx;
    const primeiraCarta = baralho[primeiro];
    const segundaCarta = baralho[segundo];

    // conta tentativa (um par testado)
    tentativas += 1;

    setTimeout(() => {
      const imgs = tabuleiro.querySelectorAll("img");
      if (primeiraCarta.id === segundaCarta.id) {
        imgs[primeiro].classList.add("acertou");
        imgs[segundo].classList.add("acertou");
        paresEncontrados++;
      } else {
        // errou: volta as cartas e decrementa tentativas restantes
        imgs[primeiro].src = verso;
        imgs[segundo].src = verso;
        tentativasRestantes -= 1;

        // checa derrota
        if (tentativasRestantes <= 0) {
          // GAME OVER: bloqueia interações e avisa usuário
          bloquearTabuleiro();
          alert("GAME OVER");
          resultado.textContent = "GAME OVER — reinicie para jogar novamente.";
          atualizarIndicadores();
          return; // não reativa o jogo
        }
      }

      // reset de estado (se não houve game over)
      primeiro = null;
      travado = false;

      // se venceu, registra tentativas no histórico
      if (paresEncontrados === cartas.length) {
        vitorias.push(tentativas);
        localStorage.setItem("vitorias_memoria", JSON.stringify(vitorias));
      }

      atualizarIndicadores();
    }, 700);
  }

  // Bloqueia o tabuleiro (remove listeners) — usado em GAME OVER
  function bloquearTabuleiro() {
    travado = true;
    const imgs = tabuleiro.querySelectorAll("img");
    imgs.forEach(img => {
      img.removeEventListener("click", virarCarta);
    });
  }

  // Desbloqueia (re-adiciona listeners) — usado ao reiniciar
  function desbloquearTabuleiro() {
    const imgs = tabuleiro.querySelectorAll("img");
    imgs.forEach(img => {
      if (!img.classList.contains("acertou")) {
        img.addEventListener("click", virarCarta);
      }
    });
    travado = false;
  }

  // aplica tema salvo (persistência) ao carregar
  const temaSalvo = localStorage.getItem("temaEscuro") === "1";
  if (temaSalvo) {
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark-mode"); // redundante para maior cobertura
    if (btnTema) btnTema.textContent = "Desativar Modo Escuro";
  } else {
    if (btnTema) btnTema.textContent = "Ativar Modo Escuro";
  }

  /* =============================
     Funcionalidade 1: Tema Escuro (corrigido)
     - Alterna classe 'dark-mode' no <body> e <html>
     - Persiste escolha no localStorage
     - Atualiza texto do botão
     ============================= */
  function alternarTema() {
    // garante que o botão exista
    if (!btnTema) return;

    const ativo = document.body.classList.toggle("dark-mode");
    // também marca no <html> para regras CSS que possam usar :root/escopo
    document.documentElement.classList.toggle("dark-mode", ativo);

    // atualiza texto do botão
    btnTema.textContent = ativo ? "Desativar Modo Escuro" : "Ativar Modo Escuro";

    // persiste escolha
    localStorage.setItem("temaEscuro", ativo ? "1" : "0");
  }

  // conecta listener do botão de tema (se existir)
  if (btnTema) btnTema.addEventListener("click", alternarTema);

  /* =============================
     Funcionalidade 2: Pedir Dica
     - Revela temporariamente (3s) um par ainda não encontrado
     - Usa classe .flipped para efeito visual
     ============================= */
  function pedirDica() {
    // não permite dica enquanto o jogo está travado ou já há uma carta selecionada
    if (travado || primeiro !== null) return;

    const imgs = tabuleiro.querySelectorAll("img");

    // mapa id -> índices disponíveis (não acertados)
    const mapa = {};
    baralho.forEach((c, idx) => {
      if (!imgs[idx].classList.contains("acertou")) {
        mapa[c.id] = mapa[c.id] || [];
        mapa[c.id].push(idx);
      }
    });

    // encontra um par disponível
    let par = null;
    for (const id in mapa) {
      if (mapa[id].length >= 2) {
        par = [mapa[id][0], mapa[id][1]];
        break;
      }
    }

    if (!par) return; // nenhum par disponível para dica

    const [i1, i2] = par;
    // revela as cartas da dica
    imgs[i1].src = imagensMap[baralho[i1].id];
    imgs[i2].src = imagensMap[baralho[i2].id];
    imgs[i1].classList.add("flipped");
    imgs[i2].classList.add("flipped");

    // bloqueia interações durante a dica
    travado = true;

    setTimeout(() => {
      // se durante o tempo de dica as cartas não foram acertadas, vira-as de volta
      if (!imgs[i1].classList.contains("acertou")) {
        imgs[i1].src = verso;
        imgs[i1].classList.remove("flipped");
      }
      if (!imgs[i2].classList.contains("acertou")) {
        imgs[i2].src = verso;
        imgs[i2].classList.remove("flipped");
      }
      travado = false;
    }, 3000);
  }

  // conecta listener do botão de dica (se existir)
  if (btnDica) btnDica.addEventListener("click", pedirDica);

  // reiniciar/começar jogo
  comecar.addEventListener("click", () => {
    criarBaralho();
    criarTabuleiro();
    desbloquearTabuleiro();
    atualizarIndicadores();
  });

  // inicia uma partida ao abrir a página
  criarBaralho();
  criarTabuleiro();
  atualizarIndicadores();
});

