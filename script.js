
const API_URL =
  "https://script.google.com/macros/s/AKfycbxJCXXQCBWyyys8pMmjjIwGMsgik42QQqdnRxlPsgA3XqcKbDzI64CSvVMbkIHCgb9EDA/exec";

/* Alternar abas */
function openTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".content").forEach((c) => c.classList.remove("active"));

  document.querySelector(`.tab[onclick="openTab('${name}')"]`).classList.add("active");
  document.getElementById(name).classList.add("active");
}

/* Modo escuro + troca de logo */
function toggleDark() {
  document.body.classList.toggle("dark");

  const preto = document.querySelector(".logo-preto");
  const branco = document.querySelector(".logo-branco");
  const lightToggle = document.querySelector(".light-toggle");
  const darkToggle = document.querySelector(".dark-toggle");
  if (document.body.classList.contains("dark")) {
    preto.style.opacity = "0";
    branco.style.opacity = "1";
    branco.style.display = "block";
    darkToggle.style.display = "none";
    lightToggle.style.display = "block";    
  } else {
    preto.style.opacity = "1";
    branco.style.opacity = "0";
  }
}

/* Enviar pedido */
async function enviarPedido() {
  let nome = document.getElementById("nome").value.trim();
  const pedido = document.getElementById("pedido").value.trim();

  if (!pedido) {
    alert("Escreva seu pedido de oração.");
    return;
  }

  if (!nome) nome = "Anônimo";

  document.getElementById("status").innerText = "Enviando...";

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ nome, pedido }),
      cache: "no-store",
    });

    document.getElementById("status").innerText = "🙏 Pedido enviado!";
    document.getElementById("nome").value = "";
    document.getElementById("pedido").value = "";

    carregarPedidos();
    openTab("lista");
  } catch {
    document.getElementById("status").innerText = "Erro ao enviar.";
  }
}

/* Carregar pedidos */
async function carregarPedidos() {
  const container = document.getElementById("listaContainer");
  container.innerHTML = "<p>Carregando...</p>";

  try {
    const res = await fetch(API_URL + "?nocache=" + Date.now(), { cache: "no-store" });
    const dados = await res.json();
    container.innerHTML = "";

    if (!dados || dados.length === 0) {
      container.innerHTML = `<p style="text-align:center; opacity:0.7; margin-top:20px;">Ainda não há pedidos 🙏</p>`;
      return;
    }

    // Ordena por data
    dados.sort((a, b) => new Date(b.data) - new Date(a.data));

    dados.forEach((item) => {
      const id = item.id;
      const reactedKey = "react_done_" + id;

      container.innerHTML += `
        <div class="card">
          <div class="reaction-badge" data-id="${id}">
            🙏 <span>${item.reacoes || 0}</span>
          </div>
          <h3>${item.nome}</h3>
          <p>${item.pedido}</p>
          <div class="date">${item.data}</div>
        </div>`;
    });

    // Ativar reação
    document.querySelectorAll(".reaction-badge").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const reactedKey = "react_done_" + id;

        if (localStorage.getItem(reactedKey)) {
          btn.style.transform = "scale(0.9)";
          setTimeout(() => (btn.style.transform = "scale(1)"), 150);
          return;
        }

        localStorage.setItem(reactedKey, "1");

        // Enviar +1 para o Apps Script e obter o total atualizado
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ reagir: true, id }),
          cache: "no-store",
        });
        const data = await res.json();

        // Atualizar contador com valor real da planilha
        if (data.reacoes !== undefined) {
          btn.querySelector("span").innerText = data.reacoes;
        }

        btn.style.transform = "scale(1.25)";
        setTimeout(() => (btn.style.transform = "scale(1)"), 150);
      });
    });

  } catch (e) {
    container.innerHTML = `<p style="text-align:center; color:gray;">Erro ao carregar.</p>`;
    console.error(e);
  }
}

// Atualização periódica das reações sem recarregar toda a lista
setInterval(async () => {
  const badges = document.querySelectorAll(".reaction-badge");
  if (!badges.length) return;

  try {
    const res = await fetch(API_URL + "?nocache=" + Date.now(), { cache: "no-store" });
    const dados = await res.json();

    dados.forEach((item) => {
      const badge = document.querySelector(`.reaction-badge[data-id='${item.id}']`);
      if (badge) {
        badge.querySelector("span").innerText = item.reacoes || 0;
      }
    });
  } catch (e) {
    console.log("Erro ao atualizar reações:", e);
  }
}, 5000); // a cada 5 segundos

carregarPedidos();

/* Atualização automática */
let ultimoTotal = 0;
setInterval(async () => {
  try {
    const res = await fetch(API_URL + "?check=" + Date.now());
    const dados = await res.json();

    if (dados.length !== ultimoTotal) {
      ultimoTotal = dados.length;
      carregarPedidos();
    }
  } catch {}
}, 10000);

//toggle light mode
function toggleLight() {
  document.body.classList.remove("dark");
  const preto = document.querySelector(".logo-preto");
  const branco = document.querySelector(".logo-branco");
  preto.style.opacity = "1";
  branco.style.opacity = "0";
  document.querySelector(".light-toggle").style.display = "none";
  document.querySelector(".dark-toggle").style.display = "block";
}
