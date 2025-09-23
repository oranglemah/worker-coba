/**
 * JavaScript for the link generator page
 */

// Declare QRCode variable
const QRCode = window.QRCode;

// Global variables
let proxyList = [];
let filteredProxyList = [];
let selectedProxy = null;
const defaultProxyUrl =
  "https://raw.githubusercontent.com/AFRcloud/ProxyList/refs/heads/main/ProxyList.txt ";

// === Server domains (merge + dedupe) ===
const DEFAULT_SERVER_DOMAINS = [
  "sirtu.oranglemah.my.id",
  "dia.oranglemah.web.id",
];

// Ambil dari window.SERVER_DOMAINS kalau ada (dukung array/string), lalu gabungkan dengan default
(function initServerDomains() {
  const raw = window.SERVER_DOMAINS;
  let injected = [];

  if (Array.isArray(raw)) {
    injected = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    // dukung format string dipisah koma/spasi/baris
    injected = raw
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  window.__SERVER_DOMAINS = Array.from(new Set([...(injected || []), ...DEFAULT_SERVER_DOMAINS]));
})();

const serverDomains = window.__SERVER_DOMAINS;
let selectedServerDomain = serverDomains[0];
console.log("serverDomains =", serverDomains);

const defaultUUID = "8febb7c9-a664-4b16-bbc5-563b099a4860";
const itemsPerPage = 10;
let currentPage = 1;

const pathTemplate = "/Free/{ip}-{port}";

// Array of bug options for easy management
const bugOptions = [
  { value: "", label: "Default" },
  { value: "support.zoom.us", label: "ZOOM" },
  { value: "ava.game.naver.com", label: "AVA" },
  { value: "api.midtrans.com", label: "MIDTRANS" },
];

// DOM elements
const proxyListSection = document.getElementById("proxy-list-section");
const accountCreationSection = document.getElementById("account-creation-section");
const resultSection = document.getElementById("result-section");
const loadingIndicator = document.getElementById("loading-indicator");
const proxyListContainer = document.getElementById("proxy-list-container");
const noProxiesMessage = document.getElementById("no-proxies-message");
const customUrlInput = document.getElementById("custom-url-input");
const proxyUrlInput = document.getElementById("proxy-url");
const paginationContainer = document.getElementById("pagination-container");
const proxyCountInfo = document.getElementById("proxy-count-info");
const searchInput = document.getElementById("search-input");

// Function to populate bug select dropdowns
function populateBugOptions() {
  const bugSelects = [
    document.getElementById("vmess-bug"),
    document.getElementById("vless-bug"),
    document.getElementById("trojan-bug"),
    document.getElementById("ss-bug"),
  ];

  bugSelects.forEach((el) => {
    if (!el) return;
    // hanya isi kalau memang SELECT
    if (el.tagName !== "SELECT") return;

    el.innerHTML = "";
    bugOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      el.appendChild(o);
    });

    // opsi "Manual"
    const manual = document.createElement("option");
    manual.value = "manual";
    manual.textContent = "Manual";
    el.appendChild(manual);
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Display fallback proxy list immediately to ensure something is visible
  displayFallbackProxyList();

  // Then try to load the actual proxy list
  loadProxyList(defaultProxyUrl);

  // Event listeners
  document.getElementById("refresh-btn").addEventListener("click", () => {
    loadProxyList(defaultProxyUrl);
  });

  document.getElementById("custom-url-btn").addEventListener("click", () => {
    customUrlInput.classList.toggle("hidden");
  });

  document.getElementById("load-custom-url").addEventListener("click", () => {
    const url = proxyUrlInput.value.trim();
    if (url) {
      loadProxyList(url);
    }
  });

  document.getElementById("back-to-list").addEventListener("click", () => {
    showProxyListSection();
  });

  document.getElementById("back-to-form").addEventListener("click", () => {
    resultSection.classList.add("hidden");
    accountCreationSection.classList.remove("hidden");
  });

  document.getElementById("create-new").addEventListener("click", () => {
    resultSection.classList.add("hidden");
    accountCreationSection.classList.remove("hidden");
  });

  document.getElementById("back-to-list-from-result").addEventListener("click", () => {
    showProxyListSection();
  });

  // Search functionality
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();

    if (searchTerm === "") {
      filteredProxyList = [...proxyList];
    } else {
      filteredProxyList = proxyList.filter(
        (proxy) =>
          proxy.provider.toLowerCase().includes(searchTerm) ||
          proxy.country.toLowerCase().includes(searchTerm),
      );
    }

    currentPage = 1;
    renderProxyList();
  });

  // Protocol tabs
  const protocolTabs = document.querySelectorAll(".tab-btn");
  const protocolForms = document.querySelectorAll(".protocol-form");

  protocolTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      protocolTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      protocolForms.forEach((form) => form.classList.add("hidden"));
      const targetId = tab.getAttribute("data-target");
      document.getElementById(targetId).classList.remove("hidden");
    });
  });

  // Populate server domain dropdowns
  const serverDomainSelects = [
    document.getElementById("vmess-server-domain"),
    document.getElementById("vless-server-domain"),
    document.getElementById("trojan-server-domain"),
    document.getElementById("ss-server-domain"),
  ];

  serverDomainSelects.forEach((select) => {
    if (select) {
      // Clear existing options
      select.innerHTML = "";

      // Pastikan punya name="server-domain" agar terbaca FormData.get()
      if (!select.name) select.name = "server-domain";

      // Add options for each domain
      serverDomains.forEach((domain) => {
        const option = document.createElement("option");
        option.value = domain;
        option.textContent = domain;
        select.appendChild(option);
      });

      if (serverDomains.length > 0) {
        select.value = serverDomains[0];
        selectedServerDomain = serverDomains[0];
      }

      // Update global when user changes any dropdown
      select.addEventListener("change", function () {
        selectedServerDomain = this.value;
      });
    }
  });

  // Populate bug options dropdowns
  populateBugOptions();

  // Form submissions
  const forms = [
    document.getElementById("vmess-account-form"),
    document.getElementById("vless-account-form"),
    document.getElementById("trojan-account-form"),
    document.getElementById("ss-account-form"),
  ];

  // Custom Bug dan Wildcard functionality
  const bugInputs = [
    document.getElementById("vmess-bug"),
    document.getElementById("vless-bug"),
    document.getElementById("trojan-bug"),
    document.getElementById("ss-bug"),
  ];

  const wildcardContainers = [
    document.getElementById("vmess-wildcard-container"),
    document.getElementById("vless-wildcard-container"),
    document.getElementById("trojan-wildcard-container"),
    document.getElementById("ss-wildcard-container"),
  ];

  const wildcardCheckboxes = [
    document.getElementById("vmess-wildcard"),
    document.getElementById("vless-wildcard"),
    document.getElementById("trojan-wildcard"),
    document.getElementById("ss-wildcard"),
  ];

  // Add event listeners to bug selects
  bugInputs.forEach((select, index) => {
    if (!select) return;
    const manualContainerId = select.id.replace("-bug", "-manual-bug-container");
    const manualContainer = document.getElementById(manualContainerId);
    const manualInput = document.getElementById(select.id.replace("-bug", "-manual-bug"));
    const wildcardCheckbox = wildcardCheckboxes[index];

    select.addEventListener("change", function () {
      if (this.value === "manual") {
        manualContainer?.classList.add("show");
        wildcardContainers[index]?.classList.remove("show");
        if (wildcardCheckbox) {
          wildcardCheckbox.checked = false;
          wildcardCheckbox.disabled = true;
        }
      } else if (this.value !== "") {
        manualContainer?.classList.remove("show");
        wildcardContainers[index]?.classList.add("show");
        if (wildcardCheckbox) wildcardCheckbox.disabled = false;
      } else {
        manualContainer?.classList.remove("show");
        wildcardContainers[index]?.classList.remove("show");
        if (wildcardCheckbox) {
          wildcardCheckbox.checked = false;
          wildcardCheckbox.disabled = false;
        }
      }
    });

    manualInput?.addEventListener("input", () => {
      if (wildcardCheckbox) wildcardCheckbox.disabled = true;
    });
  });

  forms.forEach((form) => {
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const formType = form.id.split("-")[0]; // vmess, vless, trojan, or ss

      // Get custom bug and wildcard values
      let customBug = formData.get("bug") ? String(formData.get("bug")).trim() : "";

      // If manual bug is selected, use the manual input value instead
      if (customBug === "manual") {
        const manualInputId = `${formType}-manual-bug`;
        const manualBugValue = (document.getElementById(manualInputId)?.value || "").trim();
        if (manualBugValue) {
          formData.set("bug", manualBugValue);
          customBug = manualBugValue;
        } else {
          formData.set("bug", "");
          customBug = "";
        }
      }

      const useWildcard = formData.get("wildcard") === "on";

      // Determine server, host, and SNI
      // Ambil dari form (harus ada name="server-domain") atau fallback ke selectedServerDomain
      const selectedDomain = String(formData.get("server-domain") || selectedServerDomain);

      // ⬇️ PERBAIKAN: server SELALU domain server yang dipilih (BUKAN bug)
      const server = selectedDomain;

      // host/sni mengikuti bug (dengan wildcard jika dicentang)
      let host = selectedDomain;
      if (customBug) {
        host = useWildcard ? `${customBug}.${selectedDomain}` : customBug;
      }

      // sni hanya relevan bila TLS
      let sni = ""; // default kosong
      const security = String(formData.get("security") || "tls"); // sebagian besar form punya field "security"
      if (security === "tls") sni = host;

      // Generate connection URL based on protocol
      let connectionUrl = "";

      if (formType === "vmess") {
        const port = security === "tls" ? 443 : 80;

        const vmessConfig = {
          v: "2",
          ps: formData.get("name"),
          add: server,        // ⬅️ tetap domain server
          port: port,
          id: formData.get("uuid"),
          aid: "0",
          net: "ws",
          type: "none",
          host: host,         // ⬅️ host header dari bug (atau domain server)
          path: formData.get("path"),
          tls: security === "tls" ? "tls" : "",
          scy: "zero",
        };

        // hanya set sni kalau TLS
        if (security === "tls") vmessConfig.sni = sni;

        connectionUrl = "vmess://" + btoa(JSON.stringify(vmessConfig));
      } else if (formType === "vless") {
        const uuid = formData.get("uuid");
        const path = encodeURIComponent(String(formData.get("path") || "/"));
        const encryption = "none";
        const name = encodeURIComponent(String(formData.get("name") || ""));
        const port = security === "tls" ? 443 : 80;

        const base = `vless://${uuid}@${server}:${port}?encryption=${encryption}&security=${security}&type=ws&host=${host}&path=${path}`;
        connectionUrl = security === "tls" ? `${base}&sni=${encodeURIComponent(sni)}#${name}` : `${base}#${name}`;
      } else if (formType === "trojan") {
        const password = formData.get("password");
        const path = encodeURIComponent(String(formData.get("path") || "/"));
        const name = encodeURIComponent(String(formData.get("name") || ""));
        const port = security === "tls" ? 443 : 80;

        const base = `trojan://${password}@${server}:${port}?security=${security}&type=ws&host=${host}&path=${path}`;
        connectionUrl = security === "tls" ? `${base}&sni=${encodeURIComponent(sni)}#${name}` : `${base}#${name}`;
      } else if (formType === "ss") {
        const password = formData.get("password");
        const name = encodeURIComponent(String(formData.get("name") || ""));
        const path = encodeURIComponent(String(formData.get("path") || "/"));
        const method = "none"; // fixed cipher "none"
        const port = security === "tls" ? 443 : 80;

        const userInfo = btoa(`${method}:${password}`);
        const base = `ss://${userInfo}@${server}:${port}?encryption=none&type=ws&host=${host}&path=${path}&security=${security}`;
        connectionUrl = security === "tls" ? `${base}&sni=${encodeURIComponent(sni)}#${name}` : `${base}#${name}`;
      }

      // Display the result
      document.getElementById("connection-url").textContent = connectionUrl;

      // Generate QR code - Improved with multiple fallback methods
      generateQRCode(connectionUrl);

      // Show result section
      accountCreationSection.classList.add("hidden");
      resultSection.classList.remove("hidden");
    });
  });

  // Copy URL button
  document.getElementById("copy-url").addEventListener("click", function () {
    const connectionUrl = document.getElementById("connection-url").textContent;
    navigator.clipboard.writeText(connectionUrl).then(() => {
      this.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
      setTimeout(() => {
        this.innerHTML = '<i class="far fa-copy mr-1"></i> Copy';
      }, 2000);
    });
  });

  // Download QR code button
  document.getElementById("download-qr").addEventListener("click", () => {
    downloadQRCode();
  });
});

// Improved QR code generation with multiple fallback methods
function generateQRCode(text) {
  const qrcodeElement = document.getElementById("qrcode");
  qrcodeElement.innerHTML = "";

  try {
    QRCode.toCanvas(
      qrcodeElement,
      text,
      {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      },
      (error) => {
        if (error) {
          console.error("QR Code canvas error:", error);
          generateQRCodeFallback(text, qrcodeElement);
        }
      },
    );
  } catch (error) {
    console.error("QR Code generation error:", error);
    generateQRCodeFallback(text, qrcodeElement);
  }
}

// Fallback QR code generation method
function generateQRCodeFallback(text, container) {
  try {
    QRCode.toString(
      text,
      {
        type: "svg",
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      },
      (error, svg) => {
        if (error || !svg) {
          console.error("QR Code SVG error:", error);
          generateQRCodeLastResort(text, container);
        } else {
          container.innerHTML = svg;
        }
      },
    );
  } catch (error) {
    console.error("QR Code SVG generation error:", error);
    generateQRCodeLastResort(text, container);
  }
}

// Last resort QR code generation method
function generateQRCodeLastResort(text, container) {
  try {
    const encodedText = encodeURIComponent(text);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data= ${encodedText}`;

    const img = document.createElement("img");
    img.src = qrApiUrl;
    img.alt = "QR Code";
    img.width = 200;
    img.height = 200;
    img.onerror = () => {
      container.innerHTML = '<div class="text-center text-rose-500">Failed to generate QR code</div>';
    };

    container.innerHTML = "";
    container.appendChild(img);
  } catch (error) {
    console.error("QR Code last resort error:", error);
    container.innerHTML = '<div class="text-center text-rose-500">Failed to generate QR code</div>';
  }
}

// Download QR code function
function downloadQRCode() {
  const qrcodeElement = document.getElementById("qrcode");
  const canvas = qrcodeElement.querySelector("canvas");
  const img = qrcodeElement.querySelector("img");
  const svg = qrcodeElement.querySelector("svg");

  let imageUrl = null;

  if (canvas) {
    try {
      imageUrl = canvas.toDataURL("image/png");
    } catch (e) {
      console.error("Canvas to data URL error:", e);
    }
  } else if (img) {
    imageUrl = img.src;
  } else if (svg) {
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      imageUrl = URL.createObjectURL(svgBlob);
    } catch (e) {
      console.error("SVG to data URL error:", e);
    }
  }

  if (imageUrl) {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
  } else {
    alert("Failed to download QR code. Please try again.");
  }
}

// Function to display fallback proxy list
function displayFallbackProxyList() {
  proxyList = [{ ip: "103.6.207.108", port: "8080", country: "ID", provider: "PT Pusat Media Indonesia" }];
  filteredProxyList = [...proxyList];
  renderProxyList();
}

// Process proxy list data
function processProxyData(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  console.log(`Found ${lines.length} lines in proxy data`);

  if (lines.length === 0) {
    noProxiesMessage.classList.remove("hidden");
    return;
  }

  let delimiter = ",";
  const firstLine = lines[0];
  if (firstLine.includes("\t")) delimiter = "\t";
  else if (firstLine.includes("|")) delimiter = "|";
  else if (firstLine.includes(";")) delimiter = ";";

  proxyList = lines
    .map((line) => {
      const parts = line.split(delimiter);
      if (parts.length >= 2) {
        return {
          ip: parts[0].trim(),
          port: parts[1].trim(),
          country: parts.length >= 3 ? parts[2].trim() : "Unknown",
          provider: parts.length >= 4 ? parts[3].trim() : "Unknown Provider",
        };
      }
      return null;
    })
    .filter((proxy) => proxy && proxy.ip && proxy.port);

  console.log(`Processed ${proxyList.length} valid proxies`);

  if (proxyList.length === 0) {
    noProxiesMessage.classList.remove("hidden");
    displayFallbackProxyList();
    return;
  }

  currentPage = 1;
  filteredProxyList = [...proxyList];
  renderProxyList();
}

// Function to render the proxy list with pagination
function renderProxyList() {
  proxyListContainer.innerHTML = "";

  if (filteredProxyList.length === 0) {
    noProxiesMessage.classList.remove("hidden");
    paginationContainer.innerHTML = "";
    proxyCountInfo.textContent = "";
    return;
  }

  noProxiesMessage.classList.add("hidden");

  const totalPages = Math.ceil(filteredProxyList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProxyList.length);

  const currentItems = filteredProxyList.slice(startIndex, endIndex);

  currentItems.forEach((proxy, index) => {
    const actualIndex = startIndex + index;
    const card = document.createElement("div");
    card.className = "proxy-card group";

    const cardContent = document.createElement("div");
    cardContent.className = "flex justify-between items-center";
    cardContent.style.display = "flex";
    cardContent.style.flexDirection = "row";

    const infoDiv = document.createElement("div");
    infoDiv.className = "flex-1 min-w-0 pr-2";

    const providerContainer = document.createElement("div");
    providerContainer.className = "flex-items-center";
    providerContainer.style.display = "flex";
    providerContainer.style.alignItems = "center";
    providerContainer.style.width = "100%";
    providerContainer.style.position = "relative";

    const providerName = document.createElement("div");
    providerName.className = "font-medium text-sm truncate group-hover:text-indigo-300 transition-colors";
    providerName.style.maxWidth = "calc(100% - 20px)";
    providerName.textContent = proxy.provider;
    providerContainer.appendChild(providerName);

    const statusBadge = document.createElement("span");
    statusBadge.className = "inline-block w-3 h-3 rounded-full bg-gray-500 ml-2 pulse-animation";
    statusBadge.style.flexShrink = "0";
    statusBadge.style.position = "relative";
    statusBadge.innerHTML = "";
    statusBadge.title = "Memeriksa...";
    statusBadge.id = `proxy-status-${actualIndex}`;
    providerContainer.appendChild(statusBadge);

    infoDiv.appendChild(providerContainer);

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "text-xs text-gray-400 mt-1 truncate group-hover:text-gray-300 transition-colors";
    detailsDiv.style.whiteSpace = "nowrap";
    detailsDiv.style.overflow = "hidden";
    detailsDiv.style.textOverflow = "ellipsis";
    detailsDiv.textContent = `${proxy.country} | ${proxy.ip}:${proxy.port}`;
    infoDiv.appendChild(detailsDiv);

    const buttonDiv = document.createElement("div");
    buttonDiv.className = "flex-shrink-0";
    buttonDiv.style.flexShrink = "0";

    const button = document.createElement("button");
    button.className =
      "create-account-btn primary-btn py-2 px-4 rounded-lg text-xs group-hover:scale-105 transition-transform";
    button.style.whiteSpace = "nowrap";
    button.style.minWidth = "60px";
    button.setAttribute("data-index", actualIndex);
    button.innerHTML = "Create";
    buttonDiv.appendChild(button);

    cardContent.appendChild(infoDiv);
    cardContent.appendChild(buttonDiv);
    card.appendChild(cardContent);

    proxyListContainer.appendChild(card);

    const statusURL = `https://api.jb8fd7grgd.workers.dev/ ${proxy.ip}:${proxy.port}`;

    fetch(statusURL)
      .then((response) => response.json())
      .then((data) => {
        const proxyData = Array.isArray(data) ? data[0] : data;

        if (proxyData && proxyData.proxyip === true) {
          statusBadge.className = "inline-block w-3 h-3 rounded-full bg-emerald-500 ml-2";
          statusBadge.innerHTML = "";
          statusBadge.title = "Aktif";
        } else {
          statusBadge.className = "inline-block w-3 h-3 rounded-full bg-rose-500 ml-2";
          statusBadge.innerHTML = "";
          statusBadge.title = "Mati";
        }
      })
      .catch((error) => {
        statusBadge.className = "inline-block w-3 h-3 rounded-full bg-amber-500 ml-2";
        statusBadge.innerHTML = "";
        statusBadge.title = "Tidak diketahui";
        console.error("Fetch error:", error);
      });
  });

  // Add event listeners to create account buttons
  document.querySelectorAll(".create-account-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"));
      selectProxy(index);
      showAccountCreationSection();
    });
  });

  // Render pagination controls
  renderPagination(totalPages);

  // Update proxy count info
  proxyCountInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredProxyList.length} proxies`;
}

// Function to check proxy status in the list
function checkProxyStatusInList(proxy, statusBadge) {
  const statusURL = `https://api.jb8fd7grgd.workers.dev/${proxy.ip}:${proxy.port}`;

  fetch(statusURL)
    .then((response) => response.json())
    .then((data) => {
      const proxyData = Array.isArray(data) ? data[0] : data;

      if (proxyData && proxyData.proxyip === true) {
        statusBadge.className = "inline-block w-3 h-3 rounded-full bg-emerald-500 ml-2";
        statusBadge.innerHTML = "";
        statusBadge.title = "Aktif";
      } else {
        statusBadge.className = "inline-block w-3 h-3 rounded-full bg-rose-500 ml-2";
        statusBadge.innerHTML = "";
        statusBadge.title = "Mati";
      }
    })
    .catch((error) => {
      statusBadge.className = "inline-block w-3 h-3 rounded-full bg-amber-500 ml-2";
      statusBadge.innerHTML = "";
      statusBadge.title = "Tidak diketahui";
      console.error("Fetch error:", error);
    });
}

// Function to render pagination controls
function renderPagination(totalPages) {
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = `pagination-btn ${currentPage === 1 ? "disabled" : ""}`;
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProxyList();
    }
  });
  paginationContainer.appendChild(prevBtn);

  const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstPageBtn = document.createElement("button");
    firstPageBtn.className = "pagination-btn";
    firstPageBtn.textContent = "1";
    firstPageBtn.addEventListener("click", () => {
      currentPage = 1;
      renderProxyList();
    });
    paginationContainer.appendChild(firstPageBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "px-1 text-gray-400";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i.toString();
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderProxyList();
    });
    paginationContainer.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "px-1 text-gray-400";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }

    const lastPageBtn = document.createElement("button");
    lastPageBtn.className = "pagination-btn";
    lastPageBtn.textContent = totalPages.toString();
    lastPageBtn.addEventListener("click", () => {
      currentPage = totalPages;
      renderProxyList();
    });
    paginationContainer.appendChild(lastPageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = `pagination-btn ${currentPage === totalPages ? "disabled" : ""}`;
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderProxyList();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

// Function to select a proxy
async function selectProxy(index) {
  selectedProxy = filteredProxyList[index];

  document.getElementById("selected-ip").textContent = selectedProxy.ip;
  document.getElementById("selected-port").textContent = selectedProxy.port;
  document.getElementById("selected-country").textContent = selectedProxy.country;
  document.getElementById("selected-provider").textContent = selectedProxy.provider;

  const baseAccountName = `${selectedProxy.country} - ${selectedProxy.provider}`;
  const path = pathTemplate.replace("{ip}", selectedProxy.ip).replace("{port}", selectedProxy.port);

  document.getElementById("vmess-path").value = path;
  document.getElementById("vless-path").value = path;
  document.getElementById("trojan-path").value = path;
  document.getElementById("ss-path").value = path;

  const vmessSecurity = document.getElementById("vmess-security").value;
  const vlessSecurity = document.getElementById("vless-security").value;
  const trojanSecurity = document.getElementById("trojan-security").value;
  const ssSecurity = document.getElementById("ss-security").value;

  document.getElementById("vmess-name").value = `${baseAccountName} [VMess-${vmessSecurity === "tls" ? "TLS" : "NTLS"}]`;
  document.getElementById("vless-name").value = `${baseAccountName} [VLESS-${vlessSecurity === "tls" ? "TLS" : "NTLS"}]`;
  document.getElementById("trojan-name").value = `${baseAccountName} [Trojan-${trojanSecurity === "tls" ? "TLS" : "NTLS"}]`;
  document.getElementById("ss-name").value = `${baseAccountName} [SS-${ssSecurity === "tls" ? "TLS" : "NTLS"}]`;

  const securitySelects = [
    { id: "vmess-security", nameId: "vmess-name", protocol: "VMess" },
    { id: "vless-security", nameId: "vless-name", protocol: "VLESS" },
    { id: "trojan-security", nameId: "trojan-name", protocol: "Trojan" },
    { id: "ss-security", nameId: "ss-name", protocol: "SS" },
  ];

  securitySelects.forEach((item) => {
    const select = document.getElementById(item.id);
    const nameInput = document.getElementById(item.nameId);
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);

    newSelect.addEventListener("change", function () {
      const tlsType = this.value === "tls" ? "TLS" : "NTLS";
      nameInput.value = `${baseAccountName} [${item.protocol}-${tlsType}]`;
    });
  });

  const statusContainer = document.getElementById("proxy-status-container");
  const statusLoading = document.getElementById("proxy-status-loading");
  const statusActive = document.getElementById("proxy-status-active");
  const statusDead = document.getElementById("proxy-status-dead");
  const statusUnknown = document.getElementById("proxy-status-unknown");
  const latencyElement = document.getElementById("proxy-latency");

  statusContainer.classList.remove("hidden");
  statusLoading.classList.remove("hidden");
  statusActive.classList.add("hidden");
  statusDead.classList.add("hidden");
  statusUnknown.classList.add("hidden");

  checkProxyStatus(selectedProxy);
}

// Function to check proxy status in the account creation section
function checkProxyStatus(proxy) {
  const startTime = performance.now();
  const statusURL = `https://api.jb8fd7grgd.workers.dev/${proxy.ip}:${proxy.port}`;
  const statusContainer = document.getElementById("proxy-status-container");
  const statusLoading = document.getElementById("proxy-status-loading");
  const statusActive = document.getElementById("proxy-status-active");
  const statusDead = document.getElementById("proxy-status-dead");
  const statusUnknown = document.getElementById("proxy-status-unknown");
  const latencyElement = document.getElementById("proxy-latency");

  statusContainer.classList.remove("hidden");
  statusLoading.classList.remove("hidden");
  statusActive.classList.add("hidden");
  statusDead.classList.add("hidden");
  statusUnknown.classList.add("hidden");

  fetch(statusURL)
    .then((response) => response.json())
    .then((data) => {
      const endTime = performance.now();
      const latency = Math.floor(endTime - startTime);

      statusLoading.classList.add("hidden");

      const proxyData = Array.isArray(data) ? data[0] : data;

      if (proxyData && proxyData.proxyip === true) {
        statusActive.classList.remove("hidden");
        latencyElement.textContent = `${latency}ms`;
      } else {
        statusDead.classList.remove("hidden");
      }
    })
    .catch((error) => {
      statusLoading.classList.add("hidden");
      statusUnknown.classList.remove("hidden");
      console.error("Fetch error:", error);
    });
}

// Function to show proxy list section
function showProxyListSection() {
  proxyListSection.classList.remove("hidden");
  accountCreationSection.classList.add("hidden");
  resultSection.classList.add("hidden");
}

// Function to show account creation section
function showAccountCreationSection() {
  proxyListSection.classList.add("hidden");
  accountCreationSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
}

// Update the loadProxyList function to better handle GitHub data and CORS issues
function loadProxyList(url) {
  loadingIndicator.classList.remove("hidden");
  proxyListContainer.innerHTML = "";
  noProxiesMessage.classList.add("hidden");

  const corsProxies = [
    async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Direct fetch failed");
      return await response.text();
    },
    async () => {
      const corsUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      const response = await fetch(corsUrl);
      if (!response.ok) throw new Error("CORS Anywhere proxy failed");
      return await response.text();
    },
    async () => {
      const corsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(corsUrl);
      if (!response.ok) throw new Error("AllOrigins proxy failed");
      const data = await response.json();
      return data.contents;
    },
    async () => {
      const corsUrl = `https://cors.sh/${url}`;
      const response = await fetch(corsUrl, {
        headers: { "x-cors-api-key": "temp_" + Math.random().toString(36).substring(2, 12) },
      });
      if (!response.ok) throw new Error("CORS.sh proxy failed");
      return await response.text();
    },
  ];

  (async function tryProxies(index = 0) {
    if (index >= corsProxies.length) {
      console.error("All proxies failed");
      loadingIndicator.classList.add("hidden");
      noProxiesMessage.classList.remove("hidden");
      displayFallbackProxyList();
      return;
    }

    try {
      const text = await corsProxies[index]();
      console.log("Fetched data:", text.substring(0, 200) + "...");
      processProxyData(text);
      loadingIndicator.classList.add("hidden");
    } catch (error) {
      console.error(`Proxy ${index} failed:`, error);
      tryProxies(index + 1);
    }
  })();
}
