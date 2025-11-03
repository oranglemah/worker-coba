const CONFIG = {
  'proxyListUrl': "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/proxyList.txt",
  'apiCheckUrl': "https://api.jb8fd7grgd.workers.dev/",
  'mainDomains': ["sirtu.oranglemah.my.id"],
  'defaultUuid': '8febb7c9-a664-4b16-bbc5-563b099a4860',
  'maxProxies': 0x32,
  'defaultProxyCount': 0x5,
  'pathTemplate': "/Free/{ip}-{port}"
};
let proxyList = [];
let filteredProxyList = [];
let validatedProxies = [];
let validationInProgress = false;
let totalValidated = 0x0;
let validCount = 0x0;
let invalidCount = 0x0;
const form = document.getElementById("subLinkForm");
const configTypeSelect = document.getElementById("configType");
const formatTypeSelect = document.getElementById("formatType");
const uuidInput = document.getElementById('uuid');
const generateUuidBtn = document.getElementById('generateUuid');
const bugTypeSelect = document.getElementById("bugType");
const mainDomainSelect = document.getElementById('mainDomain');
const customBugContainer = document.getElementById("customBugContainer");
const customBugInput = document.getElementById("customBug");
const tlsSelect = document.getElementById("tls");
const countrySelect = document.getElementById("country");
const limitInput = document.getElementById('limit');
const validateProxiesCheckbox = document.getElementById("validateProxies");
const loadingElement = document.getElementById("loading");
const validationStatusElement = document.getElementById('validation-status');
const validationCountElement = document.getElementById("validation-count");
const validationBarElement = document.getElementById("validation-bar");
const validCountElement = document.getElementById('valid-count');
const invalidCountElement = document.getElementById("invalid-count");
const errorMessageElement = document.getElementById("error-message");
const resultElement = document.getElementById("result");
const outputElement = document.getElementById("output");
const copyLinkBtn = document.getElementById("copyLink");
function generateUUIDv4() {
  return crypto.randomUUID();
}
async function copyToClipboard(_0x3a1862) {
  try {
    await navigator.clipboard.writeText(_0x3a1862);
    return true;
  } catch (_0x53b1ea) {
    console.error("Failed to copy: ", _0x53b1ea);
    return false;
  }
}
function safeBase64Encode(_0x38f716) {
  try {
    return btoa(unescape(encodeURIComponent(_0x38f716)));
  } catch (_0x84a36b) {
    console.error("Error encoding base64:", _0x84a36b);
    return '';
  }
}
document.addEventListener("DOMContentLoaded", () => {
  populateMainDomains();
  setupEventListeners();
  loadProxyList();
});
function populateMainDomains() {
  CONFIG.mainDomains.forEach(_0x40b88c => {
    const _0x111831 = document.createElement("option");
    _0x111831.value = _0x40b88c;
    _0x111831.textContent = _0x40b88c;
    mainDomainSelect.appendChild(_0x111831);
  });
}
function setupEventListeners() {
  generateUuidBtn.addEventListener("click", () => {
    uuidInput.value = crypto.randomUUID();
  });
  bugTypeSelect.addEventListener("change", () => {
    if (bugTypeSelect.value === 'non-wildcard' || bugTypeSelect.value === "wildcard") {
      customBugContainer.style.display = 'block';
    } else {
      customBugContainer.style.display = "none";
    }
  });
  form.addEventListener("submit", handleFormSubmit);
  copyLinkBtn.addEventListener("click", () => {
    copyToClipboard(outputElement.value).then(_0xbf9f12 => {
      if (_0xbf9f12) {
        copyLinkBtn.innerHTML = "\n            <svg class=\"copy-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg>\n            COPIED SUCCESSFULLY\n          ";
        setTimeout(() => {
          copyLinkBtn.innerHTML = "\n              <svg class=\"copy-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                <rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect>\n                <path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path>\n              </svg>\n              COPY CONFIGURATION\n            ";
        }, 0x7d0);
      }
    });
  });
}
function loadProxyList() {
  showLoading("Fetching proxy list...");
  fetch("https://raw.githubusercontent.com/AFRcloud/ProxyList/refs/heads/main/ProxyList.txt").then(_0x4494de => {
    if (!_0x4494de.ok) {
      throw new Error("Failed to fetch proxy list");
    }
    return _0x4494de.text();
  }).then(_0x139194 => {
    processProxyData(_0x139194);
    hideLoading();
  })["catch"](_0x34db10 => {
    console.error("Error loading proxy list:", _0x34db10);
    showError("Failed to load proxy list. Please try again later.");
    hideLoading();
  });
}
function processProxyData(_0x33f045) {
  const _0x4d6091 = _0x33f045.split(/\r?\n/).filter(_0xf68f4f => _0xf68f4f.trim() !== '');
  if (_0x4d6091.length === 0x0) {
    showError("No proxies found in the proxy list.");
    return;
  }
  let _0x3777ca = ',';
  const _0x1899eb = _0x4d6091[0x0];
  if (_0x1899eb.includes("\t")) {
    _0x3777ca = "\t";
  } else {
    if (_0x1899eb.includes('|')) {
      _0x3777ca = '|';
    } else if (_0x1899eb.includes(';')) {
      _0x3777ca = ';';
    }
  }
  proxyList = _0x4d6091.map(_0x94f33 => {
    const _0x2dfee1 = _0x94f33.split(_0x3777ca);
    if (_0x2dfee1.length >= 0x2) {
      return {
        'ip': _0x2dfee1[0x0].trim(),
        'port': _0x2dfee1[0x1].trim(),
        'country': _0x2dfee1.length >= 0x3 ? _0x2dfee1[0x2].trim() : 'Unknown',
        'provider': _0x2dfee1.length >= 0x4 ? _0x2dfee1[0x3].trim() : "Unknown Provider"
      };
    }
    return null;
  }).filter(_0xdf2f5b => _0xdf2f5b && _0xdf2f5b.ip && _0xdf2f5b.port);
  populateCountryDropdown();
}
function populateCountryDropdown() {
  const _0x3712f3 = [...new Set(proxyList.map(_0x3cdc85 => _0x3cdc85.country))];
  _0x3712f3.sort();
  countrySelect.innerHTML = '';
  const _0x47db50 = document.createElement("option");
  _0x47db50.value = '';
  _0x47db50.textContent = "All Countries";
  countrySelect.appendChild(_0x47db50);
  _0x3712f3.forEach(_0x547d71 => {
    const _0x1f50f5 = document.createElement("option");
    _0x1f50f5.value = _0x547d71;
    _0x1f50f5.textContent = _0x547d71;
    countrySelect.appendChild(_0x1f50f5);
  });
}
async function handleFormSubmit(_0x242808) {
  _0x242808.preventDefault();
  errorMessageElement.textContent = '';
  errorMessageElement.style.display = "none";
  const _0x110b63 = configTypeSelect.value;
  const _0x1e06b0 = formatTypeSelect.value;
  const _0x521cbd = uuidInput.value;
  const _0x46bcd6 = bugTypeSelect.value;
  const _0x178670 = mainDomainSelect.value;
  const _0x1a54a2 = customBugInput.value;
  const _0x287a93 = tlsSelect.value === "true";
  const _0x2b7f20 = countrySelect.value;
  const _0x2365d1 = Number.parseInt(limitInput.value, 0xa);
  const _0x287a10 = validateProxiesCheckbox.checked;
  if (!_0x521cbd) {
    showError("Please enter a UUID.");
    return;
  }
  if (_0x2365d1 < 0x1 || _0x2365d1 > 0x32) {
    showError("Proxy count must be between 1 and 50.");
    return;
  }
  filteredProxyList = _0x2b7f20 ? proxyList.filter(_0x4b2ae4 => _0x4b2ae4.country === _0x2b7f20) : [...proxyList];
  if (filteredProxyList.length === 0x0) {
    showError("No proxies found with the selected criteria.");
    return;
  }
  shuffleArray(filteredProxyList);
  filteredProxyList = filteredProxyList.slice(0x0, _0x2365d1);
  showLoading("Generating configuration...");
  if (_0x287a10) {
    await validateProxyList();
  }
  const _0x17bc8e = generateConfiguration(_0x110b63, _0x1e06b0, _0x521cbd, _0x46bcd6, _0x178670, _0x1a54a2, _0x287a93);
  showResult(_0x17bc8e);
}
async function validateProxyList() {
  validationInProgress = true;
  validatedProxies = [];
  totalValidated = 0x0;
  validCount = 0x0;
  invalidCount = 0x0;
  validationStatusElement.style.display = "block";
  validationCountElement.textContent = '0/' + filteredProxyList.length;
  validationBarElement.style.width = '0%';
  validCountElement.textContent = '0';
  invalidCountElement.textContent = '0';
  invalidCountElement.textContent = '0';
  const _0x4332ef = [...filteredProxyList];
  const _0x5b3e38 = Math.ceil(_0x4332ef.length / 0x5);
  for (let _0x16a2da = 0x0; _0x16a2da < _0x5b3e38; _0x16a2da++) {
    const _0x3a46c6 = _0x16a2da * 0x5;
    const _0x3e4450 = Math.min(_0x3a46c6 + 0x5, _0x4332ef.length);
    const _0xc8c08d = _0x4332ef.slice(_0x3a46c6, _0x3e4450);
    await Promise.all(_0xc8c08d.map(async _0x5ec896 => {
      const _0x592a51 = await validateProxy(_0x5ec896);
      totalValidated++;
      const _0x22ea5a = totalValidated / _0x4332ef.length * 0x64;
      validationCountElement.textContent = totalValidated + '/' + _0x4332ef.length;
      validationBarElement.style.width = _0x22ea5a + '%';
      if (_0x592a51) {
        validCount++;
        validCountElement.textContent = validCount;
        validatedProxies.push(_0x5ec896);
      } else {
        invalidCount++;
        invalidCountElement.textContent = invalidCount;
      }
    }));
  }
  if (validatedProxies.length > 0x0) {
    filteredProxyList = validatedProxies;
  }
  validationInProgress = false;
}
async function validateProxy(_0x40e0b1) {
  try {
    const _0x5084c5 = await fetch("https://afrcloud.dpdns.org/" + _0x40e0b1.ip + ':' + _0x40e0b1.port);
    const _0x17509d = await _0x5084c5.json();
    const _0x416052 = Array.isArray(_0x17509d) ? _0x17509d[0x0] : _0x17509d;
    return _0x416052 && _0x416052.proxyip === true;
  } catch (_0x1dc00e) {
    console.error("Error validating proxy:", _0x1dc00e);
    return false;
  }
}
function generateConfiguration(_0x1f0a31, _0x142717, _0x559e83, _0x2af67c, _0x2a84fa, _0x306f9c, _0x2a8e81) {
  const _0x26af7a = filteredProxyList;
  switch (_0x142717) {
    case "v2ray":
      return generateV2rayLinks(_0x1f0a31, _0x26af7a, _0x559e83, _0x2af67c, _0x2a84fa, _0x306f9c, _0x2a8e81);
    case 'clash':
      return generateClashConfig(_0x1f0a31, _0x26af7a, _0x559e83, _0x2af67c, _0x2a84fa, _0x306f9c, _0x2a8e81);
    case "nekobox":
      const _0x325b5f = [];
      _0x26af7a.forEach(_0x2f8b2a => {
        const _0x2a6cad = "/Free/{ip}-{port}".replace("{ip}", _0x2f8b2a.ip).replace("{port}", _0x2f8b2a.port);
        const _0x5796b5 = _0x2a8e81 ? 0x1bb : 0x50;
        const _0x10ed8d = _0x306f9c && (_0x2af67c === "non-wildcard" || _0x2af67c === "wildcard") ? _0x306f9c.split(',').map(_0x2065e6 => _0x2065e6.trim()) : [_0x2a84fa];
        _0x10ed8d.forEach(_0x56a273 => {
          let _0xa1b4c1;
          let _0x928f74;
          let _0xe50fa4;
          switch (_0x2af67c) {
            case "default":
              _0xa1b4c1 = _0x2a84fa;
              _0x928f74 = _0x2a84fa;
              _0xe50fa4 = _0x2a84fa;
              break;
            case "non-wildcard":
              _0xa1b4c1 = _0x56a273;
              _0x928f74 = _0x2a84fa;
              _0xe50fa4 = _0x2a84fa;
              break;
            case 'wildcard':
              _0xa1b4c1 = _0x56a273;
              _0x928f74 = _0x56a273 + '.' + _0x2a84fa;
              _0xe50fa4 = _0x56a273 + '.' + _0x2a84fa;
              break;
          }
          const _0x587ec3 = _0x2f8b2a.country;
          const _0x8c3a20 = _0x2f8b2a.provider;
          if (_0x1f0a31 === 'vmess' || _0x1f0a31 === "mix") {
            _0x325b5f.push({
              'type': "vmess",
              'name': '[' + (_0x325b5f.length + 0x1) + "] (" + _0x587ec3 + ") " + _0x8c3a20 + " [VMESS-" + (_0x2a8e81 ? "TLS" : 'NTLS') + ']',
              'server': _0xa1b4c1,
              'port': _0x5796b5,
              'uuid': _0x559e83,
              'tls': _0x2a8e81,
              'sni': _0xe50fa4,
              'wsHost': _0x928f74,
              'wsPath': _0x2a6cad
            });
          }
          if (_0x1f0a31 === "vless" || _0x1f0a31 === "mix") {
            _0x325b5f.push({
              'type': "vless",
              'name': '[' + (_0x325b5f.length + 0x1) + "] (" + _0x587ec3 + ") " + _0x8c3a20 + " [VLESS-" + (_0x2a8e81 ? "TLS" : "NTLS") + ']',
              'server': _0xa1b4c1,
              'port': _0x5796b5,
              'uuid': _0x559e83,
              'tls': _0x2a8e81,
              'sni': _0xe50fa4,
              'wsHost': _0x928f74,
              'wsPath': _0x2a6cad
            });
          }
          if (_0x1f0a31 === "trojan" || _0x1f0a31 === "mix") {
            _0x325b5f.push({
              'type': "trojan",
              'name': '[' + (_0x325b5f.length + 0x1) + "] (" + _0x587ec3 + ") " + _0x8c3a20 + " [TROJAN-" + (_0x2a8e81 ? "TLS" : "NTLS") + ']',
              'server': _0xa1b4c1,
              'port': _0x5796b5,
              'password': _0x559e83,
              'tls': _0x2a8e81,
              'sni': _0xe50fa4,
              'wsHost': _0x928f74,
              'wsPath': _0x2a6cad
            });
          }
          if (_0x1f0a31 === "shadowsocks" || _0x1f0a31 === "mix") {
            _0x325b5f.push({
              'type': 'ss',
              'name': '[' + (_0x325b5f.length + 0x1) + "] (" + _0x587ec3 + ") " + _0x8c3a20 + " [SS-" + (_0x2a8e81 ? "TLS" : 'NTLS') + ']',
              'server': _0xa1b4c1,
              'port': _0x5796b5,
              'password': _0x559e83,
              'tls': _0x2a8e81,
              'wsHost': _0x928f74,
              'wsPath': _0x2a6cad
            });
          }
        });
      });
      return generateNekoboxConfig(_0x325b5f);
    default:
      return "Unsupported format type";
  }
}
function generateV2rayLinks(_0x4ae1c6, _0x4b8e74, _0x29ed29, _0x229483, _0x40705a, _0x529635, _0x2014a9) {
  const _0x307e59 = [];
  let _0x225dcd = [];
  if (_0x529635 && (_0x229483 === "non-wildcard" || _0x229483 === 'wildcard')) {
    _0x225dcd = _0x529635.split(',').map(_0x300d17 => _0x300d17.trim());
  }
  _0x4b8e74.forEach(_0x29873d => {
    const _0xf9d8cf = "/Free/{ip}-{port}".replace("{ip}", _0x29873d.ip).replace('{port}', _0x29873d.port);
    const _0x197458 = _0x2014a9 ? 0x1bb : 0x50;
    const _0x56327b = _0x2014a9 ? "tls" : 'none';
    if (_0x4ae1c6 === "mix" || _0x4ae1c6 === 'vmess') {
      if (_0x225dcd.length > 0x0) {
        _0x225dcd.forEach((_0x2da4e8, _0x417d68) => {
          const _0x1f2cbd = _0x229483 === 'wildcard' ? _0x2da4e8 + '.' + _0x40705a : _0x40705a;
          const _0x2cf9bf = _0x229483 === "wildcard" ? _0x2da4e8 + '.' + _0x40705a : _0x40705a;
          const _0x3785bd = {
            'v': '2',
            'ps': '[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [VMess-" + (_0x2014a9 ? "TLS" : "NTLS") + ']',
            'add': _0x2da4e8,
            'port': _0x197458,
            'id': _0x29ed29,
            'aid': '0',
            'net': 'ws',
            'type': "none",
            'host': _0x1f2cbd,
            'path': _0xf9d8cf,
            'tls': _0x56327b,
            'sni': _0x2cf9bf,
            'scy': "zero"
          };
          _0x307e59.push("vmess://" + safeBase64Encode(JSON.stringify(_0x3785bd)));
        });
      } else {
        const _0x914513 = {
          'v': '2',
          'ps': '[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [VMess-" + (_0x2014a9 ? "TLS" : "NTLS") + ']',
          'add': _0x40705a,
          'port': _0x197458,
          'id': _0x29ed29,
          'aid': '0',
          'net': 'ws',
          'type': "none",
          'host': _0x40705a,
          'path': _0xf9d8cf,
          'tls': _0x56327b,
          'sni': _0x40705a,
          'scy': "zero"
        };
        _0x307e59.push('vmess://' + safeBase64Encode(JSON.stringify(_0x914513)));
      }
    }
    if (_0x4ae1c6 === 'mix' || _0x4ae1c6 === 'vless') {
      if (_0x225dcd.length > 0x0) {
        _0x225dcd.forEach(_0xf1564c => {
          const _0x491272 = _0x229483 === "wildcard" ? _0xf1564c + '.' + _0x40705a : _0x40705a;
          const _0x43542e = _0x229483 === 'wildcard' ? _0xf1564c + '.' + _0x40705a : _0x40705a;
          const _0x8e9d4e = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [VLESS-" + (_0x2014a9 ? 'TLS' : "NTLS") + ']');
          const _0x52d677 = encodeURIComponent(_0xf9d8cf);
          _0x307e59.push("vless://" + _0x29ed29 + '@' + _0xf1564c + ':' + _0x197458 + "?encryption=none&security=" + _0x56327b + "&type=ws&host=" + _0x491272 + "&path=" + _0x52d677 + '&sni=' + _0x43542e + '#' + _0x8e9d4e);
        });
      } else {
        const _0x48c1bc = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [VLESS-" + (_0x2014a9 ? "TLS" : "NTLS") + ']');
        const _0x1b67b9 = encodeURIComponent(_0xf9d8cf);
        _0x307e59.push('vless://' + _0x29ed29 + '@' + _0x40705a + ':' + _0x197458 + '?encryption=none&security=' + _0x56327b + '&type=ws&host=' + _0x40705a + "&path=" + _0x1b67b9 + "&sni=" + _0x40705a + '#' + _0x48c1bc);
      }
    }
    if (_0x4ae1c6 === "mix" || _0x4ae1c6 === "trojan") {
      if (_0x225dcd.length > 0x0) {
        _0x225dcd.forEach(_0x2f8766 => {
          const _0x53f2e4 = _0x229483 === 'wildcard' ? _0x2f8766 + '.' + _0x40705a : _0x40705a;
          const _0xcf00c9 = _0x229483 === "wildcard" ? _0x2f8766 + '.' + _0x40705a : _0x40705a;
          const _0x57accd = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [Trojan-" + (_0x2014a9 ? 'TLS' : 'NTLS') + ']');
          const _0x38d016 = encodeURIComponent(_0xf9d8cf);
          _0x307e59.push("trojan://" + _0x29ed29 + '@' + _0x2f8766 + ':' + _0x197458 + "?security=" + _0x56327b + "&type=ws&host=" + _0x53f2e4 + "&path=" + _0x38d016 + "&sni=" + _0xcf00c9 + '#' + _0x57accd);
        });
      } else {
        const _0x977f74 = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [Trojan-" + (_0x2014a9 ? "TLS" : 'NTLS') + ']');
        const _0x163df0 = encodeURIComponent(_0xf9d8cf);
        _0x307e59.push('trojan://' + _0x29ed29 + '@' + _0x40705a + ':' + _0x197458 + '?security=' + _0x56327b + "&type=ws&host=" + _0x40705a + "&path=" + _0x163df0 + "&sni=" + _0x40705a + '#' + _0x977f74);
      }
    }
    if (_0x4ae1c6 === "mix" || _0x4ae1c6 === "shadowsocks") {
      if (_0x225dcd.length > 0x0) {
        _0x225dcd.forEach(_0x1bb2ea => {
          const _0xbfdd0f = _0x229483 === 'wildcard' ? _0x1bb2ea + '.' + _0x40705a : _0x40705a;
          const _0x2151e0 = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [SS-" + (_0x2014a9 ? "TLS" : "NTLS") + ']');
          const _0xe88bb = encodeURIComponent(_0xf9d8cf);
          const _0x170849 = safeBase64Encode("none:" + _0x29ed29);
          _0x307e59.push("ss://" + _0x170849 + '@' + _0x1bb2ea + ':' + _0x197458 + "?plugin=v2ray-plugin%3Btls%3Bmux%3D0%3Bmode%3Dwebsocket%3Bpath%3D" + _0xe88bb + '%3Bhost%3D' + _0xbfdd0f + '#' + _0x2151e0);
        });
      } else {
        const _0x1ccb47 = encodeURIComponent('[' + (_0x307e59.length + 0x1) + "] " + _0x29873d.country + " - " + _0x29873d.provider + " [SS-" + (_0x2014a9 ? 'TLS' : "NTLS") + ']');
        const _0x122687 = encodeURIComponent(_0xf9d8cf);
        const _0x34b2b4 = safeBase64Encode("none:" + _0x29ed29);
        _0x307e59.push('ss://' + _0x34b2b4 + '@' + _0x40705a + ':' + _0x197458 + "?plugin=v2ray-plugin%3Btls%3Bmux%3D0%3Bmode%3Dwebsocket%3Bpath=" + _0x122687 + '%3Bhost%3D' + _0x40705a + '#' + _0x1ccb47);
      }
    }
  });
  return _0x307e59.join("\n");
}
function generateClashConfig(_0x1786a5, _0x29feac, _0x5e4410, _0x2cde90, _0x2020a9, _0xdfe797, _0x20d327) {
  let _0x8df0ee = "# Clash Proxy Provider Configuration\n# Generated by afrcloud\n# Date: " + new Date().toLocaleString('en-US', {
    'timeZone': "Asia/Jakarta"
  }) + "\n# Protocol: " + _0x1786a5.toUpperCase() + "\n# TLS: " + (_0x20d327 ? "Enabled" : "Disabled") + "\n\nproxies:\n";
  let _0x67ac19 = [];
  if (_0xdfe797 && (_0x2cde90 === "non-wildcard" || _0x2cde90 === "wildcard")) {
    _0x67ac19 = _0xdfe797.split(',').map(_0x457eae => _0x457eae.trim());
  }
  _0x29feac.forEach(_0x468e1e => {
    const _0x3401f7 = "/Free/{ip}-{port}".replace('{ip}', _0x468e1e.ip).replace('{port}', _0x468e1e.port);
    const _0x5a3f41 = _0x20d327 ? 0x1bb : 0x50;
    if (_0x1786a5 === "mix" || _0x1786a5 === 'vmess') {
      if (_0x67ac19.length > 0x0) {
        _0x67ac19.forEach((_0x332f38, _0x4668c4) => {
          const _0x5309ac = _0x2cde90 === "wildcard" ? _0x332f38 + '.' + _0x2020a9 : _0x2020a9;
          const _0x37865b = _0x2cde90 === "wildcard" ? _0x332f38 + '.' + _0x2020a9 : _0x2020a9;
          const _0x1cc031 = '[' + (_0x29feac.indexOf(_0x468e1e) * _0x67ac19.length + _0x4668c4 + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [VMess-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
          _0x8df0ee += "\n  - name: \"" + _0x1cc031 + "\"\n    type: vmess\n    server: " + _0x332f38 + "\n    port: " + _0x5a3f41 + "\n    uuid: " + _0x5e4410 + "\n    alterId: 0\n    cipher: zero\n    udp: false\n    tls: " + _0x20d327 + "\n    skip-cert-verify: true\n    servername: " + _0x37865b + "\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x5309ac + "\n";
        });
      } else {
        const _0x30709c = '[' + (_0x29feac.indexOf(_0x468e1e) + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [VMess-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
        _0x8df0ee += "\n  - name: \"" + _0x30709c + "\"\n    type: vmess\n    server: " + _0x2020a9 + "\n    port: " + _0x5a3f41 + "\n    uuid: " + _0x5e4410 + "\n    alterId: 0\n    cipher: zero\n    udp: false\n    tls: " + _0x20d327 + "\n    skip-cert-verify: true\n    servername: " + _0x2020a9 + "\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x2020a9 + "\n";
      }
    }
    if (_0x1786a5 === "mix" || _0x1786a5 === 'vless') {
      if (_0x67ac19.length > 0x0) {
        _0x67ac19.forEach((_0x33d5b0, _0x9c795d) => {
          const _0x47f58f = _0x2cde90 === "wildcard" ? _0x33d5b0 + '.' + _0x2020a9 : _0x2020a9;
          const _0x3795c0 = _0x2cde90 === "wildcard" ? _0x33d5b0 + '.' + _0x2020a9 : _0x2020a9;
          const _0x40df10 = '[' + (_0x29feac.indexOf(_0x468e1e) * _0x67ac19.length + _0x9c795d + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [VLESS-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
          _0x8df0ee += "\n  - name: \"" + _0x40df10 + "\"\n    type: vless\n    server: " + _0x33d5b0 + "\n    port: " + _0x5a3f41 + "\n    uuid: " + _0x5e4410 + "\n    udp: false\n    tls: " + _0x20d327 + "\n    skip-cert-verify: true\n    servername: " + _0x3795c0 + "\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x47f58f + "\n";
        });
      } else {
        const _0x364eb7 = '[' + (_0x29feac.indexOf(_0x468e1e) + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [VLESS-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
        _0x8df0ee += "\n  - name: \"" + _0x364eb7 + "\"\n    type: vless\n    server: " + _0x2020a9 + "\n    port: " + _0x5a3f41 + "\n    uuid: " + _0x5e4410 + "\n    udp: false\n    tls: " + _0x20d327 + "\n    skip-cert-verify: true\n    servername: " + _0x2020a9 + "\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x2020a9 + "\n";
      }
    }
    if (_0x1786a5 === "mix" || _0x1786a5 === "trojan") {
      if (_0x67ac19.length > 0x0) {
        _0x67ac19.forEach((_0x5d5169, _0x1454cf) => {
          const _0x1a90ac = _0x2cde90 === "wildcard" ? _0x5d5169 + '.' + _0x2020a9 : _0x2020a9;
          const _0x201e92 = _0x2cde90 === "wildcard" ? _0x5d5169 + '.' + _0x2020a9 : _0x2020a9;
          const _0x125b9e = '[' + (_0x29feac.indexOf(_0x468e1e) * _0x67ac19.length + _0x1454cf + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [Trojan-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
          _0x8df0ee += "\n  - name: \"" + _0x125b9e + "\"\n    type: trojan\n    server: " + _0x5d5169 + "\n    port: " + _0x5a3f41 + "\n    password: " + _0x5e4410 + "\n    udp: false\n    sni: " + _0x201e92 + "\n    skip-cert-verify: true\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x1a90ac + "\n";
        });
      } else {
        const _0xbcdf4 = '[' + (_0x29feac.indexOf(_0x468e1e) + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [Trojan-" + (_0x20d327 ? 'TLS' : "NTLS") + ']';
        _0x8df0ee += "\n  - name: \"" + _0xbcdf4 + "\"\n    type: trojan\n    server: " + _0x2020a9 + "\n    port: " + _0x5a3f41 + "\n    password: " + _0x5e4410 + "\n    udp: false\n    sni: " + _0x2020a9 + "\n    skip-cert-verify: true\n    network: ws\n    ws-opts:\n      path: " + _0x3401f7 + "\n      headers:\n        Host: " + _0x2020a9 + "\n";
      }
    }
    if (_0x1786a5 === 'mix' || _0x1786a5 === "shadowsocks") {
      if (_0x67ac19.length > 0x0) {
        _0x67ac19.forEach((_0x3c3645, _0x247523) => {
          const _0x53eb18 = _0x2cde90 === "wildcard" ? _0x3c3645 + '.' + _0x2020a9 : _0x2020a9;
          const _0x907f67 = '[' + (_0x29feac.indexOf(_0x468e1e) * _0x67ac19.length + _0x247523 + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [SS-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
          _0x8df0ee += "\n  - name: \"" + _0x907f67 + "\"\n    type: ss\n    server: " + _0x3c3645 + "\n    port: " + _0x5a3f41 + "\n    cipher: none\n    password: " + _0x5e4410 + "\n    udp: false\n    plugin: v2ray-plugin\n    plugin-opts:\n      mode: websocket\n      tls: " + _0x20d327 + "\n      skip-cert-verify: true\n      host: " + _0x53eb18 + "\n      path: " + _0x3401f7 + "\n      mux: false\n";
        });
      } else {
        const _0x5e7f61 = '[' + (_0x29feac.indexOf(_0x468e1e) + 0x1) + "] " + _0x468e1e.country + " - " + _0x468e1e.provider + " [SS-" + (_0x20d327 ? "TLS" : "NTLS") + ']';
        _0x8df0ee += "\n  - name: \"" + _0x5e7f61 + "\"\n    type: ss\n    server: " + _0x2020a9 + "\n    port: " + _0x5a3f41 + "\n    cipher: none\n    password: " + _0x5e4410 + "\n    udp: false\n    plugin: v2ray-plugin\n    plugin-opts:\n      mode: websocket\n      tls: " + _0x20d327 + "\n      skip-cert-verify: true\n      host: " + _0x2020a9 + "\n      path: " + _0x3401f7 + "\n      mux: false\n";
      }
    }
  });
  return _0x8df0ee;
}
function generateNekoboxConfig(_0x1c508f) {
  let _0x1885d1 = "##Free##\n{\n  \"dns\": {\n    \"final\": \"dns-final\",\n    \"independent_cache\": true,\n    \"rules\": [\n      {\n        \"disable_cache\": false,\n        \"domain\": [\n          \"family.cloudflare-dns.com\"\n        ],\n        \"server\": \"direct-dns\"\n      }\n    ],\n    \"servers\": [\n      {\n        \"address\": \"https://family.cloudflare-dns.com/dns-query\",\n        \"address_resolver\": \"direct-dns\",\n        \"strategy\": \"ipv4_only\",\n        \"tag\": \"remote-dns\"\n      },\n      {\n        \"address\": \"local\",\n        \"strategy\": \"ipv4_only\",\n        \"tag\": \"direct-dns\"\n      },\n      {\n        \"address\": \"local\",\n        \"address_resolver\": \"dns-local\",\n        \"strategy\": \"ipv4_only\",\n        \"tag\": \"dns-final\"\n      },\n      {\n        \"address\": \"local\",\n        \"tag\": \"dns-local\"\n      },\n      {\n        \"address\": \"rcode://success\",\n        \"tag\": \"dns-block\"\n      }\n    ]\n  },\n  \"experimental\": {\n    \"cache_file\": {\n      \"enabled\": true,\n      \"path\": \"../cache/clash.db\",\n      \"store_fakeip\": true\n    },\n    \"clash_api\": {\n      \"external_controller\": \"127.0.0.1:9090\",\n      \"external_ui\": \"../files/yacd\"\n    }\n  },\n  \"inbounds\": [\n    {\n      \"listen\": \"0.0.0.0\",\n      \"listen_port\": 6450,\n      \"override_address\": \"8.8.8.8\",\n      \"override_port\": 53,\n      \"tag\": \"dns-in\",\n      \"type\": \"direct\"\n    },\n    {\n      \"domain_strategy\": \"\",\n      \"endpoint_independent_nat\": true,\n      \"inet4_address\": [\n        \"172.19.0.1/28\"\n      ],\n      \"mtu\": 9000,\n      \"endpoint_independent_nat\": true,\n      \"inet4_address\": [\n        \"172.19.0.1/28\"\n      ],\n      \"mtu\": 9000,\n      \"sniff\": true,\n      \"sniff_override_destination\": true,\n      \"stack\": \"system\",\n      \"tag\": \"tun-in\",\n      \"type\": \"tun\"\n    },\n    {\n      \"domain_strategy\": \"\",\n      \"listen\": \"0.0.0.0\",\n      \"listen_port\": 2080,\n      \"sniff\": true,\n      \"sniff_override_destination\": true,\n      \"tag\": \"mixed-in\",\n      \"type\": \"mixed\"\n    }\n  ],\n  \"log\": {\n    \"level\": \"info\"\n  },\n  \"outbounds\": [\n    {\n      \"outbounds\": [\n        \"Best Latency\",\n";
  const _0x213c2d = _0x1c508f.map(_0x3becaf => "        \"" + _0x3becaf.name + "\",").join("\n");
  _0x1885d1 += _0x213c2d + "\n";
  _0x1885d1 += "        \"direct\"\n      ],\n      \"tag\": \"Internet\",\n      \"type\": \"selector\"\n    },\n    {\n      \"interval\": \"1m0s\",\n      \"outbounds\": [\n";
  _0x1885d1 += _0x213c2d + "\n";
  _0x1885d1 += "        \"direct\"\n      ],\n      \"tag\": \"Best Latency\",\n      \"type\": \"urltest\",\n      \"url\": \"https://detectportal.firefox.com/success.txt\"\n    },\n";
  const _0x2d2048 = _0x1c508f.map((_0x1c8082, _0x2c7019) => {
    let _0x565893 = '';
    if (_0x1c8082.type === "vmess") {
      _0x565893 = "    {\n      \"alter_id\": 0,\n      \"packet_encoding\": \"\",\n      \"security\": \"zero\",\n      \"server\": \"" + _0x1c8082.server + "\",\n      \"server_port\": " + _0x1c8082.port + ',' + (_0x1c8082.tls ? "\n      \"tls\": {\n        \"enabled\": true,\n        \"insecure\": false,\n        \"server_name\": \"" + (_0x1c8082.sni || _0x1c8082.server) + "\",\n        \"utls\": {\n          \"enabled\": true,\n          \"fingerprint\": \"randomized\"\n        }\n      }," : '') + "\n      \"transport\": {\n        \"headers\": {\n          \"Host\": \"" + (_0x1c8082.wsHost || _0x1c8082.server) + "\"\n        },\n        \"path\": \"" + _0x1c8082.wsPath + "\",\n        \"type\": \"ws\"\n      },\n      \"uuid\": \"" + _0x1c8082.uuid + "\",\n      \"type\": \"vmess\",\n      \"domain_strategy\": \"prefer_ipv4\",\n      \"tag\": \"" + _0x1c8082.name + "\"\n    }";
    } else {
      if (_0x1c8082.type === "vless") {
        _0x565893 = "    {\n      \"domain_strategy\": \"ipv4_only\",\n      \"flow\": \"\",\n      \"multiplex\": {\n        \"enabled\": false,\n        \"max_streams\": 32,\n        \"protocol\": \"smux\"\n      },\n      \"packet_encoding\": \"xudp\",\n      \"server\": \"" + _0x1c8082.server + "\",\n      \"server_port\": " + _0x1c8082.port + ",\n      \"tag\": \"" + _0x1c8082.name + "\"," + (_0x1c8082.tls ? "\n      \"tls\": {\n        \"enabled\": true,\n        \"insecure\": false,\n        \"server_name\": \"" + (_0x1c8082.sni || _0x1c8082.server) + "\",\n        \"utls\": {\n          \"enabled\": true,\n          \"fingerprint\": \"randomized\"\n        }\n      }," : '') + "\n      \"transport\": {\n        \"early_data_header_name\": \"Sec-WebSocket-Protocol\",\n        \"headers\": {\n          \"Host\": \"" + (_0x1c8082.wsHost || _0x1c8082.server) + "\"\n        },\n        \"max_early_data\": 0,\n        \"path\": \"" + _0x1c8082.wsPath + "\",\n        \"type\": \"ws\"\n      },\n      \"type\": \"vless\",\n      \"uuid\": \"" + _0x1c8082.uuid + "\"\n    }";
      } else {
        if (_0x1c8082.type === "trojan") {
          _0x565893 = "    {\n      \"domain_strategy\": \"ipv4_only\",\n      \"multiplex\": {\n        \"enabled\": false,\n        \"max_streams\": 32,\n        \"protocol\": \"smux\"\n      },\n      \"password\": \"" + _0x1c8082.password + "\",\n      \"server\": \"" + _0x1c8082.server + "\",\n      \"server_port\": " + _0x1c8082.port + ",\n      \"tag\": \"" + _0x1c8082.name + "\"," + (_0x1c8082.tls ? "\n      \"tls\": {\n        \"enabled\": true,\n        \"insecure\": false,\n        \"server_name\": \"" + (_0x1c8082.sni || _0x1c8082.server) + "\",\n        \"utls\": {\n          \"enabled\": true,\n          \"fingerprint\": \"randomized\"\n        }\n      }," : '') + "\n      \"transport\": {\n        \"early_data_header_name\": \"Sec-WebSocket-Protocol\",\n        \"headers\": {\n          \"Host\": \"" + (_0x1c8082.wsHost || _0x1c8082.server) + "\"\n        },\n        \"max_early_data\": 0,\n        \"path\": \"" + _0x1c8082.wsPath + "\",\n        \"type\": \"ws\"\n      },\n      \"type\": \"trojan\"\n    }";
        } else if (_0x1c8082.type === 'ss') {
          _0x565893 = "    {\n      \"type\": \"shadowsocks\",\n      \"tag\": \"" + _0x1c8082.name + "\",\n      \"server\": \"" + _0x1c8082.server + "\",\n      \"server_port\": " + _0x1c8082.port + ",\n      \"method\": \"none\",\n      \"password\": \"" + _0x1c8082.password + "\",\n      \"plugin\": \"v2ray-plugin\",\n      \"plugin_opts\": \"mux=0;path=" + _0x1c8082.wsPath + ';host=' + (_0x1c8082.wsHost || _0x1c8082.server) + ";tls=" + (_0x1c8082.tls ? '1' : '0') + "\"\n    }";
        }
      }
    }
    return _0x565893;
  }).join(",\n");
  _0x1885d1 += _0x2d2048;
  _0x1885d1 += ",\n    {\n      \"tag\": \"direct\",\n      \"type\": \"direct\"\n    },\n    {\n      \"tag\": \"bypass\",\n      \"type\": \"direct\"\n    },\n    {\n      \"tag\": \"block\",\n      \"type\": \"block\"\n    },\n    {\n      \"tag\": \"dns-out\",\n      \"type\": \"dns\"\n    }\n  ],\n  \"route\": {\n    \"auto_detect_interface\": true,\n    \"rules\": [\n      {\n        \"outbound\": \"dns-out\",\n        \"port\": [\n          53\n        ]\n      },\n      {\n        \"inbound\": [\n          \"dns-in\"\n        ],\n        \"outbound\": \"dns-out\"\n      },\n      {\n        \"network\": [\n          \"udp\"\n        ],\n        \"outbound\": \"block\",\n        \"port\": [\n          443\n        ],\n        \"port_range\": []\n      },\n      {\n        \"ip_cidr\": [\n          \"224.0.0.0/3\",\n          \"ff00::/8\"\n        ],\n        \"outbound\": \"block\",\n        \"source_ip_cidr\": [\n          \"224.0.0.0/3\",\n          \"ff00::/8\"\n        ]\n      }\n    ]\n  }\n}";
  return _0x1885d1;
}
function showLoading(_0x544805) {
  loadingElement.style.display = "block";
  loadingElement.querySelector(".loading-text").textContent = _0x544805;
  resultElement.style.display = "none";
  validationStatusElement.style.display = 'none';
}
function hideLoading() {
  loadingElement.style.display = "none";
}
function showError(_0x20bbbc) {
  errorMessageElement.textContent = _0x20bbbc;
  errorMessageElement.style.display = "block";
}
function showResult(_0xcc5258) {
  hideLoading();
  validationStatusElement.style.display = "none";
  outputElement.value = _0xcc5258;
  resultElement.style.display = 'block';
  resultElement.scrollIntoView({
    'behavior': "smooth"
  });
}
function shuffleArray(_0xd9add7) {
  for (let _0x502beb = _0xd9add7.length - 0x1; _0x502beb > 0x0; _0x502beb--) {
    const _0x1d417d = Math.floor(Math.random() * (_0x502beb + 0x1));
    [_0xd9add7[_0x502beb], _0xd9add7[_0x1d417d]] = [_0xd9add7[_0x1d417d], _0xd9add7[_0x502beb]];
  }
  return _0xd9add7;
}
