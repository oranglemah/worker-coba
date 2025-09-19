// worker.js — Full patch with CC filter & all /sub endpoints
// Runs on Cloudflare Workers (no DOM). UI sederhana tersedia di /sub dan /web.

/* ===================== CONFIG ===================== */
const CONFIG = {
  proxyListUrl: "https://raw.githubusercontent.com/AFRcloud/ProxyList/refs/heads/main/ProxyList.txt",
  apiCheckUrl: "https://api.jb8fd7grgd.workers.dev/",
  mainDomains: ["dia.oranglemah.web.id"],
  defaultUuid: "fccdaaae-af39-41a7-9fde-fd32a48278cf",
  maxProxies: 0x32,
  defaultProxyCount: 0x5,
  pathTemplate: "/Free/{ip}-{port}",
  uiTitle: "AFRCloud Sub Generator"
};

/* ===================== Boot ===================== */
addEventListener("fetch", event => event.respondWith(handleRequest(event.request)));

/* ===================== ISO2 Map (CC Helper) ===================== */
const ISO2_MAP = {
  ID: "Indonesia", SG: "Singapore", MY: "Malaysia", TH: "Thailand", VN: "Vietnam",
  PH: "Philippines", JP: "Japan", KR: "Korea", HK: "Hong Kong", TW: "Taiwan",
  CN: "China", IN: "India", AU: "Australia", NZ: "New Zealand",
  US: "United States", CA: "Canada", MX: "Mexico",
  GB: "United Kingdom", UK: "United Kingdom", DE: "Germany", NL: "Netherlands",
  FR: "France", ES: "Spain", IT: "Italy", TR: "Turkey", RU: "Russia",
  AE: "United Arab Emirates", SA: "Saudi Arabia"
};

/* ===================== Utils ===================== */
function normalizeCC(ccRaw) {
  if (!ccRaw) return "";
  const cc = ccRaw.trim();
  if (cc.length === 2) {
    const iso = cc.toUpperCase();
    return ISO2_MAP[iso] || iso; // if not in map, keep code
  }
  return cc;
}
function matchCountry(recordCountry, wanted) {
  if (!wanted) return true;
  const rc = (recordCountry || "").toLowerCase();
  const w  = wanted.toLowerCase();
  return rc === w || rc.includes(`(${w})`) || rc.startsWith(w) || rc.includes(` ${w} `) || rc.endsWith(` ${w}`);
}
function clampLimit(n, min = 1, max = CONFIG.maxProxies) {
  const num = Number.isFinite(n) ? n : CONFIG.defaultProxyCount;
  return Math.min(Math.max(num, min), max);
}
function pickRandom(list, n) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
function safeBase64Encode(str) {
  try { return btoa(unescape(encodeURIComponent(str))); } catch { return ""; }
}
function uenc(s) { return encodeURIComponent(s); }

async function fetchProxyListText(url) {
  const r = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(`Proxy list fetch failed ${r.status}`);
  return await r.text();
}
function parseProxyListText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length === 0) return [];
  let delim = ",";
  const first = lines[0];
  if (first.includes("\t")) delim = "\t";
  else if (first.includes("|")) delim = "|";
  else if (first.includes(";")) delim = ";";
  return lines.map(l => {
    const p = l.split(delim);
    if (p.length < 2) return null;
    return {
      ip: p[0].trim(),
      port: p[1].trim(),
      country: p.length >= 3 ? p[2].trim() : "Unknown",
      provider: p.length >= 4 ? p[3].trim() : "Unknown Provider"
    };
  }).filter(Boolean);
}
async function getFilteredProxiesByCC(cc, limit) {
  const raw = await fetchProxyListText(CONFIG.proxyListUrl);
  const all = parseProxyListText(raw);
  const wanted = normalizeCC(cc);
  const filtered = wanted ? all.filter(p => matchCountry(p.country, wanted)) : all;
  const final = pickRandom(filtered.length ? filtered : all, clampLimit(limit));
  return final;
}

/* ===================== Generators ===================== */
// V2Ray/VMess/VLESS/Trojan/SS link builder
function generateV2rayLinks(protocol, proxyList, uuid, bugType, mainDomain, customBugs, tls) {
  const out = [];
  let bugHosts = [];
  if (customBugs && (bugType === "non-wildcard" || bugType === "wildcard")) {
    bugHosts = customBugs.split(",").map(s => s.trim()).filter(Boolean);
  }

  for (const rec of proxyList) {
    const path = CONFIG.pathTemplate.replace("{ip}", rec.ip).replace("{port}", rec.port);
    const port = tls ? 443 : 80;
    const sec = tls ? "tls" : "none";
    const nameBase = `${rec.country} - ${rec.provider}`;

    const genForHost = (hostRoot, hostHeader, sniHost) => {
      if (protocol === "mix" || protocol === "vmess") {
        const vmess = {
          v: "2", ps: `[${out.length + 1}] ${nameBase} [VMess-${tls ? "TLS" : "NTLS"}]`,
          add: hostRoot, port, id: uuid, aid: "0", net: "ws", type: "none",
          host: hostHeader, path, tls: sec, sni: sniHost, scy: "zero"
        };
        out.push("vmess://" + safeBase64Encode(JSON.stringify(vmess)));
      }
      if (protocol === "mix" || protocol === "vless") {
        const tag = uenc(`[${out.length + 1}] ${nameBase} [VLESS-${tls ? "TLS" : "NTLS"}]`);
        out.push(`vless://${uuid}@${hostRoot}:${port}?encryption=none&security=${sec}&type=ws&host=${hostHeader}&path=${uenc(path)}&sni=${sniHost}#${tag}`);
      }
      if (protocol === "mix" || protocol === "trojan") {
        const tag = uenc(`[${out.length + 1}] ${nameBase} [Trojan-${tls ? "TLS" : "NTLS"}]`);
        out.push(`trojan://${uuid}@${hostRoot}:${port}?security=${sec}&type=ws&host=${hostHeader}&path=${uenc(path)}&sni=${sniHost}#${tag}`);
      }
      if (protocol === "mix" || protocol === "shadowsocks") {
        const tag = uenc(`[${out.length + 1}] ${nameBase} [SS-${tls ? "TLS" : "NTLS"}]`);
        const auth = safeBase64Encode(`none:${uuid}`);
        out.push(`ss://${auth}@${hostRoot}:${port}?plugin=v2ray-plugin%3Btls%3Bmode%3Dwebsocket%3Bpath%3D${uenc(path)}%3Bhost%3D${hostHeader}#${tag}`);
      }
    };

    if (bugHosts.length > 0) {
      for (const h of bugHosts) {
        const isWildcard = bugType === "wildcard";
        const hostRoot = h;
        const hostHeader = isWildcard ? `${h}.${mainDomain}` : mainDomain;
        const sniHost = hostHeader;
        genForHost(hostRoot, hostHeader, sniHost);
      }
    } else {
      genForHost(mainDomain, mainDomain, mainDomain);
    }
  }

  return out.join("\n");
}

// Clash YAML
function generateClashConfig(protocol, proxyList, uuid, bugType, mainDomain, customBugs, tls) {
  let yaml = `# Clash Proxy Provider Configuration
# Generated by AFRCloud
# Date: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })}
# Protocol: ${protocol.toUpperCase()}
# TLS: ${tls ? "Enabled" : "Disabled"}

proxies:
`;
  let bugHosts = [];
  if (customBugs && (bugType === "non-wildcard" || bugType === "wildcard")) {
    bugHosts = customBugs.split(",").map(s => s.trim()).filter(Boolean);
  }

  for (const rec of proxyList) {
    const path = CONFIG.pathTemplate.replace("{ip}", rec.ip).replace("{port}", rec.port);
    const port = tls ? 443 : 80;

    const pushVmess = (server, hostHeader, sni) => {
      if (protocol === "mix" || protocol === "vmess") {
        const name = `[${proxyList.indexOf(rec) + 1}] ${rec.country} - ${rec.provider} [VMess-${tls ? "TLS" : "NTLS"}]`;
        yaml += `
  - name: "${name}"
    type: vmess
    server: ${server}
    port: ${port}
    uuid: ${uuid}
    alterId: 0
    cipher: zero
    udp: false
    tls: ${tls}
    skip-cert-verify: true
    servername: ${sni}
    network: ws
    ws-opts:
      path: ${path}
      headers:
        Host: ${hostHeader}
`;
      }
    };

    const pushVless = (server, hostHeader, sni) => {
      if (protocol === "mix" || protocol === "vless") {
        const name = `[${proxyList.indexOf(rec) + 1}] ${rec.country} - ${rec.provider} [VLESS-${tls ? "TLS" : "NTLS"}]`;
        yaml += `
  - name: "${name}"
    type: vless
    server: ${server}
    port: ${port}
    uuid: ${uuid}
    udp: false
    tls: ${tls}
    skip-cert-verify: true
    servername: ${sni}
    network: ws
    ws-opts:
      path: ${path}
      headers:
        Host: ${hostHeader}
`;
      }
    };

    const pushTrojan = (server, hostHeader, sni) => {
      if (protocol === "mix" || protocol === "trojan") {
        const name = `[${proxyList.indexOf(rec) + 1}] ${rec.country} - ${rec.provider} [Trojan-${tls ? "TLS" : "NTLS"}]`;
        yaml += `
  - name: "${name}"
    type: trojan
    server: ${server}
    port: ${port}
    password: ${uuid}
    udp: false
    sni: ${sni}
    skip-cert-verify: true
    network: ws
    ws-opts:
      path: ${path}
      headers:
        Host: ${hostHeader}
`;
      }
    };

    const pushSS = (server, hostHeader) => {
      if (protocol === "mix" || protocol === "shadowsocks") {
        const name = `[${proxyList.indexOf(rec) + 1}] ${rec.country} - ${rec.provider} [SS-${tls ? "TLS" : "NTLS"}]`;
        yaml += `
  - name: "${name}"
    type: ss
    server: ${server}
    port: ${port}
    cipher: none
    password: ${uuid}
    udp: false
    plugin: v2ray-plugin
    plugin-opts:
      mode: websocket
      tls: ${tls}
      skip-cert-verify: true
      host: ${hostHeader}
      path: ${path}
      mux: false
`;
      }
    };

    const emitFor = (server, hostHeader, sni) => {
      pushVmess(server, hostHeader, sni);
      pushVless(server, hostHeader, sni);
      pushTrojan(server, hostHeader, sni);
      pushSS(server, hostHeader);
    };

    if (bugHosts.length > 0) {
      for (const h of bugHosts) {
        const isWildcard = bugType === "wildcard";
        const server = h;
        const hostHeader = isWildcard ? `${h}.${mainDomain}` : mainDomain;
        const sni = hostHeader;
        emitFor(server, hostHeader, sni);
      }
    } else {
      emitFor(mainDomain, mainDomain, mainDomain);
    }
  }

  yaml += `
# (Minimal) extra outbounds to keep config valid if imported as full config
# You can paste this into a Provider file or full config as needed.
`;
  return yaml;
}

// Nekobox JSON (nodes array expected)
function generateNekoboxConfig(nodes) {
  // Untuk kesederhanaan, kita buat Internet selector + urltest + daftar nodes
  const nodeJson = nodes.map(n => {
    if (n.type === "vmess") {
      return {
        alter_id: 0, packet_encoding: "", security: "zero",
        server: n.server, server_port: n.port,
        ...(n.tls ? { tls: { enabled: true, insecure: false, server_name: n.sni || n.server, utls: { enabled: true, fingerprint: "randomized" } } } : {}),
        transport: { headers: { Host: n.wsHost || n.server }, path: n.wsPath, type: "ws" },
        uuid: n.uuid, type: "vmess", domain_strategy: "prefer_ipv4", tag: n.name
      };
    } else if (n.type === "vless") {
      return {
        domain_strategy: "ipv4_only", flow: "", multiplex: { enabled: false, max_streams: 32, protocol: "smux" },
        packet_encoding: "xudp", server: n.server, server_port: n.port, tag: n.name,
        ...(n.tls ? { tls: { enabled: true, insecure: false, server_name: n.sni || n.server, utls: { enabled: true, fingerprint: "randomized" } } } : {}),
        transport: { early_data_header_name: "Sec-WebSocket-Protocol", headers: { Host: n.wsHost || n.server }, max_early_data: 0, path: n.wsPath, type: "ws" },
        type: "vless", uuid: n.uuid
      };
    } else if (n.type === "trojan") {
      return {
        domain_strategy: "ipv4_only", multiplex: { enabled: false, max_streams: 32, protocol: "smux" },
        password: n.password, server: n.server, server_port: n.port, tag: n.name,
        ...(n.tls ? { tls: { enabled: true, insecure: false, server_name: n.sni || n.server, utls: { enabled: true, fingerprint: "randomized" } } } : {}),
        transport: { early_data_header_name: "Sec-WebSocket-Protocol", headers: { Host: n.wsHost || n.server }, max_early_data: 0, path: n.wsPath, type: "ws" },
        type: "trojan"
      };
    } else { // ss
      return {
        type: "shadowsocks", tag: n.name, server: n.server, server_port: n.port,
        method: "none", password: n.password,
        plugin: "v2ray-plugin",
        plugin_opts: `mux=0;path=${n.wsPath};host=${n.wsHost || n.server};tls=${n.tls ? "1" : "0"}`
      };
    }
  });

  const skeleton = {
    dns: {
      final: "dns-final", independent_cache: true,
      rules: [{ disable_cache: false, domain: ["family.cloudflare-dns.com"], server: "direct-dns" }],
      servers: [
        { address: "https://family.cloudflare-dns.com/dns-query", address_resolver: "direct-dns", strategy: "ipv4_only", tag: "remote-dns" },
        { address: "local", strategy: "ipv4_only", tag: "direct-dns" },
        { address: "local", address_resolver: "dns-local", strategy: "ipv4_only", tag: "dns-final" },
        { address: "local", tag: "dns-local" },
        { address: "rcode://success", tag: "dns-block" }
      ]
    },
    experimental: {
      cache_file: { enabled: true, path: "../cache/clash.db", store_fakeip: true },
      clash_api: { external_controller: "127.0.0.1:9090", external_ui: "../files/yacd" }
    },
    inbounds: [
      { listen: "0.0.0.0", listen_port: 6450, override_address: "8.8.8.8", override_port: 53, tag: "dns-in", type: "direct" },
      { domain_strategy: "", endpoint_independent_nat: true, inet4_address: ["172.19.0.1/28"], mtu: 9000, sniff: true, sniff_override_destination: true, stack: "system", tag: "tun-in", type: "tun" },
      { domain_strategy: "", listen: "0.0.0.0", listen_port: 2080, sniff: true, sniff_override_destination: true, tag: "mixed-in", type: "mixed" }
    ],
    log: { level: "info" },
    outbounds: [
      { outbounds: ["Best Latency", ...nodes.map(n => n.name), "direct"], tag: "Internet", type: "selector" },
      { interval: "1m0s", outbounds: [...nodes.map(n => n.name), "direct"], tag: "Best Latency", type: "urltest", url: "https://detectportal.firefox.com/success.txt" },
      ...nodeJson,
      { tag: "direct", type: "direct" },
      { tag: "bypass", type: "direct" },
      { tag: "block", type: "block" },
      { tag: "dns-out", type: "dns" }
    ],
    route: {
      auto_detect_interface: true,
      rules: [
        { outbound: "dns-out", port: [53] },
        { inbound: ["dns-in"], outbound: "dns-out" },
        { network: ["udp"], outbound: "block", port: [443], port_range: [] },
        { ip_cidr: ["224.0.0.0/3", "ff00::/8"], outbound: "block", source_ip_cidr: ["224.0.0.0/3", "ff00::/8"] }
      ]
    }
  };
  return "##Free##\n" + JSON.stringify(skeleton, null, 2);
}

/* ===================== Sub Wrappers (use CC filter) ===================== */
async function generateClashSub(type, bugs, bexnxx, tls, cc, limit) {
  const list = await getFilteredProxiesByCC(cc, limit);
  return generateClashConfig(type, list, CONFIG.defaultUuid, bugs ? (bexnxx !== CONFIG.mainDomains[0] ? "non-wildcard" : "default") : "default", bexnxx, null, tls);
}
async function generateV2raySub(type, bugs, bexnxx, tls, cc, limit) {
  const list = await getFilteredProxiesByCC(cc, limit);
  return generateV2rayLinks(type, list, CONFIG.defaultUuid, bugs ? (bexnxx !== CONFIG.mainDomains[0] ? "non-wildcard" : "default") : "default", bexnxx, null, tls);
}
async function generateV2rayngSub(type, bugs, bexnxx, tls, cc, limit) {
  return generateV2raySub(type, bugs, bexnxx, tls, cc, limit);
}
async function generateSingboxSub(type, bugs, bexnxx, tls, cc, limit) {
  // Kalau ada generator khusus Sing-box, panggil di sini.
  // Sementara fallback ke V2Ray links agar tetap ada output.
  return generateV2raySub(type, bugs, bexnxx, tls, cc, limit);
}
async function generateSurfboardSub(type, bugs, bexnxx, tls, cc, limit) {
  // Fallback
  return generateV2raySub(type, bugs, bexnxx, tls, cc, limit);
}
async function generateHusiSub(type, bugs, bexnxx, tls, cc, limit) {
  // Fallback
  return generateV2raySub(type, bugs, bexnxx, tls, cc, limit);
}
async function generateNekoboxSub(type, bugs, bexnxx, tls, cc, limit) {
  const list = await getFilteredProxiesByCC(cc, limit);
  // Bangun nodes singkat mengikuti aturan "nekobox" di kode Anda sebelumnya
  const nodes = [];
  for (const rec of list) {
    const path = CONFIG.pathTemplate.replace("{ip}", rec.ip).replace("{port}", rec.port);
    const port = tls ? 443 : 80;
    const pick = (t) => ({
      type: t,
      name: `[${nodes.length + 1}] (${rec.country}) ${rec.provider} [${t.toUpperCase()}-${tls ? "TLS" : "NTLS"}]`,
      server: bexnxx,
      port,
      uuid: CONFIG.defaultUuid,
      password: CONFIG.defaultUuid,
      tls,
      sni: bexnxx,
      wsHost: bexnxx,
      wsPath: path
    });
    if (type === "vmess" || type === "mix") nodes.push(pick("vmess"));
    if (type === "vless" || type === "mix") nodes.push(pick("vless"));
    if (type === "trojan" || type === "mix") nodes.push(pick("trojan"));
    if (type === "shadowsocks" || type === "mix") nodes.push(pick("ss"));
  }
  return generateNekoboxConfig(nodes);
}

/* ===================== HTTP Handlers ===================== */
async function handleRequest(request) {
  const url = new URL(request.url);

  // (Opsional) direct ip:port extraction mode (dari body/path). Placeholder:
  // Bila sebelumnya Anda punya ipPortMatch dari body/path, proses di sini.
  const ipPortMatch = null; // tidak aktif secara default
  if (ipPortMatch) {
    const proxyIP = ipPortMatch[1].replace(/[=:-]/, ":"); // ip:port
    console.log(`Direct Proxy IP: ${proxyIP}`);
    return new Response("Direct WS handler belum diaktifkan pada build ini.", { status: 501 });
  }

  const bexx = url.hostname;
  const type = url.searchParams.get("type") || "mix";
  const tls = url.searchParams.get("tls") !== "false";
  const wildcard = url.searchParams.get("wildcard") === "true";
  const bugs = url.searchParams.get("bug") || bexx;
  const bexnxx = wildcard ? `${bugs}.${bexx}` : bexx;

  // NEW: dukung cc atau country
  const ccParam = url.searchParams.get("cc") || url.searchParams.get("country") || "";
  // NEW: limit aman
  const limit = clampLimit(parseInt(url.searchParams.get("limit"), 10));

  let configs;

  switch (url.pathname) {
    case "/sub/clash":
      configs = await generateClashSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/surfboard":
      configs = await generateSurfboardSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/singbox":
      configs = await generateSingboxSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/husi":
      configs = await generateHusiSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/nekobox":
      configs = await generateNekoboxSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/v2rayng":
      configs = await generateV2rayngSub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub/v2ray":
      configs = await generateV2raySub(type, bugs, bexnxx, tls, ccParam, limit);
      return txt(configs);
    case "/sub":
      return html(await renderSubUI(bexx));
    case "/web":
      return html(await renderLanding(bexx));
    default:
      // Reverse proxy sederhana (example.com) — bisa diubah
      const targetReverseProxy = "example.com";
      return await reverseProxy(request, targetReverseProxy);
  }
}

/* ===================== Minimal UI ===================== */
async function renderSubUI(hostname) {
  const mainDomainOptions = CONFIG.mainDomains.map(d => `<option value="${d}">${d}</option>`).join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${CONFIG.uiTitle}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Ubuntu,Helvetica,Arial;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
  .card{max-width:920px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:20px}
  label{display:block;margin:.5rem 0 .25rem;color:#cbd5e1}
  input,select{width:100%;padding:.6rem .7rem;border-radius:10px;background:#0b1220;border:1px solid #1e293b;color:#e2e8f0;outline:none}
  .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .btn{background:#2563eb;border:none;padding:.7rem 1rem;border-radius:10px;color:#fff;cursor:pointer;margin-top:12px}
  textarea{width:100%;height:260px;background:#0b1220;border:1px solid #1e293b;color:#e2e8f0;border-radius:10px;padding:12px}
  .muted{color:#94a3b8;font-size:.9rem}
</style>
</head>
<body>
  <div class="card">
    <h2 style="margin:0 0 12px">${CONFIG.uiTitle}</h2>
    <p class="muted">Hostname Anda: <strong>${hostname}</strong></p>

    <div class="row">
      <div>
        <label>Type</label>
        <select id="type">
          <option value="mix">mix</option>
          <option value="vmess">vmess</option>
          <option value="vless">vless</option>
          <option value="trojan">trojan</option>
          <option value="shadowsocks">shadowsocks</option>
        </select>
      </div>
      <div>
        <label>TLS</label>
        <select id="tls">
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div>
        <label>Bug (host)</label>
        <input id="bug" placeholder="cdn, or wildcard label"/>
      </div>
      <div>
        <label>Main Domain</label>
        <select id="mainDomain">${mainDomainOptions}</select>
      </div>
    </div>

    <div class="row">
      <div>
        <label>Wildcard</label>
        <select id="wildcard">
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      </div>
      <div>
        <label>CC / Country</label>
        <input id="cc" placeholder="ID / SG / Indonesia / Singapore"/>
      </div>
    </div>

    <div class="row">
      <div>
        <label>Limit</label>
        <input id="limit" type="number" min="1" max="${CONFIG.maxProxies}" value="${CONFIG.defaultProxyCount}"/>
      </div>
      <div>
        <label>Format</label>
        <select id="fmt">
          <option value="clash">/sub/clash</option>
          <option value="v2ray">/sub/v2ray</option>
          <option value="v2rayng">/sub/v2rayng</option>
          <option value="nekobox">/sub/nekobox</option>
          <option value="singbox">/sub/singbox</option>
          <option value="surfboard">/sub/surfboard</option>
          <option value="husi">/sub/husi</option>
        </select>
      </div>
    </div>

    <button class="btn" id="gen">Generate</button>
    <p class="muted">Hasil:</p>
    <textarea id="out" readonly></textarea>
  </div>

<script>
  const $ = id => document.getElementById(id);
  $("gen").onclick = async () => {
    const fmt = $("fmt").value;
    const type = $("type").value;
    const tls = $("tls").value;
    const bug = $("bug").value.trim();
    const mainDomain = $("mainDomain").value;
    const wildcard = $("wildcard").value;
    const cc = $("cc").value.trim();
    const limit = $("limit").value;

    const host = location.host;
    const ep = \`/\${fmt}?type=\${encodeURIComponent(type)}&tls=\${encodeURIComponent(tls)}&bug=\${encodeURIComponent(bug || mainDomain)}&wildcard=\${encodeURIComponent(wildcard)}&cc=\${encodeURIComponent(cc)}&limit=\${encodeURIComponent(limit)}\`;
    const url = location.protocol + "//" + host + ep;
    const r = await fetch(url);
    $("out").value = await r.text();
  };
</script>
</body></html>`;
}

async function renderLanding(hostname) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${CONFIG.uiTitle}</title></head>
<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;background:#0f172a;color:#e2e8f0">
  <div style="max-width:720px;background:#111827;padding:24px;border-radius:16px;border:1px solid #1f2937">
    <h1 style="margin-top:0">${CONFIG.uiTitle}</h1>
    <p>Gunakan <code>/sub</code> untuk UI generator, atau panggil endpoint langsung:</p>
    <pre style="white-space:pre-wrap;background:#0b1220;padding:12px;border-radius:10px;border:1px solid #1e293b">
https://${hostname}/sub/clash?type=mix&tls=true&wildcard=true&bug=cdn&cc=ID&limit=10
https://${hostname}/sub/v2ray?type=vless&cc=Singapore&limit=5
    </pre>
    <p style="color:#94a3b8">Hostname Anda: <strong>${hostname}</strong></p>
  </div>
</body></html>`;
}

/* ===================== Reverse Proxy (simple) ===================== */
async function reverseProxy(req, targetHost) {
  try {
    const url = new URL(req.url);
    const target = new URL(url.pathname + url.search, `https://${targetHost}`);
    const init = {
      method: req.method,
      headers: new Headers(req.headers),
      redirect: "follow"
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req.body;
    }
    // Adjust Host header
    init.headers.set("Host", target.host);
    return await fetch(target, init);
  } catch (e) {
    return new Response("Reverse proxy error: " + (e && e.message), { status: 502 });
  }
}

/* ===================== Small helpers ===================== */
function txt(body) {
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
function html(body) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
