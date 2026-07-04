// Simulated Database
const INITIAL_PRODUCTS = [];

// API Configuration for Multi-device Synchronization via LAN
const API_URL = "http://192.168.8.177:5000/api";
const AI_API_URL = "http://192.168.8.177:8000/api/ai"; // Đường dẫn API của Python AI Service
let useRealAPI = false;

async function checkBackendConnection() {
    try {
        const res = await fetch(`${API_URL}/products`, { method: "GET" });
        if (res.ok) {
            useRealAPI = true;
            console.log("Đã kết nối thành công với C# Backend API!");
            showToast("Đồng bộ trực tuyến qua C# Backend & SQL Server!", "success");
            await loadProductsFromAPI();
        }
    } catch (e) {
        console.log("Không kết nối được C# Backend. Dùng chế độ giả lập LocalStorage.");
    }
}

async function loadProductsFromAPI() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        products = data.map(p => ({
            id: p.productID || p.productId || p.id,
            name: p.productName || p.name,
            category: p.category ? p.category.categoryName : (p.categoryName || "Gundam"),
            series: p.series || "Mới ra mắt",
            grade: p.grade || "HG",
            scale: p.scale || "1/144",
            manufacturer: p.manufacturer || "Bandai",
            price: p.price,
            stock: p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 10),
            description: p.description || "Mô tả sản phẩm...",
            image: p.imageUrl || p.image || "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=400&q=80",
            accessories: []
        }));
    } catch (e) {
        console.error("Lỗi đồng bộ sản phẩm từ API:", e);
    }
}

// Local storage keys or session states
let products = localStorage.getItem("gundam_products") 
    ? JSON.parse(localStorage.getItem("gundam_products")) 
    : [...INITIAL_PRODUCTS];
let cart = [];
let currentUser = localStorage.getItem("gundam_current_user")
    ? JSON.parse(localStorage.getItem("gundam_current_user"))
    : null; // Quản lý trạng thái người dùng đăng nhập từ trang login.html

const SIMULATED_USERS = [
    { email: "admin@gmail.com", password: "admin", name: "Quản trị viên Mecha (Admin)", role: "Admin" },
    { email: "customer@gmail.com", password: "user", name: "Nam Gundam (Khách hàng)", role: "Customer" }
];
let orders = localStorage.getItem("gundam_orders") 
    ? JSON.parse(localStorage.getItem("gundam_orders")) 
    : [
    {
        id: "ORD-9821",
        customer: "Nguyễn Văn A",
        email: "customer@gmail.com",
        date: "2026-07-02",
        total: 1630000,
        status: "Completed",
        payment: "VNPAY",
        address: "99 Tô Hiến Thành, Quận 10, TP.HCM"
    },
    {
        id: "ORD-4812",
        customer: "Trần Thị B",
        email: "customerb@gmail.com",
        date: "2026-07-03",
        total: 380000,
        status: "Pending",
        payment: "COD",
        address: "12 Lê Lợi, Quận 1, TP.HCM"
    }
];

// Hàm lưu dữ liệu vào localStorage
function saveToLocalStorage() {
    localStorage.setItem("gundam_products", JSON.stringify(products));
    localStorage.setItem("gundam_orders", JSON.stringify(orders));
}

// Active state filters
let activeFilters = {
    categories: [],
    grades: [],
    manufacturers: [],
    search: "",
    sort: "default"
};

// UI Selectors
const productsGrid = document.getElementById("products-grid");
const productCountText = document.getElementById("product-count-text");
const cartCountBadge = document.getElementById("cart-count-badge");
const cartTotalText = document.getElementById("cart-total-text");
const mainLayout = document.getElementById("main-layout");

// Modals
const productModal = document.getElementById("product-modal");
const visualSearchModal = document.getElementById("visual-search-modal");
const cartModal = document.getElementById("cart-modal");

// Tự động đồng bộ sản phẩm tự chế từ localStorage lên SQL Server nếu dùng API
async function syncLocalProductsToSQL() {
    if (!useRealAPI) return;
    
    // Đọc sản phẩm tự thêm đang có ở LocalStorage của trình duyệt
    let localProds = localStorage.getItem("gundam_products") 
        ? JSON.parse(localStorage.getItem("gundam_products")) 
        : [];
        
    if (localProds.length === 0) return;
    
    try {
        // Lấy danh sách sản phẩm hiện tại trên SQL Server qua API
        const res = await fetch(`${API_URL}/products`);
        const dbProds = await res.json();
        
        let syncedCount = 0;
        for (let lp of localProds) {
            // Kiểm tra xem sản phẩm đã được nạp vào SQL Server chưa bằng tên
            const exists = dbProds.some(dp => dp.productName.toLowerCase() === lp.name.toLowerCase());
            if (!exists) {
                // Ánh xạ ID danh mục phù hợp
                let catId = 1; // Mặc định Gundam
                if (lp.category === "Anime Figure") catId = 2;
                else if (lp.category === "Dụng cụ") catId = 3;
                else if (lp.category === "Phụ kiện") catId = 4;
                else if (lp.category === "Sơn") catId = 5;
                else if (lp.category === "Lắp sẵn") catId = 6;
                else if (lp.category === "Khác") catId = 7;
                else if (lp.category === "Đặt trước") catId = 8;
                
                const newProductAPI = {
                    productName: lp.name,
                    categoryID: catId,
                    series: lp.series || "Mới ra mắt",
                    grade: lp.grade || "HG",
                    scale: lp.scale || "1/144",
                    manufacturer: lp.manufacturer || "Bandai",
                    price: lp.price,
                    stockQuantity: lp.stock,
                    description: lp.description || "Sản phẩm do người dùng tự thêm.",
                    imageUrl: lp.image
                };
                
                // Đẩy lên SQL Server
                const postRes = await fetch(`${API_URL}/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProductAPI)
                });
                if (postRes.ok) {
                    syncedCount++;
                }
            }
        }
        
        if (syncedCount > 0) {
            showToast(`Đã đồng bộ thành công ${syncedCount} sản phẩm tự thêm lên SQL Server!`, "success");
            await loadProductsFromAPI();
        }
    } catch (e) {
        console.error("Lỗi đồng bộ sản phẩm cục bộ lên SQL Server:", e);
    }
}

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
    // Tự động dọn dẹp bộ nhớ đệm cũ để chuyển sang cửa hàng trống cho khách tự thêm
    if (!localStorage.getItem("gundam_blank_db_setup_v2")) {
        localStorage.clear();
        localStorage.setItem("gundam_blank_db_setup_v2", "true");
        products = [];
        orders = [];
        saveToLocalStorage();
    }
    
    // Tự động kiểm tra và đồng bộ nếu API C# Backend đang bật
    await checkBackendConnection();
    
    // Đồng bộ sản phẩm từ localStorage lên SQL Server nếu kết nối thành công
    await syncLocalProductsToSQL();
    
    updateAuthUI(); // Phục hồi trạng thái đăng nhập của tài khoản
    renderProducts();
    setupEventListeners();
    setupChatbot();
    setupVisualSearch();
    renderStats();
});

// Toast notification function
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type === "success" ? "success" : ""}`;
    toast.innerHTML = `
        <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format currency in VND
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Render product list with filters
function renderProducts(customList = null) {
    const listToRender = customList || products;
    
    // Filter logic
    let filtered = listToRender.filter(p => {
        if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(p.category)) return false;
        if (activeFilters.grades.length > 0 && !activeFilters.grades.includes(p.grade)) return false;
        if (activeFilters.manufacturers.length > 0 && !activeFilters.manufacturers.includes(p.manufacturer)) return false;
        if (activeFilters.search.trim() !== "") {
            const term = activeFilters.search.toLowerCase();
            return p.name.toLowerCase().includes(term) || p.series.toLowerCase().includes(term);
        }
        return true;
    });

    // Sort logic
    if (activeFilters.sort === "price-asc") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (activeFilters.sort === "price-desc") {
        filtered.sort((a, b) => b.price - a.price);
    }

    productsGrid.innerHTML = "";
    productCountText.innerText = `Tìm thấy ${filtered.length} sản phẩm`;

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p style="font-size: 1.2rem;">Không tìm thấy mô hình nào phù hợp.</p>
                <button onclick="clearAllFilters()" style="margin-top: 1rem; padding: 0.5rem 1rem; border-radius: 8px; background: var(--accent-cyan); color: var(--bg-base); border:none; cursor:pointer; font-weight:700;">Xóa tất cả bộ lọc</button>
            </div>
        `;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        const isSoldOut = p.stock <= 0;
        card.innerHTML = `
            <span class="card-tag">${p.grade !== "N/A" ? p.grade : p.category}</span>
            <div class="card-img-wrapper" onclick="openProductDetail(${p.id})">
                <img src="${p.image}" alt="${p.name}" style="${isSoldOut ? 'filter: grayscale(1) opacity(0.5);' : ''}">
                ${isSoldOut ? '<span class="sold-out-badge">HẾT HÀNG</span>' : ''}
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span>${p.manufacturer}</span>
                    <span>Tỷ lệ: ${p.scale}</span>
                </div>
                <h3 class="card-title" onclick="openProductDetail(${p.id})">${p.name}</h3>
                <div class="card-footer">
                    <span class="card-price">${formatVND(p.price)}</span>
                    ${currentUser && currentUser.role === 'Admin' ? `
                        <div style="display: flex; gap: 0.4rem;">
                            <button class="btn-small btn-edit" onclick="editProductInline(${p.id}, event)" style="padding: 0.4rem 0.6rem; font-family: var(--font-outfit);">Sửa</button>
                            <button class="btn-small btn-delete" onclick="deleteProductInline(${p.id}, event)" style="padding: 0.4rem 0.6rem; font-family: var(--font-outfit);">Xóa</button>
                        </div>
                    ` : `
                        ${isSoldOut ? `
                            <button class="add-to-cart-btn disabled" disabled style="background: #475569; color: #94a3b8; cursor: not-allowed; border: none; box-shadow: none;">
                                Hết hàng
                            </button>
                        ` : `
                            <button class="add-to-cart-btn" onclick="addToCart(${p.id}, event)">
                                <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Thêm
                            </button>
                        `}
                    `}
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// Open Product Detail Modal with Cross-Selling suggestions
function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modalContent = document.getElementById("product-detail-modal-body");
    
    // Cross selling items: Find items by IDs in product.accessories
    let crossSellHTML = "";
    if (product.accessories && product.accessories.length > 0) {
        crossSellHTML = `
            <div class="cross-sell-section">
                <h4 class="cross-sell-title">A.I Khuyên dùng đi kèm <span>Cross-selling</span></h4>
                <div class="cross-sell-grid">
        `;
        product.accessories.forEach(accId => {
            const accItem = products.find(p => p.id === accId);
            if (accItem) {
                crossSellHTML += `
                    <div class="cross-sell-item" onclick="openProductDetail(${accItem.id})">
                        <div class="cross-sell-img">
                            <img src="${accItem.image}" alt="${accItem.name}">
                        </div>
                        <div class="cross-sell-info">
                            <div class="cross-sell-name">${accItem.name}</div>
                            <div class="cross-sell-price">${formatVND(accItem.price)}</div>
                        </div>
                    </div>
                `;
            }
        });
        crossSellHTML += `</div></div>`;
    }

    modalContent.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-detail-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-detail-info">
                <span class="detail-series">${product.series}</span>
                <h2 class="detail-title">${product.name}</h2>
                <div class="detail-price">${formatVND(product.price)}</div>
                
                <div class="detail-specs-grid">
                    <div class="spec-item">
                        <span>Hãng sản xuất</span>
                        <span>${product.manufacturer}</span>
                    </div>
                    <div class="spec-item">
                        <span>Phân loại Grade</span>
                        <span>${product.grade}</span>
                    </div>
                    <div class="spec-item">
                        <span>Tỷ lệ Scale</span>
                        <span>${product.scale}</span>
                    </div>
                    <div class="spec-item">
                        <span>Tình trạng kho</span>
                        <span>${product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}</span>
                    </div>
                </div>

                <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1.5rem;">${product.description}</p>

                <div class="action-buttons">
                    ${product.stock > 0 ? `
                        <button class="btn-primary" onclick="addToCart(${product.id}); closeModal('product-modal');">THÊM VÀO GIỎ HÀNG</button>
                    ` : `
                        <button class="btn-primary" disabled style="background:#475569; color:#94a3b8; cursor:not-allowed; box-shadow:none;">HẾT HÀNG</button>
                    `}
                </div>

                ${crossSellHTML}
            </div>
        </div>
    `;

    productModal.classList.add("active");
}

// Shopping Cart Functions
function addToCart(productId, event = null) {
    if (event) event.stopPropagation();

    // Ràng buộc 2: Phải có tài khoản của web mới được mua hoặc thêm sản phẩm
    if (!currentUser) {
        showToast("Vui lòng đăng nhập tài khoản để mua hoặc thêm sản phẩm!", "error");
        window.location.href = "login.html"; // Chuyển hướng sang trang đăng nhập riêng
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast("Sản phẩm này đã hết hàng!", "error");
        return;
    }

    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product, quantity: 1 });
    }

    updateCartUI();
    showToast(`Đã thêm ${product.name} vào giỏ hàng`, "success");
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.innerText = totalCount;

    // Build cart items in modal
    const cartItemsList = document.getElementById("cart-items-list");
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                <p>Giỏ hàng của bạn đang trống.</p>
            </div>
        `;
        cartTotalText.innerText = formatVND(0);
        return;
    }

    let totalAmount = 0;
    cart.forEach(item => {
        const itemSubtotal = item.product.price * item.quantity;
        totalAmount += itemSubtotal;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
            <div class="cart-item-img">
                <img src="${item.product.image}" alt="${item.product.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.product.name}</h4>
                <div class="cart-item-meta">Grade: ${item.product.grade} | Scale: ${item.product.scale}</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQty(${item.product.id}, -1)">-</button>
                    <div class="qty-val">${item.quantity}</div>
                    <button class="qty-btn" onclick="changeQty(${item.product.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">${formatVND(itemSubtotal)}</div>
                <button class="remove-cart-item" onclick="removeCartItem(${item.product.id})">×</button>
            </div>
        `;
        cartItemsList.appendChild(row);
    });

    cartTotalText.innerText = formatVND(totalAmount);
}

function changeQty(productId, delta) {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeCartItem(productId);
    } else {
        updateCartUI();
    }
}

function removeCartItem(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    updateCartUI();
}

function checkout() {
    if (cart.length === 0) {
        showToast("Giỏ hàng của bạn đang trống!", "error");
        return;
    }
    
    // Switch to checkout view inside cart modal or prompt customer info
    const checkoutArea = document.getElementById("checkout-area");
    checkoutArea.style.display = "block";
    document.getElementById("cart-items-wrapper").style.display = "none";
}

async function submitOrder(paymentMethod) {
    const customerName = document.getElementById("shipping-name").value || "Khách hàng ẩn danh";
    const customerAddress = document.getElementById("shipping-address").value || "Địa chỉ mẫu";
    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    if (useRealAPI) {
        const checkoutData = {
            userID: 1, // Dùng tài khoản mặc định có sẵn trong SQL Server
            paymentMethod: paymentMethod,
            shippingAddress: customerAddress,
            notes: "Khách mua hàng: " + customerName,
            items: cart.map(item => ({
                productID: item.product.id,
                quantity: item.quantity
            }))
        };

        try {
            const res = await fetch(`${API_URL}/orders/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutData)
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Đặt hàng thành công! Đã trừ số lượng tồn kho trong SQL Server.", "success");
                cart = [];
                updateCartUI();
                closeModal('cart-modal');
                
                // Đồng bộ lại sản phẩm để cập nhật số lượng tồn kho mới nhất từ SQL Server
                await loadProductsFromAPI();
                renderProducts();
                renderAdminProducts();
                renderStats();
            } else {
                showToast(data.message || "Đặt hàng thất bại do không đủ hàng tồn kho!", "error");
            }
        } catch (e) {
            showToast("Lỗi kết nối máy chủ để thanh toán!", "error");
        }
    } else {
        const newOrder = {
            id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
            customer: customerName,
            email: "user_" + Math.floor(100 + Math.random() * 900) + "@gmail.com",
            date: new Date().toISOString().split('T')[0],
            total: totalAmount,
            status: "Pending",
            payment: paymentMethod,
            address: customerAddress
        };

        // Khấu trừ tồn kho tạm thời trong LocalStorage
        cart.forEach(item => {
            const p = products.find(prod => prod.id === item.product.id);
            if (p) p.stock = Math.max(0, p.stock - item.quantity);
        });

        orders.unshift(newOrder);
        cart = [];
        saveToLocalStorage(); // Lưu trạng thái
        updateCartUI();
        closeModal('cart-modal');
        renderStats();
        renderOrders();
        renderProducts();

        if (paymentMethod === "VNPAY") {
            showToast("Đang chuyển hướng sang cổng thanh toán VNPAY...", "success");
            setTimeout(() => {
                showToast("Thanh toán giả lập VNPAY thành công! Đơn hàng đã được lưu.", "success");
            }, 1500);
        } else {
            showToast("Đặt hàng thành công! Trực tiếp giao COD.", "success");
        }
    }

    // Reset checkout view
    document.getElementById("checkout-area").style.display = "none";
    document.getElementById("cart-items-wrapper").style.display = "block";
}

// Event Listeners setup
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById("main-search-input");
    searchInput.addEventListener("input", (e) => {
        activeFilters.search = e.target.value;
        renderProducts();
    });

    // Category check boxes
    document.querySelectorAll(".category-checkbox").forEach(box => {
        box.addEventListener("change", (e) => {
            const val = e.target.value;
            if (e.target.checked) {
                activeFilters.categories.push(val);
            } else {
                activeFilters.categories = activeFilters.categories.filter(c => c !== val);
            }
            renderProducts();
        });
    });

    // Grade check boxes
    document.querySelectorAll(".grade-checkbox").forEach(box => {
        box.addEventListener("change", (e) => {
            const val = e.target.value;
            if (e.target.checked) {
                activeFilters.grades.push(val);
            } else {
                activeFilters.grades = activeFilters.grades.filter(g => g !== val);
            }
            renderProducts();
        });
    });

    // Sort select
    document.getElementById("sort-select").addEventListener("change", (e) => {
        activeFilters.sort = e.target.value;
        renderProducts();
    });
}

function clearAllFilters() {
    activeFilters = {
        categories: [],
        grades: [],
        manufacturers: [],
        search: "",
        sort: "default"
    };
    
    document.querySelectorAll(".filter-option input[type='checkbox']").forEach(box => box.checked = false);
    document.getElementById("main-search-input").value = "";
    document.getElementById("sort-select").value = "default";
    renderProducts();
}

window.filterSubNav = function(catName) {
    clearAllFilters();
    activeFilters.categories.push(catName);
    switchTab('store');
    renderProducts();
};

window.filterSubNavSeries = function(seriesName, event) {
    if (event) event.stopPropagation(); // Ngăn sự kiện click lan ra phần tử cha
    clearAllFilters();
    activeFilters.search = seriesName; // Tìm kiếm theo tên dòng (Dragon Ball, Naruto...)
    switchTab('store');
    renderProducts();
};

window.toggleDropdown = function(event, element) {
    event.stopPropagation();
    
    // Đóng toàn bộ các dropdown khác đang mở
    document.querySelectorAll('.has-dropdown').forEach(dropdown => {
        if (dropdown !== element) {
            dropdown.classList.remove('active');
        }
    });
    
    // Đảo trạng thái đóng/mở của dropdown này
    element.classList.toggle('active');
};

// Đóng toàn bộ dropdown khi click ra ngoài vùng menu
document.addEventListener('click', () => {
    document.querySelectorAll('.has-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
});

window.showAllProducts = function() {
    clearAllFilters();
    switchTab('store');
    renderProducts();
};

window.showInfoModal = function() {
    openModal('info-modal');
};

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
    if (modalId === 'cart-modal') {
        document.getElementById("checkout-area").style.display = "none";
        document.getElementById("cart-items-wrapper").style.display = "block";
    }
}

/****************** MOVED HELPER FUNCTIONS ******************/
function deleteOrder(orderId) {
    orders = orders.filter(o => o.id !== orderId);
    saveToLocalStorage(); // Lưu trạng thái
    showToast(`Đã hủy đơn hàng ${orderId}`, "info");
    renderOrders();
    renderStats();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

// Tab Switching (Store vs Admin Dashboard)
function switchTab(tabName) {
    if (tabName === 'admin') {
        // Ràng buộc 1: Chỉ ai có tài khoản admin mới được vào trang quản trị
        if (!currentUser || currentUser.role !== 'Admin') {
            showToast("Truy cập bị từ chối! Chỉ tài khoản Admin mới có quyền truy cập trang quản trị.", "error");
            openModal("login-modal");
            return;
        }
    }

    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    
    if (tabName === 'store') {
        document.getElementById("store-nav-link").classList.add("active");
        mainLayout.classList.remove("full-width");
        document.getElementById("filter-sidebar").style.display = "block";
        document.getElementById("store-content").style.display = "block";
        document.getElementById("admin-dashboard").style.display = "none";
    } else if (tabName === 'admin') {
        document.getElementById("admin-nav-link").classList.add("active");
        mainLayout.classList.add("full-width");
        document.getElementById("filter-sidebar").style.display = "none";
        document.getElementById("store-content").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "block";
        renderOrders();
        renderAdminProducts();
    }
}

// AI Chatbot RAG Simulation
function setupChatbot() {
    const chatWidget = document.getElementById("ai-chatbot-widget");
    const chatTrigger = document.getElementById("chat-trigger-btn");
    const chatWindow = document.getElementById("chat-window");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");

    chatTrigger.addEventListener("click", () => {
        chatWindow.classList.toggle("active");
        document.getElementById("chat-badge").style.display = "none";
    });

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    let chatHistory = []; // Lưu lịch sử hội thoại cho RAG

    window.sendChatMessage = async function(text = null) {
        const query = text || chatInput.value.trim();
        if (query === "") return;

        if (!text) chatInput.value = "";

        // Add user message
        const userMsg = document.createElement("div");
        userMsg.className = "msg outgoing";
        userMsg.innerText = query;
        chatMessages.appendChild(userMsg);
        scrollToBottom();

        // Tạo tin nhắn chờ "Đang suy nghĩ"
        const loadingMsg = document.createElement("div");
        loadingMsg.className = "msg incoming";
        loadingMsg.innerHTML = "<i>Trợ lý AI đang suy nghĩ...</i>";
        chatMessages.appendChild(loadingMsg);
        scrollToBottom();

        let reply = "";
        try {
            // Gọi sang Python FastAPI AI Service chạy ở cổng 8000
            const response = await fetch(`${AI_API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query,
                    history: chatHistory
                })
            });

            if (response.ok) {
                const data = await response.json();
                reply = data.reply;
            } else {
                reply = getSimulatedRAGResponse(query);
            }
        } catch (e) {
            console.log("Lỗi kết nối AI Service. Chuyển sang phản hồi giả lập Offline.");
            reply = getSimulatedRAGResponse(query);
        }

        // Xóa tin nhắn chờ và hiển thị câu trả lời thực tế từ Gemini
        loadingMsg.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "msg incoming";
        aiMsg.innerHTML = reply;
        chatMessages.appendChild(aiMsg);
        scrollToBottom();

        // Lưu lịch sử hội thoại
        chatHistory.push({ role: "user", text: query });
        chatHistory.push({ role: "assistant", text: reply });
    };

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });
}

// RAG Q&A mapping
function getSimulatedRAGResponse(query) {
    const q = query.toLowerCase();
    
    if (q.includes("mới chơi") || q.includes("nhập môn") || q.includes("tập chơi") || q.includes("bắt đầu")) {
        return `Chào bạn! Đối với người mới nhập môn lắp ráp Gunpla, A.I gợi ý bạn nên bắt đầu từ dòng <b>HG (High Grade) 1/144</b> hoặc dòng <b>SD</b>.<br><br>
        - <b>Dòng HG:</b> Dễ lắp, độ chi tiết vừa phải, giá mềm. Đại diện tốt nhất là <a href="#" onclick="openProductDetail(1); return false;">HG Gundam Aerial</a> hoặc mẫu quốc dân RX-78-2.<br>
        - <b>Dụng cụ cần thiết:</b> 1 chiếc <a href="#" onclick="openProductDetail(10); return false;">Kềm cắt nhựa chuyên dụng</a> để cắt chi tiết sạch sẽ.<br><br>
        Bạn có muốn đặt mua mẫu HG Gundam Aerial đang bán chạy không?`;
    }
    
    if (q.includes("dưới 500k") || q.includes("giá rẻ") || q.includes("tiền ít") || q.includes("học sinh")) {
        return `Dưới đây là các sản phẩm đang có sẵn tại shop với mức giá dưới <b>500,000đ</b>:<br><br>
        1. <a href="#" onclick="openProductDetail(1); return false;">HG Gundam Aerial</a> (380k) - Dòng HG rất đẹp.<br>
        2. <a href="#" onclick="openProductDetail(5); return false;">SD Gundam Exia</a> (180k) - Mẫu chibi dễ thương.<br>
        3. <a href="#" onclick="openProductDetail(10); return false;">Kềm cắt nhựa Bandai</a> (250k).<br><br>
        Tất cả đều sẵn sàng giao hàng ngay!`;
    }

    if (q.includes("grade") || q.includes("phân loại") || q.includes("dòng nào")) {
        return `Phân biệt các dòng Gundam (Grades):<br>
        - <b>SD (Super Deformed):</b> Dạng chibi, khớp đơn giản, rất dễ ráp.<br>
        - <b>HG (High Grade - 1/144):</b> Tỉ lệ phổ biến nhất (~13cm), giá tốt, cực kỳ thích hợp bắt đầu.<br>
        - <b>RG (Real Grade - 1/144):</b> Có khung xương như MG nhưng nhỏ gọn bằng HG, độ chi tiết cực kỳ cao.<br>
        - <b>MG (Master Grade - 1/100):</b> Tỉ lệ 1/100 (~18cm), chi tiết cơ khí đẹp mắt, có khung xương chuyển động phức tạp.<br>
        - <b>PG (Perfect Grade - 1/60):</b> To nhất (~30cm), đắt nhất, có hệ thống đèn LED và mở ráp giáp cực khủng.<br><br>
        Bạn muốn tham khảo dòng nào nhất?`;
    }

    if (q.includes("figma") || q.includes("nendoroid") || q.includes("figure")) {
        return `Bên cạnh Gundam, shop còn rất nhiều Figure Anime chất lượng cao:<br><br>
        - <b>Nendoroid:</b> Các mẫu Chibi dễ thương từ Good Smile Company như <a href="#" onclick="openProductDetail(6); return false;">Naruto Uzumaki</a> hoặc <a href="#" onclick="openProductDetail(7); return false;">Sasuke Uchiha</a>.<br>
        - <b>Scale Figure:</b> Tượng tĩnh tinh xảo tỉ lệ như <a href="#" onclick="openProductDetail(8); return false;">Erza Scarlet 1/7</a>.<br><br>
        Bạn muốn xem thêm mẫu figure nào?`;
    }

    // Default response using RAG simulation
    return `Cảm ơn bạn đã hỏi Trợ lý AI! Dựa trên cơ sở dữ liệu mô hình Gundam, tôi tìm thấy thông tin bạn hỏi liên quan đến sản phẩm lắp ráp. Bạn có thể gõ các câu hỏi cụ thể hơn như "mới chơi nên chọn con nào?", "tìm gundam dưới 500k" hoặc "phân biệt HG và MG" để tôi phục vụ tốt nhất nhé!`;
}

// Visual Search Simulation
function setupVisualSearch() {
    const dropZone = document.getElementById("upload-zone");
    const scanLine = document.getElementById("scan-line");
    const uploadPreview = document.getElementById("upload-preview");
    const uploadPreviewImg = document.getElementById("upload-preview-img");
    const uploadIcon = document.getElementById("upload-icon");
    const uploadText = document.getElementById("upload-text");
    const analyzingOverlay = document.getElementById("analyzing-overlay");

    window.triggerVisualSearch = function() {
        openModal("visual-search-modal");
        // Reset state
        uploadPreview.style.display = "none";
        uploadIcon.style.display = "block";
        uploadText.style.display = "block";
        scanLine.style.display = "none";
        analyzingOverlay.style.display = "none";
    };

    window.selectSampleSearch = function(sampleId) {
        let imageUrl = "";
        let matchedProductId = 1;

        if (sampleId === 'aerial') {
            imageUrl = "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80";
            matchedProductId = 1; // Aerial
        } else if (sampleId === 'barbatos') {
            imageUrl = "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=400&q=80";
            matchedProductId = 3; // Barbatos
        } else if (sampleId === 'naruto') {
            imageUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80";
            matchedProductId = 6; // Naruto
        } else {
            imageUrl = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80";
            matchedProductId = 5; // SD Exia
        }

        // Show image in upload zone
        uploadIcon.style.display = "none";
        uploadText.style.display = "none";
        uploadPreview.style.display = "block";
        uploadPreviewImg.src = imageUrl;

        // Trigger scan effect
        scanLine.style.display = "block";
        analyzingOverlay.style.display = "flex";

        setTimeout(() => {
            // End simulation
            scanLine.style.display = "none";
            analyzingOverlay.style.display = "none";
            closeModal("visual-search-modal");

            // Filter main page to show the matched product
            const matched = products.find(p => p.id === matchedProductId);
            showToast(`A.I Visual Search thành công! Khớp 98% với ${matched.name}`, "success");
            
            // Render only the matched product + clear filter
            clearAllFilters();
            renderProducts([matched]);
        }, 2200);
    };

    dropZone.addEventListener("click", () => {
        // Just trigger standard file select simulation using sample images
        showToast("Vui lòng click vào 1 trong các hình ảnh mẫu Gundam ở bên dưới để mô phỏng quét ảnh thật bằng A.I!", "info");
    });
}

// Admin Panel Code
function renderStats() {
    const totalRev = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === "Pending").length;
    
    document.getElementById("stat-total-revenue").innerText = formatVND(totalRev);
    document.getElementById("stat-total-orders").innerText = orders.length;
    document.getElementById("stat-pending-orders").innerText = pendingOrders;
    document.getElementById("stat-total-items").innerText = products.length;
}

function renderOrders() {
    const tbody = document.getElementById("admin-orders-table-body");
    tbody.innerHTML = "";

    orders.forEach(o => {
        const tr = document.createElement("tr");
        let statusBadge = `<span class="badge pending">Chờ xử lý</span>`;
        if (o.status === "Shipping") statusBadge = `<span class="badge shipping">Đang giao</span>`;
        if (o.status === "Completed") statusBadge = `<span class="badge completed">Hoàn thành</span>`;

        tr.innerHTML = `
            <td><b>${o.id}</b></td>
            <td>${o.customer}</td>
            <td>${o.date}</td>
            <td><b>${formatVND(o.total)}</b></td>
            <td>${o.payment}</td>
            <td>${statusBadge}</td>
            <td class="admin-actions-cell">
                ${o.status === 'Pending' ? `<button class="btn-small btn-edit" onclick="updateOrderStatus('${o.id}', 'Shipping')">Giao hàng</button>` : ''}
                ${o.status === 'Shipping' ? `<button class="btn-small btn-edit" style="border-color:#39ff14;color:#39ff14;" onclick="updateOrderStatus('${o.id}', 'Completed')">Hoàn thành</button>` : ''}
                <button class="btn-small btn-delete" onclick="deleteOrder('${o.id}')">Hủy</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateOrderStatus(orderId, newStatus) {
    const o = orders.find(o => o.id === orderId);
    if (o) {
        o.status = newStatus;
        saveToLocalStorage(); // Lưu trạng thái
        showToast(`Đã cập nhật trạng thái đơn hàng ${orderId} thành ${newStatus}`, "success");
        renderOrders();
        renderStats();
    }
}



function renderAdminProducts() {
    const tbody = document.getElementById("admin-products-table-body");
    tbody.innerHTML = "";

    products.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.id}</td>
            <td><b>${p.name}</b></td>
            <td>${p.category}</td>
            <td>${p.grade}</td>
            <td><b>${formatVND(p.price)}</b></td>
            <td>${p.stock}</td>
            <td class="admin-actions-cell">
                <button class="btn-small btn-delete" onclick="deleteProduct(${p.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteProduct = async function(productId) {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast("Thao tác bị từ chối! Bạn không phải Admin.", "error");
        return;
    }
    if (useRealAPI) {
        try {
            const res = await fetch(`${API_URL}/products/${productId}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Đã xóa sản phẩm khỏi SQL Server", "info");
                await loadProductsFromAPI();
            } else {
                showToast("Không thể xóa sản phẩm khỏi SQL Server", "error");
            }
        } catch (e) {
            showToast("Lỗi kết nối API", "error");
        }
    } else {
        products = products.filter(p => p.id !== productId);
        saveToLocalStorage(); // Lưu trạng thái
        showToast("Đã xóa sản phẩm khỏi hệ thống", "info");
    }
    renderAdminProducts();
    renderProducts();
    renderStats();
};

window.openAddProductModal = async function() {
    if (!currentUser || currentUser.role !== 'Admin') {
        showToast("Thao tác bị từ chối! Bạn không phải Admin.", "error");
        return;
    }
    const prodName = prompt("Nhập tên mô hình Gundam/Anime mới:");
    if (!prodName) return;
    
    // Tự động nhận diện danh mục đang lọc trên trang web làm gợi ý mặc định
    const defaultCat = activeFilters.categories.length > 0 ? activeFilters.categories[0] : "Gundam";
    const prodCategory = prompt("Nhập thể loại (Gundam, Anime Figure, Dụng cụ, Phụ kiện, Sơn, Lắp sẵn, Khác, Đặt trước):", defaultCat);
    
    const prodPrice = parseInt(prompt("Nhập giá bán (VNĐ):", "350000")) || 350000;
    const prodStock = parseInt(prompt("Nhập số lượng tồn kho:", "10")) || 10;
    const prodGrade = prompt("Nhập dòng (HG, RG, MG, PG, Scale, Nendoroid):", "HG");
    const prodImage = prompt("Nhập đường dẫn link hình ảnh mô hình:", "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=400&q=80");
    const prodDesc = prompt("Nhập mô tả sản phẩm:", "Mô tả sản phẩm mô hình mới...");

    if (useRealAPI) {
        const newProductAPI = {
            productName: prodName,
            categoryID: prodCategory === "Gundam" ? 1 : prodCategory === "Anime Figure" ? 2 : prodCategory === "Dụng cụ" ? 3 : 4,
            series: "Mới ra mắt",
            grade: prodGrade,
            scale: "1/144",
            manufacturer: "Bandai",
            price: prodPrice,
            stockQuantity: prodStock,
            description: prodDesc,
            imageUrl: prodImage
        };
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProductAPI)
            });
            if (res.ok) {
                showToast("Đã thêm sản phẩm lên SQL Server thành công!", "success");
                await loadProductsFromAPI();
            } else {
                showToast("Lỗi khi thêm sản phẩm lên SQL Server", "error");
            }
        } catch (e) {
            showToast("Lỗi kết nối API", "error");
        }
    } else {
        const newProd = {
            id: products.length + 1,
            name: prodName,
            category: prodCategory,
            series: "Mới ra mắt",
            grade: prodGrade,
            scale: "1/144",
            manufacturer: "Bandai",
            price: prodPrice,
            stock: prodStock,
            description: prodDesc,
            image: prodImage,
            accessories: []
        };
        products.push(newProd);
        saveToLocalStorage(); // Lưu trạng thái
        showToast("Đã thêm sản phẩm mới thành công!", "success");
    }
    renderAdminProducts();
    renderProducts();
    renderStats();
};

// --- AUTHENTICATION MODULE ---
window.handleLoginSubmit = function() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;

    const user = SIMULATED_USERS.find(u => u.email === email && u.password === pass);
    if (user) {
        currentUser = user;
        updateAuthUI();
        closeModal("login-modal");
        
        // Reset input fields
        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";
        
        showToast(`Đăng nhập thành công! Chào mừng ${user.name}.`, "success");
    } else {
        showToast("Sai Email hoặc Mật khẩu đăng nhập!", "error");
    }
};

window.handleLogout = function() {
    currentUser = null;
    localStorage.removeItem("gundam_current_user"); // Xóa session đăng nhập
    updateAuthUI();
    switchTab('store');
    showToast("Đã đăng xuất tài khoản.", "info");
};

function updateAuthUI() {
    const userDisplayName = document.getElementById("user-display-name");
    const loginBtn = document.getElementById("login-nav-btn");
    const logoutBtn = document.getElementById("logout-nav-btn");
    const adminNavLink = document.getElementById("admin-nav-link");
    const quickAddBtn = document.getElementById("quick-add-product-btn");

    if (currentUser) {
        userDisplayName.innerText = currentUser.name;
        userDisplayName.style.display = "inline";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline";
        
        // Chỉ hiển thị liên kết trang quản trị nếu là Admin
        if (currentUser.role === 'Admin') {
            adminNavLink.style.display = "inline";
            if (quickAddBtn) quickAddBtn.style.display = "inline-flex"; // Hiển thị nút thêm nhanh
        } else {
            adminNavLink.style.display = "none";
            if (quickAddBtn) quickAddBtn.style.display = "none";
        }
    } else {
        userDisplayName.style.display = "none";
        loginBtn.style.display = "inline";
        logoutBtn.style.display = "none";
        adminNavLink.style.display = "none"; // Ẩn hoàn toàn khi chưa đăng nhập
        if (quickAddBtn) quickAddBtn.style.display = "none";
    }
    
    // Vẽ lại danh sách sản phẩm để cập nhật hiển thị nút Sửa/Xóa đối với Admin
    renderProducts();
}

// --- THEME TOGGLE MODULE ---
window.toggleTheme = function() {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    showToast(`Đã chuyển sang giao diện ${isLight ? "Sáng" : "Tối"}`, "info");
};

// --- INLINE ADMIN CRUD ---
window.deleteProductInline = function(productId, event) {
    if (event) event.stopPropagation();
    deleteProduct(productId);
};

window.editProductInline = async function(productId, event) {
    if (event) event.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newName = prompt("Sửa tên sản phẩm:", product.name);
    if (newName) {
        const newPrice = parseInt(prompt("Sửa giá bán (VNĐ):", product.price)) || product.price;
        const newImage = prompt("Sửa đường dẫn hình ảnh mô hình:", product.image) || product.image;
        const newDesc = prompt("Sửa mô tả sản phẩm:", product.description) || product.description;
        
        if (useRealAPI) {
            const updatedProductAPI = {
                productID: productId,
                productName: newName,
                categoryID: product.category === "Gundam" ? 1 : product.category === "Anime Figure" ? 2 : product.category === "Dụng cụ" ? 3 : 4,
                series: product.series || "Mới ra mắt",
                grade: product.grade || "HG",
                scale: product.scale || "1/144",
                manufacturer: product.manufacturer || "Bandai",
                price: newPrice,
                stockQuantity: product.stock || 10,
                description: newDesc,
                imageUrl: newImage
            };
            try {
                const res = await fetch(`${API_URL}/products/${productId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedProductAPI)
                });
                if (res.ok) {
                    showToast("Đã cập nhật sản phẩm lên SQL Server!", "success");
                    await loadProductsFromAPI();
                } else {
                    showToast("Lỗi cập nhật trên SQL Server", "error");
                }
            } catch (e) {
                showToast("Lỗi kết nối API", "error");
            }
        } else {
            product.name = newName;
            product.price = newPrice;
            product.image = newImage;
            product.description = newDesc;
            saveToLocalStorage(); // Lưu trạng thái
            showToast("Đã cập nhật sản phẩm thành công!", "success");
        }
        renderProducts();
        renderAdminProducts();
        renderStats();
    }
};
