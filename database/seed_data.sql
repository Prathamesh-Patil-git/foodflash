-- =============================================
-- FoodFlash — Seed Data (Single Restaurant)
-- =============================================
USE foodflash;

-- =============================================
-- USERS (admin password: admin1234 | customer password: test1234 → bcrypt hashes)
-- =============================================
INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Admin User',    'admin@test.com',    '$2b$12$k61g2QLdCyVmcQdlelTFZuddDcdNQKaQuQWTQ/GSW0UwgNvZPne9y', '9876543210', 'admin'),
('Rahul Sharma',  'rahul@test.com',    '$2b$12$Cr4ATRoGWr297WT1IMgwaui/AnXvL2EFGuNLiUfqmto3NtVp/Ydny', '9876543211', 'customer'),
('Priya Mehta',   'priya@test.com',    '$2b$12$Cr4ATRoGWr297WT1IMgwaui/AnXvL2EFGuNLiUfqmto3NtVp/Ydny', '9876543212', 'customer'),
('Amit Kumar',    'amit@test.com',     '$2b$12$Cr4ATRoGWr297WT1IMgwaui/AnXvL2EFGuNLiUfqmto3NtVp/Ydny', '9876543213', 'customer'),
('Sneha Reddy',   'sneha@test.com',    '$2b$12$Cr4ATRoGWr297WT1IMgwaui/AnXvL2EFGuNLiUfqmto3NtVp/Ydny', '9876543214', 'customer'),
('Vikram Singh',  'vikram@test.com',   '$2b$12$Cr4ATRoGWr297WT1IMgwaui/AnXvL2EFGuNLiUfqmto3NtVp/Ydny', '9876543215', 'customer');

-- =============================================
-- MENU ITEMS (single restaurant — no restaurant_id)
-- =============================================
INSERT INTO menu_items (name, description, price, category, is_veg, image_url) VALUES
-- North Indian
('Butter Chicken',    'Creamy tomato-based curry with tender chicken pieces', 349, 'north-indian', FALSE, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop'),
('Paneer Tikka',      'Marinated cottage cheese grilled in tandoor with spices', 249, 'north-indian', TRUE,  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop'),
('Chole Bhature',     'Spiced chickpea curry served with fluffy fried bread', 149, 'north-indian', TRUE,  'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&h=300&fit=crop'),
('Dal Makhani',       'Slow-cooked black lentils in rich buttery gravy', 199, 'north-indian', TRUE,  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'),
('Chicken Tikka',     'Smoky tandoor-grilled chicken marinated in yogurt spices', 279, 'north-indian', FALSE, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop'),
('Garlic Naan',       'Soft tandoor bread topped with garlic and butter', 49,  'north-indian', TRUE,  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'),

-- Italian
('Margherita Pizza',  'Classic pizza with fresh mozzarella, tomato sauce, basil', 299, 'italian', TRUE,  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'),
('Pepperoni Pizza',   'Loaded with spicy pepperoni and melted mozzarella cheese', 399, 'italian', FALSE, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop'),
('Pasta Alfredo',     'Creamy white sauce pasta with herbs and parmesan', 249, 'italian', TRUE,  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'),
('Garlic Bread',      'Toasted bread with garlic butter and herbs', 129, 'italian', TRUE,  'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=300&fit=crop'),

-- Biryani / North Indian
('Hyderabadi Biryani', 'Aromatic basmati rice layered with spiced chicken and saffron', 279, 'north-indian', FALSE, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop'),
('Veg Biryani',        'Fragrant rice with mixed vegetables and biryani spices', 219, 'north-indian', TRUE,  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'),
('Chicken 65',         'Spicy deep-fried chicken bites with curry leaves', 199, 'north-indian', FALSE, 'https://images.unsplash.com/photo-1610057099443-fde6c99db8f1?w=400&h=300&fit=crop'),
('Raita',              'Cool yogurt with cucumber, mint, and mild spices', 49,  'north-indian', TRUE,  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'),

-- American
('Classic Smash Burger','Juicy double-smashed beef patty with cheese and pickles', 199, 'american', FALSE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'),
('Chicken Wings',      'Crispy fried wings tossed in buffalo hot sauce', 229, 'american', FALSE, 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=300&fit=crop'),
('French Fries',       'Golden crispy fries seasoned with salt and herbs', 99,  'american', TRUE,  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop'),
('Veg Burger',         'Crispy veggie patty with lettuce, tomato, and mayo', 149, 'american', TRUE,  'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400&h=300&fit=crop'),

-- Chinese
('Chicken Momos',      'Steamed dumplings stuffed with spiced chicken filling', 149, 'chinese', FALSE, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop'),
('Veg Fried Rice',     'Wok-tossed rice with fresh vegetables and soy sauce', 179, 'chinese', TRUE,  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop'),
('Manchurian',         'Crispy vegetable balls in spicy Indo-Chinese sauce', 169, 'chinese', TRUE,  'https://images.unsplash.com/photo-1645696301019-35adcc18fc2c?w=400&h=300&fit=crop'),
('Chilli Chicken',     'Stir-fried chicken with bell peppers in chilli sauce', 219, 'chinese', FALSE, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop'),

-- South Indian
('Masala Dosa',        'Crispy rice crepe filled with spiced potato masala', 129, 'south-indian', TRUE,  'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop'),
('Idli Sambar',        'Steamed rice cakes served with lentil soup and chutney', 99,  'south-indian', TRUE,  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop'),
('Vada Pav',           'Spiced potato fritter in a bun with chutneys', 49,  'south-indian', TRUE,  'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400&h=300&fit=crop'),
('Filter Coffee',      'Traditional South Indian drip coffee with frothy milk', 59,  'south-indian', TRUE,  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop');

-- =============================================
-- SAMPLE ORDERS (no restaurant_id)
-- =============================================
INSERT INTO orders (user_id, total_amount, tax_amount, discount, final_amount, status) VALUES
(2, 698, 35, 0, 733, 'preparing'),
(3, 698, 35, 0, 733, 'served'),
(4, 329, 16, 0, 345, 'served'),
(5, 626, 31, 60, 597, 'food_prepared');

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(1, 1, 2, 349),   -- 2x Butter Chicken
(1, 6, 1, 49),    -- 1x Garlic Naan
(2, 7, 1, 299),   -- 1x Margherita Pizza
(2, 8, 1, 399),   -- 1x Pepperoni Pizza
(3, 11, 1, 279),  -- 1x Hyderabadi Biryani
(3, 14, 1, 49),   -- 1x Raita
(4, 19, 3, 149),  -- 3x Chicken Momos
(4, 20, 1, 179);  -- 1x Veg Fried Rice

-- =============================================
-- SAMPLE PAYMENTS
-- =============================================
INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, amount, status, method) VALUES
(1, 'order_test_001', 'pay_test_001', 733, 'captured', 'card'),
(2, 'order_test_002', 'pay_test_002', 733, 'captured', 'upi'),
(3, 'order_test_003', 'pay_test_003', 345, 'captured', 'card'),
(4, 'order_test_004', 'pay_test_004', 597, 'captured', 'wallet');
