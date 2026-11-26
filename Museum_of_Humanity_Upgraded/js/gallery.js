/* ============================================================
   MUSEUM OF HUMANITY — ARTWORK FOCUS
   Handles the "approach the artwork" experience.
   - Opens a focused overlay when an exhibit is clicked
   - Supports prev/next navigation through the room's exhibits
   - Keyboard support (Esc to close, arrows to navigate)
   - Uses a FLIP-style entrance animation
   ============================================================ */

(function () {
  "use strict";

  const overlay = document.getElementById("artFocus");
  const backdrop = overlay.querySelector(".art-focus-backdrop");
  const imageEl = document.getElementById("artFocusImage");
  const eyebrowEl = document.getElementById("artFocusEyebrow");
  const titleEl = document.getElementById("artFocusTitle");
  const descEl = document.getElementById("artFocusDesc");
  const prevBtn = document.getElementById("artPrev");
  const nextBtn = document.getElementById("artNext");

  // Current state
  let currentRoomId = null;
  let currentIndex = 0;
  let lastFocusedElement = null;

  /* ---------- Helpers ---------- */
  function getRoom(roomId) {
    return (window.rooms || []).find(r => r.id === roomId);
  }

  function getExhibit(roomId, index) {
    const room = getRoom(roomId);
    if (!room || !room.exhibits || !room.exhibits[index]) return null;
    const e = room.exhibits[index];
    return { title: e[0], desc: e[1], img: e[2] };
  }

  function setContent(roomId, index) {
    const exhibit = getExhibit(roomId, index);
    if (!exhibit) return;

    const room = getRoom(roomId);
    const total = room.exhibits.length;

    imageEl.src = exhibit.img;
    imageEl.alt = exhibit.title;
    eyebrowEl.textContent = `ROOM 0${roomId} • EXHIBIT ${index + 1} OF ${total}`;
    titleEl.textContent = exhibit.title;
    descEl.textContent = exhibit.desc;

    // Navigation buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    prevBtn.style.opacity = index === 0 ? ".35" : "1";
    nextBtn.style.opacity = index === total - 1 ? ".35" : "1";
    prevBtn.style.cursor = index === 0 ? "not-allowed" : "pointer";
    nextBtn.style.cursor = index === total - 1 ? "not-allowed" : "pointer";
  }

  /* ---------- Open / Close ---------- */
  function openArtwork(roomId, index) {
    const exhibit = getExhibit(roomId, index);
    if (!exhibit) return;

    lastFocusedElement = document.activeElement;
    currentRoomId = roomId;
    currentIndex = index;

    setContent(roomId, index);

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // FLIP-style entrance: animate the image from the clicked thumbnail
    animateFromThumbnail(roomId, index);

    // Focus the close button for accessibility
    setTimeout(() => {
      const closeBtn = overlay.querySelector(".art-focus-close");
      if (closeBtn) closeBtn.focus();
    }, 100);
  }

  function animateFromThumbnail(roomId, index) {
    // Find the originating exhibit button in the room
    const sourceBtn = document.querySelector(
      `.exhibit[data-room-id="${roomId}"][data-exhibit-index="${index}"] img`
    );
    if (!sourceBtn) return;

    const first = sourceBtn.getBoundingClientRect();
    const last = imageEl.getBoundingClientRect();
    if (!last.width || !last.height) return;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const scaleX = first.width / last.width;
    const scaleY = first.height / last.height;

    imageEl.style.transition = "none";
    imageEl.style.transformOrigin = "top left";
    imageEl.style.transform =
      `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;

    // Force reflow, then animate to natural position
    void imageEl.offsetWidth;
    requestAnimationFrame(() => {
      imageEl.style.transition =
        "transform .55s cubic-bezier(.22,1,.36,1)";
      imageEl.style.transform = "none";
    });
  }

  function closeArtwork() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Reset any leftover transform
    imageEl.style.transition = "";
    imageEl.style.transform = "";
    imageEl.src = "";

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  /* ---------- Navigation ---------- */
  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      setContent(currentRoomId, currentIndex);
    }
  }

  function goNext() {
    const room = getRoom(currentRoomId);
    if (room && currentIndex < room.exhibits.length - 1) {
      currentIndex++;
      setContent(currentRoomId, currentIndex);
    }
  }

  /* ---------- Events ---------- */
  backdrop.addEventListener("click", closeArtwork);

  overlay.querySelectorAll("[data-close-art]").forEach(el => {
    el.addEventListener("click", closeArtwork);
  });

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeArtwork();
    } else if (e.key === "ArrowLeft") {
      goPrev();
    } else if (e.key === "ArrowRight") {
      goNext();
    }
  });

  /* ---------- Export ---------- */
  window.openArtwork = openArtwork;
  window.closeArtwork = closeArtwork;
})();