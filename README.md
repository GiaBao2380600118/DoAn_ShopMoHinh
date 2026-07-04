# Đồ Án Tốt Nghiệp: Hệ Thống E-Commerce Mô Hình Anime & Gundam Tích Hợp A.I

Hệ thống thương mại điện tử chuyên biệt cho mô hình lắp ráp Gundam (Gunpla) và Figure Anime. Đồ án tích hợp các tính năng trí tuệ nhân tạo (A.I) nổi bật bao gồm:
1. **Trợ lý ảo tư vấn Gunpla AI (RAG Chatbot)**: Tư vấn nhập môn các dòng sản phẩm (SD, HG, RG, MG, PG) và đề xuất sản phẩm dựa trên nhu cầu của khách hàng.
2. **Tìm kiếm mô hình bằng Hình ảnh (Visual Search)**: Sử dụng mạng nơ-ron trích xuất đặc trưng hình ảnh (image embeddings) để đối sánh độ tương đồng và tìm ra sản phẩm có ngoại hình giống hoặc tương đương.
3. **Gợi ý bán chéo (Cross-selling)**: Tự động đề xuất phụ kiện đi kèm (Kềm cắt nhựa, bút kẻ lằn chìm, Action Base) khi người dùng xem chi tiết sản phẩm.

---

## 📁 Cấu Trúc Mã Nguồn Đồ Án

```text
Đồ_Án_CNGB/
├── prototype/              # Bản mẫu Giao diện & AI chạy ngay (Chạy trực tiếp trên Trình duyệt)
│   ├── index.html          # Giao diện chính cửa hàng, Giỏ hàng, AI Chatbot và Admin Panel
│   ├── style.css           # CSS hệ thống thiết kế Mecha/Cyberpunk cao cấp
│   └── app.js              # Quản lý cơ sở dữ liệu mẫu, giỏ hàng, giả lập chatbot RAG và quét ảnh AI
├── backend/                # Mã nguồn C# Backend (ASP.NET Core 8 Web API & Entity Framework Core)
│   ├── GundamStoreApi.csproj
│   ├── Program.cs          # Bootstrap, JWT auth & CORS configuration
│   ├── appsettings.json    # Database Connection Strings & JWT secrets
│   ├── Models/             # Các lớp thực thể (User, Product, Category, Order, OrderDetail)
│   ├── Data/
│   │   ├── AppDbContext.cs # EF Core DbContext
│   │   └── init.sql        # Kịch bản SQL khởi tạo bảng và seed data trên SQL Server
│   └── Controllers/        # API Endpoints (Auth, Products, Orders)
├── ai_service/             # Dịch vụ Python AI (FastAPI, PyTorch ResNet50)
│   ├── main.py             # API chatbot tư vấn và trích xuất đặc trưng ảnh so khớp similarity
│   └── requirements.txt    # Danh sách các thư viện Python (torch, fastapi, uvicorn...)
├── frontend/               # Thành phần giao diện React
│   └── GundamStoreApp.jsx  # React boilerplate kết nối với C# API và Python AI
└── README.md               # Tài liệu hướng dẫn (Tệp tin này)
```

---

## 🚀 Hướng Dẫn Sử Dụng Bản Mẫu (Interactive Prototype)

*Bản mẫu này giúp bạn trình diễn giao diện, luồng mua hàng và các tính năng AI hoạt động trực tiếp ngay trên trình duyệt mà không cần cài đặt môi trường lập trình.*

1. Đi tới thư mục `prototype/`.
2. Click đúp chuột vào file `index.html` để mở bằng trình duyệt (Chrome, Edge, Firefox).
3. **Trải nghiệm các tính năng:**
   - **Visual Search:** Click vào biểu tượng **Camera** ở thanh tìm kiếm, chọn một trong các hình ảnh Gundam mẫu ở dưới. Hệ thống sẽ quét ảnh bằng hiệu ứng laser và lọc ra sản phẩm khớp nhất.
   - **AI RAG Chatbot:** Click vào icon **AI** ở góc dưới cùng bên phải, nhấp vào các câu hỏi gợi ý hoặc nhập câu hỏi (Ví dụ: *"Mới chơi nên chọn dòng nào?"* hoặc *"Gundam giá rẻ dưới 500k"*).
   - **Cross-selling:** Click vào sản phẩm **HG Gundam Aerial** hoặc **Hi-Nu Gundam** để xem chi tiết sản phẩm. Ở phần bên dưới nút đặt mua, AI sẽ gợi ý các phụ kiện mua kèm như *Kềm cắt nhựa* và *Bút kẻ lằn chìm*.
   - **Admin Dashboard:** Bấm vào tab **"Quản trị Admin"** ở thanh tiêu đề để xem bảng điều khiển thống kê doanh thu, đơn hàng của khách, duyệt giao hàng, và thêm/xóa sản phẩm trong kho.

---

## 🛠️ Hướng Dẫn Cấu Hình Mã Nguồn Thực Tế (Production Environment)

Khi bạn bắt đầu triển khai code thật trên máy tính của mình hoặc trên server trường học, hãy làm theo các bước sau:

### 1. Cơ sở dữ liệu (SQL Server)
- Mở SQL Server Management Studio (SSMS).
- Tạo cơ sở dữ liệu mới và chạy toàn bộ nội dung file [init.sql](file:///d:/Đồ_Án_CNGB/backend/Data/init.sql) để tạo các bảng dữ liệu mẫu.

### 2. Chạy C# Backend API
- Cài đặt [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0).
- Mở thư mục `backend/` trong VS Code hoặc Visual Studio.
- Chạy lệnh sau để khởi chạy máy chủ API C#:
  ```bash
  dotnet run
  ```
- API sẽ chạy tại cổng mặc định `http://localhost:5000` (hoặc cổng cấu hình trong `Properties/launchSettings.json`).

### 3. Chạy Python AI Service
- Cài đặt Python 3.10 trở lên.
- Truy cập thư mục `ai_service/` và cài đặt các thư viện cần thiết:
  ```bash
  pip install -r requirements.txt
  ```
- Khởi chạy máy chủ AI bằng lệnh:
  ```bash
  python main.py
  ```
- Dịch vụ AI sẽ chạy tại `http://localhost:8000`.

### 4. Triển khai React Frontend
- Cài đặt Node.js.
- Sử dụng cấu trúc mẫu tại [GundamStoreApp.jsx](file:///d:/Đồ_Án_CNGB/frontend/GundamStoreApp.jsx) trong dự án React của bạn để thực hiện việc gửi yêu cầu API và hiển thị kết quả lên giao diện người dùng.
