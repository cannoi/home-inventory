document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadItems();

  document.getElementById('searchInput').addEventListener('input', debounce(loadItems, 300));
  document.getElementById('filterLocation').addEventListener('change', loadItems);
  document.getElementById('filterWarranty').addEventListener('change', loadItems);
});

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('statCount').textContent = data.count;
    document.getElementById('statValue').textContent = formatCurrency(data.totalValue);
  } catch (err) {
    console.error('Lỗi tải thống kê:', err);
  }
}

async function loadItems() {
  const search = document.getElementById('searchInput').value;
  const location = document.getElementById('filterLocation').value;
  const warranty = document.getElementById('filterWarranty').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (location) params.append('location', location);
  if (warranty) params.append('warranty', warranty);

  try {
    const res = await fetch(`/api/items?${params.toString()}`);
    const items = await res.json();
    renderItems(items);
  } catch (err) {
    console.error('Lỗi tải danh sách:', err);
  }
}

function renderItems(items) {
  const container = document.getElementById('itemsContainer');
  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <p class="text-4xl mb-2">📭</p>
        <p>Không tìm thấy tài sản nào phù hợp.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    let warrantyBadge = '';
    if (item.warranty_expiry) {
      const isExpired = new Date(item.warranty_expiry) < new Date();
      warrantyBadge = isExpired
        ? `<span class="bg-rose-50 text-rose-600 text-xs px-2.5 py-1 rounded-full font-medium">Hết hạn BH</span>`
        : `<span class="bg-emerald-50 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-medium">Còn hạn BH</span>`;
    }

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
        <div>
          <div class="h-48 bg-slate-100 relative">
            ${item.image_url ? `<img src="${item.image_url}" class="w-full h-full object-cover">` : `<div class="flex items-center justify-center h-full text-slate-300 text-3xl">📷</div>`}
            <div class="absolute top-3 left-3">
              <span class="bg-white/90 backdrop-blur-sm text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">${item.location}</span>
            </div>
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-slate-800 text-lg truncate flex-1" title="${item.name}">${item.name}</h3>
            </div>
            <p class="text-indigo-600 font-semibold mb-2">${formatCurrency(item.value)}</p>
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span class="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">${item.category || 'Chung'}</span>
              ${warrantyBadge}
            </div>
            ${item.notes ? `<p class="text-xs text-slate-500 line-clamp-2 mb-2">${item.notes}</p>` : ''}
          </div>
        </div>
        <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span class="text-xs text-slate-400">${item.purchase_date ? 'Mua: ' + item.purchase_date : ''}</span>
          <div class="flex gap-2">
            <button onclick="editItem(${item.id})" class="text-slate-600 hover:text-indigo-600 text-sm font-medium">Sửa</button>
            <button onclick="deleteItem(${item.id})" class="text-rose-500 hover:text-rose-700 text-sm font-medium">Xóa</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openModal(item = null) {
  const modal = document.getElementById('itemModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (item) {
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa tài sản';
    document.getElementById('itemId').value = item.id;
    document.getElementById('name').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('location').value = item.location;
    document.getElementById('value').value = item.value;
    document.getElementById('purchase_date').value = item.purchase_date || '';
    document.getElementById('warranty_expiry').value = item.warranty_expiry || '';
    document.getElementById('notes').value = item.notes || '';
  } else {
    document.getElementById('modalTitle').textContent = 'Thêm tài sản mới';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
  }
}

function closeModal() {
  const modal = document.getElementById('itemModal');
  modal.classList.remove('flex');
  modal.classList.add('hidden');
}

async function saveItem(event) {
  event.preventDefault();
  const id = document.getElementById('itemId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('location', document.getElementById('location').value);
  formData.append('value', document.getElementById('value').value);
  formData.append('purchase_date', document.getElementById('purchase_date').value);
  formData.append('warranty_expiry', document.getElementById('warranty_expiry').value);
  formData.append('notes', document.getElementById('notes').value);
  
  const imageFile = document.getElementById('image').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const url = id ? `/api/items/${id}` : '/api/items';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      body: formData
    });
    if (res.ok) {
      closeModal();
      loadStats();
      loadItems();
    } else {
      const err = await res.json();
      alert('Lỗi: ' + (err.error || 'Không thể lưu tài sản'));
    }
  } catch (err) {
    console.error('Lỗi khi lưu:', err);
  }
}

async function editItem(id) {
  try {
    const res = await fetch(`/api/items/${id}`);
    const item = await res.json();
    openModal(item);
  } catch (err) {
    console.error('Lỗi tải thông tin đồ vật:', err);
  }
}

async function deleteItem(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa tài sản này?')) return;
  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadStats();
      loadItems();
    } else {
      alert('Không thể xóa tài sản.');
    }
  } catch (err) {
    console.error('Lỗi khi xóa:', err);
  }
}
