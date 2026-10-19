// =============================================
// BOOKING.JS - Logic đặt vé rạp phim
// =============================================

const params = new URLSearchParams(window.location.search);
const MOVIE_ID = params.get('movie_id');

// Trạng thái toàn cục
let state = {
    movie: null,
    selectedShowtime: null,
    selectedSeats: [],      // [{id, row, number, type, price}]
    selectedCombos: {},     // {combo_id: {combo, qty}}
    holdExpiresAt: null,
    countdownInterval: null,
    seatRefreshInterval: null,
};

// =============================================
// KHỞI TẠO
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra đăng nhập
    const authRes = await fetch('api/auth.php?action=check');
    const authData = await authRes.json();
    if (!authData.isLoggedIn) { window.location.href = 'login.html'; return; }
    if (authData.role === 'admin') {
        alert('Tài khoản Admin không thể đặt vé.');
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('display-username').innerText = authData.username;

    if (!MOVIE_ID) { alert('Thiếu thông tin phim!'); window.location.href = 'index.html'; return; }

    // Lấy thông tin phim
    const movRes = await fetch('api/movies.php');
    const movies = await movRes.json();
    state.movie = movies.find(m => m.id == MOVIE_ID);

    if (!state.movie) { alert('Phim không tồn tại!'); window.location.href = 'index.html'; return; }

    renderMovieBanner();
    loadShowtimes();
    loadCombos();
});


// =============================================
// BƯỚC 1: SUẤT CHIẾU
// =============================================
function renderMovieBanner() {
    document.getElementById('movie-info-banner').innerHTML = `
        <img src="${state.movie.poster_url || ''}" alt="${state.movie.title}">
        <div>
            <h3>${state.movie.title}</h3>
            <p>🎭 ${state.movie.genre}</p>
            <p>⏰ ${state.movie.duration} phút</p>
            <p style="color: #ccc; margin-top: 8px; font-size: 14px;">
                <i class="fa-solid fa-location-dot" style="color: #ff3333; margin-right: 5px;"></i>
                Địa chỉ: TTTM AEON MALL Xuân Thủy, Cầu Giấy, Hà Nội
            </p>
        </div>
    `;
}

async function loadShowtimes() {
    const res = await fetch(`api/showtimes.php?movie_id=${MOVIE_ID}`);
    const showtimes = await res.json();
    const grid = document.getElementById('showtimes-grid');

    if (!showtimes.length) {
        grid.innerHTML = '<p style="color:var(--text-muted)">Hiện chưa có suất chiếu nào cho phim này.</p>';
        return;
    }

    // Nhóm theo ngày
    const byDate = {};
    showtimes.forEach(st => {
        if (!byDate[st.show_date]) byDate[st.show_date] = [];
        byDate[st.show_date].push(st);
    });

    let html = '';
    for (const [date, list] of Object.entries(byDate)) {
        const d = new Date(date);
        const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
        html += `<div style="grid-column:1/-1; color:var(--text-muted); font-weight:600; margin-top:0.5rem;">${dateStr}</div>`;
        list.forEach(st => {
            html += `
                <div class="showtime-card" id="st-${st.id}" onclick="selectShowtime(${st.id})">
                    <div class="time">${st.show_time.slice(0,5)}</div>
                    <div class="room">${st.room_name}</div>
                    <div class="price-tag">Từ ${Number(st.price_standard).toLocaleString('vi-VN')} đ</div>
                </div>
            `;
        });
    }
    grid.innerHTML = html;
    grid._data = showtimes;
}

async function selectShowtime(id) {
    const showtimes = document.getElementById('showtimes-grid')._data;
    state.selectedShowtime = showtimes.find(s => s.id == id);

    document.querySelectorAll('.showtime-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`st-${id}`).classList.add('selected');

    // Chờ 0.3s cho animation rồi chuyển bước
    setTimeout(() => goToStep(2), 300);
}

// =============================================
// BƯỚC 2: SƠ ĐỒ GHẾ
// =============================================
async function loadSeatMap() {
    const st = state.selectedShowtime;
    document.getElementById('selected-showtime-info').innerText =
        `${st.room_name} — ${st.show_time.slice(0,5)} — ${new Date(st.show_date).toLocaleDateString('vi-VN')}`;

    const res = await fetch(`api/seats.php?action=map&showtime_id=${st.id}`);
    const seats = await res.json();

    // Nhóm theo hàng
    const rows = {};
    seats.forEach(s => {
        if (!rows[s.row_label]) rows[s.row_label] = [];
        rows[s.row_label].push(s);
    });

    const mapEl = document.getElementById('seat-map');
    mapEl.innerHTML = '';

    for (const [row, rowSeats] of Object.entries(rows).sort()) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        rowDiv.innerHTML = `<div class="row-label">${row}</div>`;

        rowSeats.sort((a, b) => a.seat_number - b.seat_number).forEach(seat => {
            if (seat.seat_number === 6 && rowSeats.length > 6) {
                const aisle = document.createElement('div');
                aisle.className = 'seat-aisle';
                rowDiv.appendChild(aisle);
            }

            const btn = document.createElement('div');
            btn.className = `seat ${seat.seat_type}`;
            btn.id = `seat-${seat.id}`;
            btn.title = `${row}${seat.seat_number} - ${seatTypeLabel(seat.seat_type)} - ${seatPrice(seat.seat_type)}`;
            btn.innerText = seat.seat_number;
            btn.dataset.id = seat.id;
            btn.dataset.row = seat.row_label;
            btn.dataset.num = seat.seat_number;
            btn.dataset.type = seat.seat_type;

            if (seat.status === 'booked') {
                btn.classList.add('booked');
            } else if (seat.status === 'held' && !seat.is_my_hold) {
                btn.classList.add('held-other');
            } else if (seat.is_my_hold) {
                btn.classList.add('my-hold', 'selected');
                if (!state.selectedSeats.find(s => s.id == seat.id)) {
                    state.selectedSeats.push(buildSeatObj(seat));
                }
            } else {
                btn.onclick = () => toggleSeat(btn, seat);
            }

            rowDiv.appendChild(btn);
        });

        mapEl.appendChild(rowDiv);
    }
    updateSeatSummary();
}

function buildSeatObj(seat) {
    const st = state.selectedShowtime;
    const price = seat.seat_type === 'vip' ? st.price_vip :
                  seat.seat_type === 'couple' ? st.price_couple : st.price_standard;
    return { id: seat.id, row: seat.row_label, number: seat.seat_number, type: seat.seat_type, price: Number(price) };
}

async function toggleSeat(btn, seat) {
    const idx = state.selectedSeats.findIndex(s => s.id == seat.id);
    if (idx > -1) {
        state.selectedSeats.splice(idx, 1);
        btn.classList.remove('selected');
    } else {
        state.selectedSeats.push(buildSeatObj(seat));
        btn.classList.add('selected');
    }
    updateSeatSummary();

    if (state.selectedSeats.length > 0) {
        await holdSeats();
    } else {
        await fetch(`api/seats.php?action=release&showtime_id=${state.selectedShowtime.id}`, { method: 'DELETE' });
        stopCountdown();
        document.getElementById('timer-box').classList.add('hidden');
    }
}

async function holdSeats() {
    const res = await fetch('api/seats.php?action=hold', {
        method: 'POST',
        body: JSON.stringify({
            showtime_id: state.selectedShowtime.id,
            seat_ids: state.selectedSeats.map(s => s.id)
        })
    });
    const data = await res.json();
    if (res.ok) {
        state.holdExpiresAt = new Date(Date.now() + data.expires_in * 1000);
        startCountdown();
        document.getElementById('timer-box').classList.remove('hidden');
    } else {
        alert(data.error || 'Lỗi giữ ghế');
        loadSeatMap();
    }
}

function seatPrice(type) {
    const st = state.selectedShowtime;
    const p = type === 'vip' ? st.price_vip : type === 'couple' ? st.price_couple : st.price_standard;
    return Number(p).toLocaleString('vi-VN') + ' đ';
}

function seatTypeLabel(type) {
    return { standard: 'Thường', vip: 'VIP', couple: 'Couple' }[type] || type;
}

function updateSeatSummary() {
    const total = state.selectedSeats.reduce((s, seat) => s + seat.price, 0);
    const labels = state.selectedSeats.map(s => `${s.row}${s.number}`).join(', ');
    document.getElementById('selected-seats-text').innerText = labels || 'Chưa có';
    document.getElementById('seats-subtotal').innerText = total.toLocaleString('vi-VN') + ' đ';

    const btn = document.getElementById('btn-go-combo');
    if (state.selectedSeats.length > 0) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

// =============================================
// COUNTDOWN 5 PHÚT
// =============================================
function startCountdown() {
    stopCountdown();
    const el = document.getElementById('countdown');
    state.countdownInterval = setInterval(() => {
        const remaining = Math.max(0, state.holdExpiresAt - new Date());
        const mins = String(Math.floor(remaining / 60000)).padStart(2, '0');
        const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
        el.innerText = `${mins}:${secs}`;
        if (remaining <= 60000) el.style.color = '#ff4444';
        else el.style.color = 'var(--primary)';
        if (remaining <= 0) {
            stopCountdown();
            state.selectedSeats = [];
            updateSeatSummary();
            loadSeatMap();
            alert('⏰ Thời gian giữ ghế đã hết!');
            document.getElementById('timer-box').classList.add('hidden');
        }
    }, 1000);
}

function stopCountdown() {
    if (state.countdownInterval) clearInterval(state.countdownInterval);
    state.countdownInterval = null;
}

// =============================================
// BƯỚC 3: COMBO
// =============================================
async function loadCombos() {
    const res = await fetch('api/combos.php');
    const combos = await res.json();
    const grid = document.getElementById('combos-grid');
    grid.innerHTML = combos.map(c => `
        <div class="combo-card" id="combo-${c.id}">
            <div class="combo-qty">
                <button onclick="changeComboQty(${c.id}, -1, ${c.price}, '${c.name}')">−</button>
                <span id="qty-${c.id}">0</span>
                <button onclick="changeComboQty(${c.id}, 1, ${c.price}, '${c.name}')">+</button>
            </div>
            <div class="combo-icon">${c.icon}</div>
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <div class="combo-price">${Number(c.price).toLocaleString('vi-VN')} đ</div>
        </div>
    `).join('');
}

function changeComboQty(id, delta, price, name) {
    const current = state.selectedCombos[id] ? state.selectedCombos[id].qty : 0;
    const newQty = Math.max(0, current + delta);
    const qtyEl = document.getElementById(`qty-${id}`);
    const card = document.getElementById(`combo-${id}`);
    if (newQty === 0) {
        delete state.selectedCombos[id];
        card.classList.remove('selected');
    } else {
        state.selectedCombos[id] = { id, name, price, qty: newQty };
        card.classList.add('selected');
    }
    qtyEl.innerText = newQty;
}

// =============================================
// BƯỚC 4: XÁC NHẬN
// =============================================
function renderConfirmation() {
    const st = state.selectedShowtime;
    const m = state.movie;
    const seatsTotal = state.selectedSeats.reduce((s, seat) => s + seat.price, 0);
    const comboTotal = Object.values(state.selectedCombos).reduce((s, c) => s + c.price * c.qty, 0);
    const grandTotal = seatsTotal + comboTotal;

    document.getElementById('confirm-movie-info').innerHTML = `
        <h3>Thông tin phim</h3>
        <p>🎬 <strong>${m.title}</strong></p>
        <p>🏛️ ${st.room_name} — ${st.show_time.slice(0,5)} — ${new Date(st.show_date).toLocaleDateString('vi-VN')}</p>
    `;

    const seatRows = state.selectedSeats.map(s =>
        `<span style="background:var(--card-bg); padding:0.2rem 0.5rem; border-radius:4px; margin:0.15rem; display:inline-block;">${s.row}${s.number} <small>(${seatTypeLabel(s.type)})</small></span>`
    ).join('');
    document.getElementById('confirm-seats-info').innerHTML = `
        <h3>Ghế đã chọn — ${seatsTotal.toLocaleString('vi-VN')} đ</h3>
        <p>${seatRows}</p>
    `;

    const comboList = Object.values(state.selectedCombos).length
        ? Object.values(state.selectedCombos).map(c => `<p>${c.name} x${c.qty} — ${(c.price * c.qty).toLocaleString('vi-VN')} đ</p>`).join('')
        : '<p style="color:var(--text-muted)">Không chọn combo</p>';
    document.getElementById('confirm-combo-info').innerHTML = `<h3>Combo — ${comboTotal.toLocaleString('vi-VN')} đ</h3>${comboList}`;

    document.getElementById('confirm-total-price').innerText = grandTotal.toLocaleString('vi-VN') + ' đ';
    document.getElementById('payment-amount').innerText = grandTotal.toLocaleString('vi-VN');

    const paymentData = encodeURIComponent(`CineManager Payment: ${grandTotal} VND`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${paymentData}&color=e50914&bgcolor=1a1a1a`;
    document.getElementById('payment-qr-container').innerHTML = `<img src="${qrUrl}" alt="Payment QR" style="border: 4px solid white; border-radius: 8px;">`;
}

async function confirmBooking() {
    document.getElementById('btn-confirm').disabled = true;
    document.getElementById('btn-confirm').innerText = 'Đang xử lý...';

    const combosArr = Object.values(state.selectedCombos).map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty }));
    const seatsTotal = state.selectedSeats.reduce((s, seat) => s + seat.price, 0);
    const comboTotal = combosArr.reduce((s, c) => s + c.price * c.qty, 0);

    const res = await fetch('api/bookings.php', {
        method: 'POST',
        body: JSON.stringify({
            showtime_id: state.selectedShowtime.id,
            seat_ids: state.selectedSeats.map(s => s.id),
            combos: combosArr,
            total_price: seatsTotal + comboTotal
        })
    });
    const data = await res.json();

    if (res.ok) {
        stopCountdown();
        document.getElementById('success-booking-id').innerText = `Mã vé: #${data.booking_id}`;
        const ticketData = encodeURIComponent(`CineManager Ticket #${data.booking_id}\nPhim: ${state.movie.title}\nGhế: ${state.selectedSeats.map(s=>s.row+s.number).join(', ')}`);
        const ticketQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticketData}`;
        document.getElementById('ticket-qr-container').innerHTML = `<img src="${ticketQrUrl}" alt="Ticket QR">`;
        showOnlyStep('success');
    } else {
        alert(data.error || 'Có lỗi xảy ra');
        document.getElementById('btn-confirm').disabled = false;
        document.getElementById('btn-confirm').innerText = '🎫 Xác Nhận & Đặt Vé';
    }
}

// =============================================
// ĐIỀU HƯỚNG BƯỚC
// =============================================
async function goToStep(num) {
    if (num === 2 && !state.selectedShowtime) { alert('Vui lòng chọn suất chiếu!'); return; }
    if (num === 4 && state.selectedSeats.length === 0) { alert('Vui lòng chọn ghế!'); return; }

    if (num === 2) { state.selectedSeats = []; loadSeatMap(); }
    if (num === 4) renderConfirmation();

    showOnlyStep(num);
    updateStepBar(num);
}

function showOnlyStep(num) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    const target = num === 'success' ? document.getElementById('step-success') : document.getElementById(`step-${num}`);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepBar(num) {
    [1, 2, 3, 4].forEach(i => {
        const el = document.getElementById(`step-indicator-${i}`);
        el.classList.remove('active', 'done');
        if (i < num) el.classList.add('done');
        if (i === num) el.classList.add('active');
    });
}