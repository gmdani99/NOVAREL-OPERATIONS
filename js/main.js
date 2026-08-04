(function () {
  "use strict";

  // ---------- Mobile menu ----------
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var iconMenu = document.getElementById("icon-menu");
  var iconClose = document.getElementById("icon-close");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.contains("hidden") === false;
      mobileMenu.classList.toggle("hidden");
      iconMenu.classList.toggle("hidden");
      iconClose.classList.toggle("hidden");
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        iconMenu.classList.remove("hidden");
        iconClose.classList.add("hidden");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll(".faq-question").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      var isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item.open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        }
      });

      item.classList.toggle("open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  // ---------- Hero parallax (mouse-driven, desktop only, no infinite loop) ----------
  var prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  var hero = document.querySelector(".hero-grid")
    ? document.querySelector(".hero-grid").closest("section")
    : null;
  var blobs = document.querySelectorAll(".parallax-blob");

  if (hero && blobs.length && hasFinePointer && !prefersReducedMotionQuery.matches) {
    var rafId = null;
    hero.addEventListener("mousemove", function (e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        blobs.forEach(function (blob) {
          var depth = parseFloat(blob.getAttribute("data-depth")) || 20;
          blob.style.transform = "translate(" + (relX * depth) + "px, " + (relY * depth) + "px)";
        });
        rafId = null;
      });
    });
    hero.addEventListener("mouseleave", function () {
      blobs.forEach(function (blob) { blob.style.transform = "translate(0, 0)"; });
    });
  }

  // ---------- Booking widget: calendar limited to 3 days, with mock availability ----------
  var dayPicker = document.getElementById("day-picker");
  var timePicker = document.getElementById("time-picker");
  var noSlotsMsg = document.getElementById("no-slots-msg");
  var bookingForm = document.getElementById("booking-form");
  var bookingSubmit = document.getElementById("booking-submit");
  var bookingError = document.getElementById("booking-error");
  var bookingSuccess = document.getElementById("booking-success");

  if (dayPicker && timePicker && bookingForm) {
    var MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "16:00", "17:00", "18:00"];
    var monthLabelEl = document.getElementById("cal-month-label");
    var prevBtn = document.getElementById("cal-prev");
    var nextBtn = document.getElementById("cal-next");

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // Demo data: only 3 real calendar dates are bookable, each with a distinct
    // occupancy pattern so a visitor can see what a full, empty and half-booked day looks like.
    var BOOKABLE = [0, 1, 2].map(function (offset) {
      var d = new Date(today);
      d.setDate(d.getDate() + offset);
      return {
        offset: offset,
        date: d,
        key: d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(),
        occupancy: offset === 0 ? "full" : offset === 1 ? "empty" : "half"
      };
    });

    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();
    var selectedDay = null; // { key, occupancy, label }
    var selectedTime = null;

    function isSlotBusy(occupancy, index) {
      if (occupancy === "full") return true;
      if (occupancy === "empty") return false;
      return index % 2 === 0; // "half": alternate busy/free
    }

    function dateKey(y, m, d) { return y + "-" + m + "-" + d; }

    function renderMonth() {
      dayPicker.innerHTML = "";
      monthLabelEl.textContent = MONTH_NAMES[viewMonth] + " " + viewYear;

      var firstOfMonth = new Date(viewYear, viewMonth, 1);
      var startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (var i = 0; i < startOffset; i++) {
        var blank = document.createElement("div");
        blank.className = "calendar-cell calendar-cell-empty";
        dayPicker.appendChild(blank);
      }

      for (var day = 1; day <= daysInMonth; day++) {
        var key = dateKey(viewYear, viewMonth, day);
        var bookable = BOOKABLE.find(function (b) { return b.key === key; });
        var isToday = key === dateKey(today.getFullYear(), today.getMonth(), today.getDate());

        var cell = document.createElement(bookable ? "button" : "div");
        cell.className = "calendar-cell" + (isToday ? " is-today" : "");
        cell.textContent = String(day);

        if (bookable) {
          cell.type = "button";
          cell.classList.add("is-available");
          cell.setAttribute("role", "gridcell");
          cell.setAttribute("aria-selected", "false");
          cell.dataset.key = key;

          if (selectedDay && selectedDay.key === key) {
            cell.classList.add("is-selected");
            cell.setAttribute("aria-selected", "true");
          }

          cell.addEventListener("click", function () {
            var clickedKey = this.dataset.key;
            var clickedBookable = BOOKABLE.find(function (b) { return b.key === clickedKey; });
            dayPicker.querySelectorAll(".calendar-cell.is-selected").forEach(function (p) {
              p.classList.remove("is-selected");
              p.setAttribute("aria-selected", "false");
            });
            this.classList.add("is-selected");
            this.setAttribute("aria-selected", "true");

            var d = clickedBookable.date;
            var label = d.getDate() + " de " + MONTH_NAMES[d.getMonth()];
            selectedDay = { key: clickedKey, occupancy: clickedBookable.occupancy, label: label };
            selectedTime = null;
            buildTimes();
            validateForm();
          });
        }

        dayPicker.appendChild(cell);
      }

      var totalCells = startOffset + daysInMonth;
      var trailing = (7 - (totalCells % 7)) % 7;
      for (var t = 0; t < trailing; t++) {
        var blankEnd = document.createElement("div");
        blankEnd.className = "calendar-cell calendar-cell-empty";
        dayPicker.appendChild(blankEnd);
      }
    }

    function goToMonth(delta) {
      viewMonth += delta;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderMonth();
    }

    prevBtn.addEventListener("click", function () { goToMonth(-1); });
    nextBtn.addEventListener("click", function () { goToMonth(1); });

    function buildDays() {
      renderMonth();
      // Default to the empty ("Mañana") day so visitors land on availability, not a full day
      var defaultBookable = BOOKABLE[1];
      var defaultCell = dayPicker.querySelector('.calendar-cell[data-key="' + defaultBookable.key + '"]');
      if (defaultCell) defaultCell.click();
    }

    function buildTimes() {
      timePicker.innerHTML = "";
      var occupancy = selectedDay ? selectedDay.occupancy : "empty";
      var anyFree = false;

      ALL_SLOTS.forEach(function (slot, index) {
        var busy = isSlotBusy(occupancy, index);
        if (!busy) anyFree = true;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot" + (busy ? " is-busy" : "");
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");
        btn.disabled = busy;
        btn.textContent = slot;

        if (!busy) {
          btn.addEventListener("click", function () {
            timePicker.querySelectorAll(".time-slot").forEach(function (p) {
              p.classList.remove("is-selected");
              p.setAttribute("aria-checked", "false");
            });
            this.classList.add("is-selected");
            this.setAttribute("aria-checked", "true");
            selectedTime = slot;
            validateForm();
          });
        }

        timePicker.appendChild(btn);

        // Staggered entrance animation each time the day changes
        window.setTimeout(function () { btn.classList.add("slot-in"); }, index * 45);
      });

      noSlotsMsg.classList.toggle("hidden", anyFree);
    }

    function validateForm() {
      var name = document.getElementById("bk-name").value.trim();
      var taller = document.getElementById("bk-taller").value.trim();
      var phone = document.getElementById("bk-phone").value.trim();
      var ready = Boolean(selectedDay && selectedTime && name && taller && phone);
      bookingSubmit.disabled = !ready;
    }

    ["bk-name", "bk-taller", "bk-phone"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", validateForm);
    });

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!selectedDay || !selectedTime) {
        bookingError.textContent = "Elige un día y una hora antes de enviar la solicitud.";
        bookingError.classList.remove("hidden");
        return;
      }
      bookingError.classList.add("hidden");

      var name = document.getElementById("bk-name").value.trim();
      var taller = document.getElementById("bk-taller").value.trim();
      var phone = document.getElementById("bk-phone").value.trim();

      var message =
        "Hola, quiero solicitar una cita de diagnóstico con Novarel Operations.\n\n" +
        "Nombre: " + name + "\n" +
        "Taller: " + taller + "\n" +
        "Teléfono: " + phone + "\n" +
        "Día solicitado: " + selectedDay.label + "\n" +
        "Hora solicitada: " + selectedTime + "\n\n" +
        "(Solicitud de cita pendiente de confirmación por parte de Novarel Operations.)";

      var whatsappUrl =
        "https://wa.me/34627490823?text=" + encodeURIComponent(message);

      window.open(whatsappUrl, "_blank", "noopener");
      bookingSuccess.classList.remove("hidden");
      bookingSubmit.disabled = true;
    });

    buildDays();
  }

  // ---------- Scroll reveal ----------
  var revealEls = document.querySelectorAll(".reveal");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }
})();
