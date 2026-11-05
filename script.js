// 1. Venue Information

const venues = [
  {
    id: "auditorium",
    name: "Main Auditorium",
    type: "Auditorium",
    capacity: 500,
    projector: "4K Laser",
    mic: "Wireless + Podium",
    ac: "Central AC",
    emoji: "🎭",
    room: "Uni Tower · Main Auditorium"
  },
  {
    id: "seminar",
    name: "Mini Seminar Hall",
    type: "Seminar Hall",
    capacity: 120,
    projector: "HD Projector",
    mic: "2 Wireless",
    ac: "Central AC",
    emoji: "🎤",
    room: "Academic Block · Seminar Wing"
  },
  {
    id: "classroom",
    name: "Smart Classroom 204",
    type: "Smart Classroom",
    capacity: 60,
    projector: "Interactive Panel",
    mic: "Ceiling Mic",
    ac: "Split AC",
    emoji: "🧑‍🏫",
    room: "Academic Block · Smart Learning Wing"
  },
  {
    id: "conference",
    name: "Conference Room",
    type: "Conference Room",
    capacity: 24,
    projector: "LED Display",
    mic: "Conference System",
    ac: "Split AC",
    emoji: "🤝",
    room: "Administration Block · First Floor"
  }
];


// 2. Date Functions

const today = new Date();
today.setHours(0, 0, 0, 0);

const dateISO = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};


// 3. Sample Booking Data

const sampleDate1 = dateISO(addDays(today, 1));
const sampleDate2 = dateISO(addDays(today, 3));
const sampleDate3 = dateISO(addDays(today, 5));

const seedBookings = [
  {
    id: 1,
    eventName: "LPU Faculty Guest Lecture",
    organizer: "Dr. Ananya Sharma",
    email: "ananya@lpu.in",
    venue: "auditorium",
    date: sampleDate1,
    startTime: "10:00",
    endTime: "12:00",
    attendance: 280,
    av: ["Projector", "Microphone"],
    status: "Reserved"
  },
  {
    id: 2,
    eventName: "LPU Robotics Club Meetup",
    organizer: "Rohan Mehta",
    email: "rohan@lpu.in",
    venue: "classroom",
    date: sampleDate1,
    startTime: "14:00",
    endTime: "16:00",
    attendance: 45,
    av: ["Projector"],
    status: "Pending"
  },
  {
    id: 3,
    eventName: "LPU Research Seminar",
    organizer: "Prof. Iyer",
    email: "iyer@lpu.in",
    venue: "seminar",
    date: sampleDate2,
    startTime: "11:00",
    endTime: "13:00",
    attendance: 90,
    av: ["Projector", "Speakers"],
    status: "Reserved"
  },
  {
    id: 4,
    eventName: "LPU Photography Society Meet",
    organizer: "Aarav Singh",
    email: "aarav@lpu.in",
    venue: "conference",
    date: sampleDate3,
    startTime: "15:00",
    endTime: "16:30",
    attendance: 18,
    av: [],
    status: "Pending"
  }
];


// 4. Load Data from Local Storage

let bookings;

try {
  bookings =
    JSON.parse(localStorage.getItem("campusSpaceBookings")) ||
    seedBookings;
} catch {
  bookings = seedBookings;
}

let viewDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

let selectedDate = dateISO(today);
let activeCalendarVenue = "all";


// 5. Helper Functions

const $ = selector =>
  document.querySelector(selector);

const venueById = id =>
  venues.find(v => v.id === id);

const prettyDate = value =>
  new Date(value + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

const time12 = value => {
  const [h, m] = value.split(":").map(Number);

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

const save = () => {
  localStorage.setItem(
    "campusSpaceBookings",
    JSON.stringify(bookings)
  );
};

const escapeHTML = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));


// 6. Notification Message

function toast(message) {
  const el = $("#toast");

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}


// 7. Fill Venue Dropdowns

function fillVenueSelects() {

  $("#bookingVenue").innerHTML =
    venues.map(v =>
      `<option value="${v.id}">${v.name}</option>`
    ).join("");

  $("#calendarVenueFilter").innerHTML =
    '<option value="all">All venues</option>' +
    venues.map(v =>
      `<option value="${v.id}">${v.name}</option>`
    ).join("");
}


// 8. Dashboard Statistics

function renderStats() {

  $("#totalVenues").textContent = venues.length;

  $("#reservedToday").textContent =
    bookings.filter(b =>
      b.date === dateISO(today) &&
      b.status === "Reserved"
    ).length;

  const pending = bookings.filter(
    b => b.status === "Pending"
  ).length;

  $("#pendingCount").textContent = pending;
  $("#requestNavCount").textContent = pending;

  const usedToday = new Set(
    bookings.filter(b =>
      b.date === dateISO(today) &&
      b.status === "Reserved"
    ).map(b => b.venue)
  );

  $("#availableCount").textContent =
    venues.length - usedToday.size;
}


// 9. Interactive Calendar

function renderCalendar() {

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  $("#monthLabel").textContent =
    viewDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    });

  const first = new Date(year, month, 1);

  const startOffset =
    (first.getDay() + 6) % 7;

  const start = addDays(first, -startOffset);

  const grid = $("#calendarGrid");

  grid.innerHTML = "";

  for (let i = 0; i < 42; i++) {

    const d = addDays(start, i);
    const iso = dateISO(d);

    const inMonth = d.getMonth() === month;

    const dayBookings = bookings.filter(b =>
      b.date === iso &&
      (
        activeCalendarVenue === "all" ||
        b.venue === activeCalendarVenue
      )
    );

    const cell = document.createElement("button");

    cell.type = "button";

    cell.className =
      `calendar-day ${inMonth ? "" : "muted"} ${
        iso === selectedDate ? "selected" : ""
      }`;

    cell.innerHTML = `
      <span class="day-number ${
        iso === dateISO(today) ? "today-mark" : ""
      }">
        ${d.getDate()}
      </span>

      <div class="day-events">
        ${dayBookings.slice(0, 3).map(b =>
          `<i class="event-pill ${b.status.toLowerCase()}"></i>`
        ).join("")}
      </div>

      ${
        dayBookings.length
          ? `<div class="event-count">
              ${dayBookings.length} event(s)
            </div>`
          : ""
      }
    `;

    cell.addEventListener("click", () => {

      selectedDate = iso;

      renderCalendar();
      renderDaySlots();

    });

    grid.appendChild(cell);
  }

  renderDaySlots();
}


// 10. Selected Date Booking Details

function renderDaySlots() {

  $("#selectedDateTitle").textContent =
    prettyDate(selectedDate);

  const dayBookings = bookings
    .filter(b =>
      b.date === selectedDate &&
      (
        activeCalendarVenue === "all" ||
        b.venue === activeCalendarVenue
      )
    )
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  const el = $("#daySlots");

  if (!dayBookings.length) {

    el.innerHTML = `
      <div class="empty-state"
        style="grid-column:1/-1">
        No reservations for this date.
        All venues are currently open for requests.
      </div>
    `;

    return;
  }

  el.innerHTML = dayBookings.map(b => `
    <div class="slot-row">

      <div>
        <strong>${escapeHTML(b.eventName)}</strong>

        <small>
          ${venueById(b.venue)?.name || "Venue"}
          · ${time12(b.startTime)}–${time12(b.endTime)}
        </small>
      </div>

      <span class="status ${b.status.toLowerCase()}">
        ${b.status}
      </span>

    </div>
  `).join("");
}


// 11. Upcoming Reservations

function renderUpcoming() {

  const list = bookings
    .filter(b =>
      b.date >= dateISO(today) &&
      b.status !== "Rejected"
    )
    .sort((a, b) =>
      (a.date + a.startTime).localeCompare(
        b.date + b.startTime
      )
    )
    .slice(0, 4);

  $("#upcomingList").innerHTML = list.length
    ? list.map(b => {

        const d = new Date(b.date + "T00:00:00");

        return `
          <div class="upcoming-item">

            <div class="date-tile">
              <b>${d.getDate()}</b>
              <small>
                ${d.toLocaleDateString("en-IN", {
                  month: "short"
                }).toUpperCase()}
              </small>
            </div>

            <div class="upcoming-info">
              <strong>${escapeHTML(b.eventName)}</strong>
              <small>
                ${venueById(b.venue)?.name}
                · ${time12(b.startTime)}
              </small>
            </div>

            <span class="status ${b.status.toLowerCase()}">
              ${b.status}
            </span>

          </div>
        `;

      }).join("")
    : '<div class="empty-state">No upcoming reservations.</div>';
}


// 12. Venue Directory

function renderVenues() {

  const q = $("#venueSearch").value.toLowerCase();

  const type = $("#venueTypeFilter").value;

  const filtered = venues.filter(v =>

    (type === "all" || v.type === type) &&

    (
      v.name.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      v.room.toLowerCase().includes(q)
    )

  );

  $("#venueGrid").innerHTML = filtered.length
    ? filtered.map(v => `

      <article class="venue-card">

        <div class="venue-visual ${v.id}">

          <span class="venue-type">${v.type}</span>

          <span class="venue-emoji">${v.emoji}</span>

        </div>

        <div class="venue-body">

          <h3>${v.name}</h3>

          <p>${v.room}</p>

          <div class="venue-specs">
            <span>
              SEATING
              <b>${v.capacity} people</b>
            </span>

            <span>
              PROJECTOR
              <b>${v.projector}</b>
            </span>
          </div>

          <div class="venue-specs">
            <span>
              MIC SYSTEM
              <b>${v.mic}</b>
            </span>

            <span>
              AIR CONDITION
              <b>${v.ac}</b>
            </span>
          </div>

          <button class="outline-button"
            data-book-venue="${v.id}">
            View availability & book →
          </button>

        </div>

      </article>

    `).join("")
    : '<div class="empty-state">No venues match your search.</div>';
}


// 13. Booking Request Table

function renderRequests() {

  const rows = bookings.slice().sort((a, b) =>
    (b.date + b.startTime).localeCompare(
      a.date + a.startTime
    )
  );

  const pending = rows.filter(
    b => b.status === "Pending"
  ).length;

  $("#requestTotal").textContent =
    `${pending} pending · ${rows.length} total`;

  $("#requestTableBody").innerHTML = rows.length

    ? rows.map(b => `

      <tr>

        <td>
          <strong>${escapeHTML(b.eventName)}</strong>

          <small>
            ${escapeHTML(b.organizer)}
            · ${escapeHTML(b.email)}
            · ${escapeHTML(b.campusId || "LPU ID not added")}
          </small>
        </td>

        <td>${venueById(b.venue)?.name || "—"}</td>

        <td>
          ${prettyDate(b.date)}
          <small>
            ${time12(b.startTime)} – ${time12(b.endTime)}
          </small>
        </td>

        <td>${b.attendance} people</td>

        <td>
          <span class="status ${b.status.toLowerCase()}">
            ${b.status}
          </span>
        </td>

        <td>

          ${
            b.status === "Pending"

              ? `
                <div class="action-buttons">

                  <button class="approve-btn"
                    data-action="approve"
                    data-id="${b.id}">
                    Approve
                  </button>

                  <button class="reject-btn"
                    data-action="reject"
                    data-id="${b.id}">
                    Reject
                  </button>

                </div>
              `

              : "—"
          }

        </td>

      </tr>

    `).join("")

    : `
      <tr>
        <td colspan="6" class="no-requests">
          No booking requests yet.
        </td>
      </tr>
    `;
}


// 14. Refresh All Website Sections

function renderAll() {

  renderStats();
  renderCalendar();
  renderUpcoming();
  renderVenues();
  renderRequests();

}


// 15. Open Booking Form

function openModal(venueId = null, date = selectedDate) {

  $("#bookingForm").reset();

  if (venueId) {
    $("#bookingVenue").value = venueId;
  }

  $("#bookingDate").value = date;
  $("#bookingDate").min = dateISO(today);

  $("#bookingModal").classList.add("open");

  $("#bookingModal").setAttribute(
    "aria-hidden",
    "false"
  );

}


// 16. Close Booking Form

function closeModal() {

  $("#bookingModal").classList.remove("open");

  $("#bookingModal").setAttribute(
    "aria-hidden",
    "true"
  );

}


// 17. Time Dropdown

function fillTimes() {

  const times = [];

  for (let h = 8; h <= 20; h++) {

    for (let m of [0, 30]) {

      if (h === 20 && m > 0) continue;

      times.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );

    }
  }

  const options = times.map(t =>
    `<option value="${t}">${time12(t)}</option>`
  ).join("");

  $("#startTime").innerHTML = options;
  $("#endTime").innerHTML = options;

  $("#startTime").value = "10:00";
  $("#endTime").value = "11:00";

}


// 18. Check Booking Time Conflict

function overlaps(a, b) {

  return (
    a.date === b.date &&
    a.venue === b.venue &&
    a.status !== "Rejected" &&
    a.startTime < b.endTime &&
    b.startTime < a.endTime
  );

}


// 19. Submit Booking Request

function handleSubmit(e) {

  e.preventDefault();

  const f = new FormData(e.target);

  const booking = {

    id: Date.now(),

    eventName: f.get("eventName").trim(),

    organizer: f.get("organizer").trim(),

    email: f.get("email").trim(),

    campusId: f.get("campusId").trim(),

    department: f.get("department"),

    eventCategory: f.get("eventCategory"),

    venue: f.get("venue"),

    date: f.get("date"),

    startTime: f.get("startTime"),

    endTime: f.get("endTime"),

    attendance: Number(f.get("attendance")),

    av: f.getAll("av"),

    notes: f.get("notes").trim(),

    status: "Pending"

  };


  // Validate Event Time

  if (booking.endTime <= booking.startTime) {

    toast("End time must be later than start time.");

    return;

  }


  // Validate Venue Capacity

  const venue = venueById(booking.venue);

  if (booking.attendance > venue.capacity) {

    toast(
      `This venue capacity is ${venue.capacity}. Choose a larger venue.`
    );

    return;

  }


  // Check Duplicate Time Booking

  if (bookings.some(b => overlaps(b, booking))) {

    toast(
      "This venue has a booking conflict for the selected time."
    );

    return;

  }


  // Save New Booking

  bookings.push(booking);

  save();

  closeModal();

  renderAll();

  toast("Booking request submitted successfully!");

}


// 20. Approve / Reject Booking

function updateBooking(id, action) {

  const b = bookings.find(x => x.id === id);

  if (!b) return;


  if (action === "approve") {

    if (
      bookings.some(x =>
        x.id !== id &&
        overlaps(x, b)
      )
    ) {

      toast(
        "Cannot approve: this time slot conflicts with another booking."
      );

      return;

    }

    b.status = "Reserved";

    toast("Booking approved and reserved.");

  } else {

    b.status = "Rejected";

    toast("Booking request rejected.");

  }


  save();

  renderAll();

}


// =====================================
// 21. INITIALIZE WEBSITE
// =====================================

$("#todayLabel").textContent =
  today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

fillVenueSelects();

fillTimes();

renderAll();


// =====================================
// 22. BUTTON EVENTS
// =====================================

// Previous Month
$("#prevMonth").addEventListener("click", () => {

  viewDate.setMonth(viewDate.getMonth() - 1);

  renderCalendar();

});


// Next Month
$("#nextMonth").addEventListener("click", () => {

  viewDate.setMonth(viewDate.getMonth() + 1);

  renderCalendar();

});


// Today Button
$("#todayButton").addEventListener("click", () => {

  viewDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  selectedDate = dateISO(today);

  renderCalendar();

});


// Calendar Venue Filter
$("#calendarVenueFilter").addEventListener("change", e => {

  activeCalendarVenue = e.target.value;

  renderCalendar();

});


// Search Venue
$("#venueSearch").addEventListener("input", renderVenues);


// Filter Venue Type
$("#venueTypeFilter").addEventListener("change", renderVenues);


// New Booking Buttons
$("#newBookingTop").addEventListener("click", () => openModal());

$("#quickBook").addEventListener("click", () => openModal());

$("#bookSelectedDate").addEventListener("click", () =>
  openModal(null, selectedDate)
);


// Close Modal
$("#closeModal").addEventListener("click", closeModal);

$("#cancelModal").addEventListener("click", closeModal);


// Close Modal on Background Click
$("#bookingModal").addEventListener("click", e => {

  if (e.target.id === "bookingModal") {

    closeModal();

  }

});


// Booking Form Submit
$("#bookingForm").addEventListener("submit", handleSubmit);


// Approve / Reject Buttons
$("#requestTableBody").addEventListener("click", e => {

  const btn = e.target.closest("button[data-action]");

  if (btn) {

    updateBooking(
      Number(btn.dataset.id),
      btn.dataset.action
    );

  }

});


// Venue Book Button
$("#venueGrid").addEventListener("click", e => {

  const btn = e.target.closest("[data-book-venue]");

  if (btn) {

    openModal(btn.dataset.bookVenue);

  }

});


// Mobile Menu
$("#mobileMenu").addEventListener("click", () => {

  $("#sidebar").classList.toggle("open");

});


// Close Mobile Menu on Navigation
document.querySelectorAll(".nav-link").forEach(a => {

  a.addEventListener("click", () => {

    $("#sidebar").classList.remove("open");

  });

});


// Notification Button
$("#notificationButton").addEventListener("click", () => {

  toast(
    `${bookings.filter(b => b.status === "Pending").length} booking request(s) awaiting review.`
  );

});