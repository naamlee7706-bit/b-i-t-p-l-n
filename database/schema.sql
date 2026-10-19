CREATE DATABASE IF NOT EXISTS quan_ly_rap_phim;
USE quan_ly_rap_phim;

-- Bảng phim
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INT,
    release_date DATE,
    poster_url TEXT,
    trailer_url TEXT, -- Link Youtube
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user'
);

-- Tạo tài khoản mặc định: admin / 123456
-- Trong thực tế nên dùng password_hash, ở đây tôi dùng hash sẵn của '123456'
INSERT IGNORE INTO users (username, password, full_name, role) VALUES 
('admin', '123456', 'Quản trị viên', 'admin');

-- Dữ liệu mẫu phim
INSERT IGNORE INTO movies (title, genre, duration, release_date, poster_url, trailer_url) VALUES
('Avengers: Endgame', 'Hành động, Viễn tưởng', 181, '2019-04-26', 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg', 'https://www.youtube.com/watch?v=TcMBFSGVi1c'),
('Interstellar', 'Khoa học viễn tưởng', 169, '2014-11-07', 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg', 'https://www.youtube.com/watch?v=zSWdZVtXT7E'),
('The Dark Knight', 'Hành động, Tội phạm', 152, '2008-07-18', 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg', 'https://www.youtube.com/watch?v=EXeTwQWaywY'),
('Inception', 'Hành động, Viễn tưởng', 148, '2010-07-16', 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg', 'https://www.youtube.com/watch?v=8hP9D6kZseM'),
('Spider-Man: Across the Spider-Verse', 'Hoạt hình, Hành động', 140, '2023-06-02', 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg', 'https://www.youtube.com/watch?v=shW9i6k8cB0'),
('Oppenheimer', 'Tiểu sử, Chính kịch', 180, '2023-07-21', 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjctYTRjYS00YTMzLTkyM2QtN2M5ODkmZGExZTNmXkEyXkFqcGdeQXVyNTAzNzgwNTg@._V1_.jpg', 'https://www.youtube.com/watch?v=uYPbbksJxIg'),
('Your Name', 'Hoạt hình, Lãng mạn', 106, '2016-08-26', 'https://m.media-amazon.com/images/M/MV5BNGYyZGM5MGMtYTY2Ni00M2Y1LWIzNjQtYWVlM2M1NjM0YzL1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg', 'https://www.youtube.com/watch?v=xU47nhruN-Q'),
('Demon Slayer: Mugen Train', 'Hoạt hình, Hành động', 117, '2020-10-16', 'https://m.media-amazon.com/images/M/MV5BODI2NjdlYWItMTE1ZC00YzI2LTgxZGQtNTIyYTIzY2ZlZDdlXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg', 'https://www.youtube.com/watch?v=ATJYac_dORw'),
('Parasite', 'Kinh dị, Hài hước đen', 132, '2019-05-30', 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg', 'https://www.youtube.com/watch?v=5xH0HfJHsaY'),
('Dune: Part Two', 'Hành động, Viễn tưởng', 166, '2024-03-01', 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w'),
('John Wick: Chapter 4', 'Hành động, Tội phạm', 169, '2023-03-24', 'https://m.media-amazon.com/images/M/MV5BMDExZGMyOTMtMDgyYi00NGIwLWJhMTEtOTdkZGFjNmZiMTEwXkEyXkFqcGdeQXVyMTM1NjM2ODg1._V1_.jpg', 'https://www.youtube.com/watch?v=qEVUtrk8_B4'),
('Top Gun: Maverick', 'Hành động, Chính kịch', 130, '2022-05-27', 'https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZGQ0LThiOWUtYjBkMWM5ZmEwZDU2XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_.jpg', 'https://www.youtube.com/watch?v=giXco2jaZ_4');

-- ==========================================
-- HỆ THỐNG ĐẶT VÉ
-- ==========================================

-- Phòng chiếu
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_rows INT DEFAULT 8,
    seats_per_row INT DEFAULT 10
);

-- Suất chiếu
CREATE TABLE IF NOT EXISTS showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    room_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price_standard DECIMAL(10,0) DEFAULT 90000,
    price_vip DECIMAL(10,0) DEFAULT 130000,
    price_couple DECIMAL(10,0) DEFAULT 220000,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Ghế ngồi
CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    row_label CHAR(1) NOT NULL,
    seat_number INT NOT NULL,
    seat_type ENUM('standard','vip','couple') DEFAULT 'standard',
    UNIQUE KEY uq_seat (room_id, row_label, seat_number),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Giữ ghế tạm thời (5 phút)
CREATE TABLE IF NOT EXISTS seat_holds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_id INT NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    UNIQUE KEY uq_hold (showtime_id, seat_id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Vé đã đặt
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    combo_json TEXT,
    total_price DECIMAL(10,0) NOT NULL,
    status ENUM('confirmed','cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
);

-- Chi tiết ghế trong vé
CREATE TABLE IF NOT EXISTS booking_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    seat_price DECIMAL(10,0) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- ==========================================
-- DỮ LIỆU MẪU HỆ THỐNG ĐẶT VÉ
-- ==========================================

INSERT IGNORE INTO rooms (id, name, total_rows, seats_per_row) VALUES
(1, 'Phòng Chiếu 1 (Standard)', 8, 10),
(2, 'Phòng Chiếu 2 (VIP)', 6, 8),
(3, 'Phòng IMAX', 10, 12);

-- Ghế phòng 1 (Standard): 8 hàng x 10 ghế
INSERT IGNORE INTO seats (room_id, row_label, seat_number, seat_type)
SELECT 1, r.row_char, n.seat_num,
    CASE WHEN r.row_char IN ('G','H') THEN 'vip' ELSE 'standard' END
FROM 
    (SELECT 'A' AS row_char UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') r
CROSS JOIN 
    (SELECT 1 AS seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) n;

-- Ghế phòng 2 (VIP): 6 hàng x 8 ghế
INSERT IGNORE INTO seats (room_id, row_label, seat_number, seat_type)
SELECT 2, r.row_char, n.seat_num,
    CASE WHEN r.row_char IN ('E','F') THEN 'couple' ELSE 'vip' END
FROM 
    (SELECT 'A' AS row_char UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F') r
CROSS JOIN 
    (SELECT 1 AS seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) n;

-- Ghế phòng 3 (IMAX): 10 hàng x 12 ghế
INSERT IGNORE INTO seats (room_id, row_label, seat_number, seat_type)
SELECT 3, r.row_char, n.seat_num,
    CASE 
        WHEN r.row_char IN ('I','J') THEN 'couple'
        WHEN r.row_char IN ('F','G','H') THEN 'vip'
        ELSE 'standard'
    END
FROM 
    (SELECT 'A' AS row_char UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J') r
CROSS JOIN 
    (SELECT 1 AS seat_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) n;

-- Suất chiếu mẫu (Đảm bảo movie_id 1 và 2 tồn tại trong bảng movies trước khi chạy)
INSERT IGNORE INTO showtimes (id, movie_id, room_id, show_date, show_time, price_standard, price_vip, price_couple) VALUES
(1, 1, 1, CURDATE(), '10:00:00', 90000, 130000, 220000),
(2, 1, 1, CURDATE(), '13:30:00', 90000, 130000, 220000),
(3, 1, 2, CURDATE(), '16:00:00', 90000, 130000, 220000),
(4, 2, 1, CURDATE(), '19:30:00', 90000, 130000, 220000),
(5, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 110000, 150000, 260000);
