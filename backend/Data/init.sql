-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU ĐỒ ÁN MECHA E-COMMERCE (SQL Server)
CREATE DATABASE GundamStoreDb;
GO

USE GundamStoreDb;
GO

-- 1. Bảng Categories
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL
);

-- 2. Bảng Products
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    CategoryID INT FOREIGN KEY REFERENCES Categories(CategoryID),
    Series NVARCHAR(100) NOT NULL,
    Grade NVARCHAR(50) NULL,
    Scale NVARCHAR(50) NULL,
    Manufacturer NVARCHAR(100) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    StockQuantity INT NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ImageUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Bảng Users
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(500) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'Customer', -- Admin, Customer
    Address NVARCHAR(255) NULL,
    PhoneNumber VARCHAR(20) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. Bảng Orders
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(18,2) NOT NULL,
    OrderStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Shipping, Completed, Cancelled
    PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'COD',
    ShippingAddress NVARCHAR(255) NOT NULL,
    Notes NVARCHAR(500) NULL
);

-- 5. Bảng OrderDetails
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT FOREIGN KEY REFERENCES Orders(OrderID) ON DELETE CASCADE,
    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL
);

-- SEED DATA MẪU
INSERT INTO Categories (CategoryName, Description) VALUES 
(N'Gundam', N'Mô hình lắp ráp nhựa Gundam Gunpla'),
(N'Anime Figure', N'Mô hình tĩnh nhân vật Anime, Nendoroid, Figma'),
(N'Dụng cụ', N'Kềm cắt, bút kẻ lằn, keo dán nhựa chuyên dụng'),
(N'Phụ kiện', N'Action Base, decal dán nước, chi tiết độ');

INSERT INTO Products (ProductName, CategoryID, Series, Grade, Scale, Manufacturer, Price, StockQuantity, Description, ImageUrl) VALUES 
(N'HG Gundam Aerial 1/144', 1, N'The Witch from Mercury', N'HG', N'1/144', N'Bandai', 380000.00, 12, N'Mô hình lắp ráp HG Gundam Aerial tỉ lệ 1/144 thuộc series Mobile Suit Gundam: The Witch from Mercury.', N'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80'),
(N'RG RX-93-v2 Hi-Nu Gundam 1/144', 1, N'Char''s Counterattack', N'RG', N'1/144', N'Bandai', 1150000.00, 5, N'Mẫu Real Grade (RG) Hi-Nu Gundam được đánh giá là một trong những sản phẩm RG tốt nhất.', N'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'),
(N'MG Gundam Barbatos Lupus Rex 1/100', 1, N'Iron-Blooded Orphans', N'MG', N'1/100', N'Bandai', 1250000.00, 8, N'Dòng Master Grade (MG) 1/100 tái hiện hoàn hảo khung xương Gundam Frame.', N'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=400&q=80'),
(N'Nendoroid Naruto Uzumaki', 2, N'Naruto', N'Nendoroid', N'Non-Scale', N'Good Smile Company', 1200000.00, 6, N'Mô hình Nendoroid Naruto Uzumaki đi kèm nhiều phụ kiện biểu cảm khuôn mặt.', N'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80'),
(N'Kềm cắt nhựa chuyên dụng Bandai', 3, N'Tools', N'N/A', N'N/A', N'Bandai', 250000.00, 30, N'Kềm cắt nhựa giúp cắt các chi tiết runner cực kỳ mịn màng.', N'https://images.unsplash.com/photo-1530124560676-10551d5b3db0?auto=format&fit=crop&w=400&q=80');

-- Tài khoản admin mặc định (Mật khẩu băm giả lập: admin123)
INSERT INTO Users (Email, PasswordHash, FullName, Role, Address, PhoneNumber) VALUES 
('admin@gundamstore.com', 'admin_hashed_password', N'Quản trị viên Mecha', 'Admin', N'123 Trường Chinh, Q. Tân Bình, TP.HCM', '0912345678'),
('customer@gmail.com', 'customer_hashed_password', N'Nguyễn Hoàng Nam', 'Customer', N'99 Tô Hiến Thành, Q. 10, TP.HCM', '0988888888');
GO
