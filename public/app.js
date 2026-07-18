const form = document.getElementById("form");
const sizeInput = document.getElementById("size");
const sizeValue = document.getElementById("sizeValue");
const presets = document.querySelectorAll(".preset");
const submit = document.getElementById("submit");
const preview = document.getElementById("preview");
const icon = document.getElementById("icon");
const previewTitle = document.getElementById("previewTitle");
const previewSource = document.getElementById("previewSource");
const download = document.getElementById("download");
const copyUrl = document.getElementById("copyUrl");
const status = document.getElementById("status");

let currentApiUrl = "";

function hostnameOf(url) {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
      ? url
      : `https://${url}`;
    return new URL(withProtocol).hostname;
  } catch {
    return url;
  }
}

function setSize(value) {
  const size = Number(value);
  sizeInput.value = String(size);
  sizeValue.textContent = String(size);
  presets.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.size) === size);
  });
}

sizeInput.addEventListener("input", () => {
  setSize(sizeInput.value);
});

presets.forEach((button) => {
  button.addEventListener("click", () => {
    setSize(button.dataset.size);
  });
});

copyUrl.addEventListener("click", async () => {
  if (!currentApiUrl) return;
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}${currentApiUrl}`
    );
    status.textContent = "URL をコピーしました";
    status.classList.remove("is-error");
  } catch {
    status.textContent = "コピーに失敗しました";
    status.classList.add("is-error");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const url = String(data.get("url") ?? "").trim();
  const size = Number(data.get("size") ?? 64);

  if (!url) return;

  const api = `/api/favicon?url=${encodeURIComponent(url)}&size=${encodeURIComponent(size)}`;
  currentApiUrl = api;

  submit.disabled = true;
  status.textContent = "取得中…";
  status.classList.remove("is-error");
  preview.hidden = false;

  try {
    const response = await fetch(`${api}&t=${Date.now()}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `取得に失敗しました (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const host = hostnameOf(url);
    const source =
      response.headers.get("X-Favicon-Source") ||
      `https://www.google.com/s2/favicons?domain=${host}&sz=${size}`;

    icon.src = objectUrl;
    icon.width = size;
    icon.height = size;
    icon.style.width = `${Math.min(size, 72)}px`;
    icon.style.height = `${Math.min(size, 72)}px`;
    // restart pop animation
    icon.style.animation = "none";
    void icon.offsetWidth;
    icon.style.animation = "";

    previewTitle.textContent = `${host} · ${size}px`;
    previewSource.textContent = source;
    download.href = objectUrl;
    download.download = `favicon-${host.replace(/\./g, "_")}-${size}.png`;

    status.textContent = "取得しました";
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : "取得に失敗しました";
    status.classList.add("is-error");
  } finally {
    submit.disabled = false;
  }
});
