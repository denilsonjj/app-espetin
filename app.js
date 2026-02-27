(() => {
  const STORAGE_KEYS = {
    day: "currentDayKey",
    total: "total",
    lastAction: "lastAction"
  };

  const PRODUCTS = [
    { id: "carne", name: "Espetinho de carne", price: 6, icon: "🍢" },
    { id: "frango", name: "Espetinho de frango", price: 6, icon: "🍗" },
    { id: "coxinha", name: "Coxinha", price: 4, icon: "🥟" },
    { id: "bolo", name: "Bolo", price: 5, icon: "🍰" }
  ];

  const totalEl = document.getElementById("total");
  const dateEl = document.getElementById("currentDate");
  const badgeEl = document.getElementById("networkBadge");
  const productGrid = document.getElementById("productGrid");
  const resetBtn = document.getElementById("resetBtn");
  const undoBtn = document.getElementById("undoBtn");

  let state = {
    day: "",
    total: 0,
    lastAction: null
  };

  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const dateFmt = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.day, state.day);
    localStorage.setItem(STORAGE_KEYS.total, String(state.total));
    if (state.lastAction) {
      localStorage.setItem(STORAGE_KEYS.lastAction, JSON.stringify(state.lastAction));
    } else {
      localStorage.removeItem(STORAGE_KEYS.lastAction);
    }
  }

  function loadState() {
    const savedDay = localStorage.getItem(STORAGE_KEYS.day);
    const savedTotal = Number(localStorage.getItem(STORAGE_KEYS.total) || 0);
    const savedLastActionRaw = localStorage.getItem(STORAGE_KEYS.lastAction);

    let savedLastAction = null;
    if (savedLastActionRaw) {
      try {
        savedLastAction = JSON.parse(savedLastActionRaw);
      } catch {
        savedLastAction = null;
      }
    }

    state.day = savedDay || "";
    state.total = Number.isFinite(savedTotal) ? savedTotal : 0;
    state.lastAction = savedLastAction;

    ensureCurrentDay();
  }

  function ensureCurrentDay() {
    const today = getTodayKey();
    if (state.day === today) return;
    state.day = today;
    state.total = 0;
    state.lastAction = null;
    saveState();
  }

  function updateUI() {
    totalEl.textContent = money.format(state.total);
    dateEl.textContent = `Data: ${dateFmt.format(new Date())}`;
    undoBtn.disabled = !state.lastAction;
  }

  function pulseVibration() {
    if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }
  }

  function addSale(product) {
    ensureCurrentDay();
    state.total += product.price;
    state.lastAction = {
      type: "add",
      amount: product.price,
      productId: product.id,
      timestamp: Date.now()
    };
    saveState();
    updateUI();
    pulseVibration();
  }

  function undoLastAction() {
    ensureCurrentDay();
    if (!state.lastAction || state.lastAction.type !== "add") return;
    state.total = Math.max(0, state.total - Number(state.lastAction.amount || 0));
    state.lastAction = null;
    saveState();
    updateUI();
  }

  function resetDay() {
    ensureCurrentDay();
    state.day = getTodayKey();
    state.total = 0;
    state.lastAction = null;
    saveState();
    updateUI();
    pulseVibration();
  }

  function renderProducts() {
    const fragment = document.createDocumentFragment();

    PRODUCTS.forEach((product) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "product-btn";
      btn.setAttribute("aria-label", `${product.name} ${money.format(product.price)}`);
      btn.innerHTML = `
        <span class="product-icon" aria-hidden="true">${product.icon}</span>
        <span class="product-name">${product.name}</span>
        <span class="product-price">${money.format(product.price)}</span>
      `;
      btn.addEventListener("click", () => addSale(product));
      fragment.appendChild(btn);
    });

    productGrid.appendChild(fragment);
  }

  function updateNetworkBadge() {
    if (navigator.onLine) {
      badgeEl.textContent = "Online";
      badgeEl.classList.remove("offline");
      badgeEl.classList.add("online");
    } else {
      badgeEl.textContent = "Offline";
      badgeEl.classList.remove("online");
      badgeEl.classList.add("offline");
    }
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          // Sem bloqueio para uso local.
        });
      });
    }
  }

  function init() {
    loadState();
    renderProducts();
    updateUI();
    updateNetworkBadge();

    resetBtn.addEventListener("click", resetDay);
    undoBtn.addEventListener("click", undoLastAction);
    window.addEventListener("online", updateNetworkBadge);
    window.addEventListener("offline", updateNetworkBadge);

    registerServiceWorker();
  }

  init();
})();
