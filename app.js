
"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    main: $("#mainContent"),
    sidebar: $("#sidebar"),
    menuToggle: $("#menuToggle"),
    sidebarScrim: $("#sidebarScrim"),
    createButton: $("#createServerButton"),
    modal: $("#serverModal"),
    closeModal: $("#closeModal"),
    cancelModal: $("#cancelModal"),
    form: $("#serverForm"),
    serverName: $("#serverName"),
    gameType: $("#gameType"),
    serverList: $("#serverList"),
    serverSearch: $("#serverSearch"),
    statusFilter: $("#statusFilter"),
    total: $("#totalServers"),
    running: $("#runningServers"),
    stopped: $("#stoppedServers"),
    toast: $("#toast"),
    breadcrumb: $("#breadcrumbTitle"),
    year: $("#currentYear"),
    navCount: $(".nav-count"),
    helpButton: $("#helpButton")
  };

  const games = {
    samp: {
      name: "SA-MP / open.mp",
      short: "SA",
      className: "samp"
    },
    minecraft: {
      name: "Minecraft",
      short: "MC",
      className: "minecraft"
    },
    cs: {
      name: "Counter-Strike",
      short: "CS",
      className: "cs"
    },
    other: {
      name: "Other Game",
      short: "GM",
      className: "other"
    }
  };

  // Semua data di bawah hanya berada di memori browser.
  // Data akan hilang ketika halaman dimuat ulang.
  // Ini bukan database atau server game sungguhan.
  let servers = [];
  let nextId = 1;
  let toastTimeout = null;
  let lastFocusedElement = null;

  const pageNames = {
    dashboard: "Dashboard",
    servers: "Game Servers",
    templates: "Game Templates",
    activity: "Activity Logs",
    settings: "Settings"
  };

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function showToast(message) {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 3000);
  }

  function updateStats() {
    const runningCount = servers.filter(
      server => server.status === "running"
    ).length;

    const stoppedCount = servers.length - runningCount;

    elements.total.textContent = String(servers.length);
    elements.running.textContent = String(runningCount);
    elements.stopped.textContent = String(stoppedCount);
    elements.navCount.textContent = String(servers.length);
  }

  function getFilteredServers() {
    const search = elements.serverSearch.value
      .trim()
      .toLocaleLowerCase("id-ID");

    const status = elements.statusFilter.value;

    return servers.filter(server => {
      const matchesSearch =
        server.name.toLocaleLowerCase("id-ID").includes(search) ||
        games[server.game].name.toLocaleLowerCase("id-ID").includes(search);

      const matchesStatus =
        status === "all" || server.status === status;

      return matchesSearch && matchesStatus;
    });
  }

  function createServerCard(server) {
    const game = games[server.game];
    const isRunning = server.status === "running";
    const statusLabel = isRunning ? "Demo Running" : "Demo Stopped";

    return `
      <article class="server-card" data-id="${server.id}">
        <div class="server-identity">
          <div class="server-logo ${game.className}">
            ${game.short}
          </div>
          <div class="server-info">
            <h3>${escapeHTML(server.name)}</h3>
            <p>${escapeHTML(game.name)} · Demo #${server.id}</p>
          </div>
        </div>

        <div class="server-meta">
          <span class="server-status ${server.status}">
            <span class="status-dot"></span>
            ${statusLabel}
          </span>
          <small>Node: Belum terhubung</small>
        </div>

        <div class="server-actions">
          <button class="small-button"
            type="button"
            data-action="toggle"
            data-id="${server.id}">
            ${isRunning ? "Stop Demo" : "Start Demo"}
          </button>
          <button class="small-button"
            type="button"
            data-action="details"
            data-id="${server.id}">
            Details
          </button>
          <button class="small-button"
            type="button"
            data-action="delete"
            data-id="${server.id}">
            Delete
          </button>
        </div>
      </article>
    `;
  }

  function renderServers() {
    const filteredServers = getFilteredServers();

    if (filteredServers.length === 0) {
      const hasServers = servers.length > 0;

      elements.serverList.innerHTML = `
        <div class="empty-state">
          <strong>${
            hasServers ? "Tidak ada hasil" : "Belum ada game server"
          }</strong>
          <p>${
            hasServers
              ? "Coba ubah kata pencarian atau filter status."
              : "Buat server demo untuk mencoba tampilan panel."
          }</p>
          ${
            hasServers
              ? ""
              : `<button class="button button-primary"
                  type="button" data-action="create">
                  + Create Demo Server
                </button>`
          }
        </div>
      `;
    } else {
      elements.serverList.innerHTML = filteredServers
        .map(createServerCard)
        .join("");
    }

    updateStats();
  }

  function openModal(game = "samp") {
    if (!elements.modal) return;

    lastFocusedElement = document.activeElement;
    elements.gameType.value = games[game] ? game : "samp";
    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.serverName.focus();
  }

  function closeModal() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  function createDemoServer(event) {
    event.preventDefault();

    const name = elements.serverName.value.trim();
    const game = elements.gameType.value;

    if (name.length < 3 || name.length > 32) {
      showToast("Nama server harus terdiri dari 3–32 karakter.");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(games, game)) {
      showToast("Pilih template game yang tersedia.");
      return;
    }

    const duplicate = servers.some(
      server => server.name.toLocaleLowerCase("id-ID") ===
        name.toLocaleLowerCase("id-ID")
    );

    if (duplicate) {
      showToast("Nama server demo tersebut sudah digunakan.");
      return;
    }

    servers.push({
      id: nextId++,
      name,
      game,
      status: "stopped"
    });

    elements.form.reset();
    elements.gameType.value = "samp";

    closeModal();
    renderServers();
    showToast("Server demo berhasil dibuat. Belum ada mesin game.");
  }

  function findServer(id) {
    return servers.find(server => server.id === Number(id));
  }

  function handleServerAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "create") {
      openModal();
      return;
    }

    const server = findServer(button.dataset.id);

    if (!server) {
      showToast("Data server tidak ditemukan.");
      renderServers();
      return;
    }

    if (action === "toggle") {
      server.status =
        server.status === "running" ? "stopped" : "running";

      renderServers();

      showToast(
        server.status === "running"
          ? "Status demo berubah ke Running. Game belum dijalankan."
          : "Status demo berubah ke Stopped. Tidak ada proses game yang dihentikan."
      );
      return;
    }

    if (action === "details") {
      showToast(
        `${server.name} · ${games[server.game].name} · Demo, belum terhubung ke node.`
      );
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `Hapus data demo "${server.name}" dari halaman ini?`
      );

      if (!confirmed) return;

      servers = servers.filter(item => item.id !== server.id);
      renderServers();
      showToast("Data server demo dihapus dari memori browser.");
    }
  }

  function setPage(page) {
    if (!Object.prototype.hasOwnProperty.call(pageNames, page)) {
      return;
    }

    $$(".nav-link").forEach(link => {
      const active = link.dataset.page === page;
      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    elements.breadcrumb.textContent = pageNames[page];

    if (page === "dashboard" || page === "servers") {
      elements.main.scrollIntoView({ behavior: "smooth" });

      if (page === "servers") {
        $("#serverSearch").focus({ preventScroll: true });
      }

      closeSidebar();
      return;
    }

    const messages = {
      templates: "Katalog template akan dikembangkan pada tahap berikutnya.",
      activity: "Activity Logs memerlukan sistem backend dan database.",
      settings: "Settings akun akan dibuat setelah autentikasi tersedia."
    };

    showToast(messages[page]);
    closeSidebar();
  }

  function closeSidebar() {
    document.body.classList.remove("menu-open");
    elements.menuToggle.setAttribute("aria-expanded", "false");
    elements.menuToggle.setAttribute("aria-label", "Buka navigasi");
  }

  function toggleSidebar() {
    const open = document.body.classList.toggle("menu-open");

    elements.menuToggle.setAttribute("aria-expanded", String(open));
    elements.menuToggle.setAttribute(
      "aria-label",
      open ? "Tutup navigasi" : "Buka navigasi"
    );
  }

  function handleTemplateClick(event) {
    const card = event.target.closest("[data-game]");
    if (!card) return;

    const game = card.dataset.game;

    if (!games[game]) {
      showToast("Template game ini belum tersedia.");
      return;
    }

    openModal(game);
  }

  function init() {
    elements.year.textContent = String(new Date().getFullYear());

    elements.createButton.addEventListener("click", () => openModal());
    elements.closeModal.addEventListener("click", closeModal);
    elements.cancelModal.addEventListener("click", closeModal);
    elements.form.addEventListener("submit", createDemoServer);

    elements.serverSearch.addEventListener("input", renderServers);
    elements.statusFilter.addEventListener("change", renderServers);
    elements.serverList.addEventListener("click", handleServerAction);
    $("#templateGrid").addEventListener("click", handleTemplateClick);

    elements.menuToggle.addEventListener("click", toggleSidebar);
    elements.sidebarScrim.addEventListener("click", closeSidebar);

    elements.helpButton.addEventListener("click", () => {
      showToast(
        "Nusantara Panel v1.0 — fondasi frontend. Backend belum terhubung."
      );
    });

    $$(".nav-link, [data-page]").forEach(link => {
      link.addEventListener("click", event => {
        const page = link.dataset.page;
        if (!page) return;

        event.preventDefault();
        setPage(page);
        history.replaceState(null, "", `#${page}`);
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        if (!elements.modal.hidden) {
          closeModal();
        } else {
          closeSidebar();
        }
      }
    });

    elements.modal.addEventListener("click", event => {
      if (event.target === elements.modal) {
        closeModal();
      }
    });

    const initialPage = window.location.hash.slice(1);
    if (pageNames[initialPage]) {
      setPage(initialPage);
    }

    renderServers();
  }

  init();
})();
