-- =======================================================================
-- BikeHub – Complete Database Schema & Seed Data (MySQL 8)
-- 3NF Relational Architecture with Primary Keys, Foreign Keys, Indexes
-- =======================================================================

CREATE DATABASE IF NOT EXISTS bikehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bikehub;

-- Disable foreign key checks for clean teardown during migrations/resets
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS bike_images;
DROP TABLE IF EXISTS bikes;
DROP TABLE IF EXISTS seller_profiles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    role        ENUM('BUYER','SELLER','ADMIN') NOT NULL DEFAULT 'BUYER',
    status      ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 2. SELLER PROFILES TABLE (1:1 with users)
-- -----------------------------------------------------------------------
CREATE TABLE seller_profiles (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    shop_name           VARCHAR(150),
    address             VARCHAR(255),
    city                VARCHAR(100),
    verification_status ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
    document_url        VARCHAR(500),
    verified_at         TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_city (city),
    INDEX idx_seller_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 3. BIKES TABLE
-- -----------------------------------------------------------------------
CREATE TABLE bikes (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id      BIGINT NOT NULL,
    brand          VARCHAR(80) NOT NULL,
    model          VARCHAR(100) NOT NULL,
    year           INT NOT NULL,
    km_driven      INT DEFAULT 0,
    fuel_type      VARCHAR(30) DEFAULT 'Petrol',
    engine_cc      INT,
    bike_condition ENUM('NEW','EXCELLENT','GOOD','FAIR','POOR') NOT NULL DEFAULT 'GOOD',
    price          DECIMAL(12,2) NOT NULL,
    description    TEXT,
    city           VARCHAR(100),
    status         ENUM('AVAILABLE','SOLD','HIDDEN','PENDING_REVIEW') NOT NULL DEFAULT 'AVAILABLE',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bikes_brand (brand),
    INDEX idx_bikes_price (price),
    INDEX idx_bikes_city (city),
    INDEX idx_bikes_status (status),
    INDEX idx_bikes_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 4. BIKE IMAGES TABLE (1:N with bikes)
-- -----------------------------------------------------------------------
CREATE TABLE bike_images (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    bike_id     BIGINT NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE,
    INDEX idx_bike_images_bike (bike_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 5. WISHLIST TABLE (M:N between users and bikes)
-- -----------------------------------------------------------------------
CREATE TABLE wishlist (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id   BIGINT NOT NULL,
    bike_id   BIGINT NOT NULL,
    UNIQUE KEY uq_wishlist (user_id, bike_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 6. ORDERS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE orders (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id    BIGINT NOT NULL,
    bike_id     BIGINT NOT NULL,
    amount      DECIMAL(12,2) NOT NULL,
    status      ENUM('PLACED','PAID','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLACED',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT,
    INDEX idx_orders_buyer (buyer_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 7. PAYMENTS TABLE (1:1 with orders)
-- -----------------------------------------------------------------------
CREATE TABLE payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT NOT NULL UNIQUE,
    gateway_payment_id  VARCHAR(100),
    status              ENUM('CREATED','SUCCESS','FAILED') NOT NULL DEFAULT 'CREATED',
    method              VARCHAR(50),
    paid_at             TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_gateway (gateway_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 8. REVIEWS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE reviews (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    reviewer_id  BIGINT NOT NULL,
    seller_id    BIGINT NOT NULL,
    bike_id      BIGINT,
    rating       TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL,
    INDEX idx_reviews_seller (seller_id),
    INDEX idx_reviews_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 9. CHAT ROOMS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE chat_rooms (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id    BIGINT NOT NULL,
    seller_id   BIGINT NOT NULL,
    bike_id     BIGINT NOT NULL,
    UNIQUE KEY uq_chat (buyer_id, seller_id, bike_id),
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 10. CHAT MESSAGES TABLE
-- -----------------------------------------------------------------------
CREATE TABLE chat_messages (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT NOT NULL,
    sender_id  BIGINT NOT NULL,
    content    TEXT NOT NULL,
    sent_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_room (room_id),
    INDEX idx_chat_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 11. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    type        VARCHAR(50) NOT NULL,
    message     VARCHAR(500) NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 12. USER ACTIVITY TABLE (Used by AI Recommendation Engine)
-- -----------------------------------------------------------------------
CREATE TABLE user_activity (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    bike_id      BIGINT,
    action_type  ENUM('VIEW','SEARCH','WISHLIST','CHAT') NOT NULL,
    search_term  VARCHAR(150),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL,
    INDEX idx_user_activity (user_id, action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =======================================================================
-- SAMPLE INSERT DATA (Seed Data for Testing)
-- Default password for all seed accounts is: password123
-- BCrypt Hash: $2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm
-- =======================================================================

-- 1. USERS (1 Admin, 2 Verified Sellers, 2 Buyers)
INSERT INTO users (id, name, email, password, phone, role, status) VALUES
(1, 'Admin BikeHub', 'admin@bikehub.com', '$2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm', '+919876543210', 'ADMIN', 'ACTIVE'),
(2, 'Rajesh Sharma', 'seller.rajesh@bikehub.com', '$2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm', '+919822011223', 'SELLER', 'ACTIVE'),
(3, 'Priya Kulkarni', 'seller.priya@bikehub.com', '$2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm', '+919845033445', 'SELLER', 'ACTIVE'),
(4, 'Amit Verma', 'buyer.amit@gmail.com', '$2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm', '+919711055667', 'BUYER', 'ACTIVE'),
(5, 'Sneha Patel', 'buyer.sneha@gmail.com', '$2a$10$.XnadPnbuYp176G9uE7lnenjln7NHiUCyksTOoEmQ429jyZ5r2Wdm', '+919933077889', 'BUYER', 'ACTIVE');

-- 2. SELLER PROFILES
INSERT INTO seller_profiles (id, user_id, shop_name, address, city, verification_status, document_url, verified_at) VALUES
(1, 2, 'Rajesh Superbikes Hub', 'Shop 14, FC Road, Deccan Gymkhana', 'Pune', 'VERIFIED', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800', NOW()),
(2, 3, 'Priya MotoCorp Premier', '42, 100 Feet Road, HAL 2nd Stage, Indiranagar', 'Bangalore', 'VERIFIED', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800', NOW());

-- 3. BIKES (10 Distinct Listings across Royal Enfield, Yamaha, KTM, Honda, etc.)
INSERT INTO bikes (id, seller_id, brand, model, year, km_driven, fuel_type, engine_cc, bike_condition, price, description, city, status) VALUES
(1, 2, 'Royal Enfield', 'Classic 350', 2022, 12500, 'Petrol', 349, 'EXCELLENT', 165000.00, 'Single owner Royal Enfield Classic 350 Stealth Black. Timely serviced at authorized showroom. Comprehensive insurance valid till Dec 2026. Zero scratches.', 'Pune', 'AVAILABLE'),
(2, 3, 'Yamaha', 'YZF R15 V4', 2023, 6200, 'Petrol', 155, 'EXCELLENT', 152000.00, 'Racing Blue Yamaha R15 V4 equipped with quickshifter, traction control, and dual-channel ABS. Immaculate condition, only weekend highway rides.', 'Bangalore', 'AVAILABLE'),
(3, 2, 'KTM', 'Duke 390', 2021, 18500, 'Petrol', 373, 'GOOD', 215000.00, 'Orange & White KTM Duke 390 BS6. New Metzeler rear tyre installed recently. Full service history with genuine parts and TFT display in perfect condition.', 'Pune', 'AVAILABLE'),
(4, 3, 'Honda', 'CB350 Hness', 2022, 8400, 'Petrol', 348, 'EXCELLENT', 178000.00, 'Precious Red Metallic CB350 DLX Pro. Equipped with smartphone voice control system (HSVCS), dual horn, and crash guards. Smooth torque and exhaust thumping.', 'Bangalore', 'AVAILABLE'),
(5, 2, 'Kawasaki', 'Ninja 300', 2020, 14200, 'Petrol', 296, 'GOOD', 265000.00, 'Lime Green Kawasaki Ninja 300 twin-cylinder super-sport. Slipper clutch, new chain sprocket set, ceramic coated. Ready for touring and track days.', 'Pune', 'AVAILABLE'),
(6, 3, 'TVS', 'Apache RTR 200 4V', 2022, 11000, 'Petrol', 197, 'GOOD', 112000.00, 'Matte Blue Apache RTR 200 with adjustable suspension, ride modes (Sport/Urban/Rain), and SmartXonnect Bluetooth. First owner, excellent fuel economy.', 'Bangalore', 'AVAILABLE'),
(7, 2, 'Suzuki', 'Gixxer SF 250', 2021, 15800, 'Petrol', 249, 'GOOD', 138000.00, 'MotoGP Edition Suzuki Gixxer SF 250 oil-cooled single cylinder. Very refined high-speed highway cruiser. All paper documents clear and updated.', 'Pune', 'AVAILABLE'),
(8, 2, 'Bajaj', 'Pulsar NS200', 2020, 22000, 'Petrol', 199, 'FAIR', 88000.00, 'Pewter Grey Pulsar NS200. Liquid cooled 24.5 PS engine. New battery with 3 years warranty. Minor wear and tear, mechanically 100% sound.', 'Pune', 'AVAILABLE'),
(9, 3, 'BMW', 'G 310 R', 2023, 4100, 'Petrol', 313, 'EXCELLENT', 275000.00, 'Style Passion Red BMW G 310 R roadster. Premium inverted forks, ride-by-wire throttle, LED headlight. Barely used, manufacturer warranty active.', 'Bangalore', 'AVAILABLE'),
(10, 3, 'Triumph', 'Speed 400', 2024, 2100, 'Petrol', 398, 'NEW', 228000.00, 'Carnival Red Triumph Speed 400 modern classic. Liquid-cooled, 40 PS power, 6-speed gearbox, hybrid spine frame. Like-new showroom condition.', 'Bangalore', 'AVAILABLE');

-- 4. BIKE IMAGES (High quality Unsplash motorcycle photos)
INSERT INTO bike_images (id, bike_id, image_url, is_primary) VALUES
(1, 1, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', TRUE),
(2, 1, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', FALSE),
(3, 2, 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', TRUE),
(4, 2, 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800', FALSE),
(5, 3, 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800', TRUE),
(6, 4, 'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800', TRUE),
(7, 5, 'https://images.unsplash.com/photo-1571646034647-52e6ea84b28c?w=800', TRUE),
(8, 6, 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800', TRUE),
(9, 7, 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800', TRUE),
(10, 8, 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800', TRUE),
(11, 9, 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', TRUE),
(12, 10, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', TRUE);

-- 5. WISHLIST
INSERT INTO wishlist (id, user_id, bike_id) VALUES
(1, 4, 1),
(2, 4, 4),
(3, 5, 2),
(4, 5, 10);

-- 6. ORDERS & PAYMENTS
INSERT INTO orders (id, buyer_id, bike_id, amount, status) VALUES
(1, 4, 1, 165000.00, 'PAID'),
(2, 5, 2, 152000.00, 'PLACED');

INSERT INTO payments (id, order_id, gateway_payment_id, status, method, paid_at) VALUES
(1, 1, 'pay_test_RzP1009847291', 'SUCCESS', 'UPI', NOW());

-- 7. REVIEWS
INSERT INTO reviews (id, reviewer_id, seller_id, bike_id, rating, comment) VALUES
(1, 4, 2, 1, 5, 'Outstanding experience! Rajesh was completely transparent regarding the vehicle documents and service history. The Royal Enfield runs like a dream.'),
(2, 5, 3, 2, 5, 'Priya was extremely helpful and organized a test ride immediately. Quick paperwork assistance and very polite.');

-- 8. CHAT ROOMS & MESSAGES
INSERT INTO chat_rooms (id, buyer_id, seller_id, bike_id) VALUES
(1, 4, 2, 1),
(2, 5, 3, 2);

INSERT INTO chat_messages (id, room_id, sender_id, content, is_read) VALUES
(1, 1, 4, 'Hello Rajesh ji, is the Royal Enfield Classic 350 available for an inspection this Saturday?', TRUE),
(2, 1, 2, 'Yes Amit! Saturday morning 11 AM works fine at our showroom on FC Road.', TRUE),
(3, 2, 5, 'Hi Priya, can we do a slight negotiation on the Yamaha R15 V4?', FALSE);

-- 9. NOTIFICATIONS
INSERT INTO notifications (id, user_id, type, message, is_read) VALUES
(1, 2, 'NEW_INQUIRY', 'Amit Verma sent you a message regarding Royal Enfield Classic 350.', TRUE),
(2, 4, 'ORDER_CONFIRMED', 'Your payment for Order #1 was successful! Seller has been notified.', FALSE),
(3, 3, 'NEW_INQUIRY', 'Sneha Patel inquired about Yamaha YZF R15 V4.', FALSE);

-- 10. USER ACTIVITY (For Content-Based Recommendation)
INSERT INTO user_activity (id, user_id, bike_id, action_type, search_term) VALUES
(1, 4, 1, 'VIEW', NULL),
(2, 4, 4, 'VIEW', NULL),
(3, 4, NULL, 'SEARCH', 'Royal Enfield 350'),
(4, 5, 2, 'VIEW', NULL),
(5, 5, 10, 'VIEW', NULL),
(6, 5, NULL, 'SEARCH', 'Yamaha R15');


-- =======================================================================
-- ESSENTIAL ANALYTICAL & OPERATIONAL SQL QUERIES
-- =======================================================================

-- Query 1: Top-Selling Bike Brands by Listing Volume
-- SELECT brand, COUNT(*) AS total_listings, AVG(price) AS average_price
-- FROM bikes
-- GROUP BY brand
-- ORDER BY total_listings DESC;

-- Query 2: Platform Total Revenue and Successful Transactions
-- SELECT COUNT(o.id) AS total_orders, SUM(o.amount) AS total_sales_volume
-- FROM orders o
-- JOIN payments p ON o.id = p.order_id
-- WHERE p.status = 'SUCCESS';

-- Query 3: Active Verified Sellers with Listing Counts and Ratings
-- SELECT u.id AS seller_id, u.name, sp.shop_name, sp.city,
--        COUNT(DISTINCT b.id) AS total_bikes_listed,
--        ROUND(COALESCE(AVG(r.rating), 0), 1) AS average_rating
-- FROM users u
-- JOIN seller_profiles sp ON u.id = sp.user_id
-- LEFT JOIN bikes b ON u.id = b.seller_id
-- LEFT JOIN reviews r ON u.id = r.seller_id
-- WHERE sp.verification_status = 'VERIFIED'
-- GROUP BY u.id, u.name, sp.shop_name, sp.city;

-- Query 4: Search Bikes with Dynamic Filters (e.g. Pune, Petrol, Price <= 200,000)
-- SELECT b.id, b.brand, b.model, b.year, b.km_driven, b.price, b.city, bi.image_url
-- FROM bikes b
-- LEFT JOIN bike_images bi ON b.id = bi.bike_id AND bi.is_primary = TRUE
-- WHERE b.status = 'AVAILABLE'
--   AND b.city = 'Pune'
--   AND b.price <= 200000.00
-- ORDER BY b.price ASC;
