const API_URL = "https://project-webdevelopment-efe.onrender.com";
let currentUser = JSON.parse(localStorage.getItem("waslaUser")) || null;
let activeHistoryTab = 'myLentTools';

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadTools();
    loadHistory();
});

function checkAuth() {
    const authModalEl = document.getElementById("authModal");
    const authModal = bootstrap.Modal.getInstance(authModalEl) || new bootstrap.Modal(authModalEl);
    const userBar = document.getElementById("userBar");

    if (!currentUser || !currentUser.email) {
        authModal.show();
    } else {
        authModal.hide();
        userBar.innerHTML = `
            <span class="me-3"><i class="fa-solid fa-circle-user"></i> مرحباً، <strong>${currentUser.name}</strong> (${currentUser.email})</span>
            <button onclick="logout()" class="btn btn-outline-danger btn-sm">
                <i class="fa-solid fa-right-from-bracket"></i> خروج
            </button>
        `;
    }
}

async function loginUser() {
    const name = document.getElementById("authName").value.trim();
    const email = document.getElementById("authEmail").value.trim();
    const phone = document.getElementById("authPhone").value.trim();

    if (!name || !email || !phone) {
        alert("يرجى تعبئة جميع الحقول: الاسم والبريد الإلكتروني ورقم الهاتف");
        return;
    }

    const jordanPhoneRegex = /^07[789]\d{7}$/;
    if (!jordanPhoneRegex.test(phone)) {
        alert("يرجى إدخال رقم هاتف أردني صحيح يتكون من 10 أرقام ويبدأ بـ 07 (مثال: 0791234567)");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("يرجى إدخال بريد إلكتروني صحيح");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, fullName: name, email, phone })
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = { id: data.userId || data.id, name, email, phone };
            localStorage.setItem("waslaUser", JSON.stringify(currentUser));
            checkAuth();
            loadTools();
            loadHistory();
        } else {
            alert("حدث خطأ أثناء تسجيل الدخول");
        }
    } catch (e) {
        console.error("Login error:", e);
        currentUser = { name, email, phone };
        localStorage.setItem("waslaUser", JSON.stringify(currentUser));
        checkAuth();
        loadTools();
        loadHistory();
    }
}

function logout() {
    localStorage.removeItem("waslaUser");
    currentUser = null;
    location.reload();
}

function toggleCustomCategoryInput(select) {
    const customDiv = document.getElementById("customCategoryDiv");
    if (select.value === "أخرى") {
        customDiv.classList.remove("d-none");
    } else {
        customDiv.classList.add("d-none");
    }
}

async function submitNewTool() {
    if (!currentUser) return checkAuth();

    const name = document.getElementById("toolNameInput").value.trim();
    const fileInput = document.getElementById("toolImageFileInput") || document.getElementById("ImageInput");
    const categorySelect = document.getElementById("toolCategorySelect").value;
    const customCategory = document.getElementById("customCategoryInput").value.trim();
    const totalQuantity = parseInt(document.getElementById("toolQtyInput").value);
    const description = document.getElementById("toolDescInput").value.trim();

    const finalCategory = (categorySelect === "أخرى" && customCategory) ? customCategory : categorySelect;

    if (!name || isNaN(totalQuantity) || totalQuantity < 1) {
        alert("يرجى التأكد من كتابة اسم الأداة والكمية بشكل صحيح");
        return;
    }

    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Category", finalCategory);
    formData.append("TotalQuantity", totalQuantity);
    formData.append("Description", description);
    formData.append("OwnerName", currentUser.name);
    formData.append("OwnerEmail", currentUser.email);
    formData.append("OwnerPhone", currentUser.phone);
    if (currentUser.id) formData.append("OwnerId", currentUser.id);

    if (fileInput && fileInput.files[0]) {
        formData.append("image", fileInput.files[0]);
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("تم إضافة الأداة بنجاح!");
            
            const modalEl = document.getElementById("addToolModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();

            document.getElementById("toolNameInput").value = "";
            if (fileInput) fileInput.value = "";
            document.getElementById("toolDescInput").value = "";
            document.getElementById("customCategoryInput").value = "";
            document.getElementById("customCategoryDiv").classList.add("d-none");

            loadTools();
        } else {
            const errText = await res.text();
            alert("فشل الحفظ في السيرفر: " + errText);
        }
    } catch (e) {
        console.error("Error adding tool:", e);
        alert("حدث خطأ في الاتصال بالباك إند");
    }
}

async function loadTools() {
    try {
        const res = await fetch(API_URL);
        const tools = await res.json();
        const container = document.getElementById("toolsGrid");
        const statTotalTools = document.getElementById("statTotalTools");
        
        container.innerHTML = "";
        if (statTotalTools) statTotalTools.innerText = tools.length;

        const cleanPhone = (ph) => ph ? ph.toString().trim() : '';

        tools.forEach(t => {
            const isOutOfStock = t.availableQuantity <= 0;
            
            // التحقق مما إذا كان المستخدم الحالي هو مالك هذه الأداة
            const isOwner = currentUser && (
                (currentUser.id && currentUser.id === t.ownerId) ||
                (cleanPhone(currentUser.phone) === cleanPhone(t.ownerPhone)) ||
                (currentUser.email && t.ownerEmail && currentUser.email.toLowerCase() === t.ownerEmail.toLowerCase())
            );

            const card = document.createElement("div");
            card.className = "col-md-4";
            card.innerHTML = `
                <div class="card h-100 shadow-sm border-0 position-relative">
                    ${t.imageUrl ? `<img src="http://localhost:5063${t.imageUrl}" class="card-img-top" style="height: 180px; object-fit: cover;" alt="${t.name}">` : ''}
                    
                    ${isOwner ? `
                        <div class="position-absolute top-0 end-0 m-2 d-flex gap-1">
                            <button class="btn btn-warning btn-sm" title="تعديل الأداة" onclick="openEditModal(${t.id}, '${t.name.replace(/'/g, "\\'")}', '${(t.category||'').replace(/'/g, "\\'")}', ${t.totalQuantity}, '${(t.description||'').replace(/'/g, "\\'")}')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" title="حذف الأداة" onclick="deleteTool(${t.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}

                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title fw-bold m-0">${t.name}</h5>
                            <span class="badge bg-secondary">${t.category || 'عام'}</span>
                        </div>
                        <p class="card-text text-muted small">${t.description || 'لا يوجد وصف'}</p>
                        <p class="small text-secondary mb-3">المالك: <strong>${t.ownerName}</strong></p>
                        
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            ${isOutOfStock 
                                ? `<span class="badge bg-danger p-2"><i class="fa-solid fa-circle-xmark"></i> نفدت الكمية ⚠️</span>` 
                                : `<span class="badge bg-success p-2">المتاح: ${t.availableQuantity} من ${t.totalQuantity}</span>`
                            }
                            ${!isOwner ? `
                                <button class="btn btn-sm btn-primary" ${isOutOfStock ? 'disabled' : ''} onclick="openBorrowModal(${t.id}, '${t.name}')">
                                    ${isOutOfStock ? 'غير متاح' : 'طلب استعارة'}
                                </button>
                            ` : `<span class="badge bg-info text-dark p-2"><i class="fa-solid fa-user-check"></i> أداتك الخاصّة</span>`}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error loading tools:", e);
    }
}

// فتح مودال التعديل وتعبئة البيانات المسبقة
function openEditModal(id, name, category, description) {
    document.getElementById("editToolId").value = id;
    document.getElementById("editToolNameInput").value = name;
    document.getElementById("editToolCategoryInput").value = category;
    document.getElementById("editToolDescInput").value = description;

    const modalEl = document.getElementById("editToolModal");
    (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).show();
}

// فتح مودال التعديل وتعبئة البيانات المسبقة بما فيها الكمية
function openEditModal(id, name, category, totalQuantity, description) {
    document.getElementById("editToolId").value = id;
    document.getElementById("editToolNameInput").value = name;
    document.getElementById("editToolCategoryInput").value = category;
    document.getElementById("editToolQtyInput").value = totalQuantity;
    document.getElementById("editToolDescInput").value = description;

    const modalEl = document.getElementById("editToolModal");
    (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).show();
}

async function submitEditTool() {
    const id = document.getElementById("editToolId").value;
    const name = document.getElementById("editToolNameInput").value.trim();
    const category = document.getElementById("editToolCategoryInput").value.trim();
    const totalQuantity = parseInt(document.getElementById("editToolQtyInput").value, 10);
    const description = document.getElementById("editToolDescInput").value.trim();

    if (!name || isNaN(totalQuantity) || totalQuantity < 1) {
        alert("يرجى إدخال كمية صحيحة (1 أو أكثر)");
        return;
    }

    const updateData = {
        Name: name,
        Category: category,
        TotalQuantity: totalQuantity,
        Description: description,
        OwnerId: currentUser ? (currentUser.id || 0) : 0,
        OwnerName: currentUser ? currentUser.name : "",
        OwnerEmail: currentUser ? currentUser.email : "",
        OwnerPhone: currentUser ? currentUser.phone : ""
    };

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            alert("تم التحديث بنجاح!");
            const modalEl = document.getElementById("editToolModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
            
            // إعادة تحميل الأدوات من السيرفر فوراً
            await loadTools();
        } else {
            const errText = await res.text();
            alert("خطأ من السيرفر: " + errText);
        }
    } catch (e) {
        console.error("Error updating tool:", e);
    }
}

// حذف الأداة
async function deleteTool(id) {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذه الأداة؟")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (res.ok) {
            alert("تم حذف الأداة بنجاح!");
            loadTools();
        } else {
            alert("فشل حذف الأداة من السيرفر");
        }
    } catch (e) {
        console.error("Error deleting tool:", e);
    }
}

function openBorrowModal(toolId, toolName) {
    if (!currentUser) return checkAuth();
    document.getElementById("borrowToolId").value = toolId;
    document.getElementById("borrowToolName").innerText = toolName;
    const modalEl = document.getElementById("borrowModal");
    (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).show();
}

async function submitBorrowRequest() {
    const toolId = document.getElementById("borrowToolId").value;
    const quantity = parseInt(document.getElementById("borrowQtyInput").value);
    const expectedReturnDate = document.getElementById("borrowDateInput").value;

    if (!expectedReturnDate || quantity < 1) {
        alert("يرجى تحديد الكمية وتاريخ الإرجاع المتوقع");
        return;
    }

    const borrowData = {
        toolId: parseInt(toolId),
        borrowerId: currentUser.id || 0,
        borrowerName: currentUser.name,
        borrowerEmail: currentUser.email,
        borrowerPhone: currentUser.phone,
        quantity: quantity,
        expectedReturnDate: expectedReturnDate
    };

    try {
        const res = await fetch(`${API_URL}/borrow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(borrowData)
        });

        if (res.ok) {
            alert("تم إرسال طلب الاستعارة بنجاح!");
            const modalEl = document.getElementById("borrowModal");
            (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).hide();
            loadTools();
            loadHistory();
        } else {
            const errText = await res.text();
            alert("فشلت عملية الاستعارة: " + errText);
        }
    } catch (e) {
        console.error("Error requesting borrow:", e);
    }
}

function switchHistoryTab(tabName) {
    activeHistoryTab = tabName;
    document.querySelectorAll("#historyTabs .nav-link").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");
    loadHistory();
}

async function loadHistory() {
    try {
        const [historyRes, toolsRes] = await Promise.all([
            fetch(`${API_URL}/history`),
            fetch(API_URL)
        ]);

        const history = await historyRes.json();
        const tools = await toolsRes.json();

        const tbody = document.getElementById("historyTableBody");
        const statTotalBorrows = document.getElementById("statTotalBorrows");
        if (statTotalBorrows) statTotalBorrows.innerText = history.length;
        
        tbody.innerHTML = "";

        const cleanPhone = (ph) => ph ? ph.toString().trim() : '';

        history.forEach(r => {
            const tool = tools.find(t => t.id === r.toolId);

            const isOwner = currentUser && tool && (
                (currentUser.id && currentUser.id === tool.ownerId) ||
                (cleanPhone(currentUser.phone) === cleanPhone(tool.ownerPhone)) ||
                (currentUser.email && tool.ownerEmail && currentUser.email.toLowerCase() === tool.ownerEmail.toLowerCase())
            );

            const isBorrower = currentUser && (
                (currentUser.id && currentUser.id === r.borrowerId) ||
                (cleanPhone(currentUser.phone) === cleanPhone(r.borrowerPhone)) ||
                (currentUser.email && r.borrowerEmail && currentUser.email.toLowerCase() === r.borrowerEmail.toLowerCase())
            );

            if (activeHistoryTab === 'myLentTools' && !isOwner) return;
            if (activeHistoryTab === 'myBorrowedTools' && !isBorrower) return;

            const borrowTimeStr = new Date(r.borrowedAt).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });
            let returnStatusHtml = "";

            if (r.isOwnerApproved && r.returnedAt) {
                const approvedTimeStr = new Date(r.returnedAt).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });
                returnStatusHtml = `<div class="text-success fw-bold">تأكيد المالك:<br> 🕒 ${approvedTimeStr}</div>`;
            } else if (r.isReturnRequested && r.returnRequestedAt) {
                const reqTimeStr = new Date(r.returnRequestedAt).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });
                returnStatusHtml = `<div class="text-warning fw-bold">طلب الإرجاع:<br> 🕒 ${reqTimeStr}</div>`;
            } else {
                returnStatusHtml = `<span class="text-muted">متوقع: ${new Date(r.expectedReturnDate).toLocaleDateString('ar-JO')}</span>`;
            }

            let actionHtml = "";
            if (r.isOwnerApproved) {
                actionHtml = `<span class="badge bg-success p-2"><i class="fa-solid fa-check-double"></i> تم الإرجاع وتأكيد المالك</span>`;
            } else if (r.isReturnRequested) {
                if (isOwner) {
                    actionHtml = `<button class="btn btn-success btn-sm" onclick="approveReturn(${r.id})"><i class="fa-solid fa-check"></i> تأكيد استلام الأداة (المالك)</button>`;
                } else {
                    actionHtml = `<span class="badge bg-warning text-dark p-2"><i class="fa-solid fa-hourglass-half"></i> بانتظار تأكيد المالك</span>`;
                }
            } else {
                if (isBorrower) {
                    actionHtml = `<button class="btn btn-outline-primary btn-sm" onclick="requestReturn(${r.id})"><i class="fa-solid fa-rotate-left"></i> طلب إرجاع الأداة</button>`;
                } else {
                    actionHtml = `<span class="badge bg-info text-dark p-2">قيد الاستعارة</span>`;
                }
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${r.toolName}</strong></td>
                <td>${isOwner ? `المستعير: <strong>${r.borrowerName}</strong>` : `المالك: <strong>${tool ? tool.ownerName : 'غير محدد'}</strong>`}</td>
                <td>
                    <a href="tel:${tool ? tool.ownerPhone : ''}" class="btn btn-sm btn-outline-success">
                        <i class="fa-solid fa-phone"></i> ${tool ? tool.ownerPhone : 'غير متوفر'}
                    </a>
                </td>
                <td><span class="badge bg-light text-dark border">${r.quantity}</span></td>
                <td>🕒 ${borrowTimeStr}</td>
                <td>${returnStatusHtml}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (e) {
        console.error("Error loading history:", e);
    }
}

async function requestReturn(recordId) {
    try {
        const res = await fetch(`${API_URL}/request-return/${recordId}`, { method: "POST" });
        if (res.ok) {
            alert("تم إرسال طلب الإرجاع! بانتظار تأكيد المالك.");
            loadHistory();
        }
    } catch (e) {
        console.error("Error requesting return:", e);
    }
}

async function approveReturn(recordId) {
    try {
        const res = await fetch(`${API_URL}/approve-return/${recordId}`, { method: "POST" });
        if (res.ok) {
            alert("تم تأكيد إرجاع الأداة بنجاح!");
            loadTools();
            loadHistory();
        }
    } catch (e) {
        console.error("Error approving return:", e);
    }
}
