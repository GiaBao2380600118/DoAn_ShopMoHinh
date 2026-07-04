import React, { useState, useEffect, useRef } from 'react';
import './GundamStoreApp.css'; // Assume similar cyberpunk/mecha CSS styles

const API_BASE_URL = 'http://localhost:5000/api'; // ASP.NET Core Backend
const AI_SERVICE_URL = 'http://localhost:8000/api/ai'; // Python FastAPI Service

export default function GundamStoreApp() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState('');
    
    // AI Chatbot State
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Xin chào! Mình là trợ lý tư vấn Gundam/Anime AI. Bạn đang muốn tìm dòng mô hình nào hoặc cần hỗ trợ dụng cụ lắp ráp?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    
    // Visual Search State
    const [visualSearchOpen, setVisualSearchOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);

    // Load initial products from ASP.NET API
    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedGrade, searchQuery]);

    const fetchProducts = async () => {
        try {
            let url = `${API_BASE_URL}/products?search=${searchQuery}`;
            if (selectedCategory) url += `&categoryId=${selectedCategory}`;
            if (selectedGrade) url += `&grade=${selectedGrade}`;
            
            const res = await fetch(url);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Lỗi kết nối API Backend C#:", err);
        }
    };

    // Send chat question to Python AI Service (RAG)
    const handleSendChatMessage = async (textToSend) => {
        const query = textToSend || chatInput;
        if (!query.trim()) return;

        setMessages(prev => [...prev, { sender: 'user', text: query }]);
        setChatInput('');

        try {
            const res = await fetch(`${AI_SERVICE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
            
            // If the AI service suggests products, filter catalog
            if (data.suggested_products && data.suggested_products.length > 0) {
                // Highlight or filter those specific products
                console.log("Sản phẩm gợi ý:", data.suggested_products);
            }
        } catch (err) {
            console.error("Lỗi kết nối AI Service:", err);
            setMessages(prev => [...prev, { sender: 'ai', text: "Xin lỗi, hệ thống AI chatbot đang bận. Bạn vui lòng thử lại sau." }]);
        }
    };

    // Upload image to Python AI Service for Visual Search (embeddings comparison)
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${AI_SERVICE_URL}/visual-search`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            setIsScanning(false);
            setVisualSearchOpen(false);

            if (data.status === 'success') {
                // Fetch the matched product detail or filter it in UI
                alert(`Tìm thấy sản phẩm trùng khớp với ảnh: ID ${data.matched_product_id} (Độ tin cậy: ${data.confidence * 100}%)`);
                setSearchQuery('');
                // Fetch matched product by ID
                const prodRes = await fetch(`${API_BASE_URL}/products/${data.matched_product_id}`);
                const prodData = await prodRes.json();
                setProducts([prodData]);
            }
        } catch (err) {
            console.error("Lỗi AI Visual Search:", err);
            setIsScanning(false);
            alert("Lỗi phân tích hình ảnh từ AI Service.");
        }
    };

    return (
        <div className="app-container">
            {/* Nav and storefront components go here... */}
            <div style={{ padding: '20px' }}>
                <h2>Mã Nguồn Tích Hợp Frontend React với ASP.NET Core & Python FastAPI</h2>
                <p>Hãy xem tệp mã nguồn này làm mẫu để viết giao diện React thực tế kết nối trực tiếp đến các cổng API.</p>
                
                {/* Visual Search trigger button */}
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px', background: '#00f3ff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                    📸 Tìm bằng hình ảnh (Upload)
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />

                {/* Chat window trigger button */}
                <button onClick={() => setChatOpen(!chatOpen)} style={{ padding: '10px', background: '#ff6c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🤖 Tư vấn Gunpla AI (RAG Chat)
                </button>
            </div>
            
            {/* Simulated Chatbot Modal inside React */}
            {chatOpen && (
                <div style={{ position: 'fixed', bottom: '80px', right: '20px', width: '350px', background: '#121620', border: '1px solid #222b40', borderRadius: '10px', padding: '10px', color: '#fff' }}>
                    <div style={{ borderBottom: '1px solid #222b40', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tư vấn AI Chatbot</span>
                        <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
                    </div>
                    <div style={{ height: '250px', overflowY: 'auto', marginBottom: '10px' }}>
                        {messages.map((m, idx) => (
                            <div key={idx} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '5px', padding: '8px', background: m.sender === 'user' ? '#00f3ff' : '#1a2030', color: m.sender === 'user' ? '#000' : '#fff', borderRadius: '8px' }}>
                                {m.text}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()} style={{ flex: 1, padding: '5px', background: '#0a0c10', border: '1px solid #222b40', color: '#fff' }} />
                        <button onClick={() => handleSendChatMessage()} style={{ padding: '5px 10px', background: '#00f3ff', border: 'none', cursor: 'pointer', color: '#000' }}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
}
