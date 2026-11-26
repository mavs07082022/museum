const roomCards = document.getElementById("roomCards");
const visited = JSON.parse(localStorage.getItem("mohVisited") || "[]");

const sourceEntries = [
  ["Stanford Encyclopedia of Philosophy — Personhood", "Background reading on philosophical accounts of personhood.", "https://plato.stanford.edu/"],
  ["Internet Encyclopedia of Philosophy — Freedom", "Philosophical overview of freedom and responsibility.", "https://iep.utm.edu/"],
  ["Internet Encyclopedia of Philosophy — Empathy", "Explore empathy, understanding, and ethical relationships.", "https://iep.utm.edu/"],
  ["UNESCO — Culture", "Culture, heritage, and human communities.", "https://www.unesco.org/en/culture"],
  ["Filipino Philosophy / Kapwa and Bayanihan", "Use your class modules and teacher-approved readings.", "https://www.google.com/search?q=Filipino+philosophy+kapwa+bayanihan+academic+references"]
];

function renderCards() {
  roomCards.innerHTML = window.rooms.map(r => `
    <article class="room-card" data-id="${r.id}" onclick="openRoom(${r.id})">
      <img src="${r.card}" alt="Photographic visual for ${r.title}" loading="lazy">
      <div class="card-content">
        <span class="room-number">ROOM 0${r.id}</span>
        <h3>${r.title}</h3>
        <p>${r.subtitle}</p>
        <button class="enter-room">ENTER ROOM ↗</button>
      </div>
    </article>`).join("");
}

function renderSources() {
  document.getElementById("sourceList").innerHTML = sourceEntries.map(s => `
    <div class="source-item">
      <p><b>${s[0]}</b><br>${s[1]}</p>
      <a href="${s[2]}" target="_blank" rel="noopener">OPEN SOURCE ↗</a>
    </div>`).join("");
}

function progress() {
  document.getElementById("progressText").textContent = `${visited.length} / 5`;
  document.getElementById("progressBar").style.width = `${visited.length * 20}%`;
}

function buildRoomHTML(r) {
  const exhibits = r.exhibits.map((e, i) => `
    <button class="exhibit" type="button" onclick="window.open3DRoom(${r.id})">
      <img src="${e[2]}" alt="${e[0]}" loading="lazy">
      <div>
        <h3>${e[0]}</h3>
        <p>${e[1]}</p>
        <span class="exhibit-hint">CLICK TO VIEW IN 3D ROOM ↗</span>
      </div>
    </button>`).join("");

  const videoId = r.videoId;
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : r.card;

  return `
    <div class="room-hero" style="background-image:url('${r.image}')">
      <div class="room-hero-content">
        <span class="eyebrow">ROOM 0${r.id} • VIRTUAL EXHIBIT</span>
        <h2>${r.title}</h2>
        <p>${r.subtitle}</p>
      </div>
    </div>
    <div class="room-body">
      <p class="room-intro">${r.desc}</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <button class="gold-button" onclick="window.open3DRoom(${r.id})">🚶‍♂️ ENTER 3D EXHIBIT</button>
      </div>

      <div class="exhibit-grid">${exhibits}</div>

      <blockquote class="room-quote">
        ${r.quotes ? r.quotes.map(q => `<p class="room-quote-line">“${q}”</p>`).join("") : r.quote}
      </blockquote>

      <div class="video-feature">
        <div class="video-thumb" onclick="playRoomVideo(${r.id})">
          <img src="${thumb}" alt="Video thumbnail" onerror="this.src='${r.card}'">
          <div class="play-button">▶</div>
        </div>
        <div class="video-info">
          <span class="eyebrow">WATCH & LEARN</span>
          <h3>${r.videoTitle}</h3>
          <p>Watch this video to explore the concepts in this room.</p>
        </div>
      </div>

      <div class="reflection-card">
        <span class="eyebrow">INTERACTIVE REFLECTION</span>
        <h3>${r.activity}</h3>
        <p>${r.reflection}</p>
        <textarea id="roomReflection" placeholder="Your response..."></textarea>
        <button class="gold-button" onclick="saveRoomReflection(${r.id})">SAVE ROOM REFLECTION</button>
        <span class="saved-note" id="roomSaved"></span>
      </div>

      <div class="room-actions">
        <button class="enter-room" onclick="closeRoom()">← BACK TO EXHIBITION</button>
        ${r.id < 5 ? `<button class="gold-button" onclick="nextRoom(${r.id + 1})">NEXT ROOM →</button>` : `<button class="gold-button" onclick="closeRoom(); openJournal()">FINISH & REFLECT →</button>`}
      </div>
    </div>`;
}

function openRoom(id) {
  const r = window.rooms.find(x => x.id === id);
  if (!r) return;

  if (!visited.includes(id)) {
    visited.push(id);
    localStorage.setItem("mohVisited", JSON.stringify(visited));
    progress();
  }

  const contentDiv = document.getElementById("roomContent");
  contentDiv.innerHTML = buildRoomHTML(r);

  document.getElementById("roomModal").classList.add("open");
  document.getElementById("roomModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const saved = JSON.parse(localStorage.getItem("mohRoomReflections") || "{}");
  const textarea = document.getElementById("roomReflection");
  if (saved[id] && textarea) textarea.value = saved[id];

  document.querySelector(".modal-panel").scrollTop = 0;
}

function nextRoom(id) {
  const contentDiv = document.getElementById("roomContent");
  contentDiv.classList.add("fade-out");
  setTimeout(() => {
    contentDiv.classList.remove("fade-out");
    openRoom(id);
    contentDiv.classList.add("fade-in");
    setTimeout(() => contentDiv.classList.remove("fade-in"), 400);
  }, 300);
}

function closeRoom() {
  document.getElementById("roomModal").classList.remove("open");
  document.getElementById("roomModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function saveRoomReflection(id) {
  const s = JSON.parse(localStorage.getItem("mohRoomReflections") || "{}");
  s[id] = document.getElementById("roomReflection").value;
  localStorage.setItem("mohRoomReflections", JSON.stringify(s));
  document.getElementById("roomSaved").textContent = "Saved on this device ✓";
}

function playRoomVideo(id) {
  const r = window.rooms.find(x => x.id === id);
  if (!r || !r.videoId) return;
  playRoomVideoById(r.videoId, r.videoTitle);
}

function playRoomVideoById(videoId, title) {
  document.getElementById("videoFrame").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  document.getElementById("videoCaption").textContent = title;
  document.getElementById("videoModal").classList.add("open");
}

function closeVideo() {
  document.getElementById("videoModal").classList.remove("open");
  document.getElementById("videoFrame").innerHTML = "";
  if (window.isVirtualRoomOpen) {
    setTimeout(() => {
      document.getElementById("v-canvas-container").requestPointerLock();
    }, 100);
  }
}

function openJournal() {
  document.getElementById("journalModal").classList.add("open");
  document.getElementById("journalInput").value = localStorage.getItem("mohFinalReflection") || "";
}

function closeJournal() {
  document.getElementById("journalModal").classList.remove("open");
}

function showArtFocus(exhibit) {
  document.getElementById("artFocusImage").src = exhibit.img;
  document.getElementById("artFocusTitle").textContent = exhibit.title;
  document.getElementById("artFocusDesc").textContent = exhibit.desc;
  document.getElementById("artFocus").classList.add("open");
  document.getElementById("artFocus").setAttribute("aria-hidden", "false");
}

function closeArtFocus() {
  document.getElementById("artFocus").classList.remove("open");
  document.getElementById("artFocus").setAttribute("aria-hidden", "true");
  if (window.isVirtualRoomOpen) {
    setTimeout(() => {
      document.getElementById("v-canvas-container").requestPointerLock();
    }, 100);
  }
}

// Next Room Modal logic
let targetNextRoomId = null;

function openNextRoomPrompt(nextId) {
  targetNextRoomId = nextId;
  const r = window.rooms.find(x => x.id === nextId);
  if (!r) return;
  
  document.getElementById("nextRoomTitle").textContent = r.title;
  document.getElementById("nextRoomDesc").textContent = r.desc;
  document.getElementById("nextRoomModal").classList.add("open");
}

function closeNextRoomModal() {
  document.getElementById("nextRoomModal").classList.remove("open");
  if (window.isVirtualRoomOpen) {
    setTimeout(() => {
      document.getElementById("v-canvas-container").requestPointerLock();
    }, 100);
  }
}

function goToNextRoom() {
  document.getElementById("nextRoomModal").classList.remove("open");
  if (targetNextRoomId !== null) {
    window.open3DRoom(targetNextRoomId);
  }
}

/* ---------- INIT ---------- */
renderCards();
renderSources();
progress();

document.querySelector(".modal-close").addEventListener("click", closeRoom);
document.querySelector(".modal-backdrop").addEventListener("click", closeRoom);
document.querySelector(".video-close").addEventListener("click", closeVideo);
document.querySelector(".video-backdrop").addEventListener("click", closeVideo);
document.querySelector(".journal-close").addEventListener("click", closeJournal);
document.querySelector(".journal-backdrop").addEventListener("click", closeJournal);
document.getElementById("openJournal").addEventListener("click", openJournal);
document.getElementById("saveJournal").addEventListener("click", () => {
  localStorage.setItem("mohFinalReflection", document.getElementById("journalInput").value);
  document.getElementById("savedNote").textContent = "Reflection saved ✓";
});

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("mohTheme");
if (savedTheme === "light") document.body.classList.add("light");
function syncTheme() {
  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☾" : "☼";
}
syncTheme();
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("mohTheme", document.body.classList.contains("light") ? "light" : "dark");
  syncTheme();
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".nav");
menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("show");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => {
  siteNav.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
}));

window.openRoom = openRoom;
window.closeRoom = closeRoom;
window.nextRoom = nextRoom;
window.playRoomVideo = playRoomVideo;
window.playRoomVideoById = playRoomVideoById;
window.closeVideo = closeVideo;
window.openJournal = openJournal;
window.closeJournal = closeJournal;
window.saveRoomReflection = saveRoomReflection;
window.showArtFocus = showArtFocus;
window.closeArtFocus = closeArtFocus;
window.openNextRoomPrompt = openNextRoomPrompt;
window.closeNextRoomModal = closeNextRoomModal;
window.goToNextRoom = goToNextRoom;
