document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const movieGrid = document.getElementById('movie-grid');
    const addMovieForm = document.getElementById('add-movie-form');
    const changePassForm = document.getElementById('change-pass-form');
    const editMovieForm = document.getElementById('edit-movie-form');
    const adminPanel = document.getElementById('admin-panel');
    const userInfo = document.getElementById('user-info');
    const displayUsername = document.getElementById('display-username');
    const sectionTitle = document.getElementById('main-section-title');

    let currentUser = null;
    let allMovies = []; // Mảng gốc lưu trữ toàn bộ phim
    let currentTab = 'dang-chieu'; // Quản lý tab hiện tại tập trung tại đây

    // --- LOGIC ĐIỀU KHIỂN NÚT TRƯỢT TABS ĐỒNG BỘ 100% VỚI BIẾN JS ---
    const tabs = document.querySelectorAll(".tab-btn-item");
    const line = document.querySelector(".tab-pill-line");

    const updateTabLine = (activeTab) => {
        if (line && activeTab) {
            line.style.left = activeTab.offsetLeft + "px";
            line.style.width = activeTab.offsetWidth + "px";
        }
    };

    // Khởi tạo vị trí vạch đỏ ban đầu cho tab Đang Chiếu
    const defaultActive = document.querySelector(".tab-btn-item.active");
    if (defaultActive) {
        setTimeout(() => { updateTabLine(defaultActive); }, 250);
    }

    // Bắt sự kiện click chuyển tab trực tiếp tại đây để ép biến currentTab cập nhật ngay lập tức
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            const activeTab = document.querySelector(".tab-btn-item.active");
            if (activeTab) activeTab.classList.remove("active");

            e.target.classList.add("active");
            updateTabLine(e.target);

            // Cập nhật trạng thái tab mục tiêu
            currentTab = e.target.getAttribute("data-target");

            // Đổi tiêu đề chữ lớn phía trên danh sách phim
            if (sectionTitle) {
                sectionTitle.innerHTML = `🍿 Phim ${e.target.innerText}`;
            }

            // Gọi hàm lọc chạy lại dữ liệu ngay lập tức không cần thông qua trung gian
            applyMovieFilter();
        });
    });

    window.addEventListener("resize", () => {
        const currentActive = document.querySelector(".tab-btn-item.active");
        if (currentActive) updateTabLine(currentActive);
    });


    // --- AUTH LOGIC (XỬ LÝ ĐĂNG NHẬP) ---
    const checkAuth = async () => {
        const res = await fetch('api/auth.php?action=check');
        const data = await res.json();

        if (data.isLoggedIn) {
            currentUser = data;
            if (userInfo) userInfo.classList.remove('hidden');
            if (displayUsername) displayUsername.innerText = data.username + (data.role === 'admin' ? ' (Admin)' : '');

            if (data.role === 'admin') {
                if (adminPanel) adminPanel.classList.remove('hidden');
                const ticketsLink = document.getElementById('my-tickets-link');
                if (ticketsLink) ticketsLink.classList.add('hidden');
            } else {
                if (adminPanel) adminPanel.classList.add('hidden');
            }

            fetchMovies();
        } else {
            window.location.href = 'login.html';
        }
    };

    changePassForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = {
            old_password: document.getElementById('old-pass').value,
            new_password: document.getElementById('new-pass').value
        };
        const res = await fetch('api/auth.php?action=change_password', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đổi mật khẩu thành công');
            closeModal('change-pass-modal');
            changePassForm.reset();
        } else {
            showToast(data.error || 'Lỗi đổi mật khẩu', 'error');
        }
    };


    // --- MOVIE CRUD & FILTER LOGIC (BỘ LỌC TOÁN HỌC CHUẨN) ---
    const fetchMovies = async () => {
        const res = await fetch('api/movies.php');
        allMovies = await res.json();
        applyMovieFilter();
    };

    const applyMovieFilter = () => {
        const searchInput = document.getElementById('search-movie');
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

        // Lấy ngày hôm nay từ hệ thống máy tính của m (Định dạng chuẩn chuỗi: YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        const filtered = allMovies.filter(movie => {
            // 1. Kiểm tra từ khóa tìm kiếm ô text
            const matchesSearch = movie.title.toLowerCase().includes(term) || movie.genre.toLowerCase().includes(term);

            // 2. Định dạng lại chuỗi ngày phát hành thu được từ CSDL để triệt tiêu lỗi dấu gạch chéo
            let movieDateStr = '';
            if (movie.release_date) {
                movieDateStr = movie.release_date.replace(/\//g, '-');
                // Ép chuỗi đảo ngược về đúng định dạng chuẩn YYYY-MM-DD nếu CSDL trả về DD-MM-YYYY
                if (movieDateStr.includes('-') && movieDateStr.split('-')[0].length !== 4) {
                    const parts = movieDateStr.split('-');
                    movieDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            let matchesTab = false;
            const titleLower = movie.title.toLowerCase();

            // 3. Phân loại logic nghiêm ngặt theo đúng tab đang kích hoạt
            if (currentTab === 'dang-chieu') {
                // Đang Chiếu: Ngày chiếu nhỏ hơn hoặc bằng hôm nay VÀ tên không chứa chữ "sớm"
                matchesTab = movieDateStr && movieDateStr <= todayStr && !titleLower.includes('sớm');
            } else if (currentTab === 'sap-chieu') {
                // Sắp Chiếu: Ngày chiếu lớn hơn ngày hôm nay VÀ tên không chứa chữ "sớm"
                matchesTab = movieDateStr && movieDateStr > todayStr && !titleLower.includes('sớm');
            } else if (currentTab === 'suat-chieu-som') {
                // Suất Chiếu Sớm: Gom các phim có chữ "sớm" hoặc các phim được cài đặt thủ công đặc biệt
                matchesTab = titleLower.includes('sớm') || titleLower.includes('interstellar') || titleLower.includes('inception');
            }

            return matchesSearch && matchesTab;
        });

        renderMovies(filtered);
    };

    // Ô tìm kiếm text
    const searchInput = document.getElementById('search-movie');
    if (searchInput) {
        searchInput.addEventListener('input', applyMovieFilter);
    }

    const renderMovies = (movies) => {
        movieGrid.innerHTML = '';

        if (movies.length === 0) {
            movieGrid.innerHTML = `<p style="color: #999; grid-column: 1/-1; text-align: center; padding: 3rem; font-size: 16px;">🍿 Hiện tại chưa có phim nào thuộc mục này...</p>`;
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';

            const isAdmin = currentUser && currentUser.role === 'admin';

            card.innerHTML = `
                <div class="poster-container">
                    <img src="${movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${movie.title}">
                    <div class="overlay">
                        <button onclick="playTrailer('${movie.trailer_url}')">▶ Xem Trailer</button>
                        ${!isAdmin ? `
                        <a href="booking.html?movie_id=${movie.id}" style="display:block; width:100%;">
                            <button style="background:#e50914; width:100%;">🎫 Đặt Vé</button>
                        </a>
                        ` : ''}
                        ${isAdmin ? `
                            <button class="secondary" onclick="openEditModal(${JSON.stringify(movie).replace(/"/g, '&quot;')})">✏️ Sửa</button>
                            <button style="background:rgba(255,0,0,0.5)" onclick="deleteMovie(${movie.id})">🗑️ Xóa</button>
                        ` : ''}
                    </div>
                </div>
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.genre} | ${movie.duration} phút</p>
                </div>
            `;
            movieGrid.appendChild(card);
        });
    };

    if (addMovieForm) {
        addMovieForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                title: document.getElementById('add-title').value,
                genre: document.getElementById('add-genre').value,
                duration: document.getElementById('add-duration').value,
                release_date: document.getElementById('add-date').value,
                poster_url: document.getElementById('add-poster').value,
                trailer_url: document.getElementById('add-trailer').value
            };
            const res = await fetch('api/movies.php', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                showToast('Thêm phim thành công!');
                addMovieForm.reset();
                closeModal('add-movie-modal');
                fetchMovies();
            } else {
                showToast('Lỗi khi thêm phim', 'error');
            }
        };
    }

    window.openEditModal = (movie) => {
        document.getElementById('edit-id').value = movie.id;
        document.getElementById('edit-title').value = movie.title;
        document.getElementById('edit-genre').value = movie.genre;
        document.getElementById('edit-duration').value = movie.duration;
        document.getElementById('edit-date').value = movie.release_date;
        document.getElementById('edit-poster').value = movie.poster_url;
        document.getElementById('edit-trailer').value = movie.trailer_url;
        openModal('edit-modal');
    };

    editMovieForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const formData = {
            title: document.getElementById('edit-title').value,
            genre: document.getElementById('edit-genre').value,
            duration: document.getElementById('edit-duration').value,
            release_date: document.getElementById('edit-date').value,
            poster_url: document.getElementById('edit-poster').value,
            trailer_url: document.getElementById('edit-trailer').value
        };
        const res = await fetch(`api/movies.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            showToast('Cập nhật phim thành công!');
            closeModal('edit-modal');
            fetchMovies();
        } else {
            showToast('Lỗi khi cập nhật phim', 'error');
        }
    };

    window.deleteMovie = async (id) => {
        if (confirm('Xóa phim này?')) {
            const res = await fetch(`api/movies.php?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Đã xóa phim thành công');
                fetchMovies();
            } else {
                showToast('Lỗi khi xóa phim', 'error');
            }
        }
    };

    // --- MODAL & TRAILER ---
    window.openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('hidden');
    };
    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    };

    window.playTrailer = (url) => {
        if (!url) return alert('Phim này chưa có trailer');
        let videoId = '';
        if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];

        if (videoId) {
            document.getElementById('video-player').innerHTML = `
                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            `;
            openModal('trailer-modal');
        } else {
            showToast('Link Youtube không hợp lệ', 'error');
        }
    };

    window.stopTrailer = () => {
        document.getElementById('video-player').innerHTML = '';
        closeModal('trailer-modal');
    };

    // --- SHOWTIME MANAGEMENT (ADMIN ONLY) ---
    const addShowtimeForm = document.getElementById('add-showtime-form');

    const loadShowtimeSelects = async () => {
        const movRes = await fetch('api/movies.php');
        const movies = await movRes.json();
        const stMovie = document.getElementById('st-movie');
        if (stMovie) stMovie.innerHTML = movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');

        const roomRes = await fetch('api/rooms.php');
        const rooms = await roomRes.json();
        const stRoom = document.getElementById('st-room');
        if (stRoom) stRoom.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    };

    // Ghi đè hàm mở modal tích hợp load danh sách chọn suất chiếu
    const baseOpenModal = window.openModal;
    window.openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('hidden');
        if (id === 'add-showtime-modal') loadShowtimeSelects();
    };

    if (addShowtimeForm) {
        addShowtimeForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                movie_id: document.getElementById('st-movie').value,
                room_id: document.getElementById('st-room').value,
                show_date: document.getElementById('st-date').value,
                show_time: document.getElementById('st-time').value,
                price_standard: document.getElementById('st-price-std').value,
                price_vip: document.getElementById('st-price-vip').value,
                price_couple: document.getElementById('st-price-cp').value,
            };
            if (!formData.show_date || !formData.show_time) {
                showToast('Vui lòng chọn ngày và giờ chiếu!', 'error'); return;
            }
            const res = await fetch('api/showtimes.php', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Thêm suất chiếu thành công');
                addShowtimeForm.reset();
                closeModal('add-showtime-modal');
            } else {
                showToast(data.error || 'Có lỗi xảy ra', 'error');
            }
        };
    }

    // Khởi động chạy kiểm tra phân quyền tài khoản
    checkAuth();
});