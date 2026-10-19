/* ============================================================================
   Admin Panel – Frontend Application
   ============================================================================ */

const API = "http://localhost:3000/api";
let currentEditor = null;
let editors = {};
let adminLang = 'vi'; // Legacy variable (can be removed but kept for safety if referenced elsewhere)

// ============================================================================
// Editor Initialization
// ============================================================================

function initEditor(elementId, initialValue = "", customHeight = null) {
  if (editors[elementId]) {
    editors[elementId].destroy();
  } else if (currentEditor && elementId === 'editor-container') {
    // Legacy cleanup
    currentEditor.destroy();
  }
  
  const { Editor } = toastui;
  const { colorSyntax } = toastui.Editor.plugin;
  
  let editorHeight = customHeight;
  if (!editorHeight) {
    editorHeight = elementId.includes('desc') || elementId.includes('footer') ? '300px' : (elementId.includes('name') || elementId.includes('title') ? '200px' : '500px');
  }

  const editor = new Editor({
    el: document.getElementById(elementId),
    height: editorHeight,
    initialEditType: 'wysiwyg',
    initialValue: initialValue,
    previewStyle: 'vertical',
    theme: 'dark',
    plugins: [colorSyntax],
    hooks: {
      addImageBlobHook: async (blob, callback) => {
        const formData = new FormData();
        formData.append('image', blob);
        try {
          const resp = await fetch(`${API}/upload`, {
            method: 'POST',
            body: formData
          });
          const data = await resp.json();
          if (data.success) {
            callback(data.path, 'image');
          } else {
            showToast('Lỗi upload ảnh: ' + (data.error || 'Unknown'), 'error');
          }
        } catch (err) {
          showToast('Lỗi mạng khi upload ảnh', 'error');
        }
      }
    }
  });
  
  editors[elementId] = editor;
  currentEditor = editor;
  return editor;
}

// ============================================================================
// Editor Modal Logic
// ============================================================================

let currentModalEditor = null;
let currentModalSaveCallback = null;

function openEditorModal(title, initialValue, onSaveCallback) {
  document.getElementById('editorModalTitle').textContent = title;
  document.getElementById('editorModal').classList.add('show');
  
  // Initialize the editor inside the modal
  currentModalEditor = initEditor('modal-editor-container', initialValue, '600px');
  currentModalSaveCallback = onSaveCallback;
}

document.getElementById('editorModalCancel')?.addEventListener('click', () => {
  document.getElementById('editorModal').classList.remove('show');
  if (currentModalEditor) {
    currentModalEditor.destroy();
    currentModalEditor = null;
  }
});

document.getElementById('editorModalConfirm')?.addEventListener('click', () => {
  if (currentModalEditor && currentModalSaveCallback) {
    const content = currentModalEditor.getMarkdown();
    currentModalSaveCallback(content);
  }
  document.getElementById('editorModal').classList.remove('show');
  if (currentModalEditor) {
    currentModalEditor.destroy();
    currentModalEditor = null;
  }
});

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle", warning: "fa-exclamation-triangle" };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// Loading State
// ============================================================================

function showLoading() {
  document.getElementById("loading").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hidden");
}

// ============================================================================
// Navigation
// ============================================================================

const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("page-title");
const breadcrumb = document.getElementById("breadcrumb");
const contentArea = document.getElementById("content-area");

function initAdminRouter() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const validSections = [
    "site-settings", "pages-settings", "section-titles",
    "about", "cv", "socials", "repositories",
    "teachings", "news", "bibliography", "resume-json", "tu-tuong"
  ];
  const section = validSections.includes(hash) ? hash : "site-settings";

  navItems.forEach((n) => {
    if (n.dataset.section === section) {
      n.classList.add("active");
      const span = n.querySelector("span");
      if (span) {
        pageTitle.textContent = span.textContent;
        if (breadcrumb) {
          breadcrumb.textContent = `Admin / ${span.textContent}`;
        }
      }
    } else {
      n.classList.remove("active");
    }
  });

  loadSection(section);
}

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    const targetHash = `#/${section}`;
    if (window.location.hash === targetHash || window.location.hash === `#${section}`) {
      initAdminRouter();
    } else {
      window.location.hash = targetHash;
    }

    // Close mobile sidebar
    document.getElementById("sidebar").classList.remove("open");
    const backdrop = document.querySelector(".sidebar-backdrop");
    if (backdrop) backdrop.classList.remove("active");
  });
});

window.addEventListener("hashchange", () => {
  initAdminRouter();
});

// Mobile toggle
document.getElementById("mobile-toggle").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      backdrop.classList.remove("active");
    });
  }
  backdrop.classList.toggle("active");
});

// ============================================================================
// Section Loaders
// ============================================================================

async function loadSection(section) {
  window.scrollTo(0, 0);
  showLoading();
  const globalSave = document.getElementById("global-save");
  globalSave.style.display = "flex";
  globalSave.onclick = null;
  const globalSaveSpan = globalSave.querySelector("span");
  if (globalSaveSpan) globalSaveSpan.textContent = "Lưu thay đổi";

  try {
    switch (section) {
      case "site-settings":
        globalSave.onclick = saveSiteSettings;
        await loadSiteSettings();
        break;
      case "pages-settings":
        globalSave.onclick = savePagesSettings;
        await loadPagesSettings();
        break;
      case "section-titles":
        globalSave.onclick = saveSectionTitles;
        await loadSectionTitles();
        break;
      case "about":
        globalSave.onclick = saveAbout;
        await loadAbout();
        break;
      case "cv":
        globalSave.onclick = saveCV;
        await loadCV();
        break;
      case "socials":
        globalSave.onclick = saveSocials;
        await loadSocials();
        break;
      case "repositories":
        globalSave.onclick = saveRepositories;
        await loadRepositories();
        break;
      case "teachings":
        globalSave.style.display = "none";
        await loadTeachings();
        break;
      case "news":
        globalSave.style.display = "none";
        await loadNews();
        break;
      case "bibliography":
        globalSave.onclick = saveBibliography;
        await loadBibliography();
        break;
      case "resume-json":
        globalSave.onclick = saveResumeJson;
        await loadResumeJson();
        break;
      case "tu-tuong":
        globalSave.onclick = saveTuTuongSettings;
        await loadTuTuongSettings();
        break;
    }
  } catch (err) {
    showToast(`Lỗi tải dữ liệu: ${err.message}`, "error");
  }
  hideLoading();
}

function renderContent(html) {
  // Keep loading div, replace the rest
  const loadingEl = document.getElementById("loading");
  contentArea.innerHTML = "";
  contentArea.appendChild(loadingEl);
  contentArea.insertAdjacentHTML("beforeend", html);
}

// ============================================================================
// Site Settings
// ============================================================================

async function loadSiteSettings() {
  let data;
  try {
    const resp = await fetch(`${API}/config`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    data = await resp.json();
  } catch (err) {
    renderContent(`
      <div class="card" style="border-left: 4px solid #e74c3c;">
        <div class="card-body" style="padding: 2rem;">
          <h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> Không thể kết nối Admin Server</h3>
          <p>Admin server chưa chạy. Hãy mở terminal trong thư mục PFLIO và chạy lệnh:</p>
          <pre style="background:#1a1a2e;padding:1rem;border-radius:8px;color:#00ff88;">node admin-server.js</pre>
          <p>Sau đó tải lại trang này.</p>
          <p style="color:#999;font-size:0.85em;">Lỗi: ${err.message}</p>
        </div>
      </div>
    `);
    return;
  }

  

  renderContent(`
    <div class="section-intro">
      <p>Cấu hình chung cho toàn bộ website portfolio. Thay đổi sẽ được áp dụng sau khi Jekyll rebuild.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-id-badge"></i> Thông tin cá nhân</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Tiêu đề (Tiếng Việt)</label>
              <input type="text" id="cfg-title" value="${escHtml(data.title || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Tiêu đề (Tiếng Anh)</label>
              <input type="text" id="cfg-title_en" value="${escHtml(data.title_en || '')}" />
            </div>
          </div>
          <div class="form-group">
            <label>Họ (First Name)</label>
            <input type="text" id="cfg-first_name" value="${escHtml(data.first_name)}" />
            <label style="margin-top: 5px; font-weight: normal; cursor: pointer;">
              <input type="checkbox" id="cfg-first_name_bold" ${data.first_name_bold !== false ? 'checked' : ''} /> In đậm (Bold)
            </label>
          </div>
          <div class="form-group">
            <label>Tên đệm (Middle Name)</label>
            <input type="text" id="cfg-middle_name" value="${escHtml(data.middle_name)}" />
            <label style="margin-top: 5px; font-weight: normal; cursor: pointer;">
              <input type="checkbox" id="cfg-middle_name_bold" ${data.middle_name_bold ? 'checked' : ''} /> In đậm (Bold)
            </label>
          </div>
          <div class="form-group">
            <label>Tên (Last Name)</label>
            <input type="text" id="cfg-last_name" value="${escHtml(data.last_name)}" />
            <label style="margin-top: 5px; font-weight: normal; cursor: pointer;">
              <input type="checkbox" id="cfg-last_name_bold" ${data.last_name_bold ? 'checked' : ''} /> In đậm (Bold)
            </label>
          </div>
          <!-- Removed duplicate title field -->
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-image"></i> Header Logo</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Logo File</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-header_logo_preview" src="${data.header_logo ? `/assets/img/${data.header_logo}` : ''}" style="max-height: 40px; display: ${data.header_logo ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-header_logo" value="${escHtml(data.header_logo || "")}" style="flex: 1;" oninput="document.getElementById('cfg-header_logo_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-header_logo_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-header_logo_upload" accept="image/*" style="display: none;" onchange="uploadHeaderLogo(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-header_logo_upload').click()"><i class="fas fa-upload"></i> Tải logo lên</button>
            </div>
            <span class="form-help">VD: logo.png (file tải lên sẽ lưu trong assets/img)</span>
          </div>
          <div class="form-group">
            <label>Kích thước Logo (Width x Height)</label>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="cfg-header_logo_size" value="${escHtml(data.header_logo_size || "40px")}" placeholder="Width" />
              <input type="text" id="cfg-header_logo_height" value="${escHtml(data.header_logo_height || "auto")}" placeholder="Height" />
            </div>
          </div>
          <div class="form-group">
            <label>Màu nền (Background Color)</label>
            <input type="color" id="cfg-header_logo_bg" value="${escHtml(data.header_logo_bg || "#ffffff")}" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-ruler-combined"></i> Kích thước & Thu phóng Header khi chưa lăn chuột (Floating Header)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Tỉ lệ thu phóng Header (Scale)</label>
            <div style="display: flex; gap: 15px; align-items: center;">
              <input type="range" id="cfg-navbar_scale" min="70" max="115" value="${data.navbar_scale || 88}" oninput="document.getElementById('navbar_scale_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_scale_val" style="min-width: 45px; font-weight: bold; color: var(--primary);">${data.navbar_scale || 88}%</span>
            </div>
            <span class="form-help">Thu nhỏ Header (khuyên dùng 80% - 90% để thanh menu thanh thoát, gọn gàng).</span>
          </div>

          <div class="form-group">
            <label>Chiều ngang Header khi chưa lăn chuột (Header Width / Max-Width)</label>
            <div style="display: flex; gap: 15px; align-items: center;">
              <input type="range" id="cfg-header_max_width_slider" min="750" max="1600" step="10" value="${parseInt(data.header_max_width || 1080)}" oninput="document.getElementById('cfg-header_max_width').value = this.value + 'px'; document.getElementById('cfg-header_width').value = 'min(92vw, ' + this.value + 'px)'; document.getElementById('header_max_width_val').innerText = this.value + 'px'" style="flex: 1;" />
              <span id="header_max_width_val" style="min-width: 55px; font-weight: bold; color: var(--primary);">${parseInt(data.header_max_width || 1080)}px</span>
            </div>
            <input type="hidden" id="cfg-header_max_width" value="${escHtml(data.header_max_width || "1080px")}" />
            <input type="hidden" id="cfg-header_width" value="${escHtml(data.header_width || "min(92vw, 1080px)")}" />
            <span class="form-help">Độ rộng của thanh Header nổi khi ở đầu trang (chưa lăn chuột). Mặc định 1080px - 1180px. Kéo tăng để Header dài rộng hơn sang 2 bên màn hình hoặc kéo giảm để thu gọn lại.</span>
          </div>

          <div class="form-group">
            <label>Độ đệm trên/dưới Menu (Vertical Padding)</label>
            <div style="display: flex; gap: 15px; align-items: center;">
              <input type="range" id="cfg-navbar_padding_y_slider" min="1" max="16" value="${parseInt(data.navbar_padding_y || 3)}" oninput="document.getElementById('cfg-navbar_padding_y').value = this.value + 'px'; document.getElementById('navbar_padding_y_val').innerText = this.value + 'px'" style="flex: 1;" />
              <span id="navbar_padding_y_val" style="min-width: 45px; font-weight: bold; color: var(--primary);">${data.navbar_padding_y || '3px'}</span>
            </div>
            <input type="hidden" id="cfg-navbar_padding_y" value="${escHtml(data.navbar_padding_y || "3px")}" />
            <span class="form-help">Khoảng cách mép trên/dưới đến nội dung menu (Mặc định 3px).</span>
          </div>

          <div class="form-group">
            <label>Cỡ chữ Menu (Menu Font Size)</label>
            <div style="display: flex; gap: 15px; align-items: center;">
              <input type="range" id="cfg-navbar_font_size_slider" min="11" max="18" step="0.5" value="${parseFloat(data.navbar_font_size || 13.5)}" oninput="document.getElementById('cfg-navbar_font_size').value = this.value + 'px'; document.getElementById('navbar_font_size_val').innerText = this.value + 'px'" style="flex: 1;" />
              <span id="navbar_font_size_val" style="min-width: 45px; font-weight: bold; color: var(--primary);">${data.navbar_font_size || '13.5px'}</span>
            </div>
            <input type="hidden" id="cfg-navbar_font_size" value="${escHtml(data.navbar_font_size || "13.5px")}" />
          </div>

          <div class="form-group">
            <label>Cỡ chữ Tên / Thương hiệu (Brand Font Size)</label>
            <div style="display: flex; gap: 15px; align-items: center;">
              <input type="range" id="cfg-navbar_brand_size_slider" min="13" max="22" step="0.5" value="${parseFloat(data.navbar_brand_size || 15)}" oninput="document.getElementById('cfg-navbar_brand_size').value = this.value + 'px'; document.getElementById('navbar_brand_size_val').innerText = this.value + 'px'" style="flex: 1;" />
              <span id="navbar_brand_size_val" style="min-width: 45px; font-weight: bold; color: var(--primary);">${data.navbar_brand_size || '15px'}</span>
            </div>
            <input type="hidden" id="cfg-navbar_brand_size" value="${escHtml(data.navbar_brand_size || "15px")}" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-paint-roller"></i> Giao diện toàn trang (Global Theme)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Màu nền trang web (Body Background)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-global_bg" value="${escHtml(data.global_bg_color || "#ffffff")}" oninput="document.getElementById('cfg-global_bg_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-global_bg_color" value="${escHtml(data.global_bg_color || "#ffffff")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-global_bg').value = val;" style="flex: 1;" placeholder="#ffffff" />
            </div>
          </div>
          <div class="form-group">
            <label>Màu chữ khi di chuột vào link (Hover Text Color)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-global_hover" value="${escHtml(data.global_hover_color || "#b509ac")}" oninput="document.getElementById('cfg-global_hover_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-global_hover_color" value="${escHtml(data.global_hover_color || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-global_hover').value = val;" style="flex: 1;" placeholder="#b509ac" />
            </div>
          </div>
          <div class="form-group">
            <label>Màu nền thanh Menu (Header Background)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-navbar_bg" value="${escHtml(data.navbar_bg_color || "#ffffff")}" oninput="document.getElementById('cfg-navbar_bg_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_bg_color" value="${escHtml(data.navbar_bg_color || "#ffffff")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_bg').value = val;" style="flex: 1;" placeholder="#ffffff" />
            </div>
          </div>
          <div class="form-group">
            <label>Màu chữ Menu (Header Text)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-navbar_text" value="${escHtml(data.navbar_text_color || "")}" oninput="document.getElementById('cfg-navbar_text_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_text_color" value="${escHtml(data.navbar_text_color || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_text').value = val;" style="flex: 1;" placeholder="Mặc định" />
            </div>
          </div>
          <div class="form-group">
            <label>Màu chữ đang chọn (Header Active)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-navbar_active" value="${escHtml(data.navbar_active_text_color || "")}" oninput="document.getElementById('cfg-navbar_active_text_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_active_text_color" value="${escHtml(data.navbar_active_text_color || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_active').value = val;" style="flex: 1;" placeholder="Mặc định" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>Ảnh nền thanh Menu (Header Background Image)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-navbar_bg_image_preview" src="${data.navbar_bg_image ? `/assets/img/${data.navbar_bg_image}` : ''}" style="max-height: 40px; display: ${data.navbar_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-navbar_bg_image" value="${escHtml(data.navbar_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-navbar_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-navbar_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-navbar_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadNavbarBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-navbar_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chọn file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeNavbarBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh thanh Menu:</label>
              <input type="range" id="cfg-navbar_bg_image_size" min="10" max="200" value="${data.navbar_bg_image_size || 100}" oninput="document.getElementById('navbar_bg_size_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_size_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_image_size || 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Đổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-navbar_bg_hue" min="0" max="360" value="${data.navbar_bg_hue || 0}" oninput="document.getElementById('navbar_bg_hue_val').innerText = this.value + '°'" style="flex: 1;" />
              <span id="navbar_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_hue || 0}°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ (Opacity):</label>
              <input type="range" id="cfg-navbar_bg_opacity" min="0" max="100" value="${data.navbar_bg_opacity !== undefined ? data.navbar_bg_opacity : 100}" oninput="document.getElementById('navbar_bg_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_opacity !== undefined ? data.navbar_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-navbar_bg_overlay" value="${escHtml(data.navbar_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-navbar_bg_overlay').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_bg_overlay" value="${escHtml(data.navbar_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_bg_overlay').value = val;" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ màu đè:</label>
              <input type="range" id="cfg-navbar_bg_overlay_opacity" min="0" max="100" value="${data.navbar_bg_overlay_opacity !== undefined ? data.navbar_bg_overlay_opacity : 50}" oninput="document.getElementById('navbar_bg_overlay_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_overlay_opacity !== undefined ? data.navbar_bg_overlay_opacity : 50}%</span>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Ảnh nền trung tâm (Background Image)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-global_bg_image_preview" src="${data.global_bg_image ? `/assets/img/${data.global_bg_image}` : ''}" style="max-height: 40px; display: ${data.global_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-global_bg_image" value="${escHtml(data.global_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-global_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-global_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-global_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadGlobalBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-global_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chọn file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeGlobalBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh nền:</label>
              <input type="range" id="cfg-global_bg_image_size" min="10" max="200" value="${data.global_bg_image_size || 100}" oninput="document.getElementById('global_bg_size_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_size_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_image_size || 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Đổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-global_bg_hue" min="0" max="360" value="${data.global_bg_hue || 0}" oninput="document.getElementById('global_bg_hue_val').innerText = this.value + '°'" style="flex: 1;" />
              <span id="global_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_hue || 0}°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ (Opacity):</label>
              <input type="range" id="cfg-global_bg_opacity" min="0" max="100" value="${data.global_bg_opacity !== undefined ? data.global_bg_opacity : 100}" oninput="document.getElementById('global_bg_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_opacity !== undefined ? data.global_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-global_bg_overlay" value="${escHtml(data.global_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-global_bg_overlay').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-global_bg_overlay" value="${escHtml(data.global_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-global_bg_overlay').value = val;" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ màu đè:</label>
              <input type="range" id="cfg-global_bg_overlay_opacity" min="0" max="100" value="${data.global_bg_overlay_opacity !== undefined ? data.global_bg_overlay_opacity : 50}" oninput="document.getElementById('global_bg_overlay_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_overlay_opacity !== undefined ? data.global_bg_overlay_opacity : 50}%</span>
            </div>
            <span class="form-help">Hình ảnh sẽ nằm ở giữa tâm màn hình. File tải lên lưu trong assets/img.</span>
          </div>
          
          <div class="form-group full-width">
            <label>Ảnh nền toàn trang (Wallpaper / Body Background)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-body_bg_image_preview" src="${data.body_bg_image ? `/assets/img/${data.body_bg_image}` : ''}" style="max-height: 40px; display: ${data.body_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-body_bg_image" value="${escHtml(data.body_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-body_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-body_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-body_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadBodyBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-body_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chọn file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeBodyBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh toàn trang:</label>
              <input type="range" id="cfg-body_bg_image_size" min="10" max="300" value="${!['cover', 'contain', 'auto', ''].includes(data.body_bg_image_size) ? data.body_bg_image_size : 100}" oninput="document.getElementById('body_bg_size_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_size_val" style="min-width: 40px; font-weight: bold;">${!['cover', 'contain', 'auto', ''].includes(data.body_bg_image_size) ? data.body_bg_image_size : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Đổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-body_bg_hue" min="0" max="360" value="${data.body_bg_hue || 0}" oninput="document.getElementById('body_bg_hue_val').innerText = this.value + '°'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_hue || 0}°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ (Opacity):</label>
              <input type="range" id="cfg-body_bg_opacity" min="0" max="100" value="${data.body_bg_opacity !== undefined ? data.body_bg_opacity : 100}" oninput="document.getElementById('body_bg_opacity_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_opacity !== undefined ? data.body_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-body_bg_overlay" value="${escHtml(data.body_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-body_bg_overlay').value = this.value; updateWallpaperPreview();" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-body_bg_overlay" value="${escHtml(data.body_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-body_bg_overlay').value = val; updateWallpaperPreview();" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Độ mờ màu đè:</label>
              <input type="range" id="cfg-body_bg_overlay_opacity" min="0" max="100" value="${data.body_bg_overlay_opacity !== undefined ? data.body_bg_overlay_opacity : 50}" oninput="document.getElementById('body_bg_overlay_opacity_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_overlay_opacity !== undefined ? data.body_bg_overlay_opacity : 50}%</span>
            </div>
            
            <div style="margin-top: 25px; border-top: 1px solid var(--border); padding-top: 15px;">
              <label><i class="fas fa-eye"></i> Xem trước (Live Preview)</label>
              <div id="wallpaper-live-preview" style="width: 100%; height: 250px; border: 2px dashed var(--border-light); border-radius: 8px; position: relative; overflow: hidden; background-color: ${data.global_bg_color || '#ffffff'}; margin-top: 10px;">
                <div id="wlp-image" style="
                  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                  background-image: url('${data.body_bg_image ? `/assets/img/${data.body_bg_image}` : ''}');
                  background-position: center; background-repeat: no-repeat;
                  background-size: ${!['cover', 'contain', 'auto', ''].includes(data.body_bg_image_size) ? data.body_bg_image_size + '%' : '100%'};
                  filter: hue-rotate(${data.body_bg_hue || 0}deg);
                  opacity: ${data.body_bg_opacity !== undefined ? data.body_bg_opacity / 100 : 1};
                "></div>
                <div id="wlp-overlay" style="
                  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                  background-color: ${data.body_bg_overlay || 'transparent'};
                  opacity: ${data.body_bg_overlay_opacity !== undefined ? data.body_bg_overlay_opacity / 100 : 0.5};
                "></div>
              </div>
              <span class="form-help">Khung này hiển thị giả lập hình nền của trang web.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-globe"></i> Website</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Mô tả (Description)</label>
            <div id="editor-desc"></div>
          </div>
          <div class="form-group">
            <label>Keywords</label>
            <input type="text" id="cfg-keywords" value="${escHtml(data.keywords)}" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-window-maximize" style="color: var(--primary);"></i> Icon Tab trình duyệt (Favicon)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-icon_preview" src="${data.icon ? (data.icon.startsWith('http') || data.icon.startsWith('/') ? data.icon : `/assets/img/${data.icon}`) : ''}" style="width: 36px; height: 36px; object-fit: contain; display: ${data.icon ? 'block' : 'none'}; border: 1px solid var(--border-color); border-radius: 6px; padding: 2px; background: var(--bg-primary);" />
              <input type="text" id="cfg-icon" value="${escHtml(data.icon || "")}" placeholder="VD: favicon.ico hoặc co-dang.jpg" style="flex: 1;" oninput="const val = this.value.trim(); const p = document.getElementById('cfg-icon_preview'); const tabIcon = document.getElementById('cfg-tab_preview_icon'); if (val) { const s = val.startsWith('http') || val.startsWith('/') ? val : '/assets/img/' + val; p.src = s; p.style.display = 'block'; if (tabIcon) tabIcon.src = s; } else { p.style.display = 'none'; if (tabIcon) tabIcon.src = '/favicon.ico'; }" />
              <input type="file" id="cfg-icon_upload" accept="image/*,.ico,.svg" style="display: none;" onchange="uploadFavicon(this)" />
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('cfg-icon_upload').click()"><i class="fas fa-upload"></i> Tải icon mới</button>
            </div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span class="form-help" style="margin: 0;">Mô phỏng hiển thị trên tab trình duyệt:</span>
              <div class="mock-browser-tab" style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; background: #292d3e; color: #f8f8f2; border-radius: 6px 6px 0 0; font-size: 12px; font-family: system-ui, sans-serif; border: 1px solid rgba(255,255,255,0.1); border-bottom: none;">
                <img id="cfg-tab_preview_icon" src="${data.icon ? (data.icon.startsWith('http') || data.icon.startsWith('/') ? data.icon : `/assets/img/${data.icon}`) : '/favicon.ico'}" style="width: 16px; height: 16px; object-fit: contain; border-radius: 2px;" />
                <span id="cfg-tab_preview_title" style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px;">${escHtml([data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ') || 'Portfolio')}</span>
                <span style="opacity: 0.5; margin-left: 4px; font-size: 10px;">✕</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>URL</label>
            <input type="text" id="cfg-url" value="${escHtml(data.url)}" />
          </div>
          <div class="form-group">
            <label>Base URL</label>
            <input type="text" id="cfg-baseurl" value="${escHtml(data.baseurl)}" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-blog"></i> Blog</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Tên Blog (Tiếng Việt)</label>
              <input type="text" id="cfg-blog_name" value="${escHtml(data.blog_name || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Tên Blog (Tiếng Anh)</label>
              <input type="text" id="cfg-blog_name_en" value="${escHtml(data.blog_name_en || '')}" />
            </div>
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Mô tả Blog (Tiếng Việt)</label>
              <input type="text" id="cfg-blog_description" value="${escHtml(data.blog_description || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Mô tả Blog (Tiếng Anh)</label>
              <input type="text" id="cfg-blog_description_en" value="${escHtml(data.blog_description_en || '')}" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-shoe-prints"></i> Footer</h2>
      </div>
      <div class="card-body">
        <div class="form-group full-width">
          <label>Footer Text</label>
          <div id="editor-footer"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-footer">
        <button class="btn btn-primary" onclick="saveSiteSettings()">
          <i class="fas fa-save"></i> Lưu thay đổi
        </button>
      </div>
    </div>
  `);
  
  window._descContentVi = data.description || '';
    window._descContentEn = data.description_en || '';
    window._footerContentVi = data.footer_text || '';
    window._footerContentEn = data.footer_text_en || '';
}

async function saveSiteSettings() {
    const payload = {
      title: document.getElementById("cfg-title").value,
      title_en: document.getElementById("cfg-title_en").value,
      first_name: document.getElementById("cfg-first_name").value,
      first_name_bold: document.getElementById("cfg-first_name_bold").checked,
      middle_name: document.getElementById("cfg-middle_name").value,
      middle_name_bold: document.getElementById("cfg-middle_name_bold").checked,
      last_name: document.getElementById("cfg-last_name").value,
      last_name_bold: document.getElementById("cfg-last_name_bold").checked,
      keywords: document.getElementById("cfg-keywords").value,
      lang: document.getElementById("cfg-lang") ? document.getElementById("cfg-lang").value : 'vi',
      url: document.getElementById("cfg-url").value,
      baseurl: document.getElementById("cfg-baseurl").value,
      blog_name: document.getElementById("cfg-blog_name").value,
      blog_name_en: document.getElementById("cfg-blog_name_en").value,
      blog_description: document.getElementById("cfg-blog_description").value,
      blog_description_en: document.getElementById("cfg-blog_description_en").value,
      icon: document.getElementById("cfg-icon").value,
      
      description: window._descContentVi,
      description_en: window._descContentEn,
      footer_text: window._footerContentVi,
      footer_text_en: window._footerContentEn,
      
      header_logo: document.getElementById("cfg-header_logo").value,
      header_logo_size: document.getElementById("cfg-header_logo_size").value,
      header_logo_height: document.getElementById("cfg-header_logo_height").value,
      header_logo_bg: document.getElementById("cfg-header_logo_bg").value,
      navbar_scale: parseInt(document.getElementById("cfg-navbar_scale") ? document.getElementById("cfg-navbar_scale").value : 88),
      header_max_width: document.getElementById("cfg-header_max_width") ? document.getElementById("cfg-header_max_width").value : "1080px",
      header_width: document.getElementById("cfg-header_width") ? document.getElementById("cfg-header_width").value : "min(92vw, 1080px)",
      navbar_padding_y: document.getElementById("cfg-navbar_padding_y") ? document.getElementById("cfg-navbar_padding_y").value : "3px",
      navbar_font_size: document.getElementById("cfg-navbar_font_size") ? document.getElementById("cfg-navbar_font_size").value : "13.5px",
      navbar_brand_size: document.getElementById("cfg-navbar_brand_size") ? document.getElementById("cfg-navbar_brand_size").value : "15px",
  
      global_bg_color: document.getElementById("cfg-global_bg_color").value,
      global_bg_image: document.getElementById("cfg-global_bg_image").value,
      global_bg_image_size: document.getElementById("cfg-global_bg_image_size").value,
      global_bg_hue: document.getElementById("cfg-global_bg_hue").value,
      global_bg_opacity: document.getElementById("cfg-global_bg_opacity").value,
      global_bg_overlay: document.getElementById("cfg-global_bg_overlay").value,
      global_bg_overlay_opacity: document.getElementById("cfg-global_bg_overlay_opacity").value,
      global_hover_color: document.getElementById("cfg-global_hover_color").value,
  
      body_bg_image: document.getElementById("cfg-body_bg_image").value,
      body_bg_image_size: document.getElementById("cfg-body_bg_image_size").value,
      body_bg_hue: document.getElementById("cfg-body_bg_hue").value,
      body_bg_opacity: document.getElementById("cfg-body_bg_opacity").value,
      body_bg_overlay: document.getElementById("cfg-body_bg_overlay").value,
      body_bg_overlay_opacity: document.getElementById("cfg-body_bg_overlay_opacity").value,
  
      navbar_bg_color: document.getElementById("cfg-navbar_bg_color").value,
      navbar_bg_image: document.getElementById("cfg-navbar_bg_image").value,
      navbar_bg_image_size: document.getElementById("cfg-navbar_bg_image_size").value,
      navbar_bg_hue: document.getElementById("cfg-navbar_bg_hue").value,
      navbar_bg_opacity: document.getElementById("cfg-navbar_bg_opacity").value,
      navbar_bg_overlay: document.getElementById("cfg-navbar_bg_overlay").value,
      navbar_bg_overlay_opacity: document.getElementById("cfg-navbar_bg_overlay_opacity").value,
      navbar_text_color: document.getElementById("cfg-navbar_text_color").value,
      navbar_active_text_color: document.getElementById("cfg-navbar_active_text_color").value,
    };
    
    try {
    await fetch(`${API}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showToast("✅ Đã lưu cấu hình! Giao diện trang web và icon tab sẽ được cập nhật.", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function uploadFavicon(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData }).then(r => r.json());
    if (res.success) {
      const input = document.getElementById("cfg-icon");
      const preview = document.getElementById("cfg-icon_preview");
      const tabIcon = document.getElementById("cfg-tab_preview_icon");
      if (input) {
        input.value = res.filename;
      }
      const newSrc = `/assets/img/${res.filename}?v=${Date.now()}`;
      if (preview) {
        preview.src = newSrc;
        preview.style.display = "block";
      }
      if (tabIcon) {
        tabIcon.src = newSrc;
      }
      showToast("Tải icon tab (favicon) lên thành công! Hãy bấm 'Lưu thay đổi' để cập nhật.", "success");
    } else {
      showToast("Lỗi khi tải icon: " + (res.error || "Không rõ"), "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối khi tải icon: " + err.message, "error");
  } finally {
    hideLoading();
    fileInput.value = "";
  }
}

// ============================================================================
// Pages Settings
// ============================================================================

async function loadPagesSettings() {
  const pages = ["cv", "publications", "teaching", "repositories"];
  const pagesData = await Promise.all(pages.map(p => fetch(`${API}/pages/${p}`).then(r => r.json().catch(() => ({})))));
  
  let html = `
    <div class="section-intro">
      <p>Chỉnh sửa Tiêu đề (Title) và Mô tả (Description) cho các trang trên thanh menu.</p>
    </div>
  `;
  
  pages.forEach((p, idx) => {
    const data = pagesData[idx];
    const title = p === 'cv' ? 'Sơ yếu lý lịch (CV)' : p === 'publications' ? 'Ấn phẩm (Publications)' : p === 'teaching' ? 'Học vấn (Teaching)' : 'Lưu trữ (Repositories)';
    html += `
      <div class="card mb-4">
        <div class="card-header">
          <h2><i class="fas fa-file-alt"></i> Trang: ${title}</h2>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group full-width" style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Tiêu đề trang (Tiếng Việt)</label>
                <input type="text" id="page-title-${p}" value="${escHtml(data.title || '')}" />
              </div>
              <div style="flex: 1;">
                <label>Tiêu đề trang (Tiếng Anh)</label>
                <input type="text" id="page-title_en-${p}" value="${escHtml(data.title_en || '')}" />
              </div>
            </div>
            <div class="form-group full-width" style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Mô tả (Tiếng Việt)</label>
                <textarea id="page-desc-${p}" rows="2" class="form-control" style="width: 100%; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); border-radius: var(--radius-sm); padding: 10px;">${escHtml(data.description || '')}</textarea>
              </div>
              <div style="flex: 1;">
                <label>Mô tả (Tiếng Anh)</label>
                <textarea id="page-desc_en-${p}" rows="2" class="form-control" style="width: 100%; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); border-radius: var(--radius-sm); padding: 10px;">${escHtml(data.description_en || '')}</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
    <div class="card">
      <div class="card-footer">
        <button class="btn btn-primary" onclick="savePagesSettings()">
          <i class="fas fa-save"></i> Lưu thay đổi
        </button>
      </div>
    </div>
  `;
  
  renderContent(html);
}

async function savePagesSettings() {
  const pages = ["cv", "publications", "teaching", "repositories"];
  try {
    for (const p of pages) {
      const title = document.getElementById(`page-title-${p}`).value;
      const title_en = document.getElementById(`page-title_en-${p}`).value;
      const desc = document.getElementById(`page-desc-${p}`).value;
      const desc_en = document.getElementById(`page-desc_en-${p}`).value;
      
      const payload = {
        title,
        title_en,
        description: desc,
        description_en: desc_en
      };
      
      await fetch(`${API}/pages/${p}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    showToast("Đã lưu cấu hình trang thành công!");
  } catch (err) {
    showToast(`Lỗi khi lưu: ${err.message}`, "error");
  }
}

// ============================================================================
// Section Titles
// ============================================================================

async function loadSectionTitles() {
  const data = await fetch(`${API}/config`).then((r) => r.json());
  const st = data.section_titles || {};
  const st_en = data.section_titles_en || {};

  renderContent(`
    <div class="section-intro">
      <p>Cấu hình tên các phân mục (Section headings) xuất hiện trong các trang.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-palette"></i> Màu sắc tiêu đề</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Màu chữ tiêu đề (để trống nếu dùng màu mặc định)</label>
            <input type="color" id="cfg-section_titles_color" value="${escHtml(data.section_titles_color || '')}" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-heading"></i> Sơ yếu lý lịch (CV)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Thông tin chung (VI)</label>
              <input type="text" id="cfg-st-cv-general" value="${escHtml(st.cv_general || 'Thông tin chung')}" />
            </div>
            <div style="flex: 1;">
              <label>Thông tin chung (EN)</label>
              <input type="text" id="cfg-st_en-cv-general" value="${escHtml(st_en.cv_general || 'General Information')}" />
            </div>
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Học vấn (VI)</label>
              <input type="text" id="cfg-st-cv-education" value="${escHtml(st.cv_education || 'Học vấn')}" />
            </div>
            <div style="flex: 1;">
              <label>Học vấn (EN)</label>
              <input type="text" id="cfg-st_en-cv-education" value="${escHtml(st_en.cv_education || 'Education')}" />
            </div>
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Kinh nghiệm (VI)</label>
              <input type="text" id="cfg-st-cv-experience" value="${escHtml(st.cv_experience || 'Kinh nghiệm')}" />
            </div>
            <div style="flex: 1;">
              <label>Kinh nghiệm (EN)</label>
              <input type="text" id="cfg-st_en-cv-experience" value="${escHtml(st_en.cv_experience || 'Experience')}" />
            </div>
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Giải thưởng và Thành tựu (VI)</label>
              <input type="text" id="cfg-st-cv-honors" value="${escHtml(st.cv_honors || 'Giải thưởng và Thành tựu')}" />
            </div>
            <div style="flex: 1;">
              <label>Giải thưởng và Thành tựu (EN)</label>
              <input type="text" id="cfg-st_en-cv-honors" value="${escHtml(st_en.cv_honors || 'Honors and Awards')}" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-heading"></i> Về tôi (About)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Tin tức (VI)</label>
              <input type="text" id="cfg-st-about-news" value="${escHtml(st.about_news || 'Tin tức')}" />
            </div>
            <div style="flex: 1;">
              <label>Tin tức (EN)</label>
              <input type="text" id="cfg-st_en-about-news" value="${escHtml(st_en.about_news || 'News')}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}

async function saveSectionTitles() {
  const payload = {
    section_titles_color: document.getElementById('cfg-section_titles_color').value,
    section_titles: {
      cv_general: document.getElementById('cfg-st-cv-general').value,
      cv_education: document.getElementById('cfg-st-cv-education').value,
      cv_experience: document.getElementById('cfg-st-cv-experience').value,
      cv_honors: document.getElementById('cfg-st-cv-honors').value,
      about_news: document.getElementById('cfg-st-about-news').value,
    },
    section_titles_en: {
      cv_general: document.getElementById('cfg-st_en-cv-general').value,
      cv_education: document.getElementById('cfg-st_en-cv-education').value,
      cv_experience: document.getElementById('cfg-st_en-cv-experience').value,
      cv_honors: document.getElementById('cfg-st_en-cv-honors').value,
      about_news: document.getElementById('cfg-st_en-about-news').value,
    }
  };

  try {
    await fetch(`${API}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showToast("Đã lưu Tiêu đề phân mục thành công! Chờ Jekyll rebuild...", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// About Page
// ============================================================================

async function loadAbout() {
  const data = await fetch(`${API}/about`).then((r) => r.json());
  const fm = data.frontMatter;
  
  if (fm.profile?.more_info_rows) {
    moreInfoRowsData = fm.profile.more_info_rows;
  } else {
    moreInfoRowsData = [{ text: fm.profile?.more_info || "", logo: "", logo_width: "" }];
  }

  // Store contents globally so modal can edit them
  window._aboutContentVi = data.body;
  window._aboutContentEn = fm.content_en || "";

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa trang giới thiệu (About) — trang chủ của portfolio.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-heading"></i> Front Matter</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Subtitle (Tiếng Việt)</label>
              <input type="text" id="about-subtitle" value="${escHtml(fm.subtitle || "")}" />
            </div>
            <div style="flex: 1;">
              <label>Subtitle (Tiếng Anh)</label>
              <input type="text" id="about-subtitle_en" value="${escHtml(fm.subtitle_en || "")}" />
            </div>
          </div>
          <div class="form-group">
            <label>Profile Image</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="about-image-preview" src="${fm.profile?.image ? '/assets/img/' + fm.profile.image : ''}" style="max-height: 40px; display: ${fm.profile?.image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="about-image" value="${escHtml(fm.profile?.image || "")}" style="flex: 1;" oninput="document.getElementById('about-image-preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('about-image-preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="about-image-upload" accept="image/*" style="display: none;" onchange="uploadProfileImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('about-image-upload').click()"><i class="fas fa-upload"></i> Tải ảnh lên</button>
            </div>
            <span class="form-help">File name trong assets/img/</span>
          </div>
          <div class="form-group">
            <label>Image Align</label>
            <select id="about-align">
              <option value="right" ${fm.profile?.align === 'right' ? 'selected' : ''}>Right</option>
              <option value="left" ${fm.profile?.align === 'left' ? 'selected' : ''}>Left</option>
            </select>
          </div>
          <div class="form-group">
            <label>Image Circular</label>
            <select id="about-circular">
              <option value="false" ${!fm.profile?.image_circular ? 'selected' : ''}>No</option>
              <option value="true" ${fm.profile?.image_circular ? 'selected' : ''}>Yes</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label>More Info (Thông tin cá nhân)</label>
            <div id="more-info-rows-container"></div>
            <button type="button" class="btn btn-secondary" onclick="addMoreInfoRow()" style="margin-top: 10px;">+ Thêm dòng</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-edit"></i> Nội dung trang chủ (Soạn thảo văn bản như Word)</h2>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size: 0.88rem; margin-bottom: 18px;">
          Bạn có thể định dạng chữ <strong>In đậm (B)</strong>, <em>In nghiêng (I)</em>, gạch đầu dòng, căn chỉnh, chèn link... trực tiếp bằng các nút trên thanh công cụ giống như trong Word mà không cần nhớ các ký tự Markdown.
        </p>
        <div class="form-grid">
          <div class="form-group full-width" style="margin-bottom: 24px;">
            <label style="font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--accent-light);">
              <i class="fas fa-file-alt"></i> Nội dung (Tiếng Việt)
            </label>
            <div id="about-editor-vi-container" style="background: var(--bg-tertiary); border-radius: 8px; overflow: hidden; border: 1px solid var(--border);"></div>
          </div>
          <div class="form-group full-width">
            <label style="font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--accent-light);">
              <i class="fas fa-globe"></i> Nội dung (Tiếng Anh)
            </label>
            <div id="about-editor-en-container" style="background: var(--bg-tertiary); border-radius: 8px; overflow: hidden; border: 1px solid var(--border);"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-footer">
        <button class="btn btn-primary" onclick="saveAbout()">
          <i class="fas fa-save"></i> Lưu thay đổi
        </button>
      </div>
    </div>
  `);

  renderMoreInfoRows();

  // Khởi tạo 2 bộ soạn thảo WYSIWYG trực tiếp (như Word)
  setTimeout(() => {
    initEditor('about-editor-vi-container', data.body || '', '420px');
    initEditor('about-editor-en-container', fm.content_en || '', '420px');
  }, 100);
}

async function saveAbout() {
  const original = await fetch(`${API}/about`).then((r) => r.json());
  const fm = original.frontMatter;

  fm.subtitle = document.getElementById("about-subtitle").value;
  fm.subtitle_en = document.getElementById("about-subtitle_en").value;
  
  syncMoreInfoRows();
  let moreInfoHtml = "";
  moreInfoRowsData.forEach(row => {
    moreInfoHtml += `<p>${row.text}`;
    if (row.logo) {
      moreInfoHtml += ` <img src="/assets/img/${row.logo}" style="width: ${row.logo_width || '30px'}; vertical-align: middle; margin-left: 5px;">`;
    }
    moreInfoHtml += `</p>\n`;
  });

  fm.profile = {
    align: document.getElementById("about-align").value,
    image: document.getElementById("about-image").value,
    image_circular: document.getElementById("about-circular").value === "true",
    more_info: moreInfoHtml,
    more_info_rows: moreInfoRowsData
  };
  
  // Lấy nội dung từ WYSIWYG editor nếu có, nếu không lấy từ textarea/biến
  const finalBody = editors['about-editor-vi-container'] 
    ? editors['about-editor-vi-container'].getMarkdown() 
    : (document.getElementById("about-content-vi") ? document.getElementById("about-content-vi").value : (window._aboutContentVi || ""));

  fm.content_en = editors['about-editor-en-container'] 
    ? editors['about-editor-en-container'].getMarkdown() 
    : (document.getElementById("about-content-en") ? document.getElementById("about-content-en").value : (window._aboutContentEn || ""));

  try {
    await fetch(`${API}/about`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body: finalBody }),
    });
    showToast("Trang About đã được lưu thành công!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// CV Icon Helpers (FontAwesome & Image Uploads)
// ============================================================================

function renderIconPreviewHtml(val, defaultIcon = "fa-solid fa-circle-info", size = 18) {
  const icon = (val || defaultIcon || "").trim();
  const sizeNum = size ? parseInt(size, 10) : 18;
  const sizePx = `${sizeNum}px`;
  if (!icon) return `<i class="fas fa-question text-muted" style="font-size: 14px; opacity: 0.5;"></i>`;
  const isImage = /\.(svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/i.test(icon) || icon.startsWith("/") || icon.startsWith("http");
  if (isImage) {
    const src = icon.startsWith("http") || icon.startsWith("/") ? icon : `/assets/img/${icon}`;
    return `<img src="${src}" alt="icon" style="width: ${sizePx}; height: ${sizePx}; max-width: 44px; max-height: 44px; object-fit: contain; vertical-align: middle;" />`;
  }
  let faClass = icon;
  if (!faClass.includes("fa-") && !faClass.includes("fab ") && !faClass.includes("fas ") && !faClass.includes("far ")) {
    faClass = `fa-solid fa-${faClass}`;
  } else if (!faClass.startsWith("fa-") && !faClass.startsWith("fas ") && !faClass.startsWith("far ") && !faClass.startsWith("fab ") && !faClass.startsWith("fa-solid") && !faClass.startsWith("fa-regular") && !faClass.startsWith("fa-brands")) {
    faClass = `fa-solid ${faClass}`;
  }
  return `<i class="${escHtml(faClass)}" style="font-size: ${sizePx};"></i>`;
}

function updateCvIconPreview(inputId, val, defaultIcon) {
  const previewBox = document.getElementById(`${inputId}-preview`);
  const sizeInput = document.getElementById(`${inputId}-size`);
  const curSize = sizeInput ? parseInt(sizeInput.value, 10) : 18;
  if (previewBox) {
    previewBox.innerHTML = renderIconPreviewHtml(val, defaultIcon, curSize);
  }
}

function updateCvIconSize(inputId, sizeVal, defaultIcon) {
  const sizeSpan = document.getElementById(`${inputId}-size-val`);
  if (sizeSpan) sizeSpan.textContent = `${sizeVal}px`;
  const input = document.getElementById(inputId);
  const iconVal = input ? input.value : "";
  const previewBox = document.getElementById(`${inputId}-preview`);
  if (previewBox) {
    previewBox.innerHTML = renderIconPreviewHtml(iconVal, defaultIcon, sizeVal);
  }
}

function setCvIconSizePreset(inputId, sizeVal, defaultIcon) {
  const sizeInput = document.getElementById(`${inputId}-size`);
  if (sizeInput) {
    sizeInput.value = sizeVal;
    updateCvIconSize(inputId, sizeVal, defaultIcon);
  }
}

async function uploadCvIconFile(fileInput, targetInputId, defaultIcon) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData }).then(r => r.json());
    if (res.success) {
      const input = document.getElementById(targetInputId);
      if (input) {
        input.value = res.filename;
        updateCvIconPreview(targetInputId, res.filename, defaultIcon);
      }
      showToast("Tải icon lên thành công!", "success");
    } else {
      showToast("Lỗi tải icon: " + (res.error || "Không rõ"), "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối khi tải icon: " + err.message, "error");
  } finally {
    hideLoading();
    fileInput.value = "";
  }
}

function resetCvIcon(inputId, defaultIcon) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = defaultIcon;
    updateCvIconPreview(inputId, defaultIcon, defaultIcon);
  }
}

function setCvIconPreset(inputId, faClass, defaultIcon) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = faClass;
    updateCvIconPreview(inputId, faClass, defaultIcon);
  }
}

function renderCvIconPicker(inputId, currentValue, defaultIcon, label = "Icon hiển thị", extraClass = "", currentSize = 18, sizeInputClass = "") {
  const curVal = currentValue !== undefined && currentValue !== null ? currentValue : defaultIcon;
  const curSize = currentSize ? parseInt(currentSize, 10) : 18;
  return `
    <div class="cv-icon-picker-box" style="margin-top: 8px; padding: 10px 12px; background: rgba(0,0,0,0.02); border: 1px dashed var(--border); border-radius: var(--radius-sm);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-icons" style="color: var(--accent-light);"></i> ${escHtml(label)}
        </span>
        <span class="text-muted" style="font-size: 0.74rem;">Nhập class FontAwesome hoặc tải file ảnh (SVG/PNG/ICO)</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div id="${inputId}-preview" class="cv-icon-preview-box" title="Xem trước icon" style="min-width: 44px; min-height: 44px; width: 44px; height: 44px; border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); flex-shrink: 0; color: var(--accent-light); overflow: hidden;">
          ${renderIconPreviewHtml(curVal, defaultIcon, curSize)}
        </div>
        <input type="text" id="${inputId}" class="form-control cv-icon-input ${extraClass}" value="${escHtml(curVal || '')}" placeholder="VD: fa-solid fa-user hoặc icon.svg" style="flex: 1; font-size: 0.85rem; height: 36px;" oninput="updateCvIconPreview('${inputId}', this.value, '${defaultIcon}')" />
        <input type="file" id="${inputId}-file" accept="image/*,.ico,.svg" style="display: none;" onchange="uploadCvIconFile(this, '${inputId}', '${defaultIcon}')" />
        <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('${inputId}-file').click()" title="Tải file icon lên từ máy tính (SVG, PNG, ICO, ...)" style="height: 36px; white-space: nowrap; font-size: 0.8rem; padding: 0 12px; display: inline-flex; align-items: center; gap: 5px;">
          <i class="fas fa-upload"></i> Tải file icon
        </button>
        <button type="button" class="btn btn-sm btn-outline btn-icon" onclick="resetCvIcon('${inputId}', '${defaultIcon}')" title="Khôi phục icon mặc định (${defaultIcon})" style="height: 36px; width: 36px; padding: 0; flex-shrink: 0;">
          <i class="fas fa-undo"></i>
        </button>
      </div>

      <!-- Thanh trượt phóng to thu nhỏ icon -->
      <div style="margin-top: 10px; padding: 7px 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); margin: 0; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fas fa-search-plus" style="color: var(--accent-light);"></i> Phóng to / Thu nhỏ kích thước:
          </label>
          <span id="${inputId}-size-val" style="font-weight: 700; font-size: 0.82rem; color: var(--accent-light);">${curSize}px</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">10px</span>
          <input type="range" id="${inputId}-size" class="cv-icon-size-input ${sizeInputClass}" min="10" max="44" step="1" value="${curSize}" oninput="updateCvIconSize('${inputId}', this.value, '${defaultIcon}')" style="flex: 1; cursor: pointer;" />
          <span style="font-size: 0.72rem; color: var(--text-muted);">44px</span>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn btn-sm btn-outline" onclick="setCvIconSizePreset('${inputId}', 14, '${defaultIcon}')" style="padding: 1px 6px; font-size: 0.7rem;" title="14px">Nhỏ</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="setCvIconSizePreset('${inputId}', 18, '${defaultIcon}')" style="padding: 1px 6px; font-size: 0.7rem; font-weight: bold;" title="18px">Chuẩn</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="setCvIconSizePreset('${inputId}', 24, '${defaultIcon}')" style="padding: 1px 6px; font-size: 0.7rem;" title="24px">Vừa</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="setCvIconSizePreset('${inputId}', 30, '${defaultIcon}')" style="padding: 1px 6px; font-size: 0.7rem;" title="30px">Lớn</button>
          </div>
        </div>
      </div>

      <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="font-size: 0.72rem; color: var(--text-muted);">Gợi ý nhanh:</span>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-user', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-user"><i class="fa-solid fa-user"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-id-badge', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-id-badge"><i class="fa-solid fa-id-badge"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-envelope', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-envelope"><i class="fa-solid fa-envelope"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-location-dot', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-location-dot"><i class="fa-solid fa-location-dot"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-language', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-language"><i class="fa-solid fa-language"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-landmark', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-landmark"><i class="fa-solid fa-landmark"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-briefcase', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-briefcase"><i class="fa-solid fa-briefcase"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-building', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-building"><i class="fa-solid fa-building"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-graduation-cap', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-graduation-cap"><i class="fa-solid fa-graduation-cap"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-phone', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-phone"><i class="fa-solid fa-phone"></i></button>
        <button type="button" class="btn btn-sm" onclick="setCvIconPreset('${inputId}', 'fa-solid fa-globe', '${defaultIcon}')" style="padding: 2px 6px; font-size: 0.72rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 3px;" title="fa-globe"><i class="fa-solid fa-globe"></i></button>
      </div>
    </div>
  `;
}

// ============================================================================
// CV
// ============================================================================

async function loadCV() {
  const [data, pageRes] = await Promise.all([
    fetch(`${API}/cv`).then((r) => r.json()).catch(() => ({})),
    fetch(`${API}/pages/cv`).then((r) => r.json()).catch(() => ({}))
  ]);
  const cv = data.cv || data;

  const pageTitleVi = pageRes.title || "Sơ yếu lý lịch";
  const pageTitleEn = pageRes.title_en || "Curriculum Vitae";
  const pageTitleBold = pageRes.page_title_bold !== false;
  const pageTitleColor = pageRes.page_title_color || "#8c0303";

  const generalTitle = pageRes.general_title || "Thông tin chung";
  const generalTitleEn = pageRes.general_title_en || "General Information";
  const generalTitleBold = pageRes.general_title_bold !== false;
  const generalTitleColor = pageRes.general_title_color || "#8c0303";

  const educationTitle = pageRes.education_title || "Học vấn";
  const educationTitleEn = pageRes.education_title_en || "Education";
  const educationTitleBold = pageRes.education_title_bold !== false;
  const educationTitleColor = pageRes.education_title_color || "#8c0303";

  const experienceTitle = pageRes.experience_title || "Kinh nghiệm";
  const experienceTitleEn = pageRes.experience_title_en || "Experience";
  const experienceTitleBold = pageRes.experience_title_bold !== false;
  const experienceTitleColor = pageRes.experience_title_color || "#8c0303";

  const honorsTitle = pageRes.honors_title || "Giải thưởng và Thành tựu";
  const honorsTitleEn = pageRes.honors_title_en || "Honors and Awards";
  const honorsTitleBold = pageRes.honors_title_bold !== false;
  const honorsTitleColor = pageRes.honors_title_color || "#8c0303";

  const skillsTitle = pageRes.skills_title || "Kỹ năng chuyên môn";
  const skillsTitleEn = pageRes.skills_title_en || "Skills";
  const skillsTitleBold = pageRes.skills_title_bold !== false;
  const skillsTitleColor = pageRes.skills_title_color || "#8c0303";

  const sections = cv.sections || {};
  const eduHtml = renderDynamicList(sections.Education || [], "education", renderEducationItem);
  const expHtml = renderDynamicList(sections.Experience || [], "experience", renderExperienceItem);
  const honorsHtml = renderDynamicList(sections['Honors and Awards'] || [], "honors", renderHonorItem);
  const langHtml = renderDynamicList(sections.Languages || [], "languages", renderLanguageItem);
  const skillHtml = renderDynamicList(sections.Skills || [], "skills", renderSkillItem);

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa thông tin CV (Song ngữ) — học vấn, kinh nghiệm làm việc, kỹ năng, v.v.</p>
    </div>

    <!-- 1. Tùy chỉnh Tiêu đề & Màu sắc CV -->
    <div class="card mb-4">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h2><i class="fas fa-palette" style="color:var(--accent-light);margin-right:8px"></i> Tùy chỉnh Tiêu đề & Màu sắc (Titles & Styling)</h2>
        <button class="btn btn-primary btn-sm" onclick="saveCVTitles()">
          <i class="fas fa-save mr-1"></i> Lưu cài đặt tiêu đề
        </button>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size: 0.88rem; margin-bottom: 22px;">
          Tùy chỉnh nội dung chữ, định dạng <strong>in đậm</strong> và <strong>lựa màu sắc</strong> cho từng tiêu đề trên trang CV. Bạn có thể tự chọn màu bất kỳ hoặc <strong>tích chọn nhanh vào các ô màu đẹp có sẵn</strong> bên dưới (có dấu tích ✔️).
        </p>

        ${renderTitleStylingBlock({
          id: 'cv-page-title',
          num: '1',
          icon: 'fas fa-heading',
          label: 'Tiêu đề chính của trang (Page Title)',
          titleVi: pageTitleVi,
          titleEn: pageTitleEn,
          isBold: pageTitleBold,
          color: pageTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'cv-general-title',
          num: '2',
          icon: 'fas fa-user-circle',
          label: 'Tiêu đề mục: Thông tin chung (General Information)',
          titleVi: generalTitle,
          titleEn: generalTitleEn,
          isBold: generalTitleBold,
          color: generalTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'cv-education-title',
          num: '3',
          icon: 'fas fa-graduation-cap',
          label: 'Tiêu đề mục: Học vấn (Education)',
          titleVi: educationTitle,
          titleEn: educationTitleEn,
          isBold: educationTitleBold,
          color: educationTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'cv-experience-title',
          num: '4',
          icon: 'fas fa-briefcase',
          label: 'Tiêu đề mục: Kinh nghiệm (Experience)',
          titleVi: experienceTitle,
          titleEn: experienceTitleEn,
          isBold: experienceTitleBold,
          color: experienceTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'cv-honors-title',
          num: '5',
          icon: 'fas fa-award',
          label: 'Tiêu đề mục: Giải thưởng & Thành tựu (Honors & Awards)',
          titleVi: honorsTitle,
          titleEn: honorsTitleEn,
          isBold: honorsTitleBold,
          color: honorsTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'cv-skills-title',
          num: '6',
          icon: 'fas fa-tools',
          label: 'Tiêu đề mục: Kỹ năng chuyên môn (Skills)',
          titleVi: skillsTitle,
          titleEn: skillsTitleEn,
          isBold: skillsTitleBold,
          color: skillsTitleColor,
        })}

        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="saveCVTitles()">
            <i class="fas fa-save mr-1"></i> Lưu tùy chỉnh tiêu đề CV
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-user-circle"></i> Thông tin chung</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <div style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Họ tên (Tiếng Việt)</label>
                <input type="text" id="cv-name" value="${escHtml(cv.name || '')}" />
              </div>
              <div style="flex: 1;">
                <label>Họ tên (Tiếng Anh)</label>
                <input type="text" id="cv-name_en" value="${escHtml(cv.name_en || '')}" />
              </div>
            </div>
            ${renderCvIconPicker('cv-name_icon', cv.name_icon, 'fa-solid fa-user', 'Icon dòng Họ và tên', '', cv.name_icon_size || 18)}
          </div>

          <div class="form-group full-width">
            <div style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Chức danh (Tiếng Việt)</label>
                <input type="text" id="cv-label" value="${escHtml(cv.label || '')}" />
              </div>
              <div style="flex: 1;">
                <label>Chức danh (Tiếng Anh)</label>
                <input type="text" id="cv-label_en" value="${escHtml(cv.label_en || '')}" />
              </div>
            </div>
            ${renderCvIconPicker('cv-label_icon', cv.label_icon, 'fa-solid fa-id-badge', 'Icon dòng Chức danh', '', cv.label_icon_size || 18)}
          </div>

          <div class="form-group full-width">
            <label>Email <span style="font-weight: normal; color: var(--text-secondary); font-size: 0.8rem;">(mỗi email một dòng)</span></label>
            <textarea id="cv-email" rows="2">${escHtml(cv.email || '')}</textarea>
            ${renderCvIconPicker('cv-email_icon', cv.email_icon, 'fa-solid fa-envelope', 'Icon dòng Email', '', cv.email_icon_size || 18)}
          </div>

          <div class="form-group full-width">
            <div style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Địa điểm (Tiếng Việt)</label>
                <input type="text" id="cv-location" value="${escHtml(cv.location || '')}" />
              </div>
              <div style="flex: 1;">
                <label>Địa điểm (Tiếng Anh)</label>
                <input type="text" id="cv-location_en" value="${escHtml(cv.location_en || '')}" />
              </div>
            </div>
            ${renderCvIconPicker('cv-location_icon', cv.location_icon, 'fa-solid fa-location-dot', 'Icon dòng Địa điểm', '', cv.location_icon_size || 18)}
          </div>

          <div class="form-group full-width">
            <label>Ngôn ngữ (Hiển thị tóm tắt tại Thông tin chung)</label>
            ${renderCvIconPicker('cv-languages_icon', cv.languages_icon, 'fa-solid fa-language', 'Icon dòng Ngôn ngữ', '', cv.languages_icon_size || 18)}
            <p class="text-muted" style="font-size: 0.8rem; margin-top: 4px; margin-bottom: 0;">
              <em>Dòng này hiển thị danh sách các thứ tiếng đã cấu hình ở mục <strong>Ngôn ngữ (Languages)</strong> phía dưới.</em>
            </p>
          </div>

          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Mô tả ngắn (Tiếng Việt)</label>
              <textarea id="cv-summary" rows="3">${escHtml(cv.summary || '')}</textarea>
            </div>
            <div style="flex: 1;">
              <label>Mô tả ngắn (Tiếng Anh)</label>
              <textarea id="cv-summary_en" rows="3">${escHtml(cv.summary_en || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Custom Info Items / Các dòng thông tin tùy chỉnh (Ví dụ: Tổ chức, Đơn vị, ...) -->
        <div class="mt-4 pt-3" style="border-top: 1px dashed var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <label style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0;">
              <i class="fas fa-list-ul mr-1" style="color: var(--accent-light);"></i> Các dòng thông tin bổ sung (Tổ chức, Đơn vị, ...)
            </label>
            <button type="button" class="btn btn-sm btn-secondary" onclick="addCustomInfoItem()" style="font-size: 12px; padding: 5px 12px;">
              <i class="fas fa-plus mr-1"></i> Thêm dòng thông tin
            </button>
          </div>
          <p class="text-muted" style="font-size: 0.82rem; margin-bottom: 12px;">
            Thêm các dòng thông tin hiển thị tại mục <strong>Thông tin chung</strong> trên CV (Ví dụ: <em>Tổ chức: Chi bộ Ấp Gò Cao</em>, <em>Đơn vị công tác</em>, v.v.).
          </p>
          <div id="cv-custom-info-list" class="dynamic-list">
            ${(cv.custom_info || []).map((ci, i) => renderCustomInfoItem(ci, i)).join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap" style="gap: 10px;">
        <h2><i class="fas fa-graduation-cap"></i> Học vấn (Education)</h2>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn btn-sm btn-outline" id="btn-toggle-edu-preview" onclick="toggleEduPreview()" style="font-weight: 500;">
            <i class="fas fa-eye mr-1"></i> <span id="edu-preview-toggle-text">Ẩn xem trước</span>
          </button>
          <button type="button" class="btn btn-sm btn-primary" onclick="addDynamicItem('education-list', renderEducationItem); setTimeout(updateEduSectionPreview, 100);">
            <i class="fas fa-plus mr-1"></i> Thêm mới
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- Live Preview Component cho Học vấn -->
        <div id="edu-live-preview-wrapper" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 10px 14px; background: rgba(130, 119, 23, 0.08); border-left: 4px solid var(--accent, #827717); border-radius: 4px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: var(--accent, #827717); font-size: 0.92rem;"><i class="fas fa-tv mr-1"></i> XEM TRƯỚC SECTION HỌC VẤN (LIVE PREVIEW)</strong>
              <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px;">Khớp 100% giao diện CV</span>
            </div>
            <!-- Chuyển đổi ngôn ngữ xem trước -->
            <div style="display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 0.75rem; color: #64748b; margin-right: 2px;">Ngôn ngữ:</span>
              <button type="button" class="btn btn-sm btn-primary edu-preview-lang-btn" id="edu-preview-lang-vi" onclick="setEduPreviewLang('vi')" style="padding: 2px 10px; font-size: 0.78rem;">Tiếng Việt</button>
              <button type="button" class="btn btn-sm btn-outline edu-preview-lang-btn" id="edu-preview-lang-en" onclick="setEduPreviewLang('en')" style="padding: 2px 10px; font-size: 0.78rem;">English</button>
            </div>
          </div>
          <div id="edu-live-preview-content" style="background: var(--bg-primary, #ffffff); border: 1px solid var(--border, #e2e8f0); border-radius: 8px; padding: 20px 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
            <!-- Rendered CV Education list preview here -->
          </div>
        </div>

        <div id="education-list" class="dynamic-list">${eduHtml}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap" style="gap: 10px;">
        <h2><i class="fas fa-briefcase"></i> Kinh nghiệm (Experience)</h2>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn btn-sm btn-outline" onclick="toggleExpPreview()" style="font-weight: 500;">
            <i class="fas fa-eye mr-1"></i> <span id="exp-preview-toggle-text">Ẩn xem trước</span>
          </button>
          <button type="button" class="btn btn-sm btn-primary" onclick="addDynamicItem('experience-list', renderExperienceItem); setTimeout(updateExpSectionPreview, 100);">
            <i class="fas fa-plus mr-1"></i> Thêm mới
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- Live Preview Component cho Kinh nghiệm -->
        <div id="exp-live-preview-wrapper" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 10px 14px; background: rgba(130, 119, 23, 0.08); border-left: 4px solid var(--accent, #827717); border-radius: 4px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: var(--accent, #827717); font-size: 0.92rem;"><i class="fas fa-tv mr-1"></i> XEM TRƯỚC SECTION KINH NGHIỆM (LIVE PREVIEW)</strong>
              <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px;">Khớp 100% giao diện CV</span>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 0.75rem; color: #64748b; margin-right: 2px;">Ngôn ngữ:</span>
              <button type="button" class="btn btn-sm btn-primary exp-preview-lang-btn" id="exp-preview-lang-vi" onclick="setExpPreviewLang('vi')" style="padding: 2px 10px; font-size: 0.78rem;">Tiếng Việt</button>
              <button type="button" class="btn btn-sm btn-outline exp-preview-lang-btn" id="exp-preview-lang-en" onclick="setExpPreviewLang('en')" style="padding: 2px 10px; font-size: 0.78rem;">English</button>
            </div>
          </div>
          <div id="exp-live-preview-content" style="background: var(--bg-primary, #ffffff); border: 1px solid var(--border, #e2e8f0); border-radius: 8px; padding: 20px 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);"></div>
        </div>

        <div id="experience-list" class="dynamic-list">${expHtml}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="fas fa-award"></i> Giải thưởng & Danh hiệu</h2>
        <button class="btn btn-sm btn-primary" onclick="addDynamicItem('honors-list', renderHonorItem)">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
        <div id="honors-list" class="dynamic-list">${honorsHtml}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="fas fa-language"></i> Ngôn ngữ (Languages)</h2>
        <button class="btn btn-sm btn-primary" onclick="addDynamicItem('languages-list', renderLanguageItem)">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
        <div id="languages-list" class="dynamic-list">${langHtml}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="fas fa-tools"></i> Kỹ năng (Skills)</h2>
        <button class="btn btn-sm btn-primary" onclick="addDynamicItem('skills-list', renderSkillItem)">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
        <div id="skills-list" class="dynamic-list">${skillHtml}</div>
      </div>
    </div>
  `);
  
  // Make lists sortable
  initSortable('cv-custom-info-list');
  initSortable('education-list', updateEduSectionPreview);
  initSortable('experience-list', updateExpSectionPreview);
  initSortable('honors-list');
  initSortable('languages-list');
  initSortable('skills-list');

  // Education live preview & input sync
  const eduListEl = document.getElementById('education-list');
  if (eduListEl) {
    eduListEl.addEventListener('input', () => {
      updateEduSectionPreview();
    });
  }
  setTimeout(updateEduSectionPreview, 150);

  // Experience live preview & input sync
  const expListEl = document.getElementById('experience-list');
  if (expListEl) {
    expListEl.addEventListener('input', () => {
      updateExpSectionPreview();
    });
  }
  setTimeout(updateExpSectionPreview, 150);
}

function renderCustomInfoItem(ci = {}, i = 0) {
  const uid = 'ci-icon-' + Math.random().toString(36).substring(2, 9);
  return `
    <div class="dynamic-item" style="padding: 12px 16px; margin-bottom: 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-light);">
          <i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(ci.name || "Dòng thông tin mới")}
        </span>
        <button type="button" class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()" title="Xóa dòng này">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên mục (Tiếng Việt) <span style="color: var(--error)">*</span></label>
          <input type="text" class="custom-info-name" value="${escHtml(ci.name || '')}" placeholder="Ví dụ: Tổ chức" style="width: 100%;" />
        </div>
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên mục (Tiếng Anh)</label>
          <input type="text" class="custom-info-name_en" value="${escHtml(ci.name_en || '')}" placeholder="Ví dụ: Organization" style="width: 100%;" />
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Giá trị / Nội dung (Tiếng Việt) <span style="color: var(--error)">*</span></label>
          <input type="text" class="custom-info-value" value="${escHtml(ci.value || '')}" placeholder="Ví dụ: Chi bộ Ấp Gò Cao" style="width: 100%;" />
        </div>
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Giá trị / Nội dung (Tiếng Anh)</label>
          <input type="text" class="custom-info-value_en" value="${escHtml(ci.value_en || '')}" placeholder="Ví dụ: Go Cao Hamlet Party Cell" style="width: 100%;" />
        </div>
      </div>
      ${renderCvIconPicker(uid, ci.icon || 'fa-solid fa-landmark', 'fa-solid fa-circle-info', 'Icon dòng thông tin này', 'custom-info-icon', ci.icon_size || 18, 'custom-info-icon-size')}
    </div>
  `;
}

function addCustomInfoItem() {
  const list = document.getElementById("cv-custom-info-list");
  list.insertAdjacentHTML("beforeend", renderCustomInfoItem({}));
}

let currentEduPreviewLang = 'vi';

function setEduPreviewLang(lang) {
  currentEduPreviewLang = lang;
  const btnVi = document.getElementById('edu-preview-lang-vi');
  const btnEn = document.getElementById('edu-preview-lang-en');
  if (btnVi && btnEn) {
    if (lang === 'vi') {
      btnVi.className = 'btn btn-sm btn-primary edu-preview-lang-btn';
      btnEn.className = 'btn btn-sm btn-outline edu-preview-lang-btn';
    } else {
      btnVi.className = 'btn btn-sm btn-outline edu-preview-lang-btn';
      btnEn.className = 'btn btn-sm btn-primary edu-preview-lang-btn';
    }
  }
  updateEduSectionPreview();
}

function toggleEduPreview() {
  const wrapper = document.getElementById('edu-live-preview-wrapper');
  const toggleText = document.getElementById('edu-preview-toggle-text');
  if (!wrapper) return;
  if (wrapper.style.display === 'none') {
    wrapper.style.display = 'block';
    if (toggleText) toggleText.innerText = 'Ẩn xem trước';
    updateEduSectionPreview();
  } else {
    wrapper.style.display = 'none';
    if (toggleText) toggleText.innerText = 'Hiện xem trước';
  }
}

function updateEduSectionPreview() {
  const previewBox = document.getElementById('edu-live-preview-content');
  if (!previewBox) return;
  
  const items = document.querySelectorAll('#education-list .dynamic-item');
  if (items.length === 0) {
    previewBox.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 24px 0; font-style: italic;">
        <i class="fas fa-graduation-cap" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
        Chưa có mục học vấn nào. Nhấn "+ Thêm mới" để tạo mục học vấn.
      </div>
    `;
    return;
  }
  
  const isEn = currentEduPreviewLang === 'en';
  
  const titleVi = document.getElementById('cv-education-title')?.value.trim() || 'Học vấn';
  const titleEn = document.getElementById('cv-education-title-en')?.value.trim() || 'Education';
  const title = isEn ? titleEn : titleVi;
  const titleColor = document.getElementById('cv-education-title-color')?.value || '#827717';
  const titleBold = document.getElementById('cv-education-title-bold')?.checked !== false;

  let html = `
    <div style="font-family: inherit;">
      <h3 style="color: ${titleColor}; font-weight: ${titleBold ? 'bold' : 'normal'}; font-size: 1.35rem; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <span>${escHtml(title)}</span>
        <span style="font-size: 0.72rem; font-weight: normal; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px;">${items.length} mục</span>
      </h3>
      <div style="display: flex; flex-direction: column; gap: 24px;">
  `;

  items.forEach((item, index) => {
    const instVi = item.querySelector('.edu-institution')?.value.trim() || '';
    const instEn = item.querySelector('.edu-institution_en')?.value.trim() || '';
    const inst = isEn ? (instEn || instVi) : (instVi || instEn);

    const locVi = item.querySelector('.edu-location')?.value.trim() || '';
    const locEn = item.querySelector('.edu-location_en')?.value.trim() || '';
    const loc = isEn ? (locEn || locVi) : (locVi || locEn);

    const areaVi = item.querySelector('.edu-area')?.value.trim() || '';
    const areaEn = item.querySelector('.edu-area_en')?.value.trim() || '';
    const area = isEn ? (areaEn || areaVi) : (areaVi || areaEn);

    const studyVi = item.querySelector('.edu-studyType')?.value.trim() || '';
    const studyEn = item.querySelector('.edu-studyType_en')?.value.trim() || '';
    const study = isEn ? (studyEn || studyVi) : (studyVi || studyEn) || (isEn ? 'Bằng cấp / Ngành học' : 'Bằng cấp / Ngành học');

    const startVi = item.querySelector('.edu-start')?.value.trim() || '';
    const startEn = item.querySelector('.edu-start_en')?.value.trim() || '';
    const start = isEn ? (startEn || startVi) : (startVi || startEn);

    const endVi = item.querySelector('.edu-end')?.value.trim() || '';
    const endEn = item.querySelector('.edu-end_en')?.value.trim() || '';
    const end = isEn ? (endEn || endVi) : (endVi || endEn);

    let dateStr = '';
    if (start && end) dateStr = `${start} - ${end}`;
    else if (start || end) dateStr = start || end;
    else dateStr = '2022 - 2026';

    const logo = item.querySelector('.edu-logo')?.value.trim() || '';
    const logoSizeRaw = item.querySelector('.edu-logo-size')?.value.trim() || item.querySelector('.edu-logo-number')?.value.trim() || '100';
    const logoSizePx = /^\d+$/.test(logoSizeRaw) ? `${logoSizeRaw}px` : (logoSizeRaw || '100px');

    const highVi = item.querySelector('.edu-highlights')?.value || '';
    const highEn = item.querySelector('.edu-highlights_en')?.value || '';
    const highRaw = isEn ? (highEn || highVi) : (highVi || highEn);
    const highlights = highRaw.split('\n').map(s => s.trim()).filter(Boolean);

    const orgLine = [inst, loc, area].filter(Boolean).join(', ');

    html += `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: ${index !== items.length - 1 ? '1px solid #f1f5f9' : 'none'}; align-items: flex-start;">
        <!-- Date Badge -->
        <div style="flex: 0 0 120px;">
          <span style="background-color: var(--accent, #827717); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; display: inline-block; text-align: center; letter-spacing: 0.3px;">
            ${escHtml(dateStr)}
          </span>
        </div>

        <!-- Main Info and Logo -->
        <div style="flex: 1; min-width: 280px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <!-- Text info -->
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; word-break: break-word;">
              ${escHtml(study)}
            </div>
            
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 8px;">
              <i class="fa-solid fa-building-columns" style="color: #06b6d4; font-size: 0.98rem; margin-top: 3px; flex-shrink: 0;"></i>
              <span style="font-weight: 500; word-break: break-word;">${escHtml(orgLine || (isEn ? 'Institution name' : 'Tên trường/tổ chức'))}</span>
            </div>

            ${highlights.length > 0 ? `
              <ul style="margin: 0; padding-left: 18px; list-style-type: circle; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">
                ${highlights.map(h => `<li style="margin-bottom: 3px;">${escHtml(h.replace('(theme)', '').trim())}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <!-- Logo -->
          ${logo ? `
            <div style="flex-shrink: 0; display: flex; align-items: flex-start; justify-content: center; padding: 4px; background: #fff; border: 1px solid var(--border); border-radius: 6px;" title="Logo: ${escHtml(logo)} (Kích thước: ${logoSizePx})">
              <img src="${logo.startsWith('/') || logo.startsWith('http') ? logo : '/assets/img/' + logo}" alt="${escHtml(inst || 'Logo')}" style="width: ${logoSizePx}; max-width: 260px; max-height: 110px; object-fit: contain; display: block;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:0.75rem;color:#ef4444;\\'>Ảnh lỗi</span>'" />
            </div>
          ` : `
            <div style="flex-shrink: 0; padding: 6px 10px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 6px; font-size: 0.72rem; color: var(--text-muted); font-style: italic;">
              Không có logo
            </div>
          `}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  previewBox.innerHTML = html;
}

function syncEduLogoSize(container, sizeNum) {
  const slider = container.querySelector('.edu-logo-slider');
  const number = container.querySelector('.edu-logo-number');
  const hidden = container.querySelector('.edu-logo-size');
  
  const val = Math.max(30, Math.min(300, parseInt(sizeNum, 10) || 100));
  if (slider) slider.value = Math.min(250, Math.max(40, val));
  if (number) number.value = val;
  if (hidden) hidden.value = val;
  
  updateEduSectionPreview();
}

function onEduLogoSliderChange(slider) {
  const container = slider.closest('.dynamic-item');
  if (container) syncEduLogoSize(container, slider.value);
}

function onEduLogoNumberChange(input) {
  const container = input.closest('.dynamic-item');
  if (container) syncEduLogoSize(container, input.value);
}

function setEduLogoPreset(btn, sizePx) {
  const container = btn.closest('.dynamic-item');
  if (container) syncEduLogoSize(container, sizePx);
}

function onEduLogoPathChange(input) {
  const container = input.closest('.dynamic-item');
  if (!container) return;
  const val = input.value.trim();
  const thumb = container.querySelector('.edu-logo-thumb');
  const noImg = container.querySelector('.edu-logo-no-img');
  
  if (val) {
    const src = val.startsWith('/') || val.startsWith('http') ? val : '/assets/img/' + val;
    if (thumb) {
      thumb.src = src;
      thumb.style.display = 'block';
    }
    if (noImg) noImg.style.display = 'none';
  } else {
    if (thumb) {
      thumb.src = '';
      thumb.style.display = 'none';
    }
    if (noImg) noImg.style.display = 'block';
  }
  updateEduSectionPreview();
}

function clearEduLogo(btn) {
  const container = btn.closest('.dynamic-item');
  if (!container) return;
  const textInput = container.querySelector('.edu-logo');
  const thumb = container.querySelector('.edu-logo-thumb');
  const noImg = container.querySelector('.edu-logo-no-img');
  
  if (textInput) textInput.value = '';
  if (thumb) {
    thumb.src = '';
    thumb.style.display = 'none';
  }
  if (noImg) noImg.style.display = 'block';
  updateEduSectionPreview();
}

async function uploadEduLogoFile(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    if (res.success) {
      const container = fileInput.closest('.dynamic-item');
      if (container) {
        const textInput = container.querySelector('.edu-logo');
        const thumb = container.querySelector('.edu-logo-thumb');
        const noImg = container.querySelector('.edu-logo-no-img');
        
        if (textInput) textInput.value = res.filename;
        if (thumb) {
          thumb.src = '/assets/img/' + res.filename;
          thumb.style.display = 'block';
        }
        if (noImg) noImg.style.display = 'none';
        
        updateEduSectionPreview();
      }
      showToast("Tải logo lên thành công!", "success");
    } else {
      showToast("Lỗi: " + (res.error || "Không thể tải file"), "error");
    }
  } catch (err) {
    showToast("Lỗi tải logo: " + err.message, "error");
  } finally {
    hideLoading();
    fileInput.value = '';
  }
}

function renderEducationItem(edu = {}, i = 0) {
  const rawSize = edu.logo_size !== undefined && edu.logo_size !== null ? String(edu.logo_size).trim() : "";
  const currentSizeNum = parseInt(rawSize, 10) || 100;
  const currentLogo = edu.logo || "";
  const logoSrc = currentLogo ? (currentLogo.startsWith('/') || currentLogo.startsWith('http') ? currentLogo : '/assets/img/' + currentLogo) : '';

  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(edu.institution || "New Education")}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove(); setTimeout(updateEduSectionPreview, 50);">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Institution (Tiếng Việt)</label>
            <input type="text" class="edu-institution" value="${escHtml(edu.institution || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Institution (Tiếng Anh)</label>
            <input type="text" class="edu-institution_en" value="${escHtml(edu.institution_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Location (Tiếng Việt)</label>
            <input type="text" class="edu-location" value="${escHtml(edu.location || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Location (Tiếng Anh)</label>
            <input type="text" class="edu-location_en" value="${escHtml(edu.location_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Area (Tiếng Việt)</label>
            <input type="text" class="edu-area" value="${escHtml(edu.area || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Area (Tiếng Anh)</label>
            <input type="text" class="edu-area_en" value="${escHtml(edu.area_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Study Type (Tiếng Việt)</label>
            <input type="text" class="edu-studyType" value="${escHtml(edu.studyType || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Study Type (Tiếng Anh)</label>
            <input type="text" class="edu-studyType_en" value="${escHtml(edu.studyType_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Start Date</label>
            <input type="text" class="edu-start" value="${escHtml(String(edu.start_date || ""))}" />
          </div>
          <div style="flex: 1;">
            <label>Start Date (Tiếng Anh)</label>
            <input type="text" class="edu-start_en" value="${escHtml(String(edu.start_date_en || ""))}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>End Date</label>
            <input type="text" class="edu-end" value="${escHtml(String(edu.end_date || ""))}" />
          </div>
          <div style="flex: 1;">
            <label>End Date (Tiếng Anh)</label>
            <input type="text" class="edu-end_en" value="${escHtml(String(edu.end_date_en || ""))}" />
          </div>
        </div>

        <!-- Tùy chỉnh Logo & Kích thước Logo -->
        <div class="form-group full-width" style="background: rgba(0,0,0,0.02); border: 1px dashed var(--border); border-radius: var(--radius-sm, 8px); padding: 14px 16px; margin: 4px 0 10px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--accent-light, #0f766e);">
              <i class="fas fa-image mr-1"></i> Logo trường / cơ sở giáo dục
            </span>
            <span style="font-size: 0.78rem; color: #64748b;">(Tự do điều chỉnh kích thước logo & tải ảnh mới)</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
            <!-- Khung xem trước logo item -->
            <div class="edu-logo-preview-box" style="width: 100px; height: 85px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-primary, #ffffff); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; flex-shrink: 0; padding: 4px;" title="Ảnh logo hiện tại">
              <img class="edu-logo-thumb" src="${logoSrc}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; display: ${currentLogo ? 'block' : 'none'};" />
              <span class="edu-logo-no-img" style="font-size: 0.72rem; color: #94a3b8; text-align: center; display: ${currentLogo ? 'none' : 'block'};">Chưa có logo</span>
            </div>

            <!-- Tải ảnh & chọn file -->
            <div style="flex: 1; min-width: 260px;">
              <label style="font-size: 0.8rem; margin-bottom: 4px; display: block; font-weight: 500;">Tên file hoặc đường dẫn ảnh:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="edu-logo form-control" value="${escHtml(currentLogo)}" placeholder="VD: logo-dai-hoc-fpt.png" style="font-size: 0.85rem; height: 36px;" oninput="onEduLogoPathChange(this)" />
                <input type="file" class="edu-logo-file-input" accept="image/*,.svg,.png,.webp,.jpg,.jpeg" style="display: none;" onchange="uploadEduLogoFile(this)" />
                <button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.querySelector('.edu-logo-file-input').click()" title="Tải ảnh logo từ máy tính" style="white-space: nowrap; font-size: 0.82rem; height: 36px; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;">
                  <i class="fas fa-upload"></i> Tải ảnh
                </button>
                <button type="button" class="btn btn-sm btn-danger btn-icon" onclick="clearEduLogo(this)" title="Xóa logo này" style="height: 36px; width: 36px; padding: 0; flex-shrink: 0;">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <!-- Thanh trượt & Kích thước -->
              <div style="margin-top: 10px; background: var(--bg-primary, #ffffff); padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-size: 0.82rem; font-weight: 600; margin: 0; color: #334155;">
                    <i class="fas fa-arrows-alt-h text-primary"></i> Chiều rộng logo (Width):
                  </label>
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="edu-logo-number form-control" min="30" max="260" step="5" value="${currentSizeNum}" oninput="onEduLogoNumberChange(this)" style="width: 70px; height: 28px; padding: 2px 6px; font-size: 0.85rem; font-weight: 700; text-align: center;" />
                    <span style="font-size: 0.82rem; color: #64748b;">px</span>
                    <input type="hidden" class="edu-logo-size" value="${currentSizeNum}" />
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span style="font-size: 0.72rem; color: #94a3b8;">40px</span>
                  <input type="range" class="edu-logo-slider" min="40" max="250" step="5" value="${currentSizeNum}" oninput="onEduLogoSliderChange(this)" style="flex: 1; cursor: pointer;" />
                  <span style="font-size: 0.72rem; color: #94a3b8;">250px</span>
                </div>

                <!-- Nút chọn nhanh kích thước -->
                <div style="display: flex; flex-wrap: wrap; gap: 5px; align-items: center;">
                  <span style="font-size: 0.72rem; color: #64748b; margin-right: 2px;">Cỡ nhanh:</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setEduLogoPreset(this, 70)" style="padding: 1px 7px; font-size: 0.72rem;">70px (Nhỏ)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setEduLogoPreset(this, 100)" style="padding: 1px 7px; font-size: 0.72rem;">100px (Chuẩn)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setEduLogoPreset(this, 130)" style="padding: 1px 7px; font-size: 0.72rem; font-weight: bold;">130px (Rõ nét)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setEduLogoPreset(this, 170)" style="padding: 1px 7px; font-size: 0.72rem;">170px (Lớn)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setEduLogoPreset(this, 210)" style="padding: 1px 7px; font-size: 0.72rem;">210px (Cực đại)</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group full-width">
          <label>URL</label>
          <input type="text" class="edu-url" value="${escHtml(edu.url || "")}" />
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Highlights (Tiếng Việt, mỗi dòng 1 mục)</label>
            <textarea class="edu-highlights" rows="3">${escHtml(Array.isArray(edu.highlights) ? edu.highlights.join("\n") : "")}</textarea>
          </div>
          <div style="flex: 1;">
            <label>Highlights (Tiếng Anh, mỗi dòng 1 mục)</label>
            <textarea class="edu-highlights_en" rows="3">${escHtml(Array.isArray(edu.highlights_en) ? edu.highlights_en.join("\n") : "")}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

let currentExpPreviewLang = 'vi';

function setExpPreviewLang(lang) {
  currentExpPreviewLang = lang;
  const btnVi = document.getElementById('exp-preview-lang-vi');
  const btnEn = document.getElementById('exp-preview-lang-en');
  if (btnVi && btnEn) {
    btnVi.className = 'btn btn-sm ' + (lang === 'vi' ? 'btn-primary' : 'btn-outline') + ' exp-preview-lang-btn';
    btnEn.className = 'btn btn-sm ' + (lang === 'en' ? 'btn-primary' : 'btn-outline') + ' exp-preview-lang-btn';
  }
  updateExpSectionPreview();
}

function toggleExpPreview() {
  const wrapper = document.getElementById('exp-live-preview-wrapper');
  const toggleText = document.getElementById('exp-preview-toggle-text');
  if (!wrapper) return;
  if (wrapper.style.display === 'none') {
    wrapper.style.display = 'block';
    if (toggleText) toggleText.innerText = 'Ẩn xem trước';
    updateExpSectionPreview();
  } else {
    wrapper.style.display = 'none';
    if (toggleText) toggleText.innerText = 'Hiện xem trước';
  }
}

function updateExpSectionPreview() {
  const previewBox = document.getElementById('exp-live-preview-content');
  if (!previewBox) return;

  const items = document.querySelectorAll('#experience-list .dynamic-item');
  if (items.length === 0) {
    previewBox.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 24px 0; font-style: italic;">
        <i class="fas fa-briefcase" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
        Chưa có mục kinh nghiệm nào. Nhấn "+ Thêm mới" để tạo.
      </div>
    `;
    return;
  }

  const isEn = currentExpPreviewLang === 'en';
  const titleVi = document.getElementById('cv-experience-title')?.value.trim() || 'Kinh nghiệm';
  const titleEn = document.getElementById('cv-experience-title-en')?.value.trim() || 'Experience';
  const title = isEn ? titleEn : titleVi;
  const titleColor = document.getElementById('cv-experience-title-color')?.value || '#827717';
  const titleBold = document.getElementById('cv-experience-title-bold')?.checked !== false;

  const pick = (item, sel) => {
    const vi = item.querySelector('.' + sel)?.value.trim() || '';
    const en = item.querySelector('.' + sel + '_en')?.value.trim() || '';
    return isEn ? (en || vi) : (vi || en);
  };

  let html = `
    <div style="font-family: inherit;">
      <h3 style="color: ${titleColor}; font-weight: ${titleBold ? 'bold' : 'normal'}; font-size: 1.35rem; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <span>${escHtml(title)}</span>
        <span style="font-size: 0.72rem; font-weight: normal; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px;">${items.length} mục</span>
      </h3>
      <div style="display: flex; flex-direction: column; gap: 24px;">
  `;

  items.forEach((item, index) => {
    const company = pick(item, 'exp-company');
    const position = pick(item, 'exp-position') || (isEn ? 'Position' : 'Chức vụ');
    const loc = pick(item, 'exp-location');
    const summary = pick(item, 'exp-summary');
    const start = pick(item, 'exp-start');
    const end = pick(item, 'exp-end');
    const dateStr = start && end ? `${start} - ${end}` : (start || end || '');

    const logo = item.querySelector('.exp-logo')?.value.trim() || '';
    const logoSizeRaw = item.querySelector('.exp-logo-size')?.value.trim() || '100';
    const logoSizePx = /^\d+$/.test(logoSizeRaw) ? `${logoSizeRaw}px` : (logoSizeRaw || '100px');

    const highVi = item.querySelector('.exp-highlights')?.value || '';
    const highEn = item.querySelector('.exp-highlights_en')?.value || '';
    const highlights = (isEn ? (highEn || highVi) : (highVi || highEn)).split('\n').map(s => s.trim()).filter(Boolean);

    html += `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: ${index !== items.length - 1 ? '1px solid var(--border)' : 'none'}; align-items: flex-start;">
        <div style="flex: 0 0 120px;">
          <span style="background-color: var(--accent, #827717); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; display: inline-block; text-align: center; letter-spacing: 0.3px;">${escHtml(dateStr)}</span>
        </div>
        <div style="flex: 1; min-width: 280px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; word-break: break-word;">${escHtml(position)}</div>
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 6px;">
              <i class="fa-solid fa-briefcase" style="color: #3b82f6; font-size: 0.95rem; margin-top: 3px; flex-shrink: 0;"></i>
              <div style="flex: 1; min-width: 0; word-break: break-word;">
                <span style="font-weight: 500;">${escHtml(company || (isEn ? 'Company name' : 'Tên công ty/tổ chức'))}</span>
                ${loc ? `<span style="color: var(--text-muted); font-size: 0.88rem; margin-left: 6px;">(${escHtml(loc)})</span>` : ''}
              </div>
            </div>
            ${summary ? `<p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0 0 6px 0; word-break: break-word;">${escHtml(summary)}</p>` : ''}
            ${highlights.length > 0 ? `
              <ul style="margin: 0; padding-left: 18px; list-style-type: circle; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">
                ${highlights.map(h => `<li style="margin-bottom: 3px;">${escHtml(h)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          ${logo ? `
            <div style="flex-shrink: 0; display: flex; align-items: flex-start; justify-content: center; padding: 4px; background: #fff; border: 1px solid var(--border); border-radius: 6px;" title="Logo: ${escHtml(logo)} (Kích thước: ${logoSizePx})">
              <img src="${logo.startsWith('/') || logo.startsWith('http') ? logo : '/assets/img/' + logo}" alt="${escHtml(company || 'Logo')}" style="width: ${logoSizePx}; max-width: 260px; max-height: 110px; object-fit: contain; display: block;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:0.75rem;color:#ef4444;\\'>Ảnh lỗi</span>'" />
            </div>
          ` : `
            <div style="flex-shrink: 0; padding: 6px 10px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 6px; font-size: 0.72rem; color: var(--text-muted); font-style: italic;">Không có logo</div>
          `}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
  previewBox.innerHTML = html;
}

function syncExpLogoSize(container, sizeNum) {
  const slider = container.querySelector('.exp-logo-slider');
  const number = container.querySelector('.exp-logo-number');
  const hidden = container.querySelector('.exp-logo-size');
  const val = Math.max(30, Math.min(300, parseInt(sizeNum, 10) || 100));
  if (slider) slider.value = Math.min(250, Math.max(40, val));
  if (number) number.value = val;
  if (hidden) hidden.value = val;
  updateExpSectionPreview();
}

function onExpLogoSliderChange(slider) {
  const container = slider.closest('.dynamic-item');
  if (container) syncExpLogoSize(container, slider.value);
}

function onExpLogoNumberChange(input) {
  const container = input.closest('.dynamic-item');
  if (container) syncExpLogoSize(container, input.value);
}

function setExpLogoPreset(btn, sizePx) {
  const container = btn.closest('.dynamic-item');
  if (container) syncExpLogoSize(container, sizePx);
}

function setExpLogoThumb(container, val) {
  const thumb = container.querySelector('.exp-logo-thumb');
  const noImg = container.querySelector('.exp-logo-no-img');
  if (val) {
    if (thumb) {
      thumb.src = val.startsWith('/') || val.startsWith('http') ? val : '/assets/img/' + val;
      thumb.style.display = 'block';
    }
    if (noImg) noImg.style.display = 'none';
  } else {
    if (thumb) {
      thumb.src = '';
      thumb.style.display = 'none';
    }
    if (noImg) noImg.style.display = 'block';
  }
}

function onExpLogoPathChange(input) {
  const container = input.closest('.dynamic-item');
  if (!container) return;
  setExpLogoThumb(container, input.value.trim());
  updateExpSectionPreview();
}

function clearExpLogo(btn) {
  const container = btn.closest('.dynamic-item');
  if (!container) return;
  const textInput = container.querySelector('.exp-logo');
  if (textInput) textInput.value = '';
  setExpLogoThumb(container, '');
  updateExpSectionPreview();
}

async function uploadExpLogoFile(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData }).then(r => r.json());
    if (res.success) {
      const container = fileInput.closest('.dynamic-item');
      if (container) {
        const textInput = container.querySelector('.exp-logo');
        if (textInput) textInput.value = res.filename;
        setExpLogoThumb(container, res.filename);
        updateExpSectionPreview();
      }
      showToast("Tải logo lên thành công!", "success");
    } else {
      showToast("Lỗi: " + (res.error || "Không thể tải file"), "error");
    }
  } catch (err) {
    showToast("Lỗi tải logo: " + err.message, "error");
  } finally {
    hideLoading();
    fileInput.value = '';
  }
}

function renderExperienceItem(exp = {}, i = 0) {
  const rawSize = exp.logo_size !== undefined && exp.logo_size !== null ? String(exp.logo_size).trim() : "";
  const currentSizeNum = parseInt(rawSize, 10) || 100;
  const currentLogo = exp.logo || "";
  const logoSrc = currentLogo ? (currentLogo.startsWith('/') || currentLogo.startsWith('http') ? currentLogo : '/assets/img/' + currentLogo) : '';

  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(exp.company || exp.position || "New Experience")}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove(); setTimeout(updateExpSectionPreview, 50);">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Company (Tiếng Việt)</label>
            <input type="text" class="exp-company" value="${escHtml(exp.company || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Company (Tiếng Anh)</label>
            <input type="text" class="exp-company_en" value="${escHtml(exp.company_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Position (Tiếng Việt)</label>
            <input type="text" class="exp-position" value="${escHtml(exp.position || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Position (Tiếng Anh)</label>
            <input type="text" class="exp-position_en" value="${escHtml(exp.position_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Location (Tiếng Việt)</label>
            <input type="text" class="exp-location" value="${escHtml(exp.location || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Location (Tiếng Anh)</label>
            <input type="text" class="exp-location_en" value="${escHtml(exp.location_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Start Date</label>
            <input type="text" class="exp-start" value="${escHtml(String(exp.start_date || ""))}" />
          </div>
          <div style="flex: 1;">
            <label>Start Date (Tiếng Anh)</label>
            <input type="text" class="exp-start_en" value="${escHtml(String(exp.start_date_en || ""))}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>End Date</label>
            <input type="text" class="exp-end" value="${escHtml(String(exp.end_date || ""))}" />
          </div>
          <div style="flex: 1;">
            <label>End Date (Tiếng Anh)</label>
            <input type="text" class="exp-end_en" value="${escHtml(String(exp.end_date_en || ""))}" />
          </div>
        </div>
        <!-- Tùy chỉnh Logo & Kích thước Logo -->
        <div class="form-group full-width" style="background: rgba(0,0,0,0.02); border: 1px dashed var(--border); border-radius: var(--radius-sm, 8px); padding: 14px 16px; margin: 4px 0 10px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--accent-light, #0f766e);">
              <i class="fas fa-image mr-1"></i> Logo công ty / tổ chức
            </span>
            <span style="font-size: 0.78rem; color: #64748b;">(Tự do điều chỉnh kích thước logo & tải ảnh mới)</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
            <div style="width: 100px; height: 85px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-primary, #ffffff); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 4px;" title="Ảnh logo hiện tại">
              <img class="exp-logo-thumb" src="${logoSrc}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; display: ${currentLogo ? 'block' : 'none'};" />
              <span class="exp-logo-no-img" style="font-size: 0.72rem; color: #94a3b8; text-align: center; display: ${currentLogo ? 'none' : 'block'};">Chưa có logo</span>
            </div>
            <div style="flex: 1; min-width: 260px;">
              <label style="font-size: 0.8rem; margin-bottom: 4px; display: block; font-weight: 500;">Tên file hoặc đường dẫn ảnh:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="exp-logo form-control" value="${escHtml(currentLogo)}" placeholder="VD: logo-aws.png" style="font-size: 0.85rem; height: 36px;" oninput="onExpLogoPathChange(this)" />
                <input type="file" class="exp-logo-file-input" accept="image/*,.svg,.png,.webp,.jpg,.jpeg" style="display: none;" onchange="uploadExpLogoFile(this)" />
                <button type="button" class="btn btn-sm btn-outline" onclick="this.parentElement.querySelector('.exp-logo-file-input').click()" title="Tải ảnh logo từ máy tính" style="white-space: nowrap; font-size: 0.82rem; height: 36px; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;">
                  <i class="fas fa-upload"></i> Tải ảnh
                </button>
                <button type="button" class="btn btn-sm btn-danger btn-icon" onclick="clearExpLogo(this)" title="Xóa logo này" style="height: 36px; width: 36px; padding: 0; flex-shrink: 0;">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div style="margin-top: 10px; background: var(--bg-primary, #ffffff); padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-size: 0.82rem; font-weight: 600; margin: 0; color: #334155;">
                    <i class="fas fa-arrows-alt-h text-primary"></i> Chiều rộng logo (Width):
                  </label>
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="exp-logo-number form-control" min="30" max="260" step="5" value="${currentSizeNum}" oninput="onExpLogoNumberChange(this)" style="width: 70px; height: 28px; padding: 2px 6px; font-size: 0.85rem; font-weight: 700; text-align: center;" />
                    <span style="font-size: 0.82rem; color: #64748b;">px</span>
                    <input type="hidden" class="exp-logo-size" value="${currentSizeNum}" />
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span style="font-size: 0.72rem; color: #94a3b8;">40px</span>
                  <input type="range" class="exp-logo-slider" min="40" max="250" step="5" value="${currentSizeNum}" oninput="onExpLogoSliderChange(this)" style="flex: 1; cursor: pointer;" />
                  <span style="font-size: 0.72rem; color: #94a3b8;">250px</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; align-items: center;">
                  <span style="font-size: 0.72rem; color: #64748b; margin-right: 2px;">Cỡ nhanh:</span>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setExpLogoPreset(this, 70)" style="padding: 1px 7px; font-size: 0.72rem;">70px (Nhỏ)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setExpLogoPreset(this, 100)" style="padding: 1px 7px; font-size: 0.72rem;">100px (Chuẩn)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setExpLogoPreset(this, 130)" style="padding: 1px 7px; font-size: 0.72rem; font-weight: bold;">130px (Rõ nét)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setExpLogoPreset(this, 170)" style="padding: 1px 7px; font-size: 0.72rem;">170px (Lớn)</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="setExpLogoPreset(this, 210)" style="padding: 1px 7px; font-size: 0.72rem;">210px (Cực đại)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Summary (Tiếng Việt)</label>
            <textarea class="exp-summary" rows="2">${escHtml(exp.summary || "")}</textarea>
          </div>
          <div style="flex: 1;">
            <label>Summary (Tiếng Anh)</label>
            <textarea class="exp-summary_en" rows="2">${escHtml(exp.summary_en || "")}</textarea>
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Highlights (Tiếng Việt, mỗi dòng 1 mục)</label>
            <textarea class="exp-highlights" rows="3">${escHtml(Array.isArray(exp.highlights) ? exp.highlights.join("\n") : "")}</textarea>
          </div>
          <div style="flex: 1;">
            <label>Highlights (Tiếng Anh, mỗi dòng 1 mục)</label>
            <textarea class="exp-highlights_en" rows="3">${escHtml(Array.isArray(exp.highlights_en) ? exp.highlights_en.join("\n") : "")}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHonorItem(honor = {}, i = 0) {
  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(honor.title || "New Honor")}</span>
        <button class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Title (Tiếng Việt)</label>
            <input type="text" class="honor-title" value="${escHtml(honor.title || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Title (Tiếng Anh)</label>
            <input type="text" class="honor-title_en" value="${escHtml(honor.title_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Date</label>
            <input type="text" class="honor-date" value="${escHtml(String(honor.date || ""))}" />
          </div>
          <div style="flex: 1;">
            <label>Date (Tiếng Anh)</label>
            <input type="text" class="honor-date_en" value="${escHtml(String(honor.date_en || ""))}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Issuer (Tiếng Việt)</label>
            <input type="text" class="honor-issuer" value="${escHtml(honor.issuer || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Issuer (Tiếng Anh)</label>
            <input type="text" class="honor-issuer_en" value="${escHtml(honor.issuer_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Location (Tiếng Việt)</label>
            <input type="text" class="honor-location" value="${escHtml(honor.location || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Location (Tiếng Anh)</label>
            <input type="text" class="honor-location_en" value="${escHtml(honor.location_en || "")}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLanguageItem(lang = {}, i = 0) {
  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(lang.name || "New Language")}</span>
        <button class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Language Name (Tiếng Việt)</label>
            <input type="text" class="lang-name" value="${escHtml(lang.name || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Language Name (Tiếng Anh)</label>
            <input type="text" class="lang-name_en" value="${escHtml(lang.name_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Proficiency (Tiếng Việt)</label>
            <input type="text" class="lang-summary" value="${escHtml(lang.summary || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Proficiency (Tiếng Anh)</label>
            <input type="text" class="lang-summary_en" value="${escHtml(lang.summary_en || "")}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSkillItem(skill = {}, i = 0) {
  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(skill.name || "New Skill")}</span>
        <button class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Category (Tiếng Việt)</label>
            <input type="text" class="skill-name" value="${escHtml(skill.name || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Category (Tiếng Anh)</label>
            <input type="text" class="skill-name_en" value="${escHtml(skill.name_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Level (Optional)</label>
            <input type="text" class="skill-level" value="${escHtml(skill.level || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Level (Tiếng Anh)</label>
            <input type="text" class="skill-level_en" value="${escHtml(skill.level_en || "")}" />
          </div>
        </div>
        <div class="form-group full-width">
          <label>Icon class (e.g. fas fa-code)</label>
          <input type="text" class="skill-icon" value="${escHtml(skill.icon || "")}" />
        </div>
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Keywords (Tiếng Việt, cách nhau bởi phẩy)</label>
            <input type="text" class="skill-keywords" value="${escHtml(Array.isArray(skill.keywords) ? skill.keywords.join(", ") : "")}" />
          </div>
          <div style="flex: 1;">
            <label>Keywords (Tiếng Anh, cách nhau bởi phẩy)</label>
            <input type="text" class="skill-keywords_en" value="${escHtml(Array.isArray(skill.keywords_en) ? skill.keywords_en.join(", ") : "")}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function collectDynamicItems(selector, mapper) {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(mapper);
}

async function saveCV() {
  const original = await fetch(`${API}/cv`).then((r) => r.json());
  const cv = original.cv || original;

  cv.name = document.getElementById("cv-name").value;
  cv.name_en = document.getElementById("cv-name_en").value;
  cv.label = document.getElementById("cv-label").value;
  cv.label_en = document.getElementById("cv-label_en").value;
  cv.email = document.getElementById("cv-email").value.split("\n").map((s) => s.trim()).filter(Boolean).join("\n");
  cv.location = document.getElementById("cv-location").value;
  cv.location_en = document.getElementById("cv-location_en").value;
  cv.summary = document.getElementById("cv-summary").value;
  cv.summary_en = document.getElementById("cv-summary_en").value;

  if (document.getElementById("cv-name_icon")) {
    cv.name_icon = document.getElementById("cv-name_icon").value.trim();
    cv.name_icon_size = parseInt(document.getElementById("cv-name_icon-size")?.value, 10) || 18;
  }
  if (document.getElementById("cv-label_icon")) {
    cv.label_icon = document.getElementById("cv-label_icon").value.trim();
    cv.label_icon_size = parseInt(document.getElementById("cv-label_icon-size")?.value, 10) || 18;
  }
  if (document.getElementById("cv-email_icon")) {
    cv.email_icon = document.getElementById("cv-email_icon").value.trim();
    cv.email_icon_size = parseInt(document.getElementById("cv-email_icon-size")?.value, 10) || 18;
  }
  if (document.getElementById("cv-location_icon")) {
    cv.location_icon = document.getElementById("cv-location_icon").value.trim();
    cv.location_icon_size = parseInt(document.getElementById("cv-location_icon-size")?.value, 10) || 18;
  }
  if (document.getElementById("cv-languages_icon")) {
    cv.languages_icon = document.getElementById("cv-languages_icon").value.trim();
    cv.languages_icon_size = parseInt(document.getElementById("cv-languages_icon-size")?.value, 10) || 18;
  }

  // Collect custom info items (Tổ chức, Đơn vị, ...)
  cv.custom_info = collectDynamicItems("#cv-custom-info-list .dynamic-item", (el) => ({
    name: el.querySelector(".custom-info-name") ? el.querySelector(".custom-info-name").value.trim() : "",
    name_en: el.querySelector(".custom-info-name_en") ? el.querySelector(".custom-info-name_en").value.trim() : "",
    value: el.querySelector(".custom-info-value") ? el.querySelector(".custom-info-value").value.trim() : "",
    value_en: el.querySelector(".custom-info-value_en") ? el.querySelector(".custom-info-value_en").value.trim() : "",
    icon: el.querySelector(".custom-info-icon") ? el.querySelector(".custom-info-icon").value.trim() : "",
    icon_size: el.querySelector(".custom-info-icon-size") ? parseInt(el.querySelector(".custom-info-icon-size").value, 10) || 18 : 18,
  })).filter((item) => item.name && item.value);

  // Collect education
  cv.sections = cv.sections || {};
  cv.sections.Education = collectDynamicItems("#education-list .dynamic-item", (el) => ({
    institution: el.querySelector(".edu-institution").value,
    institution_en: el.querySelector(".edu-institution_en").value,
    location: el.querySelector(".edu-location").value,
    location_en: el.querySelector(".edu-location_en").value,
    area: el.querySelector(".edu-area").value,
    area_en: el.querySelector(".edu-area_en").value,
    studyType: el.querySelector(".edu-studyType").value,
    studyType_en: el.querySelector(".edu-studyType_en").value,
    start_date: el.querySelector(".edu-start").value,
    start_date_en: el.querySelector(".edu-start_en").value,
    end_date: el.querySelector(".edu-end").value,
    end_date_en: el.querySelector(".edu-end_en").value,
    logo: el.querySelector(".edu-logo").value,
    logo_size: el.querySelector(".edu-logo-size").value,
    url: el.querySelector(".edu-url").value,
    highlights: el.querySelector(".edu-highlights").value.split("\n").filter((s) => s.trim()),
    highlights_en: el.querySelector(".edu-highlights_en").value.split("\n").filter((s) => s.trim()),
  }));

  // Collect experience
  cv.sections.Experience = collectDynamicItems("#experience-list .dynamic-item", (el) => ({
    company: el.querySelector(".exp-company").value,
    company_en: el.querySelector(".exp-company_en").value,
    position: el.querySelector(".exp-position").value,
    position_en: el.querySelector(".exp-position_en").value,
    location: el.querySelector(".exp-location").value,
    location_en: el.querySelector(".exp-location_en").value,
    start_date: el.querySelector(".exp-start").value,
    start_date_en: el.querySelector(".exp-start_en").value,
    end_date: el.querySelector(".exp-end").value,
    end_date_en: el.querySelector(".exp-end_en").value,
    logo: el.querySelector(".exp-logo").value,
    logo_size: el.querySelector(".exp-logo-size").value,
    summary: el.querySelector(".exp-summary").value,
    summary_en: el.querySelector(".exp-summary_en").value,
    highlights: el.querySelector(".exp-highlights").value.split("\n").filter((s) => s.trim()),
    highlights_en: el.querySelector(".exp-highlights_en").value.split("\n").filter((s) => s.trim()),
  }));

  // Collect honors
  cv.sections["Honors and Awards"] = collectDynamicItems("#honors-list .dynamic-item", (el) => ({
    title: el.querySelector(".honor-title").value,
    title_en: el.querySelector(".honor-title_en").value,
    date: el.querySelector(".honor-date").value,
    date_en: el.querySelector(".honor-date_en").value,
    issuer: el.querySelector(".honor-issuer").value,
    issuer_en: el.querySelector(".honor-issuer_en").value,
    location: el.querySelector(".honor-location").value,
    location_en: el.querySelector(".honor-location_en").value,
  }));

  // Collect languages
  cv.sections.Languages = collectDynamicItems("#languages-list .dynamic-item", (el) => ({
    name: el.querySelector(".lang-name").value,
    name_en: el.querySelector(".lang-name_en").value,
    summary: el.querySelector(".lang-summary").value,
    summary_en: el.querySelector(".lang-summary_en").value,
  }));

  // Collect skills
  cv.sections.Skills = collectDynamicItems("#skills-list .dynamic-item", (el) => ({
    name: el.querySelector(".skill-name").value,
    name_en: el.querySelector(".skill-name_en").value,
    level: el.querySelector(".skill-level").value,
    level_en: el.querySelector(".skill-level_en").value,
    icon: el.querySelector(".skill-icon").value,
    keywords: el.querySelector(".skill-keywords").value.split(",").map(k => k.trim()).filter(Boolean),
    keywords_en: el.querySelector(".skill-keywords_en").value.split(",").map(k => k.trim()).filter(Boolean),
  }));

  try {
    await fetch(`${API}/cv`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv }),
    });

    const pageTitleInput = document.getElementById("cv-page-title");
    if (pageTitleInput) {
      const cvPageData = {
        title: pageTitleInput.value.trim(),
        title_en: document.getElementById("cv-page-title-en")?.value.trim() || "",
        page_title_bold: document.getElementById("cv-page-title-bold")?.checked ?? true,
        page_title_color: document.getElementById("cv-page-title-color")?.value || "#8c0303",

        general_title: document.getElementById("cv-general-title")?.value.trim() || "Thông tin chung",
        general_title_en: document.getElementById("cv-general-title-en")?.value.trim() || "General Information",
        general_title_bold: document.getElementById("cv-general-title-bold")?.checked ?? true,
        general_title_color: document.getElementById("cv-general-title-color")?.value || "#8c0303",

        education_title: document.getElementById("cv-education-title")?.value.trim() || "Học vấn",
        education_title_en: document.getElementById("cv-education-title-en")?.value.trim() || "Education",
        education_title_bold: document.getElementById("cv-education-title-bold")?.checked ?? true,
        education_title_color: document.getElementById("cv-education-title-color")?.value || "#8c0303",

        experience_title: document.getElementById("cv-experience-title")?.value.trim() || "Kinh nghiệm",
        experience_title_en: document.getElementById("cv-experience-title-en")?.value.trim() || "Experience",
        experience_title_bold: document.getElementById("cv-experience-title-bold")?.checked ?? true,
        experience_title_color: document.getElementById("cv-experience-title-color")?.value || "#8c0303",

        honors_title: document.getElementById("cv-honors-title")?.value.trim() || "Giải thưởng và Thành tựu",
        honors_title_en: document.getElementById("cv-honors-title-en")?.value.trim() || "Honors and Awards",
        honors_title_bold: document.getElementById("cv-honors-title-bold")?.checked ?? true,
        honors_title_color: document.getElementById("cv-honors-title-color")?.value || "#8c0303",

        skills_title: document.getElementById("cv-skills-title")?.value.trim() || "Kỹ năng chuyên môn",
        skills_title_en: document.getElementById("cv-skills-title-en")?.value.trim() || "Skills",
        skills_title_bold: document.getElementById("cv-skills-title-bold")?.checked ?? true,
        skills_title_color: document.getElementById("cv-skills-title-color")?.value || "#8c0303",
      };
      await fetch(`${API}/pages/cv`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cvPageData),
      });
    }

    showToast("CV và tùy chỉnh tiêu đề đã được lưu thành công!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}
// ============================================================================
// ============================================================================
// Socials
// ============================================================================

async function loadSocials() {
  const data = await fetch(`${API}/socials`).then((r) => r.json());

  // 10 Icons matching UI and user screenshot
  const knownFields = [
    { key: "email", label: "Email / Gmail", icon: "fa-envelope", iconType: "fas", placeholder: "yourname@gmail.com hoặc link", help: "Địa chỉ email hoặc link webmail" },
    { key: "orcid_id", label: "ORCID", icon: "fa-id-badge", iconType: "fas", placeholder: "0000-0002-1825-0097 hoặc https://orcid.org/...", help: "Mã ORCID ID hoặc link orcid.org" },
    { key: "scholar_userid", label: "Google Scholar", icon: "fa-graduation-cap", iconType: "fas", placeholder: "ID hoặc https://scholar.google.com/citations?user=...", help: "Scholar User ID hoặc link hồ sơ Google Scholar" },
    { key: "scopus_id", label: "Scopus", icon: "fa-book-open", iconType: "fas", placeholder: "Author ID hoặc https://www.scopus.com/authid/detail.uri?authorId=...", help: "Scopus Author ID hoặc link tác giả Scopus" },
    { key: "github_username", label: "GitHub", icon: "fa-github", iconType: "fab", placeholder: "username hoặc https://github.com/...", help: "GitHub username hoặc link trang cá nhân" },
    { key: "linkedin_username", label: "LinkedIn", icon: "fa-linkedin", iconType: "fab", placeholder: "username hoặc https://www.linkedin.com/in/...", help: "LinkedIn username hoặc link profile" },
    { key: "research_gate_profile", label: "ResearchGate", icon: "fa-flask", iconType: "fas", placeholder: "profile hoặc https://www.researchgate.net/profile/...", help: "Tên profile hoặc link ResearchGate" },
    { key: "kaggle_id", label: "Kaggle", icon: "fa-kaggle", iconType: "fab", placeholder: "username hoặc https://kaggle.com/...", help: "Kaggle username hoặc link profile" },
    { key: "discord_id", label: "Discord", icon: "fa-discord", iconType: "fab", placeholder: "ID hoặc link https://discord.gg/...", help: "Discord User ID hoặc link máy chủ/mời" },
    { key: "rss_url", label: "Link RSS", icon: "fa-rss", iconType: "fas", placeholder: "/feed.xml hoặc link rss tùy chỉnh", help: "Đường dẫn file feed RSS (mặc định: /feed.xml)" },
  ];

  let fieldsHtml = knownFields.map((f) => `
    <div class="form-group">
      <label><i class="${f.iconType || 'fas'} ${f.icon}"></i> ${f.label}</label>
      <input type="text" id="social-${f.key}" value="${escHtml(String(data[f.key] || ''))}" placeholder="${f.placeholder || ''}" />
      ${f.help ? `<small class="form-text text-muted" style="font-size: 11px; opacity: 0.7; display: block; margin-top: 4px;">${f.help}</small>` : ''}
    </div>
  `).join("");

  fieldsHtml += `
    <div class="form-group full-width" style="display: flex; gap: 15px;">
      <div style="flex: 1;">
        <label><i class="fas fa-file-pdf"></i> CV PDF (Tiếng Việt)</label>
        <input type="text" id="social-cv_pdf" value="${escHtml(data.cv_pdf || '')}" placeholder="/assets/pdf/example.pdf" />
      </div>
      <div style="flex: 1;">
        <label><i class="fas fa-file-pdf"></i> CV PDF (Tiếng Anh)</label>
        <input type="text" id="social-cv_pdf_en" value="${escHtml(data.cv_pdf_en || '')}" placeholder="/assets/pdf/example_en.pdf" />
      </div>
    </div>
  `;

  // Extra social platforms
  const extraFields = [
    { key: "x_username", label: "X (Twitter) Username", icon: "fa-x-twitter", iconType: "fab", placeholder: "username hoặc https://x.com/..." },
    { key: "semanticscholar_id", label: "Semantic Scholar ID", icon: "fa-atom", iconType: "fas", placeholder: "Author ID hoặc link" },
    { key: "inspirehep_id", label: "Inspire HEP ID", icon: "fa-atom", iconType: "fas", placeholder: "Inspire HEP ID" },
  ];

  let extraHtml = extraFields.map((f) => `
    <div class="form-group">
      <label><i class="${f.iconType || 'fas'} ${f.icon}"></i> ${f.label}</label>
      <input type="text" id="social-${f.key}" value="${escHtml(String(data[f.key] || ''))}" placeholder="${f.placeholder || ''}" />
    </div>
  `).join("");

  // Other custom fields
  const allHandledKeys = new Set([
    ...knownFields.map(f => f.key),
    ...extraFields.map(f => f.key),
    "cv_pdf", "cv_pdf_en", "rss_icon", "custom_social", "google_scholar_id", "semantic_scholar_id"
  ]);

  const customKeys = Object.keys(data).filter((k) => !allHandledKeys.has(k));
  const customHtml = customKeys.map((k) => `
    <div class="form-group">
      <label>${k}</label>
      <input type="text" id="social-${k}" value="${escHtml(String(data[k] || ''))}" />
    </div>
  `).join("");

  renderContent(`
    <div class="section-intro">
      <p>Quản lý các liên kết mạng xã hội và file CV. Bạn có thể nhập <strong>Username / ID</strong> hoặc <strong>dán toàn bộ Link liên kết (https://...)</strong>. UI ngoài trang chủ sẽ tự động nhận diện và cập nhật.</p>
    </div>

    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2><i class="fas fa-share-alt"></i> Các biểu tượng mạng xã hội (Icons)</h2>
        <button class="btn btn-primary btn-sm" onclick="saveSocials()">
          <i class="fas fa-save"></i> Lưu thông tin
        </button>
      </div>
      <div class="card-body">
        <div class="form-grid">
          ${fieldsHtml}
          ${customHtml}
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        <h2><i class="fas fa-plus-circle"></i> Mạng xã hội bổ sung & Tuỳ chọn khác</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          ${extraHtml}
        </div>

        <div class="form-group row align-items-center mt-3" style="display: flex; gap: 10px; align-items: center;">
          <div>
            <input type="checkbox" id="social-rss" ${data.rss_icon ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;" />
          </div>
          <div>
            <label for="social-rss" style="margin-bottom: 0; cursor: pointer; font-weight: 500;">Hiển thị biểu tượng RSS trên giao diện</label>
          </div>
        </div>
        
        <h3 class="mt-4" style="font-size: 15px; font-weight: 600;">Custom Social (Biểu tượng tự định nghĩa)</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Logo URL (icon / ảnh)</label>
            <input type="text" id="social-custom-logo" value="${escHtml(data.custom_social?.logo || '')}" placeholder="https://... hoặc /assets/img/..." />
          </div>
          <div class="form-group">
            <label>Tiêu đề (Title)</label>
            <input type="text" id="social-custom-title" value="${escHtml(data.custom_social?.title || '')}" placeholder="Website riêng" />
          </div>
          <div class="form-group full-width">
            <label>URL liên kết</label>
            <input type="text" id="social-custom-url" value="${escHtml(data.custom_social?.url || '')}" placeholder="https://..." />
          </div>
        </div>

        <div class="mt-4" style="display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="saveSocials()">
            <i class="fas fa-save"></i> Lưu thay đổi Socials
          </button>
        </div>
      </div>
    </div>
  `);
}

async function saveSocials() {
  const data = {};
  const inputs = document.querySelectorAll('input[id^="social-"]');
  
  inputs.forEach(input => {
    const key = input.id.replace('social-', '');
    if (key === 'rss') {
      data.rss_icon = input.checked;
    } else if (key.startsWith('custom-')) {
      if (!data.custom_social) data.custom_social = {};
      data.custom_social[key.replace('custom-', '')] = input.value.trim();
    } else {
      data[key] = input.value.trim();
    }
  });

  if (data.custom_social) {
    let hasCustom = false;
    Object.keys(data.custom_social).forEach(k => {
      if (!data.custom_social[k]) delete data.custom_social[k];
      else hasCustom = true;
    });
    if (!hasCustom) delete data.custom_social;
  }

  showLoading();
  try {
    const res = await fetch(`${API}/socials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      showToast("Đã lưu thông tin Socials thành công! UI đã được cập nhật.", "success");
    } else {
      showToast(result.error || "Lỗi khi lưu", "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

// ============================================================================
// Repositories
// ============================================================================

async function loadRepositories() {
  const [data, pageRes] = await Promise.all([
    fetch(`${API}/repositories`).then((r) => r.json()).catch(() => ({})),
    fetch(`${API}/pages/repositories`).then((r) => r.json()).catch(() => ({}))
  ]);

  const pageTitleVi = data.page_title || pageRes.title || "Lưu trữ";
  const pageTitleEn = data.page_title_en || pageRes.title_en || "Repositories";
  const pageTitleBold = data.page_title_bold !== false;
  const pageTitleColor = data.page_title_color || "#8c0303";

  const overviewTitle = data.overview_title || "Tổng quan GitHub";
  const overviewTitleEn = data.overview_title_en || "GitHub Overview";
  const overviewTitleBold = data.overview_title_bold !== false;
  const overviewTitleColor = data.overview_title_color || "#8c0303";

  const reposTitle = data.repos_title || "Kho lưu trữ nổi bật";
  const reposTitleEn = data.repos_title_en || "Featured Repositories";
  const reposTitleBold = data.repos_title_bold !== false;
  const reposTitleColor = data.repos_title_color || "#8c0303";

  const cardTitleColor = data.card_title_color || "#8c0303";

  renderContent(`
    <div class="section-intro">
      <p>Quản lý danh sách GitHub users, repositories và tùy chỉnh định dạng giao diện tiêu đề.</p>
    </div>

    <!-- 1. Tùy chỉnh Tiêu đề & Màu sắc đặt lên hàng đầu -->
    <div class="card mb-4">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h2><i class="fas fa-palette" style="color:var(--accent-light);margin-right:8px"></i> Tùy chỉnh Tiêu đề & Màu sắc (Titles & Styling)</h2>
        <span class="badge badge-primary" style="font-size:11px;padding:4px 10px;border-radius:12px;background:var(--accent-gradient,#8c0303);color:#fff">
          Giao diện Repositories
        </span>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size: 0.88rem; margin-bottom: 22px;">
          Tùy chỉnh nội dung chữ, định dạng <strong>in đậm</strong> và <strong>lựa màu sắc</strong> cho từng tiêu đề trên trang Repositories. Bạn có thể tự chọn màu bất kỳ hoặc <strong>tích chọn nhanh vào các ô màu đẹp có sẵn</strong> bên dưới (có dấu tích ✔️).
        </p>

        <!-- 1.1 Tiêu đề Trang (Page Title) -->
        <div class="title-styling-block mb-4 p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <span style="font-weight: 600; font-size: 0.96rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-heading" style="color: var(--accent-light);"></i> 1. Tiêu đề chính của trang (Page Title)
            </span>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; user-select: none; margin: 0; background: var(--bg-card); padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);">
              <input type="checkbox" id="repo-page-title-bold" ${pageTitleBold ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" onchange="updateLivePreview('repo-page-title')" />
              <strong style="font-weight: 700;">In đậm (Bold)</strong>
            </label>
          </div>
          <div class="form-grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Việt)</label>
              <input type="text" id="repo-page-title" value="${escHtml(pageTitleVi)}" class="form-control" style="width: 100%;" oninput="updateLivePreview('repo-page-title')" />
            </div>
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Anh)</label>
              <input type="text" id="repo-page-title-en" value="${escHtml(pageTitleEn)}" class="form-control" style="width: 100%;" />
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <label style="font-size: 0.82rem; color: var(--text-secondary); width: 80px; margin: 0; font-weight: 500;">Màu sắc:</label>
            <input type="color" id="repo-page-title-color" value="${escHtml(pageTitleColor)}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('repo-page-title-color', this.value)" />
            <input type="text" class="form-control" id="repo-page-title-color-text" value="${escHtml(pageTitleColor)}" placeholder="#8c0303" style="width: 110px;" oninput="onColorInputChange('repo-page-title-color', this.value)" />
            <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('repo-page-title-color', '#8c0303')" style="font-size: 11px; padding: 5px 12px;">Mặc định</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;"><i class="fas fa-check-circle" style="color:var(--accent-light);margin-right:3px"></i> Tích chọn màu đẹp:</span>
            ${renderColorPresets('repo-page-title-color', pageTitleColor)}
          </div>
          <!-- Live Preview -->
          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid ${pageTitleColor}; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Xem trước thực tế:</span>
            <span id="repo-page-title-preview" style="font-size: 1.3rem; font-weight: ${pageTitleBold ? '700' : '400'}; color: ${pageTitleColor}; transition: all 0.2s ease;">
              ${escHtml(pageTitleVi)}
            </span>
          </div>
        </div>

        <!-- 1.2 Tiêu đề Phân mục: Tổng quan GitHub -->
        <div class="title-styling-block mb-4 p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <span style="font-weight: 600; font-size: 0.96rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px;">
              <i class="fab fa-github" style="color: var(--accent-light);"></i> 2. Tiêu đề mục: Tổng quan GitHub (Overview Section)
            </span>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; user-select: none; margin: 0; background: var(--bg-card); padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);">
              <input type="checkbox" id="repo-overview-title-bold" ${overviewTitleBold ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" onchange="updateLivePreview('repo-overview-title')" />
              <strong style="font-weight: 700;">In đậm (Bold)</strong>
            </label>
          </div>
          <div class="form-grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Việt)</label>
              <input type="text" id="repo-overview-title" value="${escHtml(overviewTitle)}" class="form-control" style="width: 100%;" oninput="updateLivePreview('repo-overview-title')" />
            </div>
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Anh)</label>
              <input type="text" id="repo-overview-title-en" value="${escHtml(overviewTitleEn)}" class="form-control" style="width: 100%;" />
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <label style="font-size: 0.82rem; color: var(--text-secondary); width: 80px; margin: 0; font-weight: 500;">Màu sắc:</label>
            <input type="color" id="repo-overview-title-color" value="${escHtml(overviewTitleColor)}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('repo-overview-title-color', this.value)" />
            <input type="text" class="form-control" id="repo-overview-title-color-text" value="${escHtml(overviewTitleColor)}" placeholder="#8c0303" style="width: 110px;" oninput="onColorInputChange('repo-overview-title-color', this.value)" />
            <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('repo-overview-title-color', '#8c0303')" style="font-size: 11px; padding: 5px 12px;">Mặc định</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;"><i class="fas fa-check-circle" style="color:var(--accent-light);margin-right:3px"></i> Tích chọn màu đẹp:</span>
            ${renderColorPresets('repo-overview-title-color', overviewTitleColor)}
          </div>
          <!-- Live Preview -->
          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid ${overviewTitleColor}; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Xem trước thực tế:</span>
            <span id="repo-overview-title-preview" style="font-size: 1.2rem; font-weight: ${overviewTitleBold ? '700' : '400'}; color: ${overviewTitleColor}; transition: all 0.2s ease;">
              <i class="fab fa-github mr-1"></i> ${escHtml(overviewTitle)}
            </span>
          </div>
        </div>

        <!-- 1.3 Tiêu đề Phân mục: Kho lưu trữ nổi bật -->
        <div class="title-styling-block mb-4 p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <span style="font-weight: 600; font-size: 0.96rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-code-branch" style="color: var(--accent-light);"></i> 3. Tiêu đề mục: Kho lưu trữ nổi bật (Repositories Section)
            </span>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; user-select: none; margin: 0; background: var(--bg-card); padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);">
              <input type="checkbox" id="repo-repos-title-bold" ${reposTitleBold ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" onchange="updateLivePreview('repo-repos-title')" />
              <strong style="font-weight: 700;">In đậm (Bold)</strong>
            </label>
          </div>
          <div class="form-grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Việt)</label>
              <input type="text" id="repo-repos-title" value="${escHtml(reposTitle)}" class="form-control" style="width: 100%;" oninput="updateLivePreview('repo-repos-title')" />
            </div>
            <div>
              <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Anh)</label>
              <input type="text" id="repo-repos-title-en" value="${escHtml(reposTitleEn)}" class="form-control" style="width: 100%;" />
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <label style="font-size: 0.82rem; color: var(--text-secondary); width: 80px; margin: 0; font-weight: 500;">Màu sắc:</label>
            <input type="color" id="repo-repos-title-color" value="${escHtml(reposTitleColor)}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('repo-repos-title-color', this.value)" />
            <input type="text" class="form-control" id="repo-repos-title-color-text" value="${escHtml(reposTitleColor)}" placeholder="#8c0303" style="width: 110px;" oninput="onColorInputChange('repo-repos-title-color', this.value)" />
            <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('repo-repos-title-color', '#8c0303')" style="font-size: 11px; padding: 5px 12px;">Mặc định</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;"><i class="fas fa-check-circle" style="color:var(--accent-light);margin-right:3px"></i> Tích chọn màu đẹp:</span>
            ${renderColorPresets('repo-repos-title-color', reposTitleColor)}
          </div>
          <!-- Live Preview -->
          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid ${reposTitleColor}; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Xem trước thực tế:</span>
            <span id="repo-repos-title-preview" style="font-size: 1.2rem; font-weight: ${reposTitleBold ? '700' : '400'}; color: ${reposTitleColor}; transition: all 0.2s ease;">
              <i class="fas fa-code-branch mr-1"></i> ${escHtml(reposTitle)}
            </span>
          </div>
        </div>

        <!-- 1.4 Màu sắc tiêu đề trong Card GitHub -->
        <div class="title-styling-block p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-weight: 600; font-size: 0.96rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-id-card" style="color: var(--accent-light);"></i> 4. Màu tiêu đề hiển thị bên trong thẻ GitHub Cards (Widget Cards)
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
            <label style="font-size: 0.82rem; color: var(--text-secondary); width: 80px; margin: 0; font-weight: 500;">Màu sắc:</label>
            <input type="color" id="repo-card-title-color" value="${escHtml(cardTitleColor)}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('repo-card-title-color', this.value)" />
            <input type="text" class="form-control" id="repo-card-title-color-text" value="${escHtml(cardTitleColor)}" placeholder="#8c0303" style="width: 110px;" oninput="onColorInputChange('repo-card-title-color', this.value)" />
            <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('repo-card-title-color', '#8c0303')" style="font-size: 11px; padding: 5px 12px;">Mặc định</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;"><i class="fas fa-check-circle" style="color:var(--accent-light);margin-right:3px"></i> Tích chọn màu đẹp:</span>
            ${renderColorPresets('repo-card-title-color', cardTitleColor)}
          </div>
          <!-- Live Preview Card -->
          <div style="margin-top: 12px; padding: 12px 16px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid ${cardTitleColor}; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Mẫu thẻ repository:</span>
            <div id="repo-card-title-preview" style="font-size: 1.05rem; font-weight: 700; color: ${cardTitleColor};">
              <i class="far fa-bookmark mr-1"></i> TruongNguyenThaiBinh77/Portfolio1
            </div>
          </div>
        </div>
      </div>
    <!-- Cấu hình GitHub Stats & Hiển thị Repositories -->
    <div class="card mb-4">
      <div class="card-header">
        <h2><i class="fas fa-chart-line" style="color:var(--accent-light);margin-right:8px"></i> Cấu hình GitHub Stats & Huy hiệu (Badges & Theme)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label style="font-weight:600;font-size:0.9rem;margin-bottom:6px;display:block;">
              <i class="fas fa-layer-group text-primary mr-1"></i> Tổng số lượng Repositories (Hiển thị trên Badge)
            </label>
            <input type="number" id="repo-total-count" class="form-control" value="${escHtml(data.total_repos_count || 21)}" placeholder="21" min="1" />
            <small class="text-muted" style="display:block;margin-top:4px;">
              Số lượng hiển thị trên trang (Ví dụ: <strong>21</strong> repositories theo tab Repositories của GitHub).
            </small>
          </div>
          <div>
            <label style="font-weight:600;font-size:0.9rem;margin-bottom:6px;display:block;">
              <i class="fas fa-magic text-info mr-1"></i> Giao diện Thẻ GitHub (Theme & Nền)
            </label>
            <select id="repo-stats-theme" class="form-control" style="width:100%">
              <option value="light" ${(data.stats_theme || 'light') === 'light' ? 'selected' : ''}>⚪ Nền Trắng Sáng Hiện Đại (Khuyên dùng - Chuẩn B+, đồng bộ trang web)</option>
              <option value="soft_gray" ${data.stats_theme === 'soft_gray' ? 'selected' : ''}>🌫️ Xám Sáng Tinh Tế (#f8fafc - Chuẩn B+)</option>
              <option value="radical" ${data.stats_theme === 'radical' ? 'selected' : ''}>⚫ Radical Dark (Nền đen neon tím/hồng)</option>
              <option value="tokyonight" ${data.stats_theme === 'tokyonight' ? 'selected' : ''}>Tokyo Night (Tối)</option>
              <option value="dracula" ${data.stats_theme === 'dracula' ? 'selected' : ''}>Dracula (Tối)</option>
            </select>
            <small class="text-muted" style="display:block;margin-top:4px;">
              Theme <strong>Nền Trắng Sáng</strong> giúp các card hoà hợp hoàn hảo với website, đồng thời vẫn giữ nguyên xếp hạng <strong>B+</strong>.
            </small>
          </div>
        </div>

        <div id="repo-card-bg-container" style="padding-top: 10px; border-top: 1px solid var(--border);">
          <label style="font-weight:600;font-size:0.9rem;margin-bottom:6px;display:block;">
            <i class="fas fa-fill-drip text-success mr-1"></i> Tùy chỉnh Màu nền thẻ (Card Background Color)
          </label>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
            <input type="color" id="repo-card-bg-color" value="${escHtml(data.card_bg_color || '#ffffff')}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('repo-card-bg-color', this.value)" />
            <input type="text" class="form-control" id="repo-card-bg-color-text" value="${escHtml(data.card_bg_color || '#ffffff')}" placeholder="#ffffff" style="width: 110px;" oninput="onColorInputChange('repo-card-bg-color', this.value)" />
            <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('repo-card-bg-color', '#ffffff')" style="font-size: 11px; padding: 5px 12px;">Mặc định Trắng</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;">Chọn nhanh màu nền đẹp:</span>
            <button type="button" class="btn btn-sm" onclick="resetColor('repo-card-bg-color', '#ffffff')" style="background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;font-size:11px;padding:3px 8px;border-radius:4px">⚪ Trắng (#ffffff)</button>
            <button type="button" class="btn btn-sm" onclick="resetColor('repo-card-bg-color', '#f8fafc')" style="background:#f8fafc;color:#1e293b;border:1px solid #cbd5e1;font-size:11px;padding:3px 8px;border-radius:4px">🌫️ Xám sáng (#f8fafc)</button>
            <button type="button" class="btn btn-sm" onclick="resetColor('repo-card-bg-color', '#fffdf9')" style="background:#fffdf9;color:#1e293b;border:1px solid #cbd5e1;font-size:11px;padding:3px 8px;border-radius:4px">🍦 Kem ngà (#fffdf9)</button>
            <button type="button" class="btn btn-sm" onclick="resetColor('repo-card-bg-color', '#f0fdf4')" style="background:#f0fdf4;color:#1e293b;border:1px solid #bbf7d0;font-size:11px;padding:3px 8px;border-radius:4px">🍃 Xanh ngọc (#f0fdf4)</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. GitHub Users -->
    <div class="card mb-4">
      <div class="card-header">
        <h2><i class="fab fa-github"></i> GitHub Users</h2>
      </div>
      <div class="card-body">
        <div class="dynamic-list" id="gh-users-list">
          ${(data.github_users || []).map((u, i) => `
            <div class="dynamic-item" style="padding:10px 16px">
              <div class="flex items-center justify-between">
                <input type="text" class="gh-user" value="${escHtml(u)}" style="flex:1;margin-right:10px" />
                <button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
        <button class="add-item-btn mt-4" onclick="addGhUser()">
          <i class="fas fa-plus"></i> Thêm GitHub User
        </button>
      </div>
    </div>

    <!-- 3. GitHub Repositories -->
    <div class="card mb-4">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <h2><i class="fas fa-code-branch" style="color:var(--accent-light);margin-right:8px"></i> GitHub Repositories</h2>
          <small class="text-muted" style="display:block;margin-top:2px;">Bấm nút <strong style="color:#10b981"><i class="fas fa-eye"></i> Hiện</strong> / <strong style="color:#f59e0b"><i class="fas fa-eye-slash"></i> Đã ẩn</strong> cạnh mỗi repo để ẩn/hiện trực tiếp lên UI mà không mất dữ liệu.</small>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-sm btn-secondary" onclick="fetchGitHubReposFromApi()" style="font-size:12px;padding:6px 14px">
            <i class="fab fa-github" style="color:var(--accent-light);margin-right:6px"></i> Tải Repos từ GitHub
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- Filter Tabs & Batch Actions -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:8px 12px;background:var(--bg-tertiary);border-radius:6px;border:1px solid var(--border);flex-wrap:wrap;gap:10px">
          <div style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;margin-right:4px;">Bộ lọc:</span>
            <button type="button" class="btn btn-sm btn-primary repo-filter-btn active" data-filter="all" onclick="filterRepoList('all', this)" style="font-size:11px;padding:4px 11px;border-radius:12px;">
              Tất cả (<span id="repo-count-all">0</span>)
            </button>
            <button type="button" class="btn btn-sm btn-secondary repo-filter-btn" data-filter="visible" onclick="filterRepoList('visible', this)" style="font-size:11px;padding:4px 11px;border-radius:12px;">
              <i class="fas fa-eye" style="color:#10b981;margin-right:3px"></i> Đang hiện (<span id="repo-count-visible">0</span>)
            </button>
            <button type="button" class="btn btn-sm btn-secondary repo-filter-btn" data-filter="hidden" onclick="filterRepoList('hidden', this)" style="font-size:11px;padding:4px 11px;border-radius:12px;">
              <i class="fas fa-eye-slash" style="color:#f59e0b;margin-right:3px"></i> Đã ẩn (<span id="repo-count-hidden">0</span>)
            </button>
          </div>
          <div style="display:inline-flex;gap:6px;align-items:center;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="batchSetRepoVisibility('show_all')" style="font-size:11px;padding:4px 10px;" title="Hiện lại tất cả repos trên trang web UI">
              <i class="fas fa-eye" style="color:#10b981;margin-right:4px"></i> Hiện tất cả
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="batchSetRepoVisibility('hide_all')" style="font-size:11px;padding:4px 10px;" title="Ẩn toàn bộ repos khỏi trang web UI">
              <i class="fas fa-eye-slash" style="color:#f59e0b;margin-right:4px"></i> Ẩn tất cả
            </button>
          </div>
        </div>

        <div class="dynamic-list" id="gh-repos-list">
          ${(data.github_repos || []).map((r) => {
            const isHidden = (data.hidden_repos || []).includes(r);
            return renderRepoItemHtml(r, isHidden);
          }).join("")}
        </div>
        <button class="add-item-btn mt-4" onclick="addGhRepo()">
          <i class="fas fa-plus"></i> Thêm Repository thủ công
        </button>
      </div>
    </div>

    <!-- Lưu thay đổi -->
    <div class="card">
      <div class="card-footer" style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary" onclick="saveRepositories()" style="padding: 10px 24px; font-size: 15px;">
          <i class="fas fa-save mr-2"></i> Lưu Repositories & Tiêu đề
        </button>
      </div>
    </div>
  `);
  updateRepoCounters();
}

function renderTitleStylingBlock({ id, num, icon, label, titleVi, titleEn, isBold, color, defaultColor = '#8c0303', previewIcon = '', showTextInputs = true }) {
  return `
    <div class="title-styling-block mb-4 p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <span style="font-weight: 600; font-size: 0.96rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px;">
          <i class="${icon}" style="color: var(--accent-light);"></i> ${num}. ${label}
        </span>
        <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; user-select: none; margin: 0; background: var(--bg-card); padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);">
          <input type="checkbox" id="${id}-bold" ${isBold ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" onchange="updateLivePreview('${id}')" />
          <strong style="font-weight: 700;">In đậm (Bold)</strong>
        </label>
      </div>
      ${showTextInputs ? `
      <div class="form-grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Việt)</label>
          <input type="text" id="${id}" value="${escHtml(titleVi || '')}" class="form-control" style="width: 100%;" oninput="updateLivePreview('${id}')" />
        </div>
        <div>
          <label style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px; display: block;">Tên tiêu đề (Tiếng Anh)</label>
          <input type="text" id="${id}-en" value="${escHtml(titleEn || '')}" class="form-control" style="width: 100%;" />
        </div>
      </div>
      ` : ''}
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
        <label style="font-size: 0.82rem; color: var(--text-secondary); width: 80px; margin: 0; font-weight: 500;">Màu sắc:</label>
        <input type="color" id="${id}-color" value="${escHtml(color)}" style="width: 44px; height: 34px; padding: 2px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card);" oninput="onColorInputChange('${id}-color', this.value)" />
        <input type="text" class="form-control" id="${id}-color-text" value="${escHtml(color)}" placeholder="${defaultColor}" style="width: 110px;" oninput="onColorInputChange('${id}-color', this.value)" />
        <button type="button" class="btn btn-sm btn-secondary" onclick="resetColor('${id}-color', '${defaultColor}')" style="font-size: 11px; padding: 5px 12px;">Mặc định</button>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
        <span style="font-size: 12px; color: var(--text-muted); margin-right: 4px; font-weight: 500;"><i class="fas fa-check-circle" style="color:var(--accent-light);margin-right:3px"></i> Tích chọn màu đẹp:</span>
        ${renderColorPresets(`${id}-color`, color)}
      </div>
      <!-- Live Preview -->
      <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid ${color}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-eye" style="color: var(--accent-light);"></i> Xem trước thực tế:
        </span>
        <span id="${id}-preview" style="font-size: 1.15rem; font-weight: ${isBold ? '700' : '500'}; color: ${color}; padding: 4px 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.08); transition: all 0.2s ease;">
          ${previewIcon ? `<i class="${previewIcon} mr-1"></i> ` : ''}${escHtml(titleVi || '')}
        </span>
      </div>
    </div>
  `;
}

function renderColorPresets(targetId, currentColor = '#8c0303') {
  const presets = [
    { name: "Đỏ Đô", hex: "#8c0303" },
    { name: "Xanh Navy", hex: "#1e3a8a" },
    { name: "Xanh Sky", hex: "#0284c7" },
    { name: "Xanh Lá", hex: "#15803d" },
    { name: "Vàng Đồng", hex: "#b45309" },
    { name: "Tím Violet", hex: "#7c3aed" },
    { name: "Hồng Ruby", hex: "#be185d" },
    { name: "Đen Chì", hex: "#111827" },
  ];

  return `
    <div class="color-preset-group" data-target="${targetId}" style="display: inline-flex; gap: 7px; flex-wrap: wrap; align-items: center;">
      ${presets.map(p => {
        const isSelected = p.hex.toLowerCase() === (currentColor || '').toLowerCase();
        return `
          <button type="button" 
            class="color-preset-pill ${isSelected ? 'selected' : ''}"
            data-hex="${p.hex}"
            style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 20px; font-size: 11.5px; font-weight: ${isSelected ? '700' : '500'}; background: ${isSelected ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)'}; color: var(--text-primary); border: 2px solid ${isSelected ? p.hex : 'var(--border)'}; cursor: pointer; transition: all 0.2s ease; box-shadow: ${isSelected ? '0 0 8px ' + p.hex + '66' : 'none'};"
            onclick="setColorPreset('${targetId}', '${p.hex}', this)"
            title="${p.name} (${p.hex})">
            <span style="width: 14px; height: 14px; border-radius: 50%; background: ${p.hex}; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.4); font-size: 8.5px; color: #fff;">
              <i class="fas fa-check" style="display: ${isSelected ? 'inline-block' : 'none'};"></i>
            </span>
            <span>${p.name}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function setColorPreset(targetId, hex, clickedBtn) {
  const colorInput = document.getElementById(targetId);
  const textInput = document.getElementById(targetId + '-text');
  if (colorInput) colorInput.value = hex;
  if (textInput) textInput.value = hex;

  const container = document.querySelector(`.color-preset-group[data-target="${targetId}"]`);
  if (container) {
    const buttons = container.querySelectorAll('.color-preset-pill');
    buttons.forEach(btn => {
      const btnHex = btn.dataset.hex;
      const isMatch = btnHex.toLowerCase() === hex.toLowerCase();
      const checkIcon = btn.querySelector('.fa-check');
      if (checkIcon) checkIcon.style.display = isMatch ? 'inline-block' : 'none';
      btn.style.border = isMatch ? `2px solid ${btnHex}` : '2px solid var(--border)';
      btn.style.background = isMatch ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)';
      btn.style.boxShadow = isMatch ? `0 0 8px ${btnHex}66` : 'none';
      const textSpan = btn.querySelector('span:last-child');
      if (textSpan) textSpan.style.fontWeight = isMatch ? '700' : '500';
    });
  }

  updateLivePreview(targetId);
}

function onColorInputChange(targetId, hex) {
  const colorInput = document.getElementById(targetId);
  const textInput = document.getElementById(targetId + '-text');
  if (colorInput && colorInput.value !== hex) colorInput.value = hex;
  if (textInput && textInput.value !== hex) textInput.value = hex;

  const container = document.querySelector(`.color-preset-group[data-target="${targetId}"]`);
  if (container) {
    const buttons = container.querySelectorAll('.color-preset-pill');
    buttons.forEach(btn => {
      const btnHex = btn.dataset.hex;
      const isMatch = btnHex.toLowerCase() === (hex || '').toLowerCase();
      const checkIcon = btn.querySelector('.fa-check');
      if (checkIcon) checkIcon.style.display = isMatch ? 'inline-block' : 'none';
      btn.style.border = isMatch ? `2px solid ${btnHex}` : '2px solid var(--border)';
      btn.style.background = isMatch ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)';
      btn.style.boxShadow = isMatch ? `0 0 8px ${btnHex}66` : 'none';
      const textSpan = btn.querySelector('span:last-child');
      if (textSpan) textSpan.style.fontWeight = isMatch ? '700' : '500';
    });
  }

  updateLivePreview(targetId);
}

function resetColor(targetId, defaultHex = '#8c0303') {
  setColorPreset(targetId, defaultHex);
}

function updateLivePreview(idPrefix) {
  const baseId = idPrefix.endsWith('-color') ? idPrefix.replace(/-color$/, '') : idPrefix;
  const colorInput = document.getElementById(`${baseId}-color`);
  const boldInput = document.getElementById(`${baseId}-bold`);
  const textInput = document.getElementById(baseId);
  const preview = document.getElementById(`${baseId}-preview`);

  const color = colorInput ? colorInput.value : '#8c0303';
  const isBold = boldInput ? boldInput.checked : true;
  const text = textInput ? textInput.value : null;

  if (preview) {
    preview.style.color = color;
    preview.style.fontWeight = isBold ? '700' : '400';
    if (preview.parentElement) {
      preview.parentElement.style.borderLeftColor = color;
    }
    if (baseId === 'repo-card-title' || baseId === 'teach-card-title' || baseId === 'pub-article-title') {
      // Keep card styling / preview
    } else if (text !== null) {
      const iconEl = preview.querySelector('i');
      if (iconEl) {
        const iconHtml = iconEl.outerHTML;
        preview.innerHTML = `${iconHtml} ${escHtml(text)}`;
      } else {
        preview.textContent = text;
      }
    }
  }
}

async function saveCVTitles() {
  const pageTitleInput = document.getElementById("cv-page-title");
  if (!pageTitleInput) return;
  const cvPageData = {
    title: pageTitleInput.value.trim(),
    title_en: document.getElementById("cv-page-title-en")?.value.trim() || "",
    page_title_bold: document.getElementById("cv-page-title-bold")?.checked ?? true,
    page_title_color: document.getElementById("cv-page-title-color")?.value || "#8c0303",

    general_title: document.getElementById("cv-general-title")?.value.trim() || "Thông tin chung",
    general_title_en: document.getElementById("cv-general-title-en")?.value.trim() || "General Information",
    general_title_bold: document.getElementById("cv-general-title-bold")?.checked ?? true,
    general_title_color: document.getElementById("cv-general-title-color")?.value || "#8c0303",

    education_title: document.getElementById("cv-education-title")?.value.trim() || "Học vấn",
    education_title_en: document.getElementById("cv-education-title-en")?.value.trim() || "Education",
    education_title_bold: document.getElementById("cv-education-title-bold")?.checked ?? true,
    education_title_color: document.getElementById("cv-education-title-color")?.value || "#8c0303",

    experience_title: document.getElementById("cv-experience-title")?.value.trim() || "Kinh nghiệm",
    experience_title_en: document.getElementById("cv-experience-title-en")?.value.trim() || "Experience",
    experience_title_bold: document.getElementById("cv-experience-title-bold")?.checked ?? true,
    experience_title_color: document.getElementById("cv-experience-title-color")?.value || "#8c0303",

    honors_title: document.getElementById("cv-honors-title")?.value.trim() || "Giải thưởng và Thành tựu",
    honors_title_en: document.getElementById("cv-honors-title-en")?.value.trim() || "Honors and Awards",
    honors_title_bold: document.getElementById("cv-honors-title-bold")?.checked ?? true,
    honors_title_color: document.getElementById("cv-honors-title-color")?.value || "#8c0303",

    skills_title: document.getElementById("cv-skills-title")?.value.trim() || "Kỹ năng chuyên môn",
    skills_title_en: document.getElementById("cv-skills-title-en")?.value.trim() || "Skills",
    skills_title_bold: document.getElementById("cv-skills-title-bold")?.checked ?? true,
    skills_title_color: document.getElementById("cv-skills-title-color")?.value || "#8c0303",
  };
  showLoading();
  try {
    const res = await fetch(`${API}/pages/cv`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cvPageData),
    });
    if (res.ok) {
      showToast("Đã lưu tùy chỉnh tiêu đề CV thành công!", "success");
    } else {
      showToast("Lỗi khi lưu tùy chỉnh tiêu đề CV", "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

async function saveTeachingsTitles() {
  const pageTitle = document.getElementById("teach-page-title")?.value.trim() || "Thành tích";
  const pageTitleEn = document.getElementById("teach-page-title-en")?.value.trim() || "Achievements";
  const pageTitleBold = document.getElementById("teach-page-title-bold")?.checked ?? true;
  const pageTitleColor = document.getElementById("teach-page-title-color")?.value || "#8c0303";

  const honorsTitle = document.getElementById("teach-honors-title")?.value.trim() || "Thành tích nổi bật";
  const honorsTitleEn = document.getElementById("teach-honors-title-en")?.value.trim() || "Awards & Honors";
  const honorsTitleBold = document.getElementById("teach-honors-title-bold")?.checked ?? true;
  const honorsTitleColor = document.getElementById("teach-honors-title-color")?.value || "#1e293b";

  const certTitle = document.getElementById("teach-certificates-title")?.value.trim() || "Chứng chỉ & Bằng cấp";
  const certTitleEn = document.getElementById("teach-certificates-title-en")?.value.trim() || "Certificates";
  const certTitleBold = document.getElementById("teach-certificates-title-bold")?.checked ?? true;
  const certTitleColor = document.getElementById("teach-certificates-title-color")?.value || "#1e293b";

  const cardTitleBold = document.getElementById("teach-card-title-bold")?.checked ?? true;
  const cardTitleColor = document.getElementById("teach-card-title-color")?.value || "#1e293b";

  showLoading();
  try {
    const res = await fetch(`${API}/pages/teaching`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pageTitle,
        title_en: pageTitleEn,
        page_title_bold: pageTitleBold,
        page_title_color: pageTitleColor,

        honors_title: honorsTitle,
        honors_title_en: honorsTitleEn,
        honors_title_bold: honorsTitleBold,
        honors_title_color: honorsTitleColor,

        certificates_title: certTitle,
        certificates_title_en: certTitleEn,
        certificates_title_bold: certTitleBold,
        certificates_title_color: certTitleColor,

        card_title_bold: cardTitleBold,
        card_title_color: cardTitleColor,
      }),
    });
    if (res.ok) {
      showToast("Đã lưu tùy chỉnh tiêu đề Thành tích thành công!", "success");
    } else {
      showToast("Lỗi khi lưu tùy chỉnh tiêu đề Thành tích", "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

async function savePublicationsTitles() {
  const pageTitle = document.getElementById("pub-page-title")?.value.trim() || "Ấn phẩm khoa học";
  const pageTitleEn = document.getElementById("pub-page-title-en")?.value.trim() || "Publications";
  const pageTitleBold = document.getElementById("pub-page-title-bold")?.checked ?? true;
  const pageTitleColor = document.getElementById("pub-page-title-color")?.value || "#8c0303";

  const yearTitleBold = document.getElementById("pub-year-title-bold")?.checked ?? true;
  const yearTitleColor = document.getElementById("pub-year-title-color")?.value || "#64748b";

  const articleTitleBold = document.getElementById("pub-article-title-bold")?.checked ?? true;
  const articleTitleColor = document.getElementById("pub-article-title-color")?.value || "#1e293b";

  showLoading();
  try {
    const res = await fetch(`${API}/pages/publications`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pageTitle,
        title_en: pageTitleEn,
        page_title_bold: pageTitleBold,
        page_title_color: pageTitleColor,

        year_title_bold: yearTitleBold,
        year_title_color: yearTitleColor,

        article_title_bold: articleTitleBold,
        article_title_color: articleTitleColor,
      }),
    });
    if (res.ok) {
      showToast("Đã lưu tùy chỉnh tiêu đề Ấn phẩm thành công!", "success");
    } else {
      showToast("Lỗi khi lưu tùy chỉnh tiêu đề Ấn phẩm", "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

function addGhUser() {
  document.getElementById("gh-users-list").insertAdjacentHTML("beforeend", `
    <div class="dynamic-item" style="padding:10px 16px">
      <div class="flex items-center justify-between">
        <input type="text" class="gh-user" value="" placeholder="username" style="flex:1;margin-right:10px" />
        <button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `);
}

function renderRepoItemHtml(r, isHidden) {
  return `
    <div class="dynamic-item repo-item ${isHidden ? 'is-hidden-repo' : ''}" data-repo="${escHtml(r)}" style="padding:10px 16px; margin-bottom:8px; border-radius:6px; transition:all 0.2s ease; ${isHidden ? 'opacity:0.65; background:rgba(239,68,68,0.06); border:1px dashed rgba(239,68,68,0.35);' : ''}">
      <div class="flex items-center justify-between" style="gap:10px">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
          <i class="fas fa-code-branch" style="color:${isHidden ? 'var(--text-muted)' : 'var(--accent-light)'};font-size:14px;flex-shrink:0"></i>
          <input type="text" class="gh-repo form-control" value="${escHtml(r)}" placeholder="owner/repo" style="flex:1;margin-right:0;${isHidden ? 'text-decoration:line-through;color:var(--text-muted);' : ''}" oninput="this.closest('.dynamic-item').dataset.repo = this.value.trim()" />
          <span class="repo-hidden-badge" style="display:${isHidden ? 'inline-flex' : 'none'};align-items:center;font-size:11px;padding:3px 8px;background:rgba(245,158,11,0.18);color:#f59e0b;border:1px solid rgba(245,158,11,0.4);border-radius:4px;white-space:nowrap;font-weight:600;">
            <i class="fas fa-eye-slash mr-1"></i> Đã ẩn trên UI
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button type="button" class="btn btn-sm ${isHidden ? 'btn-warning' : 'btn-outline-secondary'} btn-repo-visibility" onclick="toggleRepoItemVisibility(this)" title="${isHidden ? 'Nhấp để hiện lại repo này lên trang web UI' : 'Nhấp để ẩn repo này khỏi trang web UI'}" style="font-size:12px;padding:5px 12px;display:inline-flex;align-items:center;gap:5px;min-width:76px;justify-content:center;">
            <i class="fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}" style="color:${isHidden ? '#fff' : '#10b981'}"></i>
            <span class="btn-vis-text" style="font-weight:600;">${isHidden ? 'Đã ẩn' : 'Hiện'}</span>
          </button>
          <button type="button" class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove(); updateRepoCounters();" title="Xóa repo này">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function addGhRepo() {
  document.getElementById("gh-repos-list").insertAdjacentHTML("beforeend", renderRepoItemHtml("", false));
  updateRepoCounters();
}

async function toggleRepoItemVisibility(btn) {
  const item = btn.closest(".dynamic-item");
  if (!item) return;
  const input = item.querySelector(".gh-repo");
  const repoName = input ? input.value.trim() : "";
  if (!repoName) {
    showToast("Vui lòng nhập tên repository trước!", "warning");
    return;
  }

  const isCurrentlyHidden = item.classList.contains("is-hidden-repo");
  const willBeHidden = !isCurrentlyHidden;

  // Optimistic UI update
  setRepoItemVisualState(item, willBeHidden);
  updateRepoCounters();

  // Call API
  try {
    const res = await fetch(`${API}/repositories/toggle-visibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: repoName, hidden: willBeHidden })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Không thể cập nhật trạng thái");
    }
    showToast(result.message || (willBeHidden ? `Đã ẩn ${repoName}` : `Đã hiển thị ${repoName}`), willBeHidden ? "warning" : "success");
  } catch (err) {
    // Revert on error
    setRepoItemVisualState(item, isCurrentlyHidden);
    updateRepoCounters();
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

function setRepoItemVisualState(item, isHidden) {
  const input = item.querySelector(".gh-repo");
  const badge = item.querySelector(".repo-hidden-badge");
  const btn = item.querySelector(".btn-repo-visibility");
  const icon = item.querySelector(".fa-code-branch");

  if (isHidden) {
    item.classList.add("is-hidden-repo");
    item.style.opacity = "0.65";
    item.style.background = "rgba(239,68,68,0.06)";
    item.style.border = "1px dashed rgba(239,68,68,0.35)";
    if (input) {
      input.style.textDecoration = "line-through";
      input.style.color = "var(--text-muted)";
    }
    if (badge) badge.style.display = "inline-flex";
    if (icon) icon.style.color = "var(--text-muted)";
    if (btn) {
      btn.className = "btn btn-sm btn-warning btn-repo-visibility";
      btn.title = "Nhấp để hiện lại repo này lên trang web UI";
      btn.innerHTML = `<i class="fas fa-eye-slash" style="color:#fff"></i> <span class="btn-vis-text" style="font-weight:600;">Đã ẩn</span>`;
    }
  } else {
    item.classList.remove("is-hidden-repo");
    item.style.opacity = "1";
    item.style.background = "";
    item.style.border = "";
    if (input) {
      input.style.textDecoration = "none";
      input.style.color = "";
    }
    if (badge) badge.style.display = "none";
    if (icon) icon.style.color = "var(--accent-light)";
    if (btn) {
      btn.className = "btn btn-sm btn-outline-secondary btn-repo-visibility";
      btn.title = "Nhấp để ẩn repo này khỏi trang web UI";
      btn.innerHTML = `<i class="fas fa-eye" style="color:#10b981"></i> <span class="btn-vis-text" style="font-weight:600;">Hiện</span>`;
    }
  }
}

async function batchSetRepoVisibility(action) {
  const items = Array.from(document.querySelectorAll("#gh-repos-list .dynamic-item"));
  if (items.length === 0) return;

  const willHideAll = action === "hide_all";
  items.forEach(item => setRepoItemVisualState(item, willHideAll));
  updateRepoCounters();

  try {
    const res = await fetch(`${API}/repositories/batch-visibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Lỗi thao tác");
    showToast(willHideAll ? "Đã ẩn tất cả repositories khỏi trang UI!" : "Đã bật hiển thị tất cả repositories lên trang UI!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

function filterRepoList(type, clickedBtn) {
  const buttons = document.querySelectorAll(".repo-filter-btn");
  buttons.forEach(b => {
    b.classList.remove("active", "btn-primary");
    b.classList.add("btn-secondary");
  });
  if (clickedBtn) {
    clickedBtn.classList.remove("btn-secondary");
    clickedBtn.classList.add("active", "btn-primary");
  }

  const items = document.querySelectorAll("#gh-repos-list .dynamic-item");
  items.forEach(item => {
    const isHidden = item.classList.contains("is-hidden-repo");
    if (type === "all") {
      item.style.display = "";
    } else if (type === "visible") {
      item.style.display = isHidden ? "none" : "";
    } else if (type === "hidden") {
      item.style.display = isHidden ? "" : "none";
    }
  });
}

function updateRepoCounters() {
  const items = Array.from(document.querySelectorAll("#gh-repos-list .dynamic-item"));
  const total = items.length;
  const hiddenCount = items.filter(el => el.classList.contains("is-hidden-repo")).length;
  const visibleCount = total - hiddenCount;

  const countAll = document.getElementById("repo-count-all");
  const countVis = document.getElementById("repo-count-visible");
  const countHid = document.getElementById("repo-count-hidden");

  if (countAll) countAll.textContent = total;
  if (countVis) countVis.textContent = visibleCount;
  if (countHid) countHid.textContent = hiddenCount;
}

async function fetchGitHubReposFromApi() {
  const userEl = document.querySelector(".gh-user");
  const username = userEl ? userEl.value.trim() : "TruongNguyenThaiBinh77";
  if (!username) {
    showToast("Vui lòng nhập GitHub username trước!", "error");
    return;
  }
  showToast("Đang tải danh sách Repositories từ GitHub...", "info");
  try {
    // 1. Fetch user profile for repo count
    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (userRes.ok) {
        const uData = await userRes.json();
        const countInput = document.getElementById("repo-total-count");
        if (countInput && uData.public_repos) {
          countInput.value = uData.public_repos;
        }
      }
    } catch (_) {}

    // 2. Fetch list of repositories
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error("Không thể tải dữ liệu từ GitHub API");
    const repos = await res.json();

    // Giữ lại các repo đã bị ẩn trước đó nếu có
    const currentHidden = new Set(
      Array.from(document.querySelectorAll("#gh-repos-list .dynamic-item.is-hidden-repo .gh-repo"))
        .map(el => el.value.trim())
        .filter(Boolean)
    );

    const list = document.getElementById("gh-repos-list");
    list.innerHTML = "";
    repos.forEach(r => {
      const isHidden = currentHidden.has(r.full_name);
      list.insertAdjacentHTML("beforeend", renderRepoItemHtml(r.full_name, isHidden));
    });
    updateRepoCounters();
    showToast(`Đã tải thành công ${repos.length} repositories của ${username}! Nhấn "Lưu Repositories" để áp dụng.`, "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function saveRepositories() {
  const users = Array.from(document.querySelectorAll(".gh-user")).map((el) => el.value.trim()).filter(Boolean);
  const repos = Array.from(document.querySelectorAll("#gh-repos-list .gh-repo")).map((el) => el.value.trim()).filter(Boolean);
  const hiddenRepos = Array.from(document.querySelectorAll("#gh-repos-list .dynamic-item.is-hidden-repo .gh-repo"))
    .map((el) => el.value.trim())
    .filter(Boolean);

  const totalReposCount = document.getElementById("repo-total-count") ? parseInt(document.getElementById("repo-total-count").value, 10) || 21 : 21;
  const statsTheme = document.getElementById("repo-stats-theme") ? document.getElementById("repo-stats-theme").value : "light";
  const cardBgColor = document.getElementById("repo-card-bg-color") ? document.getElementById("repo-card-bg-color").value.trim() : "#ffffff";

  const pageTitle = document.getElementById("repo-page-title") ? document.getElementById("repo-page-title").value.trim() : "Lưu trữ";
  const pageTitleEn = document.getElementById("repo-page-title-en") ? document.getElementById("repo-page-title-en").value.trim() : "Repositories";
  const pageTitleBold = document.getElementById("repo-page-title-bold") ? document.getElementById("repo-page-title-bold").checked : true;
  const pageTitleColor = document.getElementById("repo-page-title-color") ? document.getElementById("repo-page-title-color").value.trim() : "#8c0303";

  const overviewTitle = document.getElementById("repo-overview-title") ? document.getElementById("repo-overview-title").value.trim() : "Tổng quan GitHub";
  const overviewTitleEn = document.getElementById("repo-overview-title-en") ? document.getElementById("repo-overview-title-en").value.trim() : "GitHub Overview";
  const overviewTitleBold = document.getElementById("repo-overview-title-bold") ? document.getElementById("repo-overview-title-bold").checked : true;
  const overviewTitleColor = document.getElementById("repo-overview-title-color") ? document.getElementById("repo-overview-title-color").value.trim() : "#8c0303";

  const reposTitle = document.getElementById("repo-repos-title") ? document.getElementById("repo-repos-title").value.trim() : "Kho lưu trữ nổi bật";
  const reposTitleEn = document.getElementById("repo-repos-title-en") ? document.getElementById("repo-repos-title-en").value.trim() : "Featured Repositories";
  const reposTitleBold = document.getElementById("repo-repos-title-bold") ? document.getElementById("repo-repos-title-bold").checked : true;
  const reposTitleColor = document.getElementById("repo-repos-title-color") ? document.getElementById("repo-repos-title-color").value.trim() : "#8c0303";

  const cardTitleColor = document.getElementById("repo-card-title-color") ? document.getElementById("repo-card-title-color").value.trim() : "#15803d";

  try {
    // 1. Update _data/repositories.yml
    await fetch(`${API}/repositories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        github_users: users,
        repo_description_lines_max: 2,
        total_repos_count: totalReposCount,
        stats_theme: statsTheme,
        card_bg_color: cardBgColor,
        card_border_color: "#e2e8f0",
        card_text_color: "#334155",
        github_repos: repos,
        hidden_repos: hiddenRepos,
        page_title: pageTitle,
        page_title_en: pageTitleEn,
        page_title_bold: pageTitleBold,
        page_title_color: pageTitleColor,
        overview_title: overviewTitle,
        overview_title_en: overviewTitleEn,
        overview_title_bold: overviewTitleBold,
        overview_title_color: overviewTitleColor,
        repos_title: reposTitle,
        repos_title_en: reposTitleEn,
        repos_title_bold: reposTitleBold,
        repos_title_color: reposTitleColor,
        card_title_color: cardTitleColor,
      }),
    });

    // 2. Synchronize title into _pages/repositories.md as well
    try {
      const pageRes = await fetch(`${API}/pages/repositories`).then(r => r.json());
      if (pageRes && pageRes.frontMatter) {
        await fetch(`${API}/pages/repositories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontMatter: {
              ...pageRes.frontMatter,
              title: pageTitle,
              title_en: pageTitleEn,
            },
            body: pageRes.body || ""
          })
        });
      }
    } catch (_) {}

    showToast("Đã lưu Repositories & cài đặt tiêu đề thành công!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// Teaching
// ============================================================================

async function loadTeachings() {
  const [teachings, pageRes] = await Promise.all([
    fetch(`${API}/teachings`).then((r) => r.json()).catch(() => []),
    fetch(`${API}/pages/teaching`).then((r) => r.json()).catch(() => ({}))
  ]);

  const pageTitleVi = pageRes.title || "Thành tích";
  const pageTitleEn = pageRes.title_en || "Achievements";
  const pageTitleBold = pageRes.page_title_bold !== false;
  const pageTitleColor = pageRes.page_title_color || "#8c0303";

  const honorsTitle = pageRes.honors_title || "Thành tích nổi bật";
  const honorsTitleEn = pageRes.honors_title_en || "Awards & Honors";
  const honorsTitleBold = pageRes.honors_title_bold !== false;
  const honorsTitleColor = pageRes.honors_title_color || "#1e293b";

  const certTitle = pageRes.certificates_title || "Chứng chỉ & Bằng cấp";
  const certTitleEn = pageRes.certificates_title_en || "Certificates";
  const certTitleBold = pageRes.certificates_title_bold !== false;
  const certTitleColor = pageRes.certificates_title_color || "#1e293b";

  const cardTitleBold = pageRes.card_title_bold !== false;
  const cardTitleColor = pageRes.card_title_color || "#1e293b";

  const listHtml = teachings.map((t) => {
    const fm = t.frontMatter || {};
    const isCert = Boolean(fm.is_certificate);
    const typeBadge = isCert
      ? '<span class="badge badge-primary"><i class="fas fa-certificate mr-1"></i> Chứng chỉ</span>'
      : '<span class="badge badge-warning"><i class="fas fa-award mr-1"></i> Thành tích</span>';

    return `
    <div class="dynamic-item">
      <div class="dynamic-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="flex: 1; padding-right: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="dynamic-item-title" style="font-size: 0.98rem; font-weight: 700; color: var(--text-primary);">${escHtml(fm.title || t.slug)}</span>
          ${typeBadge}
        </div>
        <div class="dynamic-item-actions" style="display: flex; gap: 6px; flex-shrink: 0;">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="editTeaching('${t.slug}')" title="Chỉnh sửa">
            <i class="fas fa-edit mr-1"></i> Sửa
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTeaching('${t.slug}', '${escHtml(fm.title || t.slug).replace(/'/g, "\\'")}')" title="Xóa thành tích này">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="text-muted text-sm" style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap; color: var(--text-secondary);">
        ${fm.year ? `<span><i class="far fa-calendar-alt mr-1" style="color: var(--accent-light);"></i> ${escHtml(String(fm.year))}</span>` : ''}
        ${fm.organization ? `<span><i class="fas fa-building mr-1" style="color: #38bdf8;"></i> ${escHtml(fm.organization)}</span>` : ''}
        <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-muted);"><i class="fas fa-file-code mr-1"></i> ${t.slug}.md</span>
      </div>
    </div>
  `;
  }).join("");

  renderContent(`
    <div class="section-intro">
      <h2>Thành tích & Chứng nhận</h2>
      <p>Quản lý danh sách các giải thưởng, học bổng và chứng nhận đạt được.</p>
    </div>

    <!-- 1. Tùy chỉnh Tiêu đề & Màu sắc Thành tích -->
    <div class="card mb-4">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h2><i class="fas fa-palette" style="color:var(--accent-light);margin-right:8px"></i> Tùy chỉnh Tiêu đề & Màu sắc (Titles & Styling)</h2>
        <button class="btn btn-primary btn-sm" onclick="saveTeachingsTitles()">
          <i class="fas fa-save mr-1"></i> Lưu cài đặt tiêu đề
        </button>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size: 0.88rem; margin-bottom: 22px;">
          Tùy chỉnh nội dung chữ, định dạng <strong>in đậm</strong> và <strong>lựa màu sắc</strong> cho từng tiêu đề trên trang Thành tích & Chứng nhận. Bạn có thể tự chọn màu bất kỳ hoặc <strong>tích chọn nhanh vào các ô màu đẹp có sẵn</strong> bên dưới (có dấu tích ✔️).
        </p>

        ${renderTitleStylingBlock({
          id: 'teach-page-title',
          num: '1',
          icon: 'fas fa-heading',
          label: 'Tiêu đề chính của trang (Page Title)',
          titleVi: pageTitleVi,
          titleEn: pageTitleEn,
          isBold: pageTitleBold,
          color: pageTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'teach-honors-title',
          num: '2',
          icon: 'fas fa-award',
          label: 'Tiêu đề mục: Thành tích nổi bật (Awards & Honors)',
          titleVi: honorsTitle,
          titleEn: honorsTitleEn,
          isBold: honorsTitleBold,
          color: honorsTitleColor,
          defaultColor: '#1e293b',
          previewIcon: 'fas fa-award',
        })}

        ${renderTitleStylingBlock({
          id: 'teach-certificates-title',
          num: '3',
          icon: 'fas fa-certificate',
          label: 'Tiêu đề mục: Chứng chỉ & Bằng cấp (Certificates)',
          titleVi: certTitle,
          titleEn: certTitleEn,
          isBold: certTitleBold,
          color: certTitleColor,
          defaultColor: '#1e293b',
          previewIcon: 'fas fa-certificate',
        })}

        ${renderTitleStylingBlock({
          id: 'teach-card-title',
          num: '4',
          icon: 'fas fa-id-card',
          label: 'Tiêu đề bên trong từng Card (Card Titles)',
          titleVi: 'Huy chương Vàng Olympic Tin học Sinh viên',
          showTextInputs: false,
          isBold: cardTitleBold,
          color: cardTitleColor,
          defaultColor: '#1e293b',
          previewIcon: 'fas fa-trophy',
        })}

        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="saveTeachingsTitles()">
            <i class="fas fa-save mr-1"></i> Lưu tùy chỉnh tiêu đề Thành tích
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap" style="gap: 10px;">
        <h2><i class="fas fa-award"></i> Danh sách thành tích</h2>
        <button type="button" class="btn btn-sm btn-primary" onclick="createTeaching()">
          <i class="fas fa-plus mr-1"></i> Thêm thành tích
        </button>
      </div>
      <div class="card-body">
        <div class="dynamic-list">
          ${listHtml || '<div class="empty-state"><i class="fas fa-award"></i><p>Chưa có dữ liệu nào</p></div>'}
        </div>
      </div>
    </div>
  `);
}

function autoGenerateTeachSlug(title) {
  const slugInput = document.getElementById('teach-slug');
  if (!slugInput || slugInput.dataset.manual === 'true') return;
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  slugInput.value = slug;
}

function createTeaching() {
  const currentYear = new Date().getFullYear();

  renderContent(`
    <div class="section-intro">
      <p><a href="#teachings" onclick="loadTeachings(); return false;" style="text-decoration: none; color: var(--accent-light);"><i class="fas fa-arrow-left mr-1"></i> Quay lại danh sách thành tích</a></p>
      <h2><i class="fas fa-plus-circle text-primary mr-1"></i> Thêm thành tích mới</h2>
      <p class="text-muted">Nhập thông tin giải thưởng, học bổng hoặc chứng chỉ mới để hiển thị trên website.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-info-circle"></i> Thông tin cơ bản</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <!-- Slug -->
          <div class="form-group full-width">
            <label>Slug (Định danh file, viết liền không dấu) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="teach-slug" placeholder="VD: quan-quan-hackathon-2024" oninput="this.dataset.manual = 'true'; this.value = this.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-')" />
            <small class="text-muted">Tên file lưu trữ: <code>_teachings/[slug].md</code> (Hệ thống sẽ tự động tạo từ Tiêu đề nếu để trống)</small>
          </div>

          <!-- Title Vi & En -->
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label>Tiêu đề (Tiếng Việt) <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="teach-title" placeholder="VD: Quán quân Cuộc thi Lập trình..." oninput="autoGenerateTeachSlug(this.value)" />
              </div>
              <div>
                <label>Tiêu đề (Tiếng Anh)</label>
                <input type="text" class="form-control" id="teach-title_en" placeholder="VD: Champion of Student Programming Contest..." />
              </div>
            </div>
          </div>

          <!-- Organization Vi & En -->
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label>Đơn vị trao giải / Tổ chức (Tiếng Việt)</label>
                <input type="text" class="form-control" id="teach-org" placeholder="VD: Trường Đại học FPT..." />
              </div>
              <div>
                <label>Đơn vị trao giải / Tổ chức (Tiếng Anh)</label>
                <input type="text" class="form-control" id="teach-org_en" placeholder="VD: FPT University..." />
              </div>
            </div>
          </div>

          <!-- Description Vi & En -->
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label>Mô tả ngắn gọn (Tiếng Việt)</label>
                <textarea class="form-control" id="teach-desc" rows="3" placeholder="Mô tả tóm tắt giải thưởng hoặc khóa học..."></textarea>
              </div>
              <div>
                <label>Mô tả ngắn gọn (Tiếng Anh)</label>
                <textarea class="form-control" id="teach-desc_en" rows="3" placeholder="Brief description of the achievement..."></textarea>
              </div>
            </div>
          </div>

          <!-- Phân loại & Năm -->
          <div class="form-group full-width" style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
            <div>
              <label>Phân loại mục hiển thị <span class="text-danger">*</span></label>
              <div style="display: flex; gap: 20px; align-items: center; margin-top: 8px;">
                <label style="display:flex; align-items:center; gap: 6px; cursor: pointer; font-weight: 500;">
                  <input type="radio" name="teach-is-certificate" value="false" checked>
                  <i class="fas fa-award text-warning"></i> Thành tích / Giải thưởng
                </label>
                <label style="display:flex; align-items:center; gap: 6px; cursor: pointer; font-weight: 500;">
                  <input type="radio" name="teach-is-certificate" value="true">
                  <i class="fas fa-certificate text-info"></i> Chứng chỉ / Bằng cấp
                </label>
              </div>
            </div>
            <div>
              <label>Năm đạt được (Year)</label>
              <input type="text" class="form-control" id="teach-year" value="${currentYear}" placeholder="VD: 2024" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Certificate Upload -->
    <div class="card mt-3">
      <div class="card-header">
        <h2><i class="fas fa-certificate"></i> Tệp chứng nhận (Certificate)</h2>
      </div>
      <div class="card-body">
        <div style="margin-bottom: 15px;">
          <label>URL / Tệp chứng nhận (Ảnh hoặc PDF)</label>
          <div style="display:flex; gap: 10px;">
            <input type="text" class="form-control" id="teach-certificate-url" placeholder="/assets/img/chung-nhan.jpg hoặc link Google Drive">
            <button type="button" class="btn btn-secondary" style="white-space: nowrap;" onclick="document.getElementById('teach-file-upload').click()">
              <i class="fas fa-upload mr-1"></i> Tải file lên
            </button>
            <input type="file" id="teach-file-upload" style="display:none;" accept="image/*,application/pdf" onchange="uploadCertificateFile(this)">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label class="custom-checkbox" style="display:flex; align-items:center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="teach-show-certificate" checked>
            <span class="checkmark"></span>
            Hiển thị nút "Xem chứng nhận" trên trang web
          </label>
        </div>
      </div>
    </div>

    <!-- Chi tiết Tiếng Anh & Tiếng Việt -->
    <div class="card mt-3">
      <div class="card-header">
        <h2><i class="fas fa-edit"></i> Nội dung chi tiết</h2>
      </div>
      <div class="card-body">
        <div class="form-group" style="margin-bottom: 16px;">
          <label>Nội dung chi tiết (Tiếng Anh - Markdown):</label>
          <textarea class="form-control" id="teach-content-en" rows="3" placeholder="Detailed content in English..."></textarea>
        </div>
        <div class="form-group">
          <label>Nội dung chi tiết (Tiếng Việt - Markdown):</label>
          <div id="editor-container"></div>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-footer d-flex justify-content-between align-items-center">
        <button type="button" class="btn btn-secondary" onclick="loadTeachings()">
          <i class="fas fa-arrow-left mr-1"></i> Quay lại
        </button>
        <button type="button" class="btn btn-primary" onclick="saveNewTeaching()">
          <i class="fas fa-save mr-1"></i> Lưu thành tích mới
        </button>
      </div>
    </div>
  `);

  initEditor('editor-container', '', '350px');
}

async function saveNewTeaching() {
  const title = document.getElementById("teach-title")?.value.trim();
  if (!title) {
    showToast("Vui lòng nhập Tiêu đề thành tích!", "warning");
    document.getElementById("teach-title")?.focus();
    return;
  }

  let slug = document.getElementById("teach-slug")?.value.trim();
  if (!slug) {
    slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `achievement-${Date.now()}`;
  }

  const fm = {
    layout: "post",
    title: title,
    title_en: document.getElementById("teach-title_en")?.value.trim() || "",
    organization: document.getElementById("teach-org")?.value.trim() || "",
    organization_en: document.getElementById("teach-org_en")?.value.trim() || "",
    description: document.getElementById("teach-desc")?.value.trim() || "",
    description_en: document.getElementById("teach-desc_en")?.value.trim() || "",
    year: document.getElementById("teach-year")?.value.trim() || new Date().getFullYear(),
    is_certificate: document.querySelector('input[name="teach-is-certificate"]:checked')?.value === "true",
    certificate: document.getElementById("teach-certificate-url")?.value.trim() || "",
    show_certificate: document.getElementById("teach-show-certificate")?.checked ?? true,
    content_en: document.getElementById("teach-content-en")?.value.trim() || ""
  };

  const body = (editors['editor-container'] ? editors['editor-container'].getMarkdown() : (currentEditor ? currentEditor.getMarkdown() : "")) || "";

  showLoading();
  try {
    let res = await fetch(`${API}/teachings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, frontMatter: fm, body }),
    });

    if (res.status === 404 || !res.ok) {
      res = await fetch(`${API}/teachings/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontMatter: fm, body }),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success !== false) {
      showToast("Đã thêm thành tích mới thành công!", "success");
      await loadTeachings();
    } else {
      showToast("Lỗi: " + (data.error || "Không thể lưu thành tích"), "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

async function deleteTeaching(slug, title = "") {
  if (!confirm(`Bạn có chắc chắn muốn xóa thành tích "${title || slug}"?\nThao tác này sẽ xóa vĩnh viễn file _teachings/${slug}.md.`)) {
    return;
  }

  showLoading();
  try {
    const res = await fetch(`${API}/teachings/${slug}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      showToast("Đã xóa thành tích thành công!", "success");
      await loadTeachings();
    } else {
      showToast("Lỗi: " + (data.error || "Không thể xóa"), "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

async function editTeaching(slug) {
  showLoading();
  const data = await fetch(`${API}/teachings/${slug}`).then((r) => r.json());
  hideLoading();

  const fm = data.frontMatter || {};

  renderContent(`
    <div class="section-intro">
      <p><a href="#teachings" onclick="loadTeachings(); return false;" style="text-decoration: none; color: var(--accent-light);"><i class="fas fa-arrow-left mr-1"></i> Quay lại danh sách thành tích</a></p>
      <h2><i class="fas fa-edit text-primary mr-1"></i> Chỉnh sửa thành tích</h2>
      <p class="text-muted">File: <code>_teachings/${slug}.md</code></p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-info-circle"></i> Thông tin thành tích</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Title (Tiếng Việt) <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="teach-title" value="${escHtml(fm.title || "")}" />
              </div>
              <div>
                <label>Title (Tiếng Anh)</label>
                <input type="text" class="form-control" id="teach-title_en" value="${escHtml(fm.title_en || "")}" />
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Organization (Đơn vị / Tiếng Việt)</label>
                <input type="text" class="form-control" id="teach-org" value="${escHtml(fm.organization || "")}" />
              </div>
              <div>
                <label>Organization (Đơn vị / Tiếng Anh)</label>
                <input type="text" class="form-control" id="teach-org_en" value="${escHtml(fm.organization_en || "")}" />
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Description (Mô tả / Tiếng Việt)</label>
                <textarea class="form-control" id="teach-desc" rows="3">${escHtml(fm.description || "")}</textarea>
              </div>
              <div>
                <label>Description (Mô tả / Tiếng Anh)</label>
                <textarea class="form-control" id="teach-desc_en" rows="3">${escHtml(fm.description_en || "")}</textarea>
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Phân loại</label>
            <div style="display: flex; gap: 20px; align-items: center; margin-top: 5px;">
              <label style="display:flex; align-items:center; gap: 5px; cursor: pointer;">
                <input type="radio" name="teach-is-certificate" value="false" ${!fm.is_certificate ? 'checked' : ''}>
                <i class="fas fa-award text-warning mr-1"></i> Thành tích / Giải thưởng
              </label>
              <label style="display:flex; align-items:center; gap: 5px; cursor: pointer;">
                <input type="radio" name="teach-is-certificate" value="true" ${fm.is_certificate ? 'checked' : ''}>
                <i class="fas fa-certificate text-info mr-1"></i> Chứng chỉ / Bằng cấp
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Năm đạt được (Year)</label>
            <input type="text" class="form-control" id="teach-year" value="${escHtml(String(fm.year || ""))}" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Certificate Upload -->
    <div class="card mt-3">
      <div class="card-header">
        <h2><i class="fas fa-certificate"></i> Tệp chứng nhận (Certificate)</h2>
      </div>
      <div class="card-body">
        <div style="margin-bottom: 15px;">
          <label>URL File Chứng nhận (PDF/Image)</label>
          <div style="display:flex; gap: 10px;">
            <input type="text" class="form-control" id="teach-certificate-url" value="${escHtml(fm.certificate || "")}" placeholder="/assets/img/cert.jpg hoặc link Google Drive">
            <button class="btn btn-secondary" style="white-space: nowrap;" onclick="document.getElementById('teach-file-upload').click()">
              <i class="fas fa-upload mr-1"></i> Tải file lên
            </button>
            <input type="file" id="teach-file-upload" style="display:none;" accept="image/*,application/pdf" onchange="uploadCertificateFile(this)">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label class="custom-checkbox" style="display:flex; align-items:center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="teach-show-certificate" ${fm.show_certificate ? 'checked' : ''}>
            <span class="checkmark"></span>
            Hiển thị nút "Xem chứng nhận" trên trang web
          </label>
        </div>
      </div>
    </div>

    <!-- Chi tiết Tiếng Anh & Tiếng Việt -->
    <div class="card mt-3">
      <div class="card-header">
        <h2><i class="fas fa-edit"></i> Nội dung chi tiết</h2>
      </div>
      <div class="card-body">
        <div class="form-group" style="margin-bottom: 16px;">
          <label>Nội dung chi tiết (Tiếng Anh - Markdown):</label>
          <textarea class="form-control" id="teach-content-en" rows="3" placeholder="Detailed content in English...">${escHtml(fm.content_en || "")}</textarea>
        </div>
        <div class="form-group">
          <label>Nội dung chi tiết (Tiếng Việt - Markdown):</label>
          <div id="editor-container"></div>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-footer d-flex justify-content-between align-items-center">
        <button class="btn btn-secondary" onclick="loadTeachings()">
          <i class="fas fa-arrow-left mr-1"></i> Quay lại
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-danger" onclick="deleteTeaching('${slug}', '${escHtml(fm.title || slug).replace(/'/g, "\\'")}')">
            <i class="fas fa-trash mr-1"></i> Xóa
          </button>
          <button class="btn btn-primary" onclick="saveTeaching('${slug}')">
            <i class="fas fa-save mr-1"></i> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  `);

  initEditor('editor-container', data.body || '', '350px');
}

async function saveTeaching(slug) {
  const original = await fetch(`${API}/teachings/${slug}`).then((r) => r.json());
  const fm = original.frontMatter || {};

  fm.title = document.getElementById("teach-title").value;
  fm.title_en = document.getElementById("teach-title_en").value;
  fm.organization = document.getElementById("teach-org").value;
  fm.organization_en = document.getElementById("teach-org_en").value;
  fm.description = document.getElementById("teach-desc").value;
  fm.description_en = document.getElementById("teach-desc_en").value;
  fm.year = document.getElementById("teach-year").value;
  fm.is_certificate = document.querySelector('input[name="teach-is-certificate"]:checked').value === "true";
  
  fm.certificate = document.getElementById("teach-certificate-url").value;
  fm.show_certificate = document.getElementById("teach-show-certificate").checked;
  fm.content_en = document.getElementById("teach-content-en") ? document.getElementById("teach-content-en").value : (fm.content_en || "");

  const body = (editors['editor-container'] ? editors['editor-container'].getMarkdown() : (currentEditor ? currentEditor.getMarkdown() : "")) || "";

  try {
    await fetch(`${API}/teachings/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body }),
    });
    showToast("Thành tích đã được lưu!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// News / Bài báo
// ============================================================================

async function loadNews() {
  const news = await fetch(`${API}/news`).then((r) => r.json());

  // Sort descending by date
  news.sort((a, b) => new Date(b.frontMatter.date || 0) - new Date(a.frontMatter.date || 0));

  const listHtml = news.map((n) => {
    const fm = n.frontMatter || {};
    const hasExternal = Boolean(fm.external_url || fm.link);
    const hasPdf = Boolean(fm.pdf || fm.pdf_url);

    return `
      <div class="dynamic-item" style="padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: 8px;">
        <div class="dynamic-item-header" style="align-items: flex-start; margin-bottom: 6px;">
          <div style="flex: 1; padding-right: 12px;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
              ${fm.journal ? `<span class="badge badge-danger" style="padding: 2px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 11px; height: 11px; background-color: currentColor; mask-image: url(/assets/img/journal-icon.png); -webkit-mask-image: url(/assets/img/journal-icon.png); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat;"></span> ${escHtml(fm.journal)}</span>` : ''}
              ${hasExternal ? `<span class="badge badge-primary" style="padding: 2px 8px; font-size: 11px;"><i class="fas fa-external-link-alt"></i> Link online</span>` : ''}
              ${hasPdf ? `<span class="badge badge-warning" style="padding: 2px 8px; font-size: 11px;"><i class="fas fa-file-pdf"></i> Có file PDF</span>` : ''}
            </div>
            <strong style="font-size: 15px; color: var(--text-primary); font-weight: 600;">${escHtml(fm.title || n.slug)}</strong>
            ${fm.title_en ? `<div style="font-size: 13px; color: var(--accent-light); margin-top: 2px;"><em>${escHtml(fm.title_en)}</em></div>` : ''}
            ${fm.description ? `<p style="font-size: 13px; color: var(--text-secondary); margin: 6px 0 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">${escHtml(fm.description)}</p>` : ''}
          </div>
          <div class="dynamic-item-actions" style="display: flex; gap: 6px; white-space: nowrap;">
            ${hasExternal ? `
              <a href="${escHtml(fm.external_url || fm.link)}" target="_blank" class="btn btn-sm btn-outline" title="Mở liên kết">
                <i class="fas fa-external-link-alt"></i>
              </a>
            ` : ''}
            ${hasPdf ? `
              <a href="${escHtml(fm.pdf || fm.pdf_url)}" target="_blank" class="btn btn-sm btn-outline text-danger" title="Xem PDF">
                <i class="fas fa-file-pdf"></i>
              </a>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="editNews('${n.slug}')">
              <i class="fas fa-edit"></i> Sửa
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteNews('${n.slug}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 12px; align-items: center; margin-top: 6px;">
          <span><i class="fas fa-calendar-alt"></i> ${escHtml(String(fm.date || ""))}</span>
          ${fm.author ? `<span><i class="fas fa-user-edit"></i> ${escHtml(fm.author)}</span>` : ''}
          <span style="opacity: 0.7;">Slug: ${escHtml(n.slug)}</span>
        </div>
      </div>
    `;
  }).join("");

  renderContent(`
    <div class="section-intro">
      <p>Quản lý bài báo khoa học, tin tức và công bố học thuật hiển thị trên trang chủ.</p>
    </div>

    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2><i class="fas fa-newspaper"></i> Danh sách bài báo / Tin tức</h2>
        <button class="btn btn-sm btn-primary" onclick="createNews()">
          <i class="fas fa-plus"></i> Thêm bài báo mới
        </button>
      </div>
      <div class="card-body">
        <div class="dynamic-list">
          ${listHtml || '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Chưa có bài báo hoặc tin tức nào</p></div>'}
        </div>
      </div>
    </div>
  `);
}

function createNews() {
  const todayStr = new Date().toISOString().split("T")[0];
  window._newsContentVi = '';
  window._newsContentEn = '';

  const defaultBadges = [
    { label: 'IF', value: 'Chưa có data' },
    { label: 'Q1', value: 'Chưa có data' },
    { label: 'FWCI', value: 'Chưa có data' },
    { label: 'ISSN', value: '' },
  ];
  const renderedBadgesHtml = renderMetricBadgeRowsHtml(defaultBadges);

  renderContent(`
    <div class="section-intro">
      <p>Thêm bài báo nghiên cứu / tin tức mới vào trang web.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-plus-circle"></i> Thêm bài báo / Tin tức mới</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Slug (tên định danh file, không dấu, ví dụ: <code>2026-10-12-quan-ly-nha-nuoc-tay-ninh</code>)</label>
            <input type="text" class="form-control" id="news-slug" placeholder="2026-10-12-bai-bao-moi" />
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Tiêu đề (Tiếng Việt) <span class="text-danger">*</span></label>
              <textarea class="form-control" id="news-title" rows="2" placeholder="Nhập tiêu đề bài báo..."></textarea>
            </div>
            <div>
              <label>Tiêu đề (Tiếng Anh)</label>
              <textarea class="form-control" id="news-title_en" rows="2" placeholder="Enter article title in English..."></textarea>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Ngày xuất bản (Date)</label>
              <input type="text" class="form-control" id="news-date" value="${todayStr} 12:00:00+0700" placeholder="YYYY-MM-DD HH:mm:ss+0700" />
            </div>
            <div>
              <label>Chế độ hiển thị</label>
              <select class="form-control" id="news-inline">
                <option value="false" selected>Bài báo / Công bố (Có tiêu đề, tóm tắt, nút xem PDF)</option>
                <option value="true">Thông báo ngắn (Inline)</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Tạp chí / Nơi xuất bản (Tiếng Việt)</label>
              <input type="text" class="form-control" id="news-journal" placeholder="Ví dụ: Tạp chí Quản lý nhà nước" oninput="updateNewsBadgePreview()" />
            </div>
            <div>
              <label>Tạp chí / Nơi xuất bản (Tiếng Anh)</label>
              <input type="text" class="form-control" id="news-journal_en" placeholder="Ví dụ: State Management Review" />
            </div>
          </div>

          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 600;"><i class="fas fa-palette text-warning"></i> Màu sắc huy hiệu Tạp chí (Journal Badge Style)</span>
              <span id="news-badge-preview" style="font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;">
                <span style="display: inline-block; width: 11px; height: 11px; background-color: currentColor; mask-image: url(/assets/img/journal-icon.png); -webkit-mask-image: url(/assets/img/journal-icon.png); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat;"></span> <span id="news-badge-preview-text">Tên tạp chí xem trước</span>
              </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
              <div>
                <label style="font-size: 12px;">Màu nền (Background)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-bg-color" value="#fef3c7" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-bg-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-bg-color-text" value="#fef3c7" oninput="document.getElementById('news-journal-bg-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
              <div>
                <label style="font-size: 12px;">Màu chữ (Text Color)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-color" value="#92400e" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-color-text" value="#92400e" oninput="document.getElementById('news-journal-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
              <div>
                <label style="font-size: 12px;">Màu viền (Border Color)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-border-color" value="#fcd34d" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-border-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-border-color-text" value="#fcd34d" oninput="document.getElementById('news-journal-border-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
            </div>
            <!-- Quick preset palettes -->
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 12px; color: var(--text-muted);">Mẫu sẵn:</span>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;" onclick="applyNewsBadgePreset('#fef3c7', '#92400e', '#fcd34d')">✨ Vàng đồng (QL Nhà nước)</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;" onclick="applyNewsBadgePreset('#e0f2fe', '#0369a1', '#7dd3fc')">☁️ Xanh thanh thiên (Thanh niên)</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;" onclick="applyNewsBadgePreset('#fee2e2', '#991b1b', '#fca5a5')">🔴 Đỏ truyền thống</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #dcfce7; color: #166534; border: 1px solid #86efac;" onclick="applyNewsBadgePreset('#dcfce7', '#166534', '#86efac')">🟢 Xanh ngọc</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;" onclick="applyNewsBadgePreset('#f3e8ff', '#6b21a8', '#d8b4fe')">🟣 Tím thạch anh</button>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
              <label>Tác giả (Author)</label>
              <input type="text" class="form-control" id="news-author" placeholder="Trương Nguyễn Thái Bình" />
            </div>
            <div>
              <label>Đơn vị (Institution)</label>
              <input type="text" class="form-control" id="news-institution" placeholder="Trường Đại học FPT" />
            </div>
            <div>
              <label>Email liên hệ</label>
              <input type="text" class="form-control" id="news-email" placeholder="binhtntse182370@fpt.edu.vn" />
            </div>
          </div>

          <div class="form-group full-width">
            <label><i class="fas fa-globe text-primary"></i> Link bài báo online (External URL)</label>
            <input type="url" class="form-control" id="news-external-url" placeholder="https://www.quanlynhanuoc.vn/..." />
            <small class="text-muted">Khi người dùng nhấp vào tiêu đề bài báo trên trang chủ, hệ thống sẽ mở link này sang tab mới.</small>
          </div>

          <!-- PDF Upload & Select -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.04); padding: 14px; border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.15);">
            <label><i class="fas fa-file-pdf text-danger"></i> Tệp toàn văn PDF (PDF File)</label>
            <div style="display: flex; gap: 10px; margin-top: 4px;">
              <input type="text" class="form-control" id="news-pdf" placeholder="/assets/pdf/ten-file.pdf" style="flex: 1;" />
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('news-pdf-file-input').click()">
                <i class="fas fa-upload"></i> Tải PDF lên
              </button>
              <button type="button" class="btn btn-outline" onclick="selectExistingPdf('news-pdf')">
                <i class="fas fa-folder-open"></i> Chọn file có sẵn
              </button>
              <input type="file" id="news-pdf-file-input" style="display: none;" accept="application/pdf" onchange="uploadNewsPdf(this, 'news-pdf')" />
            </div>
            <small class="text-muted">Khi có file PDF, trên trang chủ sẽ xuất hiện nút "Xem file PDF" để người xem đọc trực tiếp.</small>
          </div>

          <!-- Sidebox Section (Hình chữ nhật nhỏ Text + Hình chữ nhật to Ảnh minh họa) -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="font-weight: 600; font-size: 15px;">
                  <i class="fas fa-layer-group text-primary"></i> Khối thông tin & Ảnh minh họa dưới thời gian (Sidebox)
                </span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                  Khối hiển thị ở cột thời gian trang chủ: gồm 1 hình chữ nhật nhỏ (text) và 1 hình chữ nhật to (ảnh minh họa). Kích thước con tự co dãn 100% theo section mẹ.
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
              <!-- Cột bên trái: Các trường nhập liệu -->
              <div>
                <!-- 1. Kích thước section mẹ -->
                <div style="margin-bottom: 12px;">
                  <label style="font-size: 13px; font-weight: 600;">
                    <i class="fas fa-arrows-alt-h text-info"></i> Chiều rộng Section mẹ: <span id="news-sidebox-width-val" style="color: var(--primary-color, #2563eb); font-weight: 700;">115</span> px
                  </label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="range" class="form-range" id="news-sidebox-width-range" min="80" max="160" step="5" value="115" style="flex: 1;" oninput="document.getElementById('news-sidebox-width').value=this.value; document.getElementById('news-sidebox-width-val').textContent=this.value; updateNewsSideboxPreview();" />
                    <input type="number" class="form-control" id="news-sidebox-width" value="115" min="80" max="180" style="width: 75px; text-align: center;" oninput="document.getElementById('news-sidebox-width-range').value=this.value; document.getElementById('news-sidebox-width-val').textContent=this.value; updateNewsSideboxPreview();" />
                  </div>
                  <small class="text-muted" style="font-size: 11px;">Điều chỉnh kích thước section mẹ (gợi ý: 100px - 130px). Hai hình chữ nhật con tự động co giãn theo.</small>
                </div>

                <!-- 2. Hình chữ nhật nhỏ: Text & Màu sắc -->
                <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1); margin-bottom: 12px;">
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    <i class="fas fa-tag text-danger"></i> 1. Hình chữ nhật nhỏ (Nhãn Text)
                  </div>
                  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
                    <div>
                      <label style="font-size: 12px;">Nội dung Text (nhãn)</label>
                      <input type="text" class="form-control" id="news-sidebox-text" value="APIN" placeholder="Ví dụ: APIN hoặc TẠP CHÍ" oninput="updateNewsSideboxPreview()" />
                    </div>
                    <div>
                      <label style="font-size: 12px;">Màu nền nhãn</label>
                      <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="color" id="news-sidebox-bg-color" value="#800000" style="width: 38px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-sidebox-bg-color-text').value=this.value; updateNewsSideboxPreview();" />
                        <input type="text" class="form-control" id="news-sidebox-bg-color-text" value="#800000" style="font-size: 12px;" oninput="document.getElementById('news-sidebox-bg-color').value=this.value; updateNewsSideboxPreview();" />
                      </div>
                    </div>
                    <div>
                      <label style="font-size: 12px;">Màu chữ nhãn</label>
                      <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="color" id="news-sidebox-text-color" value="#ffffff" style="width: 38px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-sidebox-text-color-text').value=this.value; updateNewsSideboxPreview();" />
                        <input type="text" class="form-control" id="news-sidebox-text-color-text" value="#ffffff" style="font-size: 12px;" oninput="document.getElementById('news-sidebox-text-color').value=this.value; updateNewsSideboxPreview();" />
                      </div>
                    </div>
                  </div>
                  <!-- Nút mẫu nhanh màu nhãn -->
                  <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span style="font-size: 11px; color: var(--text-muted);">Mẫu màu nhãn:</span>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #800000; color: #fff; border: 1px solid #991b1b;" onclick="applySideboxBadgePreset('#800000', '#ffffff')">🔴 Đỏ APIN</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #1e3a8a; color: #fff; border: 1px solid #1d4ed8;" onclick="applySideboxBadgePreset('#1e3a8a', '#ffffff')">🔵 Xanh Navy</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #92400e; color: #fff; border: 1px solid #b45309;" onclick="applySideboxBadgePreset('#92400e', '#ffffff')">🟡 Vàng hổ phách</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #166534; color: #fff; border: 1px solid #15803d;" onclick="applySideboxBadgePreset('#166534', '#ffffff')">🟢 Xanh lá</button>
                  </div>
                </div>

                <!-- 3. Hình chữ nhật to: Ảnh minh họa -->
                <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1);">
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    <i class="fas fa-image text-success"></i> 2. Hình chữ nhật to (Ảnh minh họa / Bìa / Sơ đồ)
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" class="form-control" id="news-sidebox-image" value="/assets/img/TCQLNC.jpg" placeholder="TCQLNC.jpg hoặc /assets/img/ten-anh.jpg" style="flex: 1;" oninput="updateNewsSideboxPreview()" />
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('news-sidebox-image-file').click()" style="white-space:nowrap;">
                      <i class="fas fa-upload"></i> Tải ảnh lên
                    </button>
                    <button type="button" class="btn btn-outline" onclick="selectExistingImage('news-sidebox-image')" style="white-space:nowrap;">
                      <i class="fas fa-folder-open"></i> Chọn ảnh
                    </button>
                    <input type="file" id="news-sidebox-image-file" style="display: none;" accept="image/*" onchange="uploadNewsImage(this, 'news-sidebox-image')" />
                  </div>
                  <small class="text-muted" style="font-size: 11px; display: block; margin-top: 4px;">Có thể chọn ảnh bìa tạp chí, sơ đồ kỹ thuật, hình minh họa. Ảnh sẽ tự co giãn vừa vặn khung chữ nhật to.</small>
                </div>
              </div>

              <!-- Cột bên phải: Khung Xem Trước Trực Quan (Live Preview) -->
              <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px;">
                  <i class="fas fa-eye"></i> XEM TRƯỚC SECTION MẸ
                </div>
                <div style="display: flex; justify-content: center; align-items: center; min-height: 180px; background: rgba(255,255,255,0.02); border-radius: 6px; padding: 12px;">
                  <!-- Live Preview Box -->
                  <div id="sidebox-live-parent" style="width: 115px; display: flex; flex-direction: column; gap: 8px; transition: width 0.2s ease;">
                    <!-- Hình chữ nhật nhỏ preview -->
                    <div id="sidebox-live-small" style="width: 100%; background-color: #800000; color: #ffffff; padding: 5px 8px; border-radius: 6px; text-align: center; font-weight: 700; font-size: 0.82rem; line-height: 1.2; box-shadow: 0 2px 4px rgba(0,0,0,0.15); word-break: break-word;">
                      APIN
                    </div>
                    <!-- Hình chữ nhật to preview -->
                    <div id="sidebox-live-big" style="width: 100%; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 4px; display: flex; align-items: center; justify-content: center; min-height: 90px;">
                      <img id="sidebox-live-img" src="/assets/img/TCQLNC.jpg" alt="Preview" style="width: 100%; height: auto; max-height: 130px; object-fit: contain; border-radius: 4px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <span style="display: none; font-size: 11px; color: #94a3b8; padding: 10px;">Chưa có ảnh</span>
                    </div>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
                  Hiển thị chính xác như trên trang chủ
                </div>
              </div>
            </div>
          </div>

          <!-- Metric Badges Section (IF, Q1, FWCI, ISSN...) -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="font-weight: 600; font-size: 15px;">
                  <i class="fas fa-certificate text-warning"></i> Chỉ số bài báo & Huy hiệu khoa học (Metric Badges: IF, Q1, FWCI, ISSN...)
                </span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                  Hiển thị ngay trên mục "Xem file PDF" và "Đọc bài báo gốc". Nếu có số liệu thì điền vào, chưa có thì ghi <em>Chưa có data</em> hoặc <em>Chưa cập nhật</em>. Admin có thể tự do tạo thêm badge như <strong>ISSN</strong>, <strong>HĐCDGS</strong>, <strong>Scopus</strong>...
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted);">Thêm nhanh:</span>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('IF', 'Chưa có data')">+ IF</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('Q1', '(latest)')">+ Q1</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('FWCI', 'Chưa có data')">+ FWCI</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('ISSN', '')">+ ISSN</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('HĐCDGS', '')">+ HĐCDGS</button>
                <button type="button" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 3px 10px;" onclick="addMetricBadgeRow('', '')">
                  <i class="fas fa-plus"></i> Tạo badge mới
                </button>
              </div>
            </div>

            <!-- Danh sách các badge hiện tại -->
            <div id="metric-badges-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
              ${renderedBadgesHtml}
            </div>

            <!-- Live preview -->
            <div style="background: rgba(0,0,0,0.25); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                <i class="fas fa-eye text-info"></i> Xem trước hiển thị trên thẻ bài báo (Phía trên nút PDF & Đọc báo gốc):
              </div>
              <div id="metric-badges-preview" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-height: 32px; padding: 4px; border-radius: 4px;">
              </div>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Nội dung tóm tắt / Abstract (Tiếng Việt)</label>
              <textarea class="form-control" id="news-desc" rows="4" placeholder="Tóm tắt vài dòng tượng trưng hiển thị dưới tiêu đề..."></textarea>
            </div>
            <div>
              <label>Nội dung tóm tắt / Abstract (Tiếng Anh)</label>
              <textarea class="form-control" id="news-desc_en" rows="4" placeholder="Abstract summary in English..."></textarea>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <label>Nội dung chi tiết (Markdown / Tiếng Việt)</label>
              <textarea class="form-control" id="news-body" rows="6" placeholder="Toàn văn bài báo bằng định dạng Markdown..."></textarea>
            </div>
            <div>
              <label>Nội dung chi tiết (Markdown / Tiếng Anh)</label>
              <textarea class="form-control" id="news-body_en" rows="6" placeholder="Full article in English Markdown..."></textarea>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer" style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary" onclick="loadNews()">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
        <button class="btn btn-primary" onclick="saveNewNews()">
          <i class="fas fa-save"></i> Tạo bài báo mới
        </button>
      </div>
    </div>
  `);
  updateMetricBadgesPreview();
}

async function saveNewNews() {
  const slugInput = document.getElementById("news-slug").value.trim();
  const title = document.getElementById("news-title").value.trim();
  if (!slugInput) return showToast("Slug (tên file) không được để trống", "error");
  if (!title) return showToast("Tiêu đề bài báo không được để trống", "error");

  const slug = slugInput.replace(/\.md$/, "");

  const frontMatter = {
    layout: "post",
    title: title,
    title_en: document.getElementById("news-title_en") ? document.getElementById("news-title_en").value.trim() : "",
    date: document.getElementById("news-date").value.trim(),
    inline: document.getElementById("news-inline").value === "true",
    related_posts: false,
    journal: document.getElementById("news-journal") ? document.getElementById("news-journal").value.trim() : "",
    journal_en: document.getElementById("news-journal_en") ? document.getElementById("news-journal_en").value.trim() : "",
    journal_bg_color: document.getElementById("news-journal-bg-color-text") ? document.getElementById("news-journal-bg-color-text").value.trim() : "",
    journal_color: document.getElementById("news-journal-color-text") ? document.getElementById("news-journal-color-text").value.trim() : "",
    journal_border_color: document.getElementById("news-journal-border-color-text") ? document.getElementById("news-journal-border-color-text").value.trim() : "",
    sidebox_text: document.getElementById("news-sidebox-text") ? document.getElementById("news-sidebox-text").value.trim() : "",
    sidebox_bg_color: document.getElementById("news-sidebox-bg-color-text") ? document.getElementById("news-sidebox-bg-color-text").value.trim() : "",
    sidebox_text_color: document.getElementById("news-sidebox-text-color-text") ? document.getElementById("news-sidebox-text-color-text").value.trim() : "",
    sidebox_image: document.getElementById("news-sidebox-image") ? document.getElementById("news-sidebox-image").value.trim() : "",
    sidebox_width: document.getElementById("news-sidebox-width") ? parseInt(document.getElementById("news-sidebox-width").value, 10) || 115 : 115,
    author: document.getElementById("news-author") ? document.getElementById("news-author").value.trim() : "",
    institution: document.getElementById("news-institution") ? document.getElementById("news-institution").value.trim() : "",
    email: document.getElementById("news-email") ? document.getElementById("news-email").value.trim() : "",
    external_url: document.getElementById("news-external-url") ? document.getElementById("news-external-url").value.trim() : "",
    pdf: document.getElementById("news-pdf") ? document.getElementById("news-pdf").value.trim() : "",
    metric_badges: getMetricBadgesFromForm(),
    description: document.getElementById("news-desc") ? document.getElementById("news-desc").value.trim() : "",
    description_en: document.getElementById("news-desc_en") ? document.getElementById("news-desc_en").value.trim() : "",
  };

  const body_en = document.getElementById("news-body_en") ? document.getElementById("news-body_en").value.trim() : "";
  if (body_en) {
    frontMatter.content_en = body_en;
  }

  const body = document.getElementById("news-body") ? document.getElementById("news-body").value : "";

  showLoading();
  try {
    const resp = await fetch(`${API}/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, frontMatter, body }),
    });
    hideLoading();
    if (!resp.ok) {
      const err = await resp.json();
      return showToast(err.error || "Lỗi tạo bài báo", "error");
    }
    showToast("Bài báo đã được tạo thành công!", "success");
    loadNews();
  } catch (err) {
    hideLoading();
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function editNews(slug) {
  showLoading();
  const data = await fetch(`${API}/news/${slug}`).then((r) => r.json());
  hideLoading();

  const fm = data.frontMatter || {};
  const bodyVi = data.body || "";
  const bodyEn = fm.content_en || "";

  let jBg = fm.journal_bg_color || "";
  let jColor = fm.journal_color || "";
  let jBorder = fm.journal_border_color || "";

  if (!jBg || !jColor || !jBorder) {
    const jName = (fm.journal || "").toLowerCase();
    if (jName.includes("quản lý nhà nước") || jName.includes("quan ly nha nuoc")) {
      jBg = jBg || "#fef3c7";
      jColor = jColor || "#92400e";
      jBorder = jBorder || "#fcd34d";
    } else if (jName.includes("thanh niên") || jName.includes("thanh nien")) {
      jBg = jBg || "#e0f2fe";
      jColor = jColor || "#0369a1";
      jBorder = jBorder || "#7dd3fc";
    } else {
      jBg = jBg || "#fef3c7";
      jColor = jColor || "#92400e";
      jBorder = jBorder || "#fcd34d";
    }
  }

  const initialBadges = (fm.metric_badges && Array.isArray(fm.metric_badges) && fm.metric_badges.length > 0)
    ? fm.metric_badges
    : (
      slug.includes('quan-ly-nha-nuoc')
        ? [
            { label: 'IF', value: 'Chưa có data' },
            { label: 'Q', value: 'Chưa có data' },
            { label: 'FWCI', value: 'Chưa có data' },
            { label: 'ISSN', value: '0868-2828' },
            { label: 'HĐCDGS', value: '0.75 - 1.0' },
          ]
        : slug.includes('cong-nghiep-van-hoa')
        ? [
            { label: 'IF', value: 'Chưa có data' },
            { label: 'Q', value: 'Chưa có data' },
            { label: 'FWCI', value: 'Chưa có data' },
            { label: 'ISSN', value: '2354-1296' },
            { label: 'HĐCDGS', value: '0.5' },
          ]
        : [
            { label: 'IF', value: 'Chưa có data' },
            { label: 'Q1', value: 'Chưa có data' },
            { label: 'FWCI', value: 'Chưa có data' },
          ]
    );
  const renderedBadgesHtml = renderMetricBadgeRowsHtml(initialBadges);

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa bài báo: <strong>${escHtml(fm.title || slug)}</strong></p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-edit"></i> Chỉnh sửa bài báo</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Slug (tên định danh file)</label>
            <input type="text" class="form-control" id="news-slug" value="${escHtml(slug)}" readonly style="background:#f1f5f9;" />
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Tiêu đề (Tiếng Việt) <span class="text-danger">*</span></label>
              <textarea class="form-control" id="news-title" rows="2">${escHtml(fm.title || "")}</textarea>
            </div>
            <div>
              <label>Tiêu đề (Tiếng Anh)</label>
              <textarea class="form-control" id="news-title_en" rows="2">${escHtml(fm.title_en || "")}</textarea>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Ngày xuất bản (Date)</label>
              <input type="text" class="form-control" id="news-date" value="${escHtml(String(fm.date || ""))}" placeholder="YYYY-MM-DD HH:mm:ss+0700" />
            </div>
            <div>
              <label>Chế độ hiển thị</label>
              <select class="form-control" id="news-inline">
                <option value="false" ${!fm.inline ? "selected" : ""}>Bài báo / Công bố (Có tiêu đề, tóm tắt, nút xem PDF)</option>
                <option value="true" ${fm.inline ? "selected" : ""}>Thông báo ngắn (Inline)</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Tạp chí / Nơi xuất bản (Tiếng Việt)</label>
              <input type="text" class="form-control" id="news-journal" value="${escHtml(fm.journal || "")}" placeholder="Ví dụ: Tạp chí Quản lý nhà nước" oninput="updateNewsBadgePreview()" />
            </div>
            <div>
              <label>Tạp chí / Nơi xuất bản (Tiếng Anh)</label>
              <input type="text" class="form-control" id="news-journal_en" value="${escHtml(fm.journal_en || "")}" placeholder="Ví dụ: State Management Review" />
            </div>
          </div>

          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 600;"><i class="fas fa-palette text-warning"></i> Màu sắc huy hiệu Tạp chí (Journal Badge Style)</span>
              <span id="news-badge-preview" style="font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px; background: ${jBg}; color: ${jColor}; border: 1px solid ${jBorder};">
                <span style="display: inline-block; width: 11px; height: 11px; background-color: currentColor; mask-image: url(/assets/img/journal-icon.png); -webkit-mask-image: url(/assets/img/journal-icon.png); mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat;"></span> <span id="news-badge-preview-text">${escHtml(fm.journal || "Tên tạp chí xem trước")}</span>
              </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
              <div>
                <label style="font-size: 12px;">Màu nền (Background)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-bg-color" value="${jBg}" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-bg-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-bg-color-text" value="${jBg}" oninput="document.getElementById('news-journal-bg-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
              <div>
                <label style="font-size: 12px;">Màu chữ (Text Color)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-color" value="${jColor}" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-color-text" value="${jColor}" oninput="document.getElementById('news-journal-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
              <div>
                <label style="font-size: 12px;">Màu viền (Border Color)</label>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input type="color" id="news-journal-border-color" value="${jBorder}" style="width: 45px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-journal-border-color-text').value=this.value; updateNewsBadgePreview();" />
                  <input type="text" class="form-control" id="news-journal-border-color-text" value="${jBorder}" oninput="document.getElementById('news-journal-border-color').value=this.value; updateNewsBadgePreview();" />
                </div>
              </div>
            </div>
            <!-- Quick preset palettes -->
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 12px; color: var(--text-muted);">Mẫu sẵn:</span>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;" onclick="applyNewsBadgePreset('#fef3c7', '#92400e', '#fcd34d')">✨ Vàng đồng (QL Nhà nước)</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;" onclick="applyNewsBadgePreset('#e0f2fe', '#0369a1', '#7dd3fc')">☁️ Xanh thanh thiên (Thanh niên)</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;" onclick="applyNewsBadgePreset('#fee2e2', '#991b1b', '#fca5a5')">🔴 Đỏ truyền thống</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #dcfce7; color: #166534; border: 1px solid #86efac;" onclick="applyNewsBadgePreset('#dcfce7', '#166534', '#86efac')">🟢 Xanh ngọc</button>
              <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;" onclick="applyNewsBadgePreset('#f3e8ff', '#6b21a8', '#d8b4fe')">🟣 Tím thạch anh</button>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
              <label>Tác giả (Author)</label>
              <input type="text" class="form-control" id="news-author" value="${escHtml(fm.author || "")}" placeholder="Trương Nguyễn Thái Bình" />
            </div>
            <div>
              <label>Đơn vị (Institution)</label>
              <input type="text" class="form-control" id="news-institution" value="${escHtml(fm.institution || "")}" placeholder="Trường Đại học FPT" />
            </div>
            <div>
              <label>Email liên hệ</label>
              <input type="text" class="form-control" id="news-email" value="${escHtml(fm.email || "")}" placeholder="binhtntse182370@fpt.edu.vn" />
            </div>
          </div>

          <div class="form-group full-width">
            <label><i class="fas fa-globe text-primary"></i> Link bài báo online (External URL)</label>
            <div style="display: flex; gap: 10px;">
              <input type="url" class="form-control" id="news-external-url" value="${escHtml(fm.external_url || fm.link || "")}" placeholder="https://www.quanlynhanuoc.vn/..." style="flex:1;" />
              ${(fm.external_url || fm.link) ? `
                <a href="${escHtml(fm.external_url || fm.link)}" target="_blank" class="btn btn-outline" style="white-space:nowrap;">
                  <i class="fas fa-external-link-alt"></i> Mở thử link
                </a>
              ` : ''}
            </div>
            <small class="text-muted">Khi người dùng nhấp vào tiêu đề bài báo trên trang chủ, hệ thống sẽ mở link này sang tab mới.</small>
          </div>

          <!-- PDF Upload & Select -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.04); padding: 14px; border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.15);">
            <label><i class="fas fa-file-pdf text-danger"></i> Tệp toàn văn PDF (PDF File)</label>
            <div style="display: flex; gap: 10px; margin-top: 4px;">
              <input type="text" class="form-control" id="news-pdf" value="${escHtml(fm.pdf || fm.pdf_url || "")}" placeholder="/assets/pdf/ten-file.pdf" style="flex: 1;" />
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('news-pdf-file-input').click()">
                <i class="fas fa-upload"></i> Tải PDF lên
              </button>
              <button type="button" class="btn btn-outline" onclick="selectExistingPdf('news-pdf')">
                <i class="fas fa-folder-open"></i> Chọn file có sẵn
              </button>
              ${(fm.pdf || fm.pdf_url) ? `
                <a href="${escHtml(fm.pdf || fm.pdf_url)}" target="_blank" class="btn btn-outline text-danger" style="white-space:nowrap;">
                  <i class="fas fa-eye"></i> Xem file PDF
                </a>
              ` : ''}
              <input type="file" id="news-pdf-file-input" style="display: none;" accept="application/pdf" onchange="uploadNewsPdf(this, 'news-pdf')" />
            </div>
            <small class="text-muted">Khi có file PDF, trên trang chủ sẽ xuất hiện nút "Xem file PDF" để người xem đọc trực tiếp.</small>
          </div>

          <!-- Sidebox Section (Hình chữ nhật nhỏ Text + Hình chữ nhật to Ảnh minh họa) -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="font-weight: 600; font-size: 15px;">
                  <i class="fas fa-layer-group text-primary"></i> Khối thông tin & Ảnh minh họa dưới thời gian (Sidebox)
                </span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                  Khối hiển thị ở cột thời gian trang chủ: gồm 1 hình chữ nhật nhỏ (text) và 1 hình chữ nhật to (ảnh minh họa). Kích thước con tự co dãn 100% theo section mẹ.
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
              <!-- Cột bên trái: Các trường nhập liệu -->
              <div>
                <!-- 1. Kích thước section mẹ -->
                <div style="margin-bottom: 12px;">
                  <label style="font-size: 13px; font-weight: 600;">
                    <i class="fas fa-arrows-alt-h text-info"></i> Chiều rộng Section mẹ: <span id="news-sidebox-width-val" style="color: var(--primary-color, #2563eb); font-weight: 700;">${fm.sidebox_width || 115}</span> px
                  </label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="range" class="form-range" id="news-sidebox-width-range" min="80" max="160" step="5" value="${fm.sidebox_width || 115}" style="flex: 1;" oninput="document.getElementById('news-sidebox-width').value=this.value; document.getElementById('news-sidebox-width-val').textContent=this.value; updateNewsSideboxPreview();" />
                    <input type="number" class="form-control" id="news-sidebox-width" value="${fm.sidebox_width || 115}" min="80" max="180" style="width: 75px; text-align: center;" oninput="document.getElementById('news-sidebox-width-range').value=this.value; document.getElementById('news-sidebox-width-val').textContent=this.value; updateNewsSideboxPreview();" />
                  </div>
                  <small class="text-muted" style="font-size: 11px;">Điều chỉnh kích thước section mẹ (gợi ý: 100px - 130px). Hai hình chữ nhật con tự động co giãn theo.</small>
                </div>

                <!-- 2. Hình chữ nhật nhỏ: Text & Màu sắc -->
                <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1); margin-bottom: 12px;">
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    <i class="fas fa-tag text-danger"></i> 1. Hình chữ nhật nhỏ (Nhãn Text)
                  </div>
                  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
                    <div>
                      <label style="font-size: 12px;">Nội dung Text (nhãn)</label>
                      <input type="text" class="form-control" id="news-sidebox-text" value="${escHtml(fm.sidebox_text !== undefined ? fm.sidebox_text : (fm.badge_name || (slug.includes('quan-ly-nha-nuoc') ? 'APIN' : 'TẠP CHÍ')))}" placeholder="Ví dụ: APIN hoặc TẠP CHÍ" oninput="updateNewsSideboxPreview()" />
                    </div>
                    <div>
                      <label style="font-size: 12px;">Màu nền nhãn</label>
                      <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="color" id="news-sidebox-bg-color" value="${fm.sidebox_bg_color || fm.badge_color || (slug.includes('quan-ly-nha-nuoc') ? '#800000' : '#1e3a8a')}" style="width: 38px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-sidebox-bg-color-text').value=this.value; updateNewsSideboxPreview();" />
                        <input type="text" class="form-control" id="news-sidebox-bg-color-text" value="${fm.sidebox_bg_color || fm.badge_color || (slug.includes('quan-ly-nha-nuoc') ? '#800000' : '#1e3a8a')}" style="font-size: 12px;" oninput="document.getElementById('news-sidebox-bg-color').value=this.value; updateNewsSideboxPreview();" />
                      </div>
                    </div>
                    <div>
                      <label style="font-size: 12px;">Màu chữ nhãn</label>
                      <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="color" id="news-sidebox-text-color" value="${fm.sidebox_text_color || '#ffffff'}" style="width: 38px; height: 35px; padding: 0; cursor: pointer; border-radius: 4px;" oninput="document.getElementById('news-sidebox-text-color-text').value=this.value; updateNewsSideboxPreview();" />
                        <input type="text" class="form-control" id="news-sidebox-text-color-text" value="${fm.sidebox_text_color || '#ffffff'}" style="font-size: 12px;" oninput="document.getElementById('news-sidebox-text-color').value=this.value; updateNewsSideboxPreview();" />
                      </div>
                    </div>
                  </div>
                  <!-- Nút mẫu nhanh màu nhãn -->
                  <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span style="font-size: 11px; color: var(--text-muted);">Mẫu màu nhãn:</span>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #800000; color: #fff; border: 1px solid #991b1b;" onclick="applySideboxBadgePreset('#800000', '#ffffff')">🔴 Đỏ APIN</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #1e3a8a; color: #fff; border: 1px solid #1d4ed8;" onclick="applySideboxBadgePreset('#1e3a8a', '#ffffff')">🔵 Xanh Navy</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #92400e; color: #fff; border: 1px solid #b45309;" onclick="applySideboxBadgePreset('#92400e', '#ffffff')">🟡 Vàng hổ phách</button>
                    <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 1px 7px; border-radius: 10px; background: #166534; color: #fff; border: 1px solid #15803d;" onclick="applySideboxBadgePreset('#166534', '#ffffff')">🟢 Xanh lá</button>
                  </div>
                </div>

                <!-- 3. Hình chữ nhật to: Ảnh minh họa -->
                <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1);">
                  <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    <i class="fas fa-image text-success"></i> 2. Hình chữ nhật to (Ảnh minh họa / Bìa / Sơ đồ)
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" class="form-control" id="news-sidebox-image" value="${escHtml(fm.sidebox_image || fm.preview || (slug.includes('quan-ly-nha-nuoc') ? 'TCQLNC.jpg' : (slug.includes('cong-nghiep-van-hoa') ? 'TCTN.jpg' : '')))}" placeholder="TCQLNC.jpg hoặc /assets/img/ten-anh.jpg" style="flex: 1;" oninput="updateNewsSideboxPreview()" />
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('news-sidebox-image-file').click()" style="white-space:nowrap;">
                      <i class="fas fa-upload"></i> Tải ảnh lên
                    </button>
                    <button type="button" class="btn btn-outline" onclick="selectExistingImage('news-sidebox-image')" style="white-space:nowrap;">
                      <i class="fas fa-folder-open"></i> Chọn ảnh
                    </button>
                    <input type="file" id="news-sidebox-image-file" style="display: none;" accept="image/*" onchange="uploadNewsImage(this, 'news-sidebox-image')" />
                  </div>
                  <small class="text-muted" style="font-size: 11px; display: block; margin-top: 4px;">Có thể chọn ảnh bìa tạp chí, sơ đồ kỹ thuật, hình minh họa. Ảnh sẽ tự co giãn vừa vặn khung chữ nhật to.</small>
                </div>
              </div>

              <!-- Cột bên phải: Khung Xem Trước Trực Quan (Live Preview) -->
              <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px;">
                  <i class="fas fa-eye"></i> XEM TRƯỚC SECTION MẸ
                </div>
                <div style="display: flex; justify-content: center; align-items: center; min-height: 180px; background: rgba(255,255,255,0.02); border-radius: 6px; padding: 12px;">
                  <!-- Live Preview Box -->
                  <div id="sidebox-live-parent" style="width: ${fm.sidebox_width || 115}px; display: flex; flex-direction: column; gap: 8px; transition: width 0.2s ease;">
                    <!-- Hình chữ nhật nhỏ preview -->
                    <div id="sidebox-live-small" style="width: 100%; background-color: ${fm.sidebox_bg_color || fm.badge_color || (slug.includes('quan-ly-nha-nuoc') ? '#800000' : '#1e3a8a')}; color: ${fm.sidebox_text_color || '#ffffff'}; padding: 5px 8px; border-radius: 6px; text-align: center; font-weight: 700; font-size: 0.82rem; line-height: 1.2; box-shadow: 0 2px 4px rgba(0,0,0,0.15); word-break: break-word;">
                      ${escHtml(fm.sidebox_text !== undefined ? fm.sidebox_text : (fm.badge_name || (slug.includes('quan-ly-nha-nuoc') ? 'APIN' : 'TẠP CHÍ')))}
                    </div>
                    <!-- Hình chữ nhật to preview -->
                    <div id="sidebox-live-big" style="width: 100%; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 4px; display: flex; align-items: center; justify-content: center; min-height: 90px;">
                      <img id="sidebox-live-img" src="${(() => {
                        const img = fm.sidebox_image || fm.preview || (slug.includes('quan-ly-nha-nuoc') ? 'TCQLNC.jpg' : (slug.includes('cong-nghiep-van-hoa') ? 'TCTN.jpg' : ''));
                        if (img.startsWith('http') || img.startsWith('/')) return img;
                        return `/assets/img/${img}`;
                      })()}" alt="Preview" style="width: 100%; height: auto; max-height: 130px; object-fit: contain; border-radius: 4px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <span style="display: none; font-size: 11px; color: #94a3b8; padding: 10px;">Chưa có ảnh</span>
                    </div>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
                  Hiển thị chính xác như trên trang chủ
                </div>
              </div>
            </div>
          </div>

          <!-- Metric Badges Section (IF, Q1, FWCI, ISSN...) -->
          <div class="form-group full-width" style="background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="font-weight: 600; font-size: 15px;">
                  <i class="fas fa-certificate text-warning"></i> Chỉ số bài báo & Huy hiệu khoa học (Metric Badges: IF, Q1, FWCI, ISSN...)
                </span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                  Hiển thị ngay trên mục "Xem file PDF" và "Đọc bài báo gốc". Nếu có số liệu thì điền vào, chưa có thì ghi <em>Chưa có data</em> hoặc <em>Chưa cập nhật</em>. Admin có thể tự do tạo thêm badge như <strong>ISSN</strong>, <strong>HĐCDGS</strong>, <strong>Scopus</strong>...
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted);">Thêm nhanh:</span>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('IF', 'Chưa có data')">+ IF</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('Q1', '(latest)')">+ Q1</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('FWCI', 'Chưa có data')">+ FWCI</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('ISSN', '')">+ ISSN</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="addMetricBadgeRow('HĐCDGS', '')">+ HĐCDGS</button>
                <button type="button" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 3px 10px;" onclick="addMetricBadgeRow('', '')">
                  <i class="fas fa-plus"></i> Tạo badge mới
                </button>
              </div>
            </div>

            <!-- Danh sách các badge hiện tại -->
            <div id="metric-badges-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
              ${renderedBadgesHtml}
            </div>

            <!-- Live preview -->
            <div style="background: rgba(0,0,0,0.25); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                <i class="fas fa-eye text-info"></i> Xem trước hiển thị trên thẻ bài báo (Phía trên nút PDF & Đọc báo gốc):
              </div>
              <div id="metric-badges-preview" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-height: 32px; padding: 4px; border-radius: 4px;">
              </div>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Nội dung tóm tắt / Abstract (Tiếng Việt)</label>
              <textarea class="form-control" id="news-desc" rows="4" placeholder="Tóm tắt vài dòng tượng trưng hiển thị dưới tiêu đề...">${escHtml(fm.description || "")}</textarea>
            </div>
            <div>
              <label>Nội dung tóm tắt / Abstract (Tiếng Anh)</label>
              <textarea class="form-control" id="news-desc_en" rows="4" placeholder="Abstract summary in English...">${escHtml(fm.description_en || "")}</textarea>
            </div>
          </div>

          <div class="form-group full-width" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <label>Nội dung chi tiết (Markdown / Tiếng Việt)</label>
              <textarea class="form-control" id="news-body" rows="6" placeholder="Toàn văn bài báo bằng định dạng Markdown...">${escHtml(bodyVi)}</textarea>
            </div>
            <div>
              <label>Nội dung chi tiết (Markdown / Tiếng Anh)</label>
              <textarea class="form-control" id="news-body_en" rows="6" placeholder="Full article in English Markdown...">${escHtml(bodyEn)}</textarea>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer" style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary" onclick="loadNews()">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
        <button class="btn btn-primary" onclick="saveExistingNews('${slug}')">
          <i class="fas fa-save"></i> Lưu bài báo
        </button>
      </div>
    </div>
  `);
  updateMetricBadgesPreview();
}

async function saveExistingNews(slug) {
  const original = await fetch(`${API}/news/${slug}`).then((r) => r.json());
  const fm = original.frontMatter || {};

  fm.title = document.getElementById("news-title").value.trim();
  fm.title_en = document.getElementById("news-title_en").value.trim();
  fm.date = document.getElementById("news-date").value.trim();
  fm.inline = document.getElementById("news-inline").value === "true";
  fm.journal = document.getElementById("news-journal").value.trim();
  fm.journal_en = document.getElementById("news-journal_en").value.trim();
  fm.journal_bg_color = document.getElementById("news-journal-bg-color-text") ? document.getElementById("news-journal-bg-color-text").value.trim() : "";
  fm.journal_color = document.getElementById("news-journal-color-text") ? document.getElementById("news-journal-color-text").value.trim() : "";
  fm.journal_border_color = document.getElementById("news-journal-border-color-text") ? document.getElementById("news-journal-border-color-text").value.trim() : "";
  fm.sidebox_text = document.getElementById("news-sidebox-text") ? document.getElementById("news-sidebox-text").value.trim() : "";
  fm.sidebox_bg_color = document.getElementById("news-sidebox-bg-color-text") ? document.getElementById("news-sidebox-bg-color-text").value.trim() : "";
  fm.sidebox_text_color = document.getElementById("news-sidebox-text-color-text") ? document.getElementById("news-sidebox-text-color-text").value.trim() : "";
  fm.sidebox_image = document.getElementById("news-sidebox-image") ? document.getElementById("news-sidebox-image").value.trim() : "";
  fm.sidebox_width = document.getElementById("news-sidebox-width") ? parseInt(document.getElementById("news-sidebox-width").value, 10) || 115 : 115;
  fm.author = document.getElementById("news-author").value.trim();
  fm.institution = document.getElementById("news-institution").value.trim();
  fm.email = document.getElementById("news-email").value.trim();
  fm.external_url = document.getElementById("news-external-url").value.trim();
  fm.pdf = document.getElementById("news-pdf").value.trim();
  fm.metric_badges = getMetricBadgesFromForm();
  fm.description = document.getElementById("news-desc").value.trim();
  fm.description_en = document.getElementById("news-desc_en").value.trim();

  const body_en = document.getElementById("news-body_en").value.trim();
  if (body_en) {
    fm.content_en = body_en;
  } else {
    delete fm.content_en;
  }

  const body = document.getElementById("news-body").value;

  showLoading();
  try {
    await fetch(`${API}/news/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body }),
    });
    hideLoading();
    showToast("Bài báo đã được lưu thành công!", "success");
    loadNews();
  } catch (err) {
    hideLoading();
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function deleteNews(slug) {
  if (!confirm(`Bạn có chắc muốn xóa bài báo "${slug}"?`)) return;

  showLoading();
  try {
    await fetch(`${API}/news/${slug}`, { method: "DELETE" });
    hideLoading();
    showToast("Đã xóa bài báo thành công!", "success");
    loadNews();
  } catch (err) {
    hideLoading();
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// Journal Badge Style Helpers
function updateNewsBadgePreview() {
  const bgInput = document.getElementById("news-journal-bg-color-text");
  const colorInput = document.getElementById("news-journal-color-text");
  const borderInput = document.getElementById("news-journal-border-color-text");
  const journalInput = document.getElementById("news-journal");
  const badgePreview = document.getElementById("news-badge-preview");
  const badgeText = document.getElementById("news-badge-preview-text");

  if (!badgePreview) return;

  const bg = bgInput ? bgInput.value : "#fef3c7";
  const color = colorInput ? colorInput.value : "#92400e";
  const border = borderInput ? borderInput.value : "#fcd34d";
  const text = (journalInput && journalInput.value.trim()) ? journalInput.value.trim() : "Tên tạp chí xem trước";

  badgePreview.style.background = bg;
  badgePreview.style.color = color;
  badgePreview.style.borderColor = border;
  if (badgeText) badgeText.textContent = text;
}

function applyNewsBadgePreset(bg, color, border) {
  const bgEl = document.getElementById("news-journal-bg-color");
  const bgTextEl = document.getElementById("news-journal-bg-color-text");
  const colorEl = document.getElementById("news-journal-color");
  const colorTextEl = document.getElementById("news-journal-color-text");
  const borderEl = document.getElementById("news-journal-border-color");
  const borderTextEl = document.getElementById("news-journal-border-color-text");

  if (bgEl) bgEl.value = bg;
  if (bgTextEl) bgTextEl.value = bg;
  if (colorEl) colorEl.value = color;
  if (colorTextEl) colorTextEl.value = color;
  if (borderEl) borderEl.value = border;
  if (borderTextEl) borderTextEl.value = border;

  updateNewsBadgePreview();
}

// Sidebox (Small Rectangle Text + Big Rectangle Image) Helpers
function updateNewsSideboxPreview() {
  const widthInput = document.getElementById("news-sidebox-width");
  const textInput = document.getElementById("news-sidebox-text");
  const bgInput = document.getElementById("news-sidebox-bg-color-text");
  const textColorInput = document.getElementById("news-sidebox-text-color-text");
  const imgInput = document.getElementById("news-sidebox-image");

  const parentBox = document.getElementById("sidebox-live-parent");
  const smallRect = document.getElementById("sidebox-live-small");
  const liveImg = document.getElementById("sidebox-live-img");

  if (!parentBox) return;

  const w = widthInput ? parseInt(widthInput.value, 10) || 115 : 115;
  parentBox.style.width = `${w}px`;

  if (smallRect) {
    const text = textInput && textInput.value.trim() ? textInput.value.trim() : "APIN";
    const bg = bgInput ? bgInput.value : "#800000";
    const color = textColorInput ? textColorInput.value : "#ffffff";
    smallRect.textContent = text;
    smallRect.style.backgroundColor = bg;
    smallRect.style.color = color;
  }

  if (liveImg) {
    let imgSrc = imgInput && imgInput.value.trim() ? imgInput.value.trim() : "";
    if (imgSrc) {
      if (!imgSrc.startsWith("http") && !imgSrc.startsWith("/")) {
        imgSrc = `/assets/img/${imgSrc}`;
      }
      liveImg.src = imgSrc;
      liveImg.style.display = "block";
      if (liveImg.nextElementSibling) liveImg.nextElementSibling.style.display = "none";
    } else {
      liveImg.style.display = "none";
      if (liveImg.nextElementSibling) liveImg.nextElementSibling.style.display = "block";
    }
  }
}

function applySideboxBadgePreset(bg, color) {
  const bgEl = document.getElementById("news-sidebox-bg-color");
  const bgTextEl = document.getElementById("news-sidebox-bg-color-text");
  const colorEl = document.getElementById("news-sidebox-text-color");
  const colorTextEl = document.getElementById("news-sidebox-text-color-text");

  if (bgEl) bgEl.value = bg;
  if (bgTextEl) bgTextEl.value = bg;
  if (colorEl) colorEl.value = color;
  if (colorTextEl) colorTextEl.value = color;

  updateNewsSideboxPreview();
}

async function uploadNewsImage(inputEl, targetInputId = 'news-sidebox-image') {
  const file = inputEl.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  showLoading();
  try {
    const resp = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await resp.json();
    if (data.success) {
      document.getElementById(targetInputId).value = data.path;
      showToast('Tải lên hình ảnh thành công!', 'success');
      updateNewsSideboxPreview();
    } else {
      showToast(data.error || 'Lỗi tải ảnh', 'error');
    }
  } catch (err) {
    showToast(`Lỗi tải ảnh: ${err.message}`, 'error');
  } finally {
    hideLoading();
    inputEl.value = '';
  }
}

async function selectExistingImage(targetInputId = 'news-sidebox-image') {
  showLoading();
  try {
    const images = await fetch(`${API}/images`).then(r => r.json());
    hideLoading();
    if (!images || images.length === 0) {
      return showToast('Chưa có hình ảnh nào trong assets/img', 'info');
    }
    const currentVal = document.getElementById(targetInputId) ? document.getElementById(targetInputId).value : '';
    const options = images.map(f => {
      const fullPath = `/assets/img/${f}`;
      const isSelected = currentVal === fullPath || currentVal === f;
      return `<option value="${fullPath}" ${isSelected ? 'selected' : ''}>${f}</option>`;
    }).join('');

    const firstImg = images[0] ? `/assets/img/${images[0]}` : '';

    const modalHtml = `
      <div class="modal show" id="imageSelectModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:9999;">
        <div class="modal-dialog" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-light);padding:24px;border-radius:12px;max-width:480px;width:90%;box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h3 style="margin-top:0;font-size:17px;display:flex;align-items:center;gap:8px;color:var(--text-primary);">
            <i class="fas fa-image text-primary"></i> Chọn hình ảnh từ hệ thống
          </h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Các file nằm trong thư mục <code>assets/img/</code>:</p>
          <select id="selected-image-dropdown" class="form-control" style="margin-bottom:15px;width:100%;" onchange="
            const v = this.value;
            document.getElementById('modal-img-preview').src = v;
          ">
            ${options}
          </select>
          <div style="text-align: center; margin-bottom: 20px; background: var(--bg-input); padding: 12px; border-radius: 6px; border: 1px solid var(--border);">
            <img id="modal-img-preview" src="${firstImg}" style="max-height: 120px; max-width: 100%; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none'" />
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('imageSelectModal').remove()">Hủy</button>
            <button type="button" class="btn btn-primary" onclick="
              const selectedVal = document.getElementById('selected-image-dropdown').value;
              document.getElementById('${targetInputId}').value = selectedVal;
              updateNewsSideboxPreview();
              document.getElementById('imageSelectModal').remove();
            ">Chọn ảnh này</button>
          </div>
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  } catch (err) {
    hideLoading();
    showToast(`Lỗi: ${err.message}`, 'error');
  }
}

// PDF Upload Helpers for News & Certificates
async function uploadNewsPdf(inputEl, targetInputId = 'news-pdf') {
  const file = inputEl.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  showLoading();
  try {
    const resp = await fetch(`${API}/upload-file`, {
      method: 'POST',
      body: formData
    });
    const data = await resp.json();
    if (data.success) {
      document.getElementById(targetInputId).value = data.path;
      showToast('Tải lên PDF thành công!', 'success');
    } else {
      showToast(data.error || 'Lỗi tải file', 'error');
    }
  } catch (err) {
    showToast(`Lỗi tải file: ${err.message}`, 'error');
  } finally {
    hideLoading();
    inputEl.value = '';
  }
}

async function uploadCertificateFile(inputEl) {
  return uploadNewsPdf(inputEl, 'teach-certificate-url');
}

async function selectExistingPdf(targetInputId = 'news-pdf') {
  showLoading();
  try {
    const pdfs = await fetch(`${API}/pdfs`).then(r => r.json());
    hideLoading();
    if (!pdfs || pdfs.length === 0) {
      return showToast('Chưa có file PDF nào trong assets/pdf', 'info');
    }
    const currentVal = document.getElementById(targetInputId) ? document.getElementById(targetInputId).value : '';
    const options = pdfs.map(f => {
      const fullPath = `/assets/pdf/${f}`;
      return `<option value="${fullPath}" ${currentVal === fullPath ? 'selected' : ''}>${f}</option>`;
    }).join('');

    const modalHtml = `
      <div class="modal show" id="pdfSelectModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:9999;">
        <div class="modal-dialog" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-light);padding:24px;border-radius:12px;max-width:480px;width:90%;box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h3 style="margin-top:0;font-size:17px;display:flex;align-items:center;gap:8px;color:var(--text-primary);">
            <i class="fas fa-file-pdf text-danger"></i> Chọn file PDF từ hệ thống
          </h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">Các file nằm trong thư mục <code>assets/pdf/</code>:</p>
          <select id="selected-pdf-dropdown" class="form-control" style="margin-bottom:20px;width:100%;">
            ${options}
          </select>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('pdfSelectModal').remove()">Hủy</button>
            <button type="button" class="btn btn-primary" onclick="
              const selectedVal = document.getElementById('selected-pdf-dropdown').value;
              document.getElementById('${targetInputId}').value = selectedVal;
              document.getElementById('pdfSelectModal').remove();
              showToast('Đã chọn file PDF: ' + selectedVal, 'success');
            ">Chọn file này</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    hideLoading();
    showToast(`Lỗi: ${err.message}`, 'error');
  }
}

// ============================================================================
// Metric Badges (IF, Q1, FWCI, ISSN...) Helpers
// ============================================================================

function renderMetricBadgeRowsHtml(badges) {
  if (!badges || !Array.isArray(badges) || badges.length === 0) return '';
  return badges.map(b => {
    let lbl = '';
    let val = '';
    if (typeof b === 'string') {
      const parts = b.split(':');
      lbl = parts[0] ? parts[0].trim() : '';
      val = parts.slice(1).join(':').trim();
    } else if (b && typeof b === 'object') {
      lbl = b.label || b.name || '';
      val = b.value !== undefined ? b.value : '';
    }
    return `
      <div class="metric-badge-row" style="display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="flex: 1; display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 12px; color: var(--text-muted); width: 60px;">Tên badge:</span>
          <input type="text" class="form-control metric-badge-label" value="${escHtml(lbl)}" placeholder="VD: IF, Q1, FWCI, ISSN..." oninput="updateMetricBadgesPreview()" style="font-size: 13px;" />
        </div>
        <div style="flex: 2; display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 12px; color: var(--text-muted); width: 55px;">Chỉ số:</span>
          <input type="text" class="form-control metric-badge-value" value="${escHtml(val)}" placeholder="VD: 11.3 (latest), Chưa có data..." oninput="updateMetricBadgesPreview()" style="font-size: 13px;" />
        </div>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeMetricBadgeRow(this)" title="Xóa badge" style="padding: 6px 10px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
}

function addMetricBadgeRow(defaultLabel = '', defaultValue = '') {
  const container = document.getElementById("metric-badges-container");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "metric-badge-row";
  row.style.cssText = "display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);";
  row.innerHTML = `
    <div style="flex: 1; display: flex; gap: 6px; align-items: center;">
      <span style="font-size: 12px; color: var(--text-muted); width: 60px;">Tên badge:</span>
      <input type="text" class="form-control metric-badge-label" value="${escHtml(defaultLabel)}" placeholder="VD: IF, Q1, FWCI, ISSN..." oninput="updateMetricBadgesPreview()" style="font-size: 13px;" />
    </div>
    <div style="flex: 2; display: flex; gap: 6px; align-items: center;">
      <span style="font-size: 12px; color: var(--text-muted); width: 55px;">Chỉ số:</span>
      <input type="text" class="form-control metric-badge-value" value="${escHtml(defaultValue)}" placeholder="VD: 11.3 (latest), Chưa có data..." oninput="updateMetricBadgesPreview()" style="font-size: 13px;" />
    </div>
    <button type="button" class="btn btn-sm btn-danger" onclick="removeMetricBadgeRow(this)" title="Xóa badge" style="padding: 6px 10px;">
      <i class="fas fa-trash"></i>
    </button>
  `;
  container.appendChild(row);
  updateMetricBadgesPreview();
}

function removeMetricBadgeRow(btn) {
  const row = btn.closest(".metric-badge-row");
  if (row) {
    row.remove();
    updateMetricBadgesPreview();
  }
}

function getMetricBadgesFromForm() {
  const container = document.getElementById("metric-badges-container");
  if (!container) return [];
  const rows = container.querySelectorAll(".metric-badge-row");
  const badges = [];
  rows.forEach(row => {
    const labelInput = row.querySelector(".metric-badge-label");
    const valInput = row.querySelector(".metric-badge-value");
    const label = labelInput ? labelInput.value.trim() : "";
    const value = valInput ? valInput.value.trim() : "";
    if (label || value) {
      badges.push({ label, value });
    }
  });
  return badges;
}

function updateMetricBadgesPreview() {
  const preview = document.getElementById("metric-badges-preview");
  if (!preview) return;
  const badges = getMetricBadgesFromForm();
  if (badges.length === 0) {
    preview.innerHTML = `<span style="font-size: 12px; color: #94a3b8; font-style: italic;">Chưa có huy hiệu nào. Bấm các nút ở trên (+ IF, + Q1, + FWCI, + ISSN...) hoặc "Tạo badge mới" để thêm.</span>`;
    return;
  }
  preview.innerHTML = badges.map(b => {
    let text = '';
    const lbl = b.label || '';
    const val = b.value !== undefined ? b.value : '';
    if (lbl && val) {
      if (val.startsWith('(') || lbl.endsWith(':')) {
        text = `${lbl} ${val}`.trim();
      } else {
        text = `${lbl}: ${val}`;
      }
    } else {
      text = lbl || val;
    }
    return `
      <span style="display: inline-flex; align-items: center; padding: 3px 9px; background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem; font-weight: 700; line-height: 1.25; box-shadow: 0 1px 2px rgba(0,0,0,0.03); letter-spacing: 0.2px; white-space: nowrap;">
        ${escHtml(text)}
      </span>
    `;
  }).join('');
}

// ============================================================================
// Bibliography (raw BibTeX editor)
// ============================================================================

let bibEntries = [];
let bibPageRes = {};

async function loadBibliography() {
  showLoading();
  try {
    const [data, pageRes] = await Promise.all([
      fetch(`${API}/bibliography_parsed`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/pages/publications`).then((r) => r.json()).catch(() => ({}))
    ]);
    if (data.success) {
      bibEntries = data.entries || [];
    } else {
      showToast("Lỗi tải data: " + (data.error || "Không rõ"), "error");
      bibEntries = [];
    }
    bibPageRes = pageRes || {};
  } catch(e) {
    console.error(e);
    showToast("Lỗi kết nối", "error");
    bibEntries = [];
    bibPageRes = {};
  } finally {
    hideLoading();
  }

  renderBibliographyUI();
}

function renderBibliographyUI() {
  const pageTitleVi = bibPageRes.title || "Ấn phẩm khoa học";
  const pageTitleEn = bibPageRes.title_en || "Publications";
  const pageTitleBold = bibPageRes.page_title_bold !== false;
  const pageTitleColor = bibPageRes.page_title_color || "#8c0303";

  const yearTitleBold = bibPageRes.year_title_bold !== false;
  const yearTitleColor = bibPageRes.year_title_color || "#64748b";

  const articleTitleBold = bibPageRes.article_title_bold !== false;
  const articleTitleColor = bibPageRes.article_title_color || "#1e293b";

  let html = `
    <div class="section-intro">
      <p>Quản lý các ấn phẩm (Publications). Bạn có thể tải ảnh đại diện và tùy chỉnh nhãn màu.</p>
    </div>

    <!-- 1. Tùy chỉnh Tiêu đề & Màu sắc Ấn phẩm -->
    <div class="card mb-4">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h2><i class="fas fa-palette" style="color:var(--accent-light);margin-right:8px"></i> Tùy chỉnh Tiêu đề & Màu sắc (Titles & Styling)</h2>
        <button class="btn btn-primary btn-sm" onclick="savePublicationsTitles()">
          <i class="fas fa-save mr-1"></i> Lưu cài đặt tiêu đề
        </button>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size: 0.88rem; margin-bottom: 22px;">
          Tùy chỉnh nội dung chữ, định dạng <strong>in đậm</strong> và <strong>lựa màu sắc</strong> cho từng tiêu đề trên trang Ấn phẩm khoa học. Bạn có thể tự chọn màu bất kỳ hoặc <strong>tích chọn nhanh vào các ô màu đẹp có sẵn</strong> bên dưới (có dấu tích ✔️).
        </p>

        ${renderTitleStylingBlock({
          id: 'pub-page-title',
          num: '1',
          icon: 'fas fa-heading',
          label: 'Tiêu đề chính của trang (Page Title)',
          titleVi: pageTitleVi,
          titleEn: pageTitleEn,
          isBold: pageTitleBold,
          color: pageTitleColor,
        })}

        ${renderTitleStylingBlock({
          id: 'pub-year-title',
          num: '2',
          icon: 'fas fa-calendar-alt',
          label: 'Tiêu đề phân cách theo Năm (Year Dividers)',
          titleVi: '2026',
          showTextInputs: false,
          isBold: yearTitleBold,
          color: yearTitleColor,
          defaultColor: '#64748b',
          previewIcon: 'fas fa-calendar-day',
        })}

        ${renderTitleStylingBlock({
          id: 'pub-article-title',
          num: '3',
          icon: 'fas fa-newspaper',
          label: 'Tiêu đề từng bài báo / ấn phẩm (Article Titles)',
          titleVi: 'Hệ thống quản lý dữ liệu lớn phục vụ giám sát năng lượng thông minh',
          showTextInputs: false,
          isBold: articleTitleBold,
          color: articleTitleColor,
          defaultColor: '#1e293b',
          previewIcon: 'fas fa-file-alt',
        })}

        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="savePublicationsTitles()">
            <i class="fas fa-save mr-1"></i> Lưu tùy chỉnh tiêu đề Ấn phẩm
          </button>
        </div>
      </div>
    </div>

    <div class="text-right mb-3" style="display:flex; justify-content:flex-end;">
      <button class="btn btn-primary" onclick="addBibEntry()">
        <i class="fas fa-plus"></i> Thêm Ấn phẩm mới
      </button>
    </div>
  `;

  if (bibEntries.length === 0) {
    html += `<div class="card"><div class="card-body">Chưa có ấn phẩm nào.</div></div>`;
  }

  bibEntries.forEach((pub, index) => {
    const t = pub.entryTags || {};
    const key = pub.citationKey;
    const type = pub.entryType;

    html += `
    <div class="card mb-4">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;"><i class="fas fa-book"></i> ${type.toUpperCase()}: ${key}</h3>
        <button class="btn btn-danger btn-sm" style="padding:4px 8px; font-size:12px;" onclick="deleteBibEntry(${index})">Xóa</button>
      </div>
      <div class="card-body">
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <!-- Cột thông tin -->
          <div style="min-width: 0;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Title (Tiếng Việt)</label>
                <input type="text" class="form-control" id="bib-title-${index}" value="${escHtml(t.title || '')}">
              </div>
              <div>
                <label>Title (Tiếng Anh)</label>
                <input type="text" class="form-control" id="bib-title_en-${index}" value="${escHtml(t.title_en || '')}">
              </div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Author (Tiếng Việt)</label>
              <div id="bib-author-${index}"></div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Author (Tiếng Anh)</label>
              <div id="bib-author_en-${index}"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Year (Tiếng Việt)</label>
                <input type="text" class="form-control" id="bib-year-${index}" value="${escHtml(t.year || '')}">
              </div>
              <div>
                <label>Year (Tiếng Anh)</label>
                <input type="text" class="form-control" id="bib-year_en-${index}" value="${escHtml(t.year_en || '')}">
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Journal/Publisher (Tiếng Việt)</label>
                <input type="text" class="form-control" id="bib-publisher-${index}" value="${escHtml(t.journal || t.publisher || '')}">
              </div>
              <div>
                <label>Journal/Publisher (Tiếng Anh)</label>
                <input type="text" class="form-control" id="bib-publisher_en-${index}" value="${escHtml(t.journal_en || t.publisher_en || '')}">
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Citation Key (ID duy nhất)</label>
                <input type="text" class="form-control" id="bib-key-${index}" value="${key}">
              </div>
              <div>
                <label>Entry Type (article, book,...)</label>
                <select class="form-control" id="bib-type-${index}">
                  <option value="article" ${type==='article'?'selected':''}>article</option>
                  <option value="book" ${type==='book'?'selected':''}>book</option>
                  <option value="inproceedings" ${type==='inproceedings'?'selected':''}>inproceedings</option>
                  <option value="misc" ${type==='misc'?'selected':''}>misc</option>
                </select>
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>Tập / Số (Volume)</label>
                <input type="text" class="form-control" id="bib-volume-${index}" value="${escHtml(t.volume || '')}" placeholder="VD: 113">
              </div>
              <div>
                <label>Trang (Pages, VD: 71-73)</label>
                <input type="text" class="form-control" id="bib-pages-${index}" value="${escHtml(t.pages || '')}" placeholder="VD: 71--73">
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom:15px;">
              <div>
                <label>URL / Link bài báo gốc</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="form-control" id="bib-url-${index}" value="${escHtml(t.url || t.html || '')}">
                  ${(t.url || t.html) ? `<a href="${escHtml(t.url || t.html)}" target="_blank" class="btn btn-outline" title="Mở liên kết"><i class="fas fa-external-link-alt"></i></a>` : ''}
                </div>
              </div>
              <div>
                <label><i class="fas fa-file-pdf text-danger"></i> Tệp PDF (PDF File)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="form-control" id="bib-pdf-${index}" value="${escHtml(t.pdf || '')}" placeholder="/assets/pdf/ten-file.pdf">
                  <button type="button" class="btn btn-secondary" onclick="document.getElementById('bib-pdf-file-${index}').click()" title="Tải PDF mới"><i class="fas fa-upload"></i></button>
                  <button type="button" class="btn btn-outline" onclick="selectExistingPdf('bib-pdf-${index}')" title="Chọn từ danh sách"><i class="fas fa-folder-open"></i></button>
                  ${t.pdf ? `<a href="${escHtml(t.pdf)}" target="_blank" class="btn btn-outline text-danger" title="Xem PDF"><i class="fas fa-file-pdf"></i></a>` : ''}
                  <input type="file" id="bib-pdf-file-${index}" style="display: none;" accept="application/pdf" onchange="uploadNewsPdf(this, 'bib-pdf-${index}')" />
                </div>
              </div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Abstract (Tiếng Việt)</label>
              <div id="bib-abstract-${index}"></div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Abstract (Tiếng Anh)</label>
              <div id="bib-abstract_en-${index}"></div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Annotation (Ghi chú / Tiếng Việt)</label>
              <div id="bib-annotation-${index}"></div>
            </div>
            <div style="margin-bottom:15px; min-width: 0;">
              <label>Annotation (Ghi chú / Tiếng Anh)</label>
              <div id="bib-annotation_en-${index}"></div>
            </div>
          </div>

          <!-- Cột Hình ảnh & Nhãn -->
          <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
            <div style="margin-bottom:15px;">
              <label>Ảnh đại diện (Preview)</label>
              <div class="image-upload-wrapper" style="background: var(--bg-tertiary); padding: 10px; border-radius: var(--radius-sm);">
                <img id="bib-preview-img-${index}" src="${t.preview ? '/assets/img/' + t.preview : ''}" style="max-width:100%; max-height: 150px; display: ${t.preview ? 'block' : 'none'}; margin-bottom: 10px; border-radius: 4px;">
                <input type="hidden" id="bib-preview-${index}" value="${t.preview || ''}">
                <input type="file" id="bib-file-${index}" class="form-control" style="font-size:12px; padding:4px;" accept="image/*" onchange="uploadBibImage(${index})">
              </div>
            </div>
            <div style="margin-bottom:15px;">
              <label>Badge Name (Nhãn nổi bật / Tiếng Việt)</label>
              <input type="text" class="form-control" id="bib-badge-name-${index}" value="${escHtml(t.badge_name || '')}">
            </div>
            <div style="margin-bottom:15px;">
              <label>Badge Name (Nhãn nổi bật / Tiếng Anh)</label>
              <input type="text" class="form-control" id="bib-badge-name_en-${index}" value="${escHtml(t.badge_name_en || '')}">
            </div>
            <div style="margin-bottom:15px;">
              <label>Màu nền Nhãn (Badge Color)</label>
              <div style="display:flex; align-items:center; gap:10px;">
                 <input type="color" id="bib-badge-color-${index}" class="form-control" style="width: 50px; height: 35px; padding: 0;" value="${t.badge_color || '#1e3a8a'}">
                 <input type="text" class="form-control" id="bib-badge-color-text-${index}" value="${t.badge_color || '#1e3a8a'}" oninput="document.getElementById('bib-badge-color-${index}').value=this.value">
              </div>
            </div>
            <div style="margin-bottom:15px;">
              <label>Màu chữ Nhãn (Badge Text Color)</label>
              <div style="display:flex; align-items:center; gap:10px;">
                 <input type="color" id="bib-badge-text-color-${index}" class="form-control" style="width: 50px; height: 35px; padding: 0;" value="${t.badge_text_color || '#ffffff'}">
                 <input type="text" class="form-control" id="bib-badge-text-color-text-${index}" value="${t.badge_text_color || '#ffffff'}" oninput="document.getElementById('bib-badge-text-color-${index}').value=this.value">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  });

  html += `
    <div class="text-right mb-5" style="display:flex; justify-content:flex-end;">
      <button class="btn btn-primary btn-lg" onclick="saveBibliography()">
        <i class="fas fa-save"></i> Lưu Tất cả Ấn phẩm
      </button>
    </div>
  `;

  renderContent(html);

  // Sync color pickers & Init editors
  bibEntries.forEach((pub, i) => {
    const t = pub.entryTags || {};
    
    const cInput = document.getElementById(`bib-badge-color-${i}`);
    const cText = document.getElementById(`bib-badge-color-text-${i}`);
    if (cInput && cText) {
      cInput.addEventListener('input', e => cText.value = e.target.value);
    }
    
    const ctInput = document.getElementById(`bib-badge-text-color-${i}`);
    const ctText = document.getElementById(`bib-badge-text-color-text-${i}`);
    if (ctInput && ctText) {
      ctInput.addEventListener('input', e => ctText.value = e.target.value);
    }
    
    setTimeout(() => {
      initEditor(`bib-author-${i}`, t.author || "", "150px");
      initEditor(`bib-author_en-${i}`, t.author_en || "", "150px");
      initEditor(`bib-abstract-${i}`, t.abstract || "", "200px");
      initEditor(`bib-abstract_en-${i}`, t.abstract_en || "", "200px");
      initEditor(`bib-annotation-${i}`, t.annotation || "", "200px");
      initEditor(`bib-annotation_en-${i}`, t.annotation_en || "", "200px");
    }, 100);
  });
}

function addBibEntry() {
  bibEntries.unshift({
    citationKey: 'new_entry_' + Date.now(),
    entryType: 'article',
    entryTags: { title: 'Bài báo mới', year: new Date().getFullYear().toString() }
  });
  renderBibliographyUI();
}

function deleteBibEntry(idx) {
  if (confirm("Bạn có chắc muốn xóa ấn phẩm này?")) {
    bibEntries.splice(idx, 1);
    renderBibliographyUI();
  }
}

async function uploadBibImage(index) {
  const input = document.getElementById(`bib-file-${index}`);
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  
  const url = URL.createObjectURL(file);
  const croppedBlob = await showCropperModal(url, NaN); // NaN for free cropping ratio
  URL.revokeObjectURL(url);
  input.value = ""; // reset input
  
  if (!croppedBlob) return;

  const formData = new FormData();
  // We use .jpg extension since toBlob uses image/jpeg
  const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
  formData.append('image', croppedBlob, newFileName);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData }).then(r => r.json());
    if (res.success) {
      document.getElementById(`bib-preview-${index}`).value = res.filename;
      const preview = document.getElementById(`bib-preview-img-${index}`);
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      showToast("Tải ảnh lên thành công!", "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (e) {
    showToast("Lỗi mạng", "error");
  } finally {
    hideLoading();
  }
}

async function saveBibliography() {
  bibEntries.forEach((pub, i) => {
    const keyEl = document.getElementById(`bib-key-${i}`);
    if (!keyEl) return;
    pub.citationKey = keyEl.value.trim();
    const typeEl = document.getElementById(`bib-type-${i}`);
    pub.entryType = typeEl ? typeEl.value : (pub.entryType || 'article');
    
    if (!pub.entryTags) pub.entryTags = {};
    const oldTags = pub.entryTags;
    const titleEl = document.getElementById(`bib-title-${i}`);
    if (titleEl) oldTags.title = titleEl.value.trim();
    const titleEnEl = document.getElementById(`bib-title_en-${i}`);
    if (titleEnEl) oldTags.title_en = titleEnEl.value.trim();
    oldTags.author = editors[`bib-author-${i}`] ? editors[`bib-author-${i}`].getMarkdown().trim() : (oldTags.author || '');
    oldTags.author_en = editors[`bib-author_en-${i}`] ? editors[`bib-author_en-${i}`].getMarkdown().trim() : (oldTags.author_en || '');
    const yearEl = document.getElementById(`bib-year-${i}`);
    if (yearEl) oldTags.year = yearEl.value.trim();
    const yearEnEl = document.getElementById(`bib-year_en-${i}`);
    if (yearEnEl) oldTags.year_en = yearEnEl.value.trim();
    
    const publisherEl = document.getElementById(`bib-publisher-${i}`);
    const publisher = publisherEl ? publisherEl.value.trim() : '';
    const publisherEnEl = document.getElementById(`bib-publisher_en-${i}`);
    const publisher_en = publisherEnEl ? publisherEnEl.value.trim() : '';
    if (pub.entryType === 'book') {
      oldTags.publisher = publisher;
      oldTags.publisher_en = publisher_en;
      delete oldTags.journal;
      delete oldTags.journal_en;
    } else {
      oldTags.journal = publisher;
      oldTags.journal_en = publisher_en;
      delete oldTags.publisher;
      delete oldTags.publisher_en;
    }
    
    const volInput = document.getElementById(`bib-volume-${i}`);
    if (volInput) oldTags.volume = volInput.value.trim();
    const pagesInput = document.getElementById(`bib-pages-${i}`);
    if (pagesInput) oldTags.pages = pagesInput.value.trim();
    const pdfInput = document.getElementById(`bib-pdf-${i}`);
    if (pdfInput) oldTags.pdf = pdfInput.value.trim();

    const urlInput = document.getElementById(`bib-url-${i}`);
    if (urlInput) oldTags.url = urlInput.value.trim();
    const prevInput = document.getElementById(`bib-preview-${i}`);
    if (prevInput) oldTags.preview = prevInput.value.trim();
    const badgeInput = document.getElementById(`bib-badge-name-${i}`);
    if (badgeInput) oldTags.badge_name = badgeInput.value.trim();
    const badgeEnInput = document.getElementById(`bib-badge-name_en-${i}`);
    if (badgeEnInput) oldTags.badge_name_en = badgeEnInput.value.trim();
    const badgeColorInput = document.getElementById(`bib-badge-color-text-${i}`);
    if (badgeColorInput) oldTags.badge_color = badgeColorInput.value;
    const textColorInput = document.getElementById(`bib-badge-text-color-text-${i}`);
    if (textColorInput) {
      oldTags.badge_text_color = textColorInput.value;
    }

    oldTags.abstract = editors[`bib-abstract-${i}`] ? editors[`bib-abstract-${i}`].getMarkdown().trim() : (oldTags.abstract || '');
    oldTags.abstract_en = editors[`bib-abstract_en-${i}`] ? editors[`bib-abstract_en-${i}`].getMarkdown().trim() : (oldTags.abstract_en || '');
    oldTags.annotation = editors[`bib-annotation-${i}`] ? editors[`bib-annotation-${i}`].getMarkdown().trim() : (oldTags.annotation || '');
    oldTags.annotation_en = editors[`bib-annotation_en-${i}`] ? editors[`bib-annotation_en-${i}`].getMarkdown().trim() : (oldTags.annotation_en || '');

    for(let k in oldTags) {
       if(!oldTags[k]) delete oldTags[k];
    }
  });

  showLoading();
  try {
    const res = await fetch(`${API}/bibliography_parsed`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: bibEntries }),
    });

    const pubPageTitle = document.getElementById("pub-page-title");
    if (pubPageTitle) {
      await fetch(`${API}/pages/publications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pubPageTitle.value.trim(),
          title_en: document.getElementById("pub-page-title-en")?.value.trim() || "",
          page_title_bold: document.getElementById("pub-page-title-bold")?.checked ?? true,
          page_title_color: document.getElementById("pub-page-title-color")?.value || "#8c0303",

          year_title_bold: document.getElementById("pub-year-title-bold")?.checked ?? true,
          year_title_color: document.getElementById("pub-year-title-color")?.value || "#64748b",

          article_title_bold: document.getElementById("pub-article-title-bold")?.checked ?? true,
          article_title_color: document.getElementById("pub-article-title-color")?.value || "#1e293b",
        }),
      });
    }

    if (res.ok) {
      showToast("Đã lưu các ấn phẩm và tùy chỉnh tiêu đề thành công!", "success");
    } else {
      showToast("Lỗi khi lưu", "error");
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

// ============================================================================
// Resume JSON
// ============================================================================

async function loadResumeJson() {
  const data = await fetch(`${API}/resume`).then((r) => r.json());

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa Resume JSON data (dùng cho CV trang rendercv/jsonresume).</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-id-card"></i> Thông tin cơ bản</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="resume-name" value="${escHtml(data.basics?.name || "")}" />
          </div>
          <div class="form-group">
            <label>Label</label>
            <input type="text" id="resume-label" value="${escHtml(data.basics?.label || "")}" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="text" id="resume-email" value="${escHtml(data.basics?.email || "")}" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="text" id="resume-phone" value="${escHtml(data.basics?.phone || "")}" />
          </div>
          <div class="form-group full-width">
            <label>Summary</label>
            <textarea id="resume-summary" rows="3">${escHtml(data.basics?.summary || "")}</textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-code"></i> Raw JSON Editor</h2>
        <span class="text-muted text-sm">Edit trực tiếp JSON cho các section phức tạp</span>
      </div>
      <div class="card-body">
        <textarea id="resume-raw" class="code-editor" rows="20">${escHtml(JSON.stringify(data, null, 2))}</textarea>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary" onclick="saveResumeJson()">
          <i class="fas fa-save"></i> Lưu Resume
        </button>
      </div>
    </div>
  `);
}

async function saveResumeJson() {
  const raw = document.getElementById("resume-raw").value;
  try {
    const data = JSON.parse(raw);
    // Update basics from form fields
    data.basics = data.basics || {};
    data.basics.name = document.getElementById("resume-name").value;
    data.basics.label = document.getElementById("resume-label").value;
    data.basics.email = document.getElementById("resume-email").value;
    data.basics.phone = document.getElementById("resume-phone").value;
    data.basics.summary = document.getElementById("resume-summary").value;

    await fetch(`${API}/resume`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    showToast("Resume JSON đã được lưu!", "success");
  } catch (err) {
    if (err instanceof SyntaxError) {
      showToast("JSON không hợp lệ! Kiểm tra lại format.", "error");
    } else {
      showToast(`Lỗi: ${err.message}`, "error");
    }
  }
}

// ============================================================================
// Utility
// ============================================================================

function escHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderDynamicList(items, prefix, renderer) {
  if (!items || !items.length) return '';
  return items.map((item, index) => renderer(item, index)).join('');
}

function addDynamicItem(listId, renderFn) {
  const list = document.getElementById(listId);
  if (!list) return;
  const index = list.children.length;
  list.insertAdjacentHTML('beforeend', renderFn({}, index));
  initSortable(listId);
}

function initSortable(listId, onEndCb) {
  const el = document.getElementById(listId);
  if (!el) return;
  if (typeof Sortable !== 'undefined') {
    Sortable.create(el, {
      handle: '.handle',
      animation: 150,
      onEnd: () => {
        if (typeof onEndCb === 'function') onEndCb();
      }
    });
  }
}

// ============================================================================
// Initial Load
// ============================================================================

async function loadNavNames() {
  try {
    const config = await fetch(`${API}/config`).then(r => r.json());
    if (config.nav_names) {
      for (const [key, value] of Object.entries(config.nav_names)) {
        const label = document.getElementById(`nav-label-${key}`);
        if (label && value) {
          label.innerText = value;
        }
      }
    }
  } catch (e) {
    console.error("Error loading nav names", e);
  }
}

function showCustomPrompt(message, defaultValue) {
  return new Promise((resolve) => {
    const modal = document.getElementById('customPromptModal');
    const title = document.getElementById('customPromptTitle');
    const input = document.getElementById('customPromptInput');
    const btnCancel = document.getElementById('customPromptCancel');
    const btnConfirm = document.getElementById('customPromptConfirm');

    title.innerText = message;
    input.value = defaultValue;
    modal.classList.add('show');
    input.focus();

    const cleanup = () => {
      modal.classList.remove('show');
      btnCancel.removeEventListener('click', onCancel);
      btnConfirm.removeEventListener('click', onConfirm);
      input.removeEventListener('keydown', onKeydown);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onConfirm = () => {
      cleanup();
      resolve(input.value);
    };

    const onKeydown = (e) => {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    };

    btnCancel.addEventListener('click', onCancel);
    btnConfirm.addEventListener('click', onConfirm);
    input.addEventListener('keydown', onKeydown);
  });
}

async function editNavName(event, key) {
  event.stopPropagation();
  const labelEl = document.getElementById(`nav-label-${key}`);
  const currentName = labelEl.innerText;
  const newName = await showCustomPrompt(`Nhập tên mới cho mục "${currentName}":`, currentName);
  if (newName !== null && newName.trim() !== "") {
    showLoading();
    try {
      const config = await fetch(`${API}/config`).then(r => r.json());
      if (!config.nav_names) config.nav_names = {};
      config.nav_names[key] = newName.trim();
      
      const resp = await fetch(`${API}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (resp.ok) {
        labelEl.innerText = newName.trim();
        showToast("Đã cập nhật tên mục điều hướng!", "success");
      } else {
        showToast("Có lỗi xảy ra khi lưu", "error");
      }
    } catch (e) {
      showToast("Lỗi mạng", "error");
    } finally {
      hideLoading();
    }
  }
}

loadNavNames();
initAdminRouter();

async function uploadProfileImage(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  
  const url = URL.createObjectURL(file);
  const croppedBlob = await showCropperModal(url, 1); // 1:1 aspect ratio for profile images
  URL.revokeObjectURL(url);
  input.value = ""; // reset input
  
  if (!croppedBlob) return;
  
  const formData = new FormData();
  const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
  formData.append('image', croppedBlob, newFileName);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    if (res.success) {
      document.getElementById('about-image').value = res.filename;
      const preview = document.getElementById('about-image-preview');
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      showToast("Tải ảnh lên thành công!", "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (e) {
    showToast("Lỗi: " + e.message, "error");
  } finally {
    hideLoading();
  }
}

async function uploadEducationLogo(input) {
  return uploadEduLogoFile(input);
}

// ============================================================================
// Cropper Modal Utility
// ============================================================================
let currentCropper = null;

function showCropperModal(imageUrl, aspectRatio = NaN) {
  return new Promise((resolve) => {
    const modal = document.getElementById('cropperModal');
    const image = document.getElementById('cropperImage');
    const btnCancel = document.getElementById('cropperCancel');
    const btnConfirm = document.getElementById('cropperConfirm');

    image.src = imageUrl;
    modal.classList.add('show');

    // Cần 1 khoảng delay nhỏ để image render trước khi init cropper, 
    // hoặc có thể init ngay lập tức. setTimeout(..., 10) giúp render mượt hơn.
    setTimeout(() => {
      if (currentCropper) {
        currentCropper.destroy();
      }

      currentCropper = new Cropper(image, {
        aspectRatio: aspectRatio,
        viewMode: 1,
        autoCropArea: 1,
      });
    }, 50);

    const cleanup = () => {
      modal.classList.remove('show');
      if (currentCropper) {
        currentCropper.destroy();
        currentCropper = null;
      }
      btnCancel.removeEventListener('click', onCancel);
      btnConfirm.removeEventListener('click', onConfirm);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onConfirm = () => {
      if (!currentCropper) return;
      currentCropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
      }).toBlob((blob) => {
        cleanup();
        resolve(blob);
      }, 'image/jpeg', 0.85);
    };

    btnCancel.addEventListener('click', onCancel);
    btnConfirm.addEventListener('click', onConfirm);
  });
}
async function uploadHeaderLogo(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    if (res.success) {
      document.getElementById('cfg-header_logo').value = res.filename;
      const preview = document.getElementById('cfg-header_logo_preview');
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      showToast("Tải logo lên thành công!", "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (e) {
    showToast("Lỗi: " + e.message, "error");
  } finally {
    hideLoading();
  }
}

async function uploadGlobalBgImage(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    showLoading();
    const resp = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });
    const res = await resp.json();
    if (res.success) {
      document.getElementById('cfg-global_bg_image').value = res.filename;
      const preview = document.getElementById('cfg-global_bg_image_preview');
      preview.src = `/assets/img/${res.filename}`;
      preview.style.display = 'block';
      
      // Auto-save global_bg_image instantly
      const currentData = await fetch(`${API}/config`).then(r => r.json());
      currentData.global_bg_image = res.filename;
      await fetch(`${API}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      
      showToast("Tải ảnh nền lên thành công!", "success");
    } else {
      showToast(res.error || "Tải ảnh lỗi", "error");
    }
  } catch (err) {
    showToast("Lỗi mạng", "error");
  } finally {
    hideLoading();
  }
}

async function uploadNavbarBgImage(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    showLoading();
    const resp = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });
    const res = await resp.json();
    if (res.success) {
      document.getElementById('cfg-navbar_bg_image').value = res.filename;
      const preview = document.getElementById('cfg-navbar_bg_image_preview');
      preview.src = `/assets/img/${res.filename}`;
      preview.style.display = 'block';
      
      const currentData = await fetch(`${API}/config`).then(r => r.json());
      currentData.navbar_bg_image = res.filename;
      await fetch(`${API}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      
      showToast("Tải ảnh nền menu lên thành công!", "success");
    } else {
      showToast(res.error || "Tải ảnh lỗi", "error");
    }
  } catch (err) {
    showToast("Lỗi mạng", "error");
  } finally {
    hideLoading();
  }
}

async function removeGlobalBgImage() {
  document.getElementById('cfg-global_bg_image').value = '';
  document.getElementById('cfg-global_bg_image_preview').style.display = 'none';
  
  showLoading();
  try {
    const currentData = await fetch(`${API}/config`).then(r => r.json());
    currentData.global_bg_image = '';
    await fetch(`${API}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });
    showToast("Đã xóa ảnh nền trang web!", "success");
  } catch (err) {
    showToast("Lỗi khi xóa", "error");
  } finally {
    hideLoading();
  }
}

async function removeNavbarBgImage() {
  document.getElementById('cfg-navbar_bg_image').value = '';
  document.getElementById('cfg-navbar_bg_image_preview').style.display = 'none';
  
  showLoading();
  try {
    const currentData = await fetch(`${API}/config`).then(r => r.json());
    currentData.navbar_bg_image = '';
    await fetch(`${API}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });
    showToast("Đã xóa ảnh nền Menu!", "success");
  } catch (err) {
    showToast("Lỗi khi xóa", "error");
  } finally {
    hideLoading();
  }
}

let moreInfoRowsData = [];

function renderMoreInfoRows() {
  const container = document.getElementById("more-info-rows-container");
  if (!container) return;
  container.innerHTML = "";
  moreInfoRowsData.forEach((row, index) => {
    container.innerHTML += `
      <div class="more-info-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; background: var(--bg-hover); padding: 10px; border-radius: 5px;">
        <input type="text" id="more-info-text-${index}" value="${escHtml(row.text || "")}" placeholder="Nội dung (hỗ trợ HTML)" style="flex: 2;" onchange="moreInfoRowsData[${index}].text = this.value" />
        <img id="more-info-logo-preview-${index}" src="${row.logo ? `/assets/img/${row.logo}` : ''}" style="max-height: 30px; display: ${row.logo ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
        <input type="text" id="more-info-logo-${index}" value="${escHtml(row.logo || "")}" placeholder="File logo" style="flex: 1;" oninput="document.getElementById('more-info-logo-preview-${index}').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('more-info-logo-preview-${index}').style.display = this.value ? 'block' : 'none'; moreInfoRowsData[${index}].logo = this.value;" />
        <input type="file" id="more-info-logo-upload-${index}" accept="image/*" style="display: none;" onchange="uploadMoreInfoLogo(this, ${index})" />
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('more-info-logo-upload-${index}').click()" title="Tải ảnh lên"><i class="fas fa-upload"></i></button>

        <input type="text" id="more-info-width-${index}" value="${escHtml(row.logo_width || "")}" placeholder="Width (VD: 30px)" style="flex: 0.5;" onchange="moreInfoRowsData[${index}].logo_width = this.value" />
        
        <input type="color" id="more-info-bg-${index}" value="${escHtml(row.logo_bg_color || "#ffffff")}" title="Màu nền logo" style="width: 30px; height: 30px; padding: 0; border: none; background: transparent; cursor: pointer;" onchange="moreInfoRowsData[${index}].logo_bg_color = this.value" />

        <button type="button" class="btn btn-danger btn-sm" onclick="removeMoreInfoRow(${index})"><i class="fas fa-trash"></i></button>
      </div>
    `;
  });
}

function addMoreInfoRow() {
  syncMoreInfoRows();
  moreInfoRowsData.push({ text: "", logo: "", logo_width: "", logo_bg_color: "" });
  renderMoreInfoRows();
}

function removeMoreInfoRow(index) {
  syncMoreInfoRows();
  moreInfoRowsData.splice(index, 1);
  renderMoreInfoRows();
}

function syncMoreInfoRows() {
  moreInfoRowsData.forEach((row, index) => {
    const textEl = document.getElementById(`more-info-text-${index}`);
    if (textEl) row.text = textEl.value;
    const logoEl = document.getElementById(`more-info-logo-${index}`);
    if (logoEl) row.logo = logoEl.value;
    const widthEl = document.getElementById(`more-info-width-${index}`);
    if (widthEl) row.logo_width = widthEl.value;
    const bgEl = document.getElementById(`more-info-bg-${index}`);
    if (bgEl) row.logo_bg_color = bgEl.value;
  });
}

async function uploadMoreInfoLogo(input, index) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    if (res.success) {
      document.getElementById(`more-info-logo-${index}`).value = res.filename;
      moreInfoRowsData[index].logo = res.filename;
      const preview = document.getElementById(`more-info-logo-preview-${index}`);
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      showToast("Tải logo lên thành công!", "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (e) {
    showToast("Lỗi: " + e.message, "error");
  } finally {
    hideLoading();
  }
}

// Font Size Controls for Admin UI
let currentAdminFontSize = parseInt(localStorage.getItem('adminFontSize')) || 16;
document.documentElement.style.fontSize = currentAdminFontSize + 'px';

const btnDecreaseFont = document.getElementById('btnDecreaseFont');
const btnIncreaseFont = document.getElementById('btnIncreaseFont');

if (btnDecreaseFont) {
  btnDecreaseFont.addEventListener('click', () => {
    currentAdminFontSize = Math.max(12, currentAdminFontSize - 1);
    document.documentElement.style.fontSize = currentAdminFontSize + 'px';
    localStorage.setItem('adminFontSize', currentAdminFontSize);
  });
}

if (btnIncreaseFont) {
  btnIncreaseFont.addEventListener('click', () => {
    currentAdminFontSize = Math.min(24, currentAdminFontSize + 1);
    document.documentElement.style.fontSize = currentAdminFontSize + 'px';
    localStorage.setItem('adminFontSize', currentAdminFontSize);
  });
}

// ============================================================================
// Global and Navbar Background Uploads & Profile Image Upload
// ============================================================================

async function handleImageUpload(input, fieldId, previewId, successMsg) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData }).then(r => r.json());
    if (res.success) {
      const field = document.getElementById(fieldId);
      if (field) field.value = res.filename;
      
      const preview = document.getElementById(previewId);
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      
      showToast(successMsg, "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (e) {
    showToast("Lỗi mạng: " + e.message, "error");
  } finally {
    hideLoading();
    input.value = ""; // Reset input
  }
}

function removeImagePreview(fieldId, previewId) {
  const field = document.getElementById(fieldId);
  if (field) field.value = '';
  
  const preview = document.getElementById(previewId);
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

function uploadNavbarBgImage(input) {
  handleImageUpload(input, 'cfg-navbar_bg_image', 'cfg-navbar_bg_image_preview', 'Tải ảnh nền thanh Menu thành công!');
}

function removeNavbarBgImage() {
  removeImagePreview('cfg-navbar_bg_image', 'cfg-navbar_bg_image_preview');
}

function uploadGlobalBgImage(input) {
  handleImageUpload(input, 'cfg-global_bg_image', 'cfg-global_bg_image_preview', 'Tải ảnh nền thành công!');
}

function removeGlobalBgImage() {
  removeImagePreview('cfg-global_bg_image', 'cfg-global_bg_image_preview');
}

function uploadFavicon(input) {
  handleImageUpload(input, 'cfg-icon', 'cfg-icon_preview', 'Tải icon lên thành công!');
}

function uploadProfileImage(input) {
  handleImageUpload(input, 'about-image', 'about-image-preview', 'Tải ảnh đại diện thành công!');
}

function uploadBodyBgImage(input) {
  handleImageUpload(input, 'cfg-body_bg_image', 'cfg-body_bg_image_preview', 'Tải ảnh nền toàn trang thành công!');
  setTimeout(updateWallpaperPreview, 500); // Give the upload a small delay to finish writing value
}

function removeBodyBgImage() {
  removeImagePreview('cfg-body_bg_image', 'cfg-body_bg_image_preview');
  updateWallpaperPreview();
}

function updateWallpaperPreview() {
  const previewImg = document.getElementById('wlp-image');
  const previewOverlay = document.getElementById('wlp-overlay');
  if (!previewImg || !previewOverlay) return;

  const bgImg = document.getElementById('cfg-body_bg_image').value;
  const bgSize = document.getElementById('cfg-body_bg_image_size').value;
  const bgHue = document.getElementById('cfg-body_bg_hue').value;
  const bgOpacity = document.getElementById('cfg-body_bg_opacity').value;
  const bgOverlay = document.getElementById('cfg-body_bg_overlay').value;
  const bgOverlayOpacity = document.getElementById('cfg-body_bg_overlay_opacity').value;

  if (bgImg) {
    previewImg.style.backgroundImage = `url('/assets/img/${bgImg}')`;
  } else {
    previewImg.style.backgroundImage = 'none';
  }
  
  previewImg.style.backgroundSize = bgSize + '%';
  previewImg.style.filter = `hue-rotate(${bgHue}deg)`;
  previewImg.style.opacity = bgOpacity / 100;
  
  previewOverlay.style.backgroundColor = bgOverlay || 'transparent';
  previewOverlay.style.opacity = bgOverlayOpacity / 100;
}

async function uploadCertificateFile(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    
    if (res.success) {
      document.getElementById('teach-certificate-url').value = '/assets/img/' + res.filename;
      showToast('Tải file chứng nhận thành công!', 'success');
    } else {
      showToast('Lỗi tải lên: ' + (res.error || 'Unknown'), 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi tải file', 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================================
// Banner Bác Hồ & Trống Đồng (Trang Chi bộ / Tư tưởng) - 2 Section Layout
// ============================================================================

const DEFAULT_HB_CONFIG = {
  banner_scale: 100,
  banner_offset_x: 0,
  drum_box_bg: "#F2DFCE",
  drum_box_radius: 16,
  drum_box_height: 410,
  drum_box_margin_left: 140,
  drum_image: "/assets/img/background-trong-dong-png_095238288.png",
  drum_x: 47,
  drum_y: 71,
  drum_size: 560,
  drum_opacity: 32,
  drum_blur: 0,
  drum_rotate: 0,
  drum_sepia: 35,
  drum_saturate: 115,
  drum_blend_mode: "normal",
  portrait_image: "/assets/img/BacHo.png",
  portrait_x: 0,
  portrait_y: 0,
  portrait_scale: 100,
  portrait_max_height: 470,
  portrait_opacity: 100,
  portrait_blur: 0,
  portrait_contrast: 100,
  portrait_brightness: 100,
  portrait_grayscale: 0,
  portrait_blend_mode: "normal",
  portrait_mask: false,
  portrait_flip: false,
  subtitle: "Chủ tịch",
  subtitle_en: "President",
  subtitle_color: "#3B291A",
  subtitle_size: 32,
  title: "HỒ CHÍ MINH",
  title_en: "HO CHI MINH",
  title_color: "#68350B",
  title_size: 46,
  show_stars: false,
  star_color: "#FFD700",
  text_x: 0,
  text_y: 0,
  bottom_bar_enabled: false,
  bottom_bar_text: "Vững bước dưới cờ Đảng",
  bottom_bar_text_en: "Steadfast Under the Party Flag",
  bottom_bar_bg: "rgba(255, 241, 229, 0.92)",
  bottom_bar_color: "#6f3706",
  bottom_bar_size: 28,
  poem_enabled: true,
  poem_title: "TỨC CẢNH PÁC BÓ",
  poem_title_en: "RUSTIC SCENE OF PAC BO",
  poem_subtitle: "Hang Cốc Bó, Pác Bó, Hà Quảng, Cao Bằng (Tháng 2 - 1941)",
  poem_subtitle_en: "Coc Bo Cave, Pac Bo, Cao Bang (February 1941)",
  poem_line1: "“Sáng ra bờ suối, tối vào hang,",
  poem_line2: "Cháo bẹ rau măng vẫn sẵn sàng.",
  poem_line3: "Bàn đá chông chênh dịch sử Đảng,",
  poem_line4: "Cuộc đời cách mạng thật là sang.”",
  poem_note: "Mùa xuân năm 1941, sau 30 năm bôn ba tìm đường cứu nước, Bác Hồ trở về Tổ quốc trực tiếp lãnh đạo cách mạng Việt Nam. Giữa núi rừng Pác Bó muôn trùng gian lao, bài thơ thể hiện khí phách lạc quan và phong thái ung dung, tự tại của Người.",
  poem_note_en: "In spring 1941, after 30 years seeking salvation for the nation, Uncle Ho returned to lead the revolution. Amid the hardships of Pac Bo, the poem shows his supreme revolutionary optimism and serene spirit.",
  gocao_enabled: true,
  gocao_title: "CHI BỘ ẤP GÒ CAO",
  gocao_title_en: "GO CAO HAMLET PARTY CELL",
  gocao_badge: "TỔ CHỨC CƠ SỞ ĐẢNG • ĐỊA BÀN DÂN CƯ",
  gocao_badge_en: "GRASSROOTS PARTY ORGANIZATION",
  gocao_subtitle: "Hạt nhân chính trị lãnh đạo toàn diện tại địa bàn dân cư — Đảng bộ xã Hậu Nghĩa, tỉnh Tây Ninh",
  gocao_subtitle_en: "Political core leading comprehensively in the residential area — Hau Nghia Commune Party Committee, Tay Ninh Province",
  gocao_history_note: "Trước đây là Khu phố Gò Cao, thị trấn Hậu Nghĩa, huyện Đức Hòa, tỉnh Long An",
  gocao_history_note_en: "Formerly Go Cao Quarter, Hau Nghia Town, Duc Hoa District, Long An Province",
  marquee_enabled: true,
  marquee_badge: "Phong trào cộng sản, công nhân quốc tế",
  marquee_badge_en: "International Communist and Workers' Movement",
  marquee_title: "Các lãnh tụ và các nhà lãnh đạo nổi tiếng",
  marquee_title_en: "Prominent Leaders and Figures",
  marquee_source_text: "Nguồn từ Tư liệu Văn kiện của Đảng",
  marquee_source_text_en: "Source: Documents & Archives of the Party",
  marquee_source_url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng",
  marquee_subtitle: "",
  marquee_height: 260,
  marquee_speed: 35,
  marquee_pause_hover: true,
  marquee_paused: false,
  marquee_gap: 0,
  marquee_show_labels: true,
  marquee_label_color: "#8B0000",
  marquee_items: [
    { id: 1, image: "/assets/img/charles_fourier.webp", name: "Charles Fourier", year: "1772 – 1837", title: "Charles Fourier (1772 – 1837)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/charles-fourier-1772-1837-3059?categoryId=104000084", target: "_blank" },
    { id: 2, image: "/assets/img/paul_lafargue.webp", name: "Paul Lafargue", year: "1842 – 1911", title: "Paul Lafargue (1842 – 1911)", url: "", target: "_blank" },
    { id: 3, image: "/assets/img/georgi_dimitrov.webp", name: "Ghêoocghi Đimitơrôp", year: "1882 – 1949", title: "Ghêoocghi Đimitơrôp (1882 – 1949)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/gheoocghi-dimitorop-1882-1949-3056?categoryId=104000084", target: "_blank" },
    { id: 4, image: "/assets/img/fidel_castro.webp", name: "Fidel Castro", year: "1926 – 2016", title: "Fidel Castro (1926 – 2016)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/fidel-castro-1926-2016-108?categoryId=104000084", target: "_blank" },
    { id: 5, image: "/assets/img/erich_honecker.webp", name: "Erich Honecker", year: "1912 – 1994", title: "Erich Honecker (1912 – 1994)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/erich-honecker-1912-1994-3055?categoryId=104000084", target: "_blank" },
    { id: 6, image: "/assets/img/hugo_chavez.webp", name: "Hugo Chavez", year: "1954 – 2013", title: "Hugo Chavez (1954 – 2013)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/hugo-chavez-1954-2013-3077?categoryId=104000084", target: "_blank" },
    { id: 7, image: "/assets/img/vladimir_lenin.webp", name: "V. I. Lênin", year: "1870 – 1924", title: "V. I. Lênin (1870 – 1924)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-lenin-1870-1924-3173?categoryId=104000084", target: "_blank" },
    { id: 8, image: "/assets/img/mao_zedong.webp", name: "Mao Trạch Đông", year: "1893 – 1976", title: "Mao Trạch Đông (1893 – 1976)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/mao-trach-dong-1893-1976-3051?categoryId=104000084", target: "_blank" },
    { id: 9, image: "/assets/img/robert_owen.webp", name: "Robert Owen", year: "1771 – 1858", title: "Robert Owen (1771 – 1858)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/robert-owen-1771-1858-3061?categoryId=104000084", target: "_blank" },
    { id: 10, image: "/assets/img/saint_simon.webp", name: "Saint Simon", year: "1760 – 1825", title: "Saint Simon (1760 – 1825)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/saint-simon-1760-1825-3060?categoryId=104000084", target: "_blank" },
    { id: 11, image: "/assets/img/joseph_stalin.webp", name: "V.I. Xtalin", year: "1879 – 1953", title: "V.I. Xtalin (1879 – 1953)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-xtalin-1879-1953-112?categoryId=104000084", target: "_blank" },
    { id: 12, image: "/assets/img/friedrich_engels.webp", name: "Phriđơrich Ăngghen", year: "1820 – 1895", title: "Phriđơrich Ăngghen (1820 – 1895)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/phridorich-angghen-1820-1895-3157?categoryId=104000084", target: "_blank" }
  ]
};

// ============================================================================
// DANH MỤC 20 LÃNH TỤ & CÁC NHÀ LÃNH ĐẠO NỔI TIẾNG (Tư liệu Văn kiện ĐCSVN)
// ============================================================================
const LEADERS_DATABASE_20 = [
  {
    id: "saint_simon",
    name: "Saint Simon",
    year: "1760 – 1825",
    title: "Saint Simon (1760 – 1825)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/saint-simon-1760-1825-3060?categoryId=104000084",
    defaultImage: "/assets/img/saint_simon.webp"
  },
  {
    id: "robert_owen",
    name: "Robert Owen",
    year: "1771 – 1858",
    title: "Robert Owen (1771 – 1858)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/robert-owen-1771-1858-3061?categoryId=104000084",
    defaultImage: "/assets/img/robert_owen.webp"
  },
  {
    id: "charles_fourier",
    name: "Charles Fourier",
    year: "1772 – 1837",
    title: "Charles Fourier (1772 – 1837)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/charles-fourier-1772-1837-3059?categoryId=104000084",
    defaultImage: "/assets/img/charles_fourier.webp"
  },
  {
    id: "cac_mac",
    name: "Các Mác",
    year: "1818 – 1883",
    title: "Các Mác (1818 – 1883)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/cac-mac-1818-1883-3132?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "friedrich_engels",
    name: "Phriđơrich Ăngghen",
    year: "1820 – 1895",
    title: "Phriđơrich Ăngghen (1820 – 1895)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/phridorich-angghen-1820-1895-3157?categoryId=104000084",
    defaultImage: "/assets/img/friedrich_engels.webp"
  },
  {
    id: "paul_lafargue",
    name: "Paul Lafargue",
    year: "1842 – 1911",
    title: "Paul Lafargue (1842 – 1911)",
    url: "",
    defaultImage: "/assets/img/paul_lafargue.webp"
  },
  {
    id: "plekhanov",
    name: "G.V. Plekhanov",
    year: "1856 – 1918",
    title: "G.V. Plekhanov (1856 – 1918)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/g-v-plekhanov-1856-1918-3062?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "lenin",
    name: "V. I. Lênin",
    year: "1870 – 1924",
    title: "V. I. Lênin (1870 – 1924)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-lenin-1870-1924-3173?categoryId=104000084",
    defaultImage: "/assets/img/vladimir_lenin.webp"
  },
  {
    id: "stalin",
    name: "V.I. Xtalin",
    year: "1879 – 1953",
    title: "V.I. Xtalin (1879 – 1953)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-xtalin-1879-1953-112?categoryId=104000084",
    defaultImage: "/assets/img/joseph_stalin.webp"
  },
  {
    id: "dimitrov",
    name: "Ghêoocghi Đimitơrôp",
    year: "1882 – 1949",
    title: "Ghêoocghi Đimitơrôp (1882 – 1949)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/gheoocghi-dimitorop-1882-1949-3056?categoryId=104000084",
    defaultImage: "/assets/img/georgi_dimitrov.webp"
  },
  {
    id: "tenlonman",
    name: "Tenlơnman",
    year: "1886 – 1944",
    title: "Tenlơnman (1886 – 1944)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/tenlonman-1886-1944-3054?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "nehru",
    name: "Jawaharlal Nehru",
    year: "1889 – 1964",
    title: "Jawaharlal Nehru (1889 – 1964)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/jawaharlal-nehru-1889-1964-109?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "hochiminh",
    name: "Hồ Chí Minh",
    year: "1890 – 1969",
    title: "Hồ Chí Minh (1890 – 1969)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/ho-chi-minh-1890-1969-3081?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "maotrachdong",
    name: "Mao Trạch Đông",
    year: "1893 – 1976",
    title: "Mao Trạch Đông (1893 – 1976)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/mao-trach-dong-1893-1976-3051?categoryId=104000084",
    defaultImage: "/assets/img/mao_zedong.webp"
  },
  {
    id: "xuphanuvong",
    name: "Xuphanuvông",
    year: "1909 – 1995",
    title: "Xuphanuvông (1909 – 1995)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/xuphanuvong-1909-1995-3057?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "honecker",
    name: "Erich Honecker",
    year: "1912 – 1994",
    title: "Erich Honecker (1912 – 1994)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/erich-honecker-1912-1994-3055?categoryId=104000084",
    defaultImage: "/assets/img/erich_honecker.webp"
  },
  {
    id: "mandela",
    name: "Nelson Mandela",
    year: "1918 – 2013",
    title: "Nelson Mandela (1918 – 2013)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/nelson-mandela-1918-2013-3082?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "phomvihan",
    name: "Cayxỏn Phômvihản",
    year: "1920 – 1992",
    title: "Cayxỏn Phômvihản (1920 – 1992)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/cayxon-phomvihan-1920-1992-3067?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "fidel_castro",
    name: "Fidel Castro",
    year: "1926 – 2016",
    title: "Fidel Castro (1926 – 2016)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/fidel-castro-1926-2016-108?categoryId=104000084",
    defaultImage: "/assets/img/fidel_castro.webp"
  },
  {
    id: "che_guevara",
    name: "Chê Ghêvara",
    year: "1928 – 1967",
    title: "Chê Ghêvara (1928 – 1967)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/che-ghevara-1928-1967-3063?categoryId=104000084",
    defaultImage: ""
  },
  {
    id: "hugo_chavez",
    name: "Hugo Chavez",
    year: "1954 – 2013",
    title: "Hugo Chavez (1954 – 2013)",
    url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/hugo-chavez-1954-2013-3077?categoryId=104000084",
    defaultImage: "/assets/img/hugo_chavez.webp"
  }
];

const MARQUEE_PRESET_LEADERS = [
  { id: 1, image: "/assets/img/charles_fourier.webp", name: "Charles Fourier", year: "1772 – 1837", title: "Charles Fourier (1772 – 1837)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/charles-fourier-1772-1837-3059?categoryId=104000084", target: "_blank" },
  { id: 2, image: "/assets/img/paul_lafargue.webp", name: "Paul Lafargue", year: "1842 – 1911", title: "Paul Lafargue (1842 – 1911)", url: "", target: "_blank" },
  { id: 3, image: "/assets/img/georgi_dimitrov.webp", name: "Ghêoocghi Đimitơrôp", year: "1882 – 1949", title: "Ghêoocghi Đimitơrôp (1882 – 1949)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/gheoocghi-dimitorop-1882-1949-3056?categoryId=104000084", target: "_blank" },
  { id: 4, image: "/assets/img/fidel_castro.webp", name: "Fidel Castro", year: "1926 – 2016", title: "Fidel Castro (1926 – 2016)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/fidel-castro-1926-2016-108?categoryId=104000084", target: "_blank" },
  { id: 5, image: "/assets/img/erich_honecker.webp", name: "Erich Honecker", year: "1912 – 1994", title: "Erich Honecker (1912 – 1994)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/erich-honecker-1912-1994-3055?categoryId=104000084", target: "_blank" },
  { id: 6, image: "/assets/img/hugo_chavez.webp", name: "Hugo Chavez", year: "1954 – 2013", title: "Hugo Chavez (1954 – 2013)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/hugo-chavez-1954-2013-3077?categoryId=104000084", target: "_blank" },
  { id: 7, image: "/assets/img/vladimir_lenin.webp", name: "V. I. Lênin", year: "1870 – 1924", title: "V. I. Lênin (1870 – 1924)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-lenin-1870-1924-3173?categoryId=104000084", target: "_blank" },
  { id: 8, image: "/assets/img/mao_zedong.webp", name: "Mao Trạch Đông", year: "1893 – 1976", title: "Mao Trạch Đông (1893 – 1976)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/mao-trach-dong-1893-1976-3051?categoryId=104000084", target: "_blank" },
  { id: 9, image: "/assets/img/robert_owen.webp", name: "Robert Owen", year: "1771 – 1858", title: "Robert Owen (1771 – 1858)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/robert-owen-1771-1858-3061?categoryId=104000084", target: "_blank" },
  { id: 10, image: "/assets/img/saint_simon.webp", name: "Saint Simon", year: "1760 – 1825", title: "Saint Simon (1760 – 1825)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/saint-simon-1760-1825-3060?categoryId=104000084", target: "_blank" },
  { id: 11, image: "/assets/img/joseph_stalin.webp", name: "V.I. Xtalin", year: "1879 – 1953", title: "V.I. Xtalin (1879 – 1953)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/v-i-xtalin-1879-1953-112?categoryId=104000084", target: "_blank" },
  { id: 12, image: "/assets/img/friedrich_engels.webp", name: "Phriđơrich Ăngghen", year: "1820 – 1895", title: "Phriđơrich Ăngghen (1820 – 1895)", url: "https://tulieuvankien.dangcongsan.vn/ho-so-su-kien-nhan-chung/phong-trao-cong-san-cong-nhan-quoc-te/cac-lanh-tu-va-cac-nha-lanh-dao-noi-tieng/phridorich-angghen-1820-1895-3157?categoryId=104000084", target: "_blank" }
];

const MARQUEE_PRESET_CONGRESS = [
  { id: 1, image: "/assets/img/timeline_1996.png", name: "Đại hội VIII", year: "1996", title: "Đại hội Đảng VIII (1996)", url: "", target: "_blank" },
  { id: 2, image: "/assets/img/timeline_2001.png", name: "Đại hội IX", year: "2001", title: "Đại hội Đảng IX (2001)", url: "", target: "_blank" },
  { id: 3, image: "/assets/img/timeline_2006.png", name: "Đại hội X", year: "2006", title: "Đại hội Đảng X (2006)", url: "", target: "_blank" },
  { id: 4, image: "/assets/img/timeline_2011.png", name: "Đại hội XI", year: "2011", title: "Đại hội Đảng XI (2011)", url: "", target: "_blank" },
  { id: 5, image: "/assets/img/timeline_2016.png", name: "Đại hội XII", year: "2016", title: "Đại hội Đảng XII (2016)", url: "", target: "_blank" },
  { id: 6, image: "/assets/img/timeline_2021.png", name: "Đại hội XIII", year: "2021", title: "Đại hội Đảng XIII (2021)", url: "", target: "_blank" },
  { id: 7, image: "/assets/img/timeline_2026.png", name: "Đại hội XIV", year: "2026", title: "Đại hội Đảng XIV (2026)", url: "", target: "_blank" }
];

let currentHbData = { ...DEFAULT_HB_CONFIG };
let hbDragTarget = "portrait"; // 'portrait' or 'drum'

async function loadTuTuongSettings() {
  showLoading();
  try {
    const res = await fetch(`${API}/tu-tuong`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    currentHbData = {
      ...DEFAULT_HB_CONFIG,
      ...(data.hero_banner || {})
    };
    
    // Đảm bảo kiểu dữ liệu chuẩn số
    [
      'banner_scale', 'banner_offset_x',
      'drum_box_radius', 'drum_box_height', 'drum_box_margin_left',
      'drum_x', 'drum_y', 'drum_size', 'drum_opacity', 'drum_blur', 'drum_rotate', 'drum_sepia', 'drum_saturate',
      'portrait_x', 'portrait_y', 'portrait_scale', 'portrait_max_height', 'portrait_opacity', 'portrait_blur',
      'portrait_contrast', 'portrait_brightness', 'portrait_grayscale',
      'subtitle_size', 'title_size', 'text_x', 'text_y', 'bottom_bar_size',
      'marquee_height', 'marquee_speed', 'marquee_gap'
    ].forEach(k => {
      if (currentHbData[k] !== undefined) {
        currentHbData[k] = Number(currentHbData[k]);
      }
    });

    if (!Array.isArray(currentHbData.marquee_items) || currentHbData.marquee_items.length === 0) {
      currentHbData.marquee_items = JSON.parse(JSON.stringify(DEFAULT_HB_CONFIG.marquee_items));
    }

    renderTuTuongUI();
  } catch (err) {
    showToast("Không thể tải cấu hình Banner: " + err.message, "error");
    renderContent(`
      <div class="card" style="border-left: 4px solid #e74c3c; padding: 2rem;">
        <h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> Lỗi tải trang Chi bộ / Tư tưởng</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="loadTuTuongSettings()">Thử lại</button>
      </div>
    `);
  } finally {
    hideLoading();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTuTuongUI() {
  const d = currentHbData;

  const html = `
    <div class="tu-tuong-config-container" style="width: 100%; padding-bottom: 80px;">
      
      <!-- Top header bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-landmark" style="color: var(--accent-light);"></i>
            <span>Quản lý Trang Chi bộ / Tư tưởng</span>
            <span class="badge badge-primary">Studio v1.2</span>
          </h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 13.5px;">
            Tùy chỉnh toàn diện 4 Section: Banner Bác Hồ & Trống Đồng, Bài thơ Pác Bó, Dải ảnh Lãnh tụ & Phong trào Quốc tế, Chi bộ Ấp Gò Cao.
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary" onclick="applyHbPreset('tolam')" title="Khôi phục về hình mẫu chuẩn">
            <i class="fas fa-magic"></i> Mẫu chuẩn
          </button>
          <button class="btn btn-primary" onclick="saveTuTuongSettings()" style="padding: 8px 22px;">
            <i class="fas fa-save"></i> Lưu Thay Đổi
          </button>
        </div>
      </div>

      <!-- Quick Jump Navigator Pills -->
      <div class="card" style="padding: 10px 16px; margin-bottom: 22px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: var(--bg-card); border: 1px solid var(--border);">
        <span style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); margin-right: 4px; display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-compass" style="color: var(--accent);"></i> Chuyển nhanh tới Section:
        </span>
        <button type="button" class="quick-jump-chip" onclick="switchHbTab(1); document.getElementById('tu-tuong-tabs-card').scrollIntoView({behavior:'smooth'});">
          <i class="fas fa-landmark" style="color: var(--accent-light);"></i> 1. Banner Bác Hồ
        </button>
        <button type="button" class="quick-jump-chip" onclick="switchHbTab(5); document.getElementById('tu-tuong-tabs-card').scrollIntoView({behavior:'smooth'});">
          <i class="fas fa-feather-alt" style="color: #f59e0b;"></i> 2. Bài Thơ Pác Bó
        </button>
        <button type="button" class="quick-jump-chip" onclick="switchHbTab(6); document.getElementById('tu-tuong-tabs-card').scrollIntoView({behavior:'smooth'});" style="border-color: rgba(99, 102, 241, 0.4); color: var(--text-primary);">
          <i class="fas fa-users" style="color: #ef4444;"></i> 3. Dải Ảnh Lãnh Tụ & QT ⭐
        </button>
        <button type="button" class="quick-jump-chip" onclick="switchHbTab(7); document.getElementById('tu-tuong-tabs-card').scrollIntoView({behavior:'smooth'});">
          <i class="fas fa-sitemap" style="color: #38bdf8;"></i> 4. Chi Bộ Ấp Gò Cao
        </button>
      </div>

      <!-- MASTER BANNER CONTROLLER (PHÓNG TO / THU NHỎ & CĂN GIỮA SECTION MẸ) -->
      <div class="card" style="padding: 18px 20px; margin-bottom: 22px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-card); border: 1px solid var(--border);">
        
        <!-- Hàng 1: Thu phóng toàn bộ Section Mẹ -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; border-bottom: 1px dashed var(--border); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.12); color: var(--accent-light); display: flex; align-items: center; justify-content: center; font-size: 18px;">
              <i class="fas fa-expand-arrows-alt"></i>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span>Thu phóng Section Mẹ (Banner Master Scale)</span>
                <span class="badge badge-success">Tự co dãn Section con</span>
              </div>
              <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                Kéo để phóng to/thu nhỏ toàn bộ Section Mẹ. Các Section con (ảnh Bác, khung Trống Đồng, tiêu đề chữ) tự động co dãn chuẩn tỷ lệ.
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 460px; min-width: 280px;">
            <button class="btn btn-sm btn-secondary" onclick="stepHbScale(-5)" title="Giảm 5%">
              <i class="fas fa-minus"></i>
            </button>
            <input type="range" class="form-range" id="input-banner-scale" min="60" max="150" step="2" value="${d.banner_scale || 100}" oninput="syncHbField('banner_scale', Number(this.value)); document.getElementById('val-banner-scale').innerText = this.value + '%'; if(document.getElementById('input-drum-box-scale')) document.getElementById('input-drum-box-scale').value = this.value; if(document.getElementById('val-drum-box-scale')) document.getElementById('val-drum-box-scale').innerText = this.value + '%';" style="flex: 1;">
            <button class="btn btn-sm btn-secondary" onclick="stepHbScale(5)" title="Tăng 5%">
              <i class="fas fa-plus"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="syncHbField('banner_scale', 100); document.getElementById('input-banner-scale').value = 100; document.getElementById('val-banner-scale').innerText = '100%'; if(document.getElementById('input-drum-box-scale')) document.getElementById('input-drum-box-scale').value = 100; if(document.getElementById('val-drum-box-scale')) document.getElementById('val-drum-box-scale').innerText = '100%';" title="Khôi phục về kích thước gốc 100%" style="min-width: 68px; font-weight: 700;">
              <span id="val-banner-scale">${d.banner_scale || 100}%</span>
            </button>
          </div>
        </div>

        <!-- Hàng 2: Căn giữa Section Mẹ (Auto-Center & Offset X) -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.12); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 18px;">
              <i class="fas fa-align-center"></i>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span>Căn giữa Section Mẹ (Master Section Alignment)</span>
                <span class="badge badge-primary">Không đổi layout con</span>
              </div>
              <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
                Khi tùy chỉnh làm các phần tử (ảnh Bác, Trống Đồng) lệch mép, bấm nút để tự động cân đối đưa toàn bộ Section Mẹ vào chính giữa.
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 460px; min-width: 280px; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="autoCenterMasterSection()" style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
              <i class="fas fa-magic"></i> Căn giữa Section Mẹ
            </button>
            <div style="display: flex; align-items: center; gap: 6px; flex: 1; max-width: 260px;">
              <button class="btn btn-sm btn-secondary" onclick="stepHbOffsetX(-5)" title="Dịch trái 5px">
                <i class="fas fa-minus"></i>
              </button>
              <input type="range" class="form-range" id="input-banner-offset-x" min="-200" max="200" step="1" value="${d.banner_offset_x || 0}" oninput="syncHbField('banner_offset_x', Number(this.value)); document.getElementById('val-banner-offset-x').innerText = (this.value > 0 ? '+' : '') + this.value + 'px'; if(document.getElementById('input-drum-box-offset-x')) document.getElementById('input-drum-box-offset-x').value = this.value; if(document.getElementById('val-drum-box-offset-x')) document.getElementById('val-drum-box-offset-x').innerText = (this.value > 0 ? '+' : '') + this.value + 'px';" style="flex: 1;">
              <button class="btn btn-sm btn-secondary" onclick="stepHbOffsetX(5)" title="Dịch phải 5px">
                <i class="fas fa-plus"></i>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="syncHbField('banner_offset_x', 0); document.getElementById('input-banner-offset-x').value = 0; document.getElementById('val-banner-offset-x').innerText = '0px'; if(document.getElementById('input-drum-box-offset-x')) document.getElementById('input-drum-box-offset-x').value = 0; if(document.getElementById('val-drum-box-offset-x')) document.getElementById('val-drum-box-offset-x').innerText = '0px';" title="Đưa về 0px" style="min-width: 60px; font-weight: 700; font-size: 12px;">
                <span id="val-banner-offset-x">${(d.banner_offset_x > 0 ? '+' : '') + (d.banner_offset_x || 0)}px</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- LIVE PREVIEW CARD -->
      <div class="card" style="margin-bottom: 25px; overflow: hidden; border: 1px solid var(--border);">
        <div class="card-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-eye" style="color: var(--accent-light);"></i> 
            <span>Màn hình xem trước trực tiếp (Live Preview)</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 12px; color: var(--text-muted);">Chế độ kéo thả chuột:</span>
            <div class="btn-group" style="display: inline-flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
              <button id="btn-drag-portrait" onclick="setHbDragTarget('portrait')" class="btn btn-sm ${hbDragTarget === 'portrait' ? 'btn-primary' : 'btn-secondary'}">
                <i class="fas fa-user"></i> Kéo Bác
              </button>
              <button id="btn-drag-drum" onclick="setHbDragTarget('drum')" class="btn btn-sm ${hbDragTarget === 'drum' ? 'btn-primary' : 'btn-secondary'}">
                <i class="fas fa-sun"></i> Kéo Trống Đồng
              </button>
              <button id="btn-drag-master" onclick="setHbDragTarget('master')" class="btn btn-sm ${hbDragTarget === 'master' ? 'btn-primary' : 'btn-secondary'}" title="Kéo chuột để dịch chuyển toàn bộ Section Mẹ">
                <i class="fas fa-arrows-alt-h"></i> Kéo Section Mẹ
              </button>
            </div>
            <button class="btn btn-sm btn-primary" onclick="autoCenterMasterSection()" title="Tự động tính toán & căn giữa toàn bộ Section Mẹ" style="display: flex; align-items: center; gap: 5px;">
              <i class="fas fa-align-center"></i> Căn giữa
            </button>
            <button class="btn btn-sm btn-secondary" onclick="resetHbPositions()" title="Đưa về vị trí mặc định">
              <i class="fas fa-undo"></i> Reset
            </button>
          </div>
        </div>

        <div class="card-body" style="padding: 20px; background: #070b14;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-info-circle" style="color: var(--accent-light);"></i> 
            <span><strong>Mẹo kéo thả:</strong> Click giữ chuột trực tiếp lên <strong>Ảnh Bác</strong> để di chuyển góc trái. Chọn <em>Kéo Trống Đồng</em> để di chuyển hoa văn Trống Đồng. Hoặc bấm <strong>Căn giữa Section</strong> để tự động cân bằng bố cục.</span>
          </div>

          <!-- Live Preview Canvas Stage Wrapper -->
          <div 
            id="preview-hb-wrapper"
            style="
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: flex-end;
              min-height: ${Math.round(Math.max(d.drum_box_height, d.portrait_max_height) * ((d.banner_scale || 100) / 100))}px;
              overflow: visible;
              background: #0f172a;
              border-radius: 12px;
              box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
              transition: min-height 0.2s ease;
            "
          >
            <div 
              id="preview-hb-main-container"
              style="
                position: relative;
                width: 100%;
                left: ${d.banner_offset_x || 0}px;
                min-height: ${Math.max(d.drum_box_height, d.portrait_max_height)}px;
                display: flex;
                align-items: flex-end;
                user-select: none;
                transform: scale(${(d.banner_scale || 100) / 100});
                transform-origin: bottom center;
                transition: transform 0.15s ease, min-height 0.2s ease, left 0.2s ease;
              "
            >
              <!-- SECTION 1: KHUNG CHỮ NHẬT CHỨA TRỐNG ĐỒNG & TIÊU ĐỀ -->
              <div 
                id="preview-hb-drum-box"
                style="
                  position: relative;
                  width: 100%;
                  flex: 1;
                  margin-left: ${d.drum_box_margin_left}px;
                  min-height: ${d.drum_box_height}px;
                  background-color: ${d.drum_box_bg};
                  border-radius: ${d.drum_box_radius}px;
                  overflow: hidden;
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  padding: 40px 60px 40px 240px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
                  cursor: ${hbDragTarget === 'drum' ? 'crosshair' : 'default'};
                  transition: background-color 0.2s, border-radius 0.2s, min-height 0.2s, margin-left 0.2s;
                "
              >
                <!-- Hoa văn Trống Đồng Watermark -->
                <div 
                  id="preview-hb-drum"
                  style="
                    position: absolute;
                    top: ${d.drum_y}%;
                    left: ${d.drum_x}%;
                    transform: translate(-50%, -50%) rotate(${d.drum_rotate}deg);
                    width: ${d.drum_size}px;
                    height: ${d.drum_size}px;
                    background-image: url('${d.drum_image}');
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                    opacity: ${d.drum_opacity / 100};
                    pointer-events: none;
                    filter: sepia(${d.drum_sepia}%) saturate(${d.drum_saturate}%) blur(${d.drum_blur}px);
                    mix-blend-mode: ${d.drum_blend_mode};
                  "
                ></div>

                <!-- Cụm Tiêu Đề trên Trống Đồng -->
                <div 
                  id="preview-hb-title-block"
                  style="
                    position: relative;
                    z-index: 3;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transform: translate(${d.text_x}px, ${d.text_y}px);
                    pointer-events: none;
                  "
                >
                  <span 
                    id="preview-hb-subtitle"
                    style="
                      font-family: Georgia, 'Times New Roman', serif;
                      font-size: ${d.subtitle_size}px;
                      font-weight: 600;
                      color: ${d.subtitle_color};
                      margin-bottom: 10px;
                      letter-spacing: 0.5px;
                    "
                  >
                    ${escapeHtml(d.subtitle || 'Chủ tịch')}
                  </span>

                  <div 
                    id="preview-hb-title-wrapper"
                    style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      gap: 12px;
                      font-size: ${d.title_size}px;
                      line-height: 1.2;
                      letter-spacing: 2px;
                      color: ${d.title_color};
                      font-weight: 900;
                      font-family: 'Times New Roman', serif;
                      white-space: nowrap;
                    "
                  >
                    <span id="preview-hb-star-left" style="color: ${d.star_color}; font-size: ${d.title_size * 0.64}px; display: ${d.show_stars ? 'inline' : 'none'};">★</span>
                    <span id="preview-hb-title" style="color: ${d.title_color}; font-weight: 900;">${escapeHtml(d.title || 'HỒ CHÍ MINH')}</span>
                    <span id="preview-hb-star-right" style="color: ${d.star_color}; font-size: ${d.title_size * 0.64}px; display: ${d.show_stars ? 'inline' : 'none'};">★</span>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: KHUNG CHỨA ẢNH BÁC RIÊNG BIỆT (ĐỘC LẬP, KÉO THẢ DỄ DÀNG, NẰM ĐÈ GÓC TRÁI) -->
              <div 
                id="preview-hb-portrait-container"
                style="
                  position: absolute;
                  left: 0px;
                  bottom: 0px;
                  z-index: 10;
                  transform: translate(${d.portrait_x}px, ${d.portrait_y}px);
                  display: flex;
                  align-items: flex-end;
                  cursor: grab;
                  touch-action: none;
                "
                title="Click giữ và kéo chuột để di chuyển ảnh Bác"
              >
                <img 
                  id="preview-hb-portrait"
                  src="${d.portrait_image}" 
                  alt="Bác Hồ"
                  style="
                    max-height: ${d.portrait_max_height}px;
                    width: auto;
                    max-width: none;
                    object-fit: contain;
                    display: block;
                    mix-blend-mode: ${d.portrait_blend_mode};
                    opacity: ${d.portrait_opacity / 100};
                    filter: contrast(${d.portrait_contrast}%) brightness(${d.portrait_brightness}%) grayscale(${d.portrait_grayscale}%) blur(${d.portrait_blur}px);
                    -webkit-mask-image: ${d.portrait_mask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none'};
                    mask-image: ${d.portrait_mask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none'};
                    transform: scale(${d.portrait_scale / 100}) ${d.portrait_flip ? 'scaleX(-1)' : ''};
                    transform-origin: bottom center;
                    pointer-events: none;
                  "
                />
                <div 
                  id="preview-hb-portrait-badge"
                  style="
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: rgba(15, 23, 42, 0.85);
                    color: #fff;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 3px 10px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.15);
                    pointer-events: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                  "
                >
                  <i class="fas fa-arrows-alt"></i> Kéo Bác
                </div>
              </div>

              <!-- Thanh chân trang dưới (Tùy chọn) -->
              <div 
                id="preview-hb-bottom-bar"
                style="
                  position: absolute;
                  bottom: 0;
                  right: 0;
                  z-index: 4;
                  background-color: ${d.bottom_bar_bg || 'rgba(255, 241, 229, 0.95)'};
                  padding: 12px 35px;
                  border-radius: 8px 0 16px 0;
                  display: ${d.bottom_bar_enabled ? 'block' : 'none'};
                "
              >
                <span id="preview-hb-bottom-bar-text" style="font-size: ${d.bottom_bar_size || 24}px; color: ${d.bottom_bar_color || '#6f3706'}; font-weight: 700;">
                  ${escapeHtml(d.bottom_bar_text || 'Vững bước dưới cờ Đảng')}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- TABS CONTROLLER -->
      <div id="tu-tuong-tabs-card" class="card" style="border: 1px solid var(--border); overflow: hidden;">
        <div class="card-header" style="background: var(--bg-secondary); padding: 8px 12px; border-bottom: 1px solid var(--border);">
          <div class="studio-tabs" style="margin-bottom: 0; border: none; background: transparent; padding: 0;">
            <button class="studio-tab-btn active" id="tab-btn-1" onclick="switchHbTab(1)">
              <i class="fas fa-vector-square"></i> 1. Trống Đồng
            </button>
            <button class="studio-tab-btn" id="tab-btn-2" onclick="switchHbTab(2)">
              <i class="fas fa-portrait"></i> 2. Ảnh Bác Hồ
            </button>
            <button class="studio-tab-btn" id="tab-btn-3" onclick="switchHbTab(3)">
              <i class="fas fa-heading"></i> 3. Chữ Banner
            </button>
            <button class="studio-tab-btn" id="tab-btn-4" onclick="switchHbTab(4)">
              <i class="fas fa-sliders-h"></i> 4. Mẫu Chuẩn
            </button>
            <button class="studio-tab-btn" id="tab-btn-5" onclick="switchHbTab(5)">
              <i class="fas fa-feather-alt"></i> 5. Bài Thơ Pác Bó
            </button>
            <button class="studio-tab-btn" id="tab-btn-6" onclick="switchHbTab(6)" style="font-weight: 700;">
              <i class="fas fa-users" style="color: #ef4444;"></i> 6. Dải Ảnh Lãnh Tụ ⭐
            </button>
            <button class="studio-tab-btn" id="tab-btn-7" onclick="switchHbTab(7)">
              <i class="fas fa-sitemap" style="color: #38bdf8;"></i> 7. Chi Bộ Ấp Gò Cao
            </button>
          </div>
        </div>

        <div class="card-body" style="padding: 24px;">
          
          <!-- TAB 1: KHUNG CHỮ NHẬT & TRỐNG ĐỒNG -->
          <div id="hb-tab-pane-1" class="hb-tab-pane">
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-layer-group" style="color: var(--accent-light);"></i> Cấu hình Khung Chữ Nhật Nền
            </h4>
            <div class="form-grid" style="margin-bottom: 25px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Màu nền khung chữ nhật (Màu kem chuẩn):</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 6px;">
                  <input type="color" id="input-drum-box-bg-picker" value="${d.drum_box_bg}" onchange="syncHbField('drum_box_bg', this.value); document.getElementById('input-drum-box-bg').value = this.value;" style="height: 38px; width: 48px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: var(--bg-input);">
                  <input type="text" id="input-drum-box-bg" class="form-control" value="${d.drum_box_bg}" oninput="syncHbField('drum_box_bg', this.value); document.getElementById('input-drum-box-bg-picker').value = this.value;">
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Chiều cao khung chữ nhật:</label>
                  <span id="val-drum-box-height" class="badge badge-primary">${d.drum_box_height}px</span>
                </div>
                <input type="range" class="form-range" min="300" max="600" step="5" value="${d.drum_box_height}" oninput="syncHbField('drum_box_height', Number(this.value)); document.getElementById('val-drum-box-height').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Bo góc khung (Radius):</label>
                  <span id="val-drum-box-radius" class="badge badge-primary">${d.drum_box_radius}px</span>
                </div>
                <input type="range" class="form-range" min="0" max="40" step="2" value="${d.drum_box_radius}" oninput="syncHbField('drum_box_radius', Number(this.value)); document.getElementById('val-drum-box-radius').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Khoảng cách lề trái (chừa ảnh Bác):</label>
                  <span id="val-drum-box-margin-left" class="badge badge-primary">${d.drum_box_margin_left}px</span>
                </div>
                <input type="range" class="form-range" min="0" max="300" step="5" value="${d.drum_box_margin_left}" oninput="syncHbField('drum_box_margin_left', Number(this.value)); document.getElementById('val-drum-box-margin-left').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Thu phóng toàn bộ Section Mẹ:</label>
                  <span id="val-drum-box-scale" class="badge badge-primary">${d.banner_scale || 100}%</span>
                </div>
                <input type="range" class="form-range" id="input-drum-box-scale" min="60" max="150" step="2" value="${d.banner_scale || 100}" oninput="syncHbField('banner_scale', Number(this.value)); if(document.getElementById('input-banner-scale')) document.getElementById('input-banner-scale').value = this.value; if(document.getElementById('val-banner-scale')) document.getElementById('val-banner-scale').innerText = this.value + '%'; document.getElementById('val-drum-box-scale').innerText = this.value + '%';">
                <span class="form-help">Phóng to/thu nhỏ toàn bộ Section Mẹ (các Section con tự động co dãn theo tỷ lệ).</span>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Căn giữa Section Mẹ (Offset X):</label>
                  <span id="val-drum-box-offset-x" class="badge badge-primary">${(d.banner_offset_x > 0 ? '+' : '') + (d.banner_offset_x || 0)}px</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="stepHbOffsetX(-5)">-5</button>
                  <input type="range" class="form-range" id="input-drum-box-offset-x" min="-200" max="200" step="1" value="${d.banner_offset_x || 0}" oninput="syncHbField('banner_offset_x', Number(this.value)); document.getElementById('val-drum-box-offset-x').innerText = (this.value > 0 ? '+' : '') + this.value + 'px'; if(document.getElementById('input-banner-offset-x')) document.getElementById('input-banner-offset-x').value = this.value; if(document.getElementById('val-banner-offset-x')) document.getElementById('val-banner-offset-x').innerText = (this.value > 0 ? '+' : '') + this.value + 'px';" style="flex: 1;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="stepHbOffsetX(5)">+5</button>
                  <button type="button" class="btn btn-sm btn-primary" onclick="autoCenterMasterSection()" style="font-size: 11.5px; padding: 4px 10px; white-space: nowrap;"><i class="fas fa-magic"></i> Căn giữa</button>
                </div>
                <span class="form-help">Dịch chuyển toàn bộ Section Mẹ sang trái/phải để cân đối chính giữa.</span>
              </div>
            </div>

            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-sun" style="color: #fbbf24;"></i> Hoa Văn Trống Đồng (Watermark Nằm Trong Khung)
            </h4>
            
            <div style="margin-bottom: 20px;">
              <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Đường dẫn ảnh Trống Đồng:</label>
              <div style="display: flex; gap: 10px; margin-top: 6px;">
                <input type="text" id="input-drum-image" class="form-control" value="${d.drum_image}" oninput="syncHbField('drum_image', this.value)">
                <label class="btn btn-secondary" style="margin: 0; white-space: nowrap; cursor: pointer;">
                  <i class="fas fa-upload"></i> Tải ảnh mới
                  <input type="file" accept="image/*" style="display: none;" onchange="uploadHbDrum(this)">
                </label>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Vị trí ngang X (%):</label>
                  <span id="val-drum-x" class="badge badge-primary">${d.drum_x}%</span>
                </div>
                <input type="range" id="input-drum-x" class="form-range" min="0" max="100" value="${d.drum_x}" oninput="syncHbField('drum_x', Number(this.value)); document.getElementById('val-drum-x').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Vị trí dọc Y (%):</label>
                  <span id="val-drum-y" class="badge badge-primary">${d.drum_y}%</span>
                </div>
                <input type="range" id="input-drum-y" class="form-range" min="0" max="100" value="${d.drum_y}" oninput="syncHbField('drum_y', Number(this.value)); document.getElementById('val-drum-y').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Kích thước Trống Đồng:</label>
                  <span id="val-drum-size" class="badge badge-primary">${d.drum_size}px</span>
                </div>
                <input type="range" class="form-range" min="200" max="900" step="10" value="${d.drum_size}" oninput="syncHbField('drum_size', Number(this.value)); document.getElementById('val-drum-size').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Độ mờ chìm (Opacity):</label>
                  <span id="val-drum-opacity" class="badge badge-primary">${d.drum_opacity}%</span>
                </div>
                <input type="range" class="form-range" min="5" max="100" value="${d.drum_opacity}" oninput="syncHbField('drum_opacity', Number(this.value)); document.getElementById('val-drum-opacity').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Góc xoay hoa văn:</label>
                  <span id="val-drum-rotate" class="badge badge-primary">${d.drum_rotate}°</span>
                </div>
                <input type="range" class="form-range" min="0" max="360" value="${d.drum_rotate}" oninput="syncHbField('drum_rotate', Number(this.value)); document.getElementById('val-drum-rotate').innerText = this.value + '°';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Độ nhòe hoa văn (Blur):</label>
                  <span id="val-drum-blur" class="badge badge-primary">${d.drum_blur}px</span>
                </div>
                <input type="range" class="form-range" min="0" max="10" step="0.5" value="${d.drum_blur}" oninput="syncHbField('drum_blur', Number(this.value)); document.getElementById('val-drum-blur').innerText = this.value + 'px';">
              </div>
            </div>
          </div>

          <!-- TAB 2: SECTION ẢNH BÁC (KÉO THẢ ĐỘC LẬP) -->
          <div id="hb-tab-pane-2" class="hb-tab-pane" style="display: none;">
            <div style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--accent); padding: 12px 18px; border-radius: 8px; margin-bottom: 22px; color: var(--text-primary); font-size: 13px;">
              <strong>Section Chân Dung Độc Lập:</strong> Nằm ở lớp trên cùng (z-index: 10), dễ dàng kéo thả bằng chuột mà không bị kẹt hay chạm vào các thành phần phía dưới.
            </div>

            <!-- Upload ảnh chân dung -->
            <div style="margin-bottom: 24px;">
              <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Đường dẫn file ảnh Bác (PNG tách nền):</label>
              <div style="display: flex; gap: 10px; margin-top: 6px;">
                <input type="text" id="input-portrait-image" class="form-control" value="${d.portrait_image}" oninput="syncHbField('portrait_image', this.value)">
                <label class="btn btn-primary" style="margin: 0; white-space: nowrap; cursor: pointer;">
                  <i class="fas fa-upload"></i> Tải ảnh Bác mới
                  <input type="file" accept="image/*" style="display: none;" onchange="uploadHbPortrait(this)">
                </label>
              </div>
            </div>

            <!-- Nút chọn nhanh chế độ màu sắc -->
            <div class="card" style="padding: 16px 20px; margin-bottom: 25px; background: var(--bg-card); border: 1px solid var(--border);">
              <label style="font-weight: 700; font-size: 13.5px; color: var(--text-primary); display: block; margin-bottom: 10px;">
                <i class="fas fa-palette" style="color: var(--accent-light);"></i> Chế độ màu sắc chân dung:
              </label>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-sm btn-success" onclick="setPortraitColorMode('natural')">
                  <i class="fas fa-paint-brush"></i> 1. Giữ Màu Gốc Tự Nhiên (Khuyên dùng)
                </button>
                <button class="btn btn-sm btn-secondary" onclick="setPortraitColorMode('bw')">
                  <i class="fas fa-camera"></i> 2. Đen Trắng Cổ Điển
                </button>
                <button class="btn btn-sm btn-secondary" onclick="setPortraitColorMode('multiply')">
                  <i class="fas fa-clone"></i> 3. Hòa Trộn (Multiply)
                </button>
              </div>
              <div class="form-help" style="margin-top: 8px;">
                * Khi chọn "Màu Gốc Tự Nhiên", ảnh Bác sẽ hiển thị đúng 100% màu sắc gốc như file bạn tải lên.
              </div>
            </div>

            <!-- Vị trí và kích thước kéo thả -->
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-arrows-alt" style="color: var(--accent-light);"></i> Tọa Độ & Kích Thước Kéo Thả
            </h4>
            <div class="form-grid" style="margin-bottom: 25px;">
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tọa độ ngang X (px):</label>
                  <span id="val-portrait-x" class="badge badge-primary">${d.portrait_x}px</span>
                </div>
                <input type="range" id="input-portrait-x" class="form-range" min="-300" max="400" step="5" value="${d.portrait_x}" oninput="syncHbField('portrait_x', Number(this.value)); document.getElementById('val-portrait-x').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tọa độ dọc Y (px):</label>
                  <span id="val-portrait-y" class="badge badge-primary">${d.portrait_y}px</span>
                </div>
                <input type="range" id="input-portrait-y" class="form-range" min="-250" max="250" step="5" value="${d.portrait_y}" oninput="syncHbField('portrait_y', Number(this.value)); document.getElementById('val-portrait-y').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Chiều cao tối đa ảnh:</label>
                  <span id="val-portrait-max-height" class="badge badge-primary">${d.portrait_max_height}px</span>
                </div>
                <input type="range" class="form-range" min="300" max="650" step="10" value="${d.portrait_max_height}" oninput="syncHbField('portrait_max_height', Number(this.value)); document.getElementById('val-portrait-max-height').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tỷ lệ thu phóng Scale (%):</label>
                  <span id="val-portrait-scale" class="badge badge-primary">${d.portrait_scale}%</span>
                </div>
                <input type="range" class="form-range" min="50" max="180" step="2" value="${d.portrait_scale}" oninput="syncHbField('portrait_scale', Number(this.value)); document.getElementById('val-portrait-scale').innerText = this.value + '%';">
              </div>
            </div>

            <!-- Tinh chỉnh hiệu ứng -->
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-sliders-h" style="color: var(--accent-light);"></i> Tinh Chỉnh Hiệu Ứng Hình Ảnh
            </h4>
            <div class="form-grid">
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Độ đen trắng Grayscale (%):</label>
                  <span id="val-portrait-grayscale" class="badge badge-primary">${d.portrait_grayscale}%</span>
                </div>
                <input type="range" id="input-portrait-grayscale" class="form-range" min="0" max="100" value="${d.portrait_grayscale}" oninput="syncHbField('portrait_grayscale', Number(this.value)); document.getElementById('val-portrait-grayscale').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Độ sáng Brightness (%):</label>
                  <span id="val-portrait-brightness" class="badge badge-primary">${d.portrait_brightness}%</span>
                </div>
                <input type="range" id="input-portrait-brightness" class="form-range" min="50" max="150" value="${d.portrait_brightness}" oninput="syncHbField('portrait_brightness', Number(this.value)); document.getElementById('val-portrait-brightness').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Độ tương phản Contrast (%):</label>
                  <span id="val-portrait-contrast" class="badge badge-primary">${d.portrait_contrast}%</span>
                </div>
                <input type="range" id="input-portrait-contrast" class="form-range" min="50" max="150" value="${d.portrait_contrast}" oninput="syncHbField('portrait_contrast', Number(this.value)); document.getElementById('val-portrait-contrast').innerText = this.value + '%';">
              </div>

              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Chế độ hòa trộn (Mix Blend Mode):</label>
                <select id="input-portrait-blend-mode" class="form-control" style="margin-top: 6px;" onchange="syncHbField('portrait_blend_mode', this.value)">
                  <option value="normal" ${d.portrait_blend_mode === 'normal' ? 'selected' : ''}>normal (Màu nguyên bản - Khuyên dùng)</option>
                  <option value="multiply" ${d.portrait_blend_mode === 'multiply' ? 'selected' : ''}>multiply (Hòa trộn vào nền)</option>
                  <option value="screen" ${d.portrait_blend_mode === 'screen' ? 'selected' : ''}>screen (Làm sáng)</option>
                  <option value="overlay" ${d.portrait_blend_mode === 'overlay' ? 'selected' : ''}>overlay (Phủ lớp)</option>
                </select>
              </div>

              <div class="form-group" style="display: flex; flex-direction: row; gap: 24px; padding-top: 14px; grid-column: 1 / -1;">
                <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" id="input-portrait-flip" ${d.portrait_flip ? 'checked' : ''} onchange="syncHbField('portrait_flip', this.checked)">
                  Lật ngang ảnh chân dung (Flip X)
                </label>

                <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" id="input-portrait-mask" ${d.portrait_mask ? 'checked' : ''} onchange="syncHbField('portrait_mask', this.checked)">
                  Làm mờ biên chân dung (Feather Mask)
                </label>
              </div>
            </div>
          </div>

          <!-- TAB 3: TIÊU ĐỀ & VĂN BẢN -->
          <div id="hb-tab-pane-3" class="hb-tab-pane" style="display: none;">
            <div class="form-grid" style="margin-bottom: 25px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Dòng chức vụ / Tiêu đề phụ:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.subtitle || '')}" oninput="syncHbField('subtitle', this.value)" style="margin-top: 6px;">
              </div>

              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Màu chữ chức vụ:</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 6px;">
                  <input type="color" value="${d.subtitle_color}" onchange="syncHbField('subtitle_color', this.value); document.getElementById('input-subtitle-color').value = this.value;" style="height: 38px; width: 48px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: var(--bg-input);">
                  <input type="text" id="input-subtitle-color" class="form-control" value="${d.subtitle_color}" oninput="syncHbField('subtitle_color', this.value)">
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Cỡ chữ chức vụ:</label>
                  <span id="val-subtitle-size" class="badge badge-primary">${d.subtitle_size}px</span>
                </div>
                <input type="range" class="form-range" min="18" max="48" value="${d.subtitle_size}" oninput="syncHbField('subtitle_size', Number(this.value)); document.getElementById('val-subtitle-size').innerText = this.value + 'px';">
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 25px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tên Lãnh tụ / Tiêu đề chính:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.title || '')}" oninput="syncHbField('title', this.value)" style="margin-top: 6px; font-weight: bold;">
              </div>

              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Màu chữ tên lãnh tụ:</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 6px;">
                  <input type="color" value="${d.title_color}" onchange="syncHbField('title_color', this.value); document.getElementById('input-title-color').value = this.value;" style="height: 38px; width: 48px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: var(--bg-input);">
                  <input type="text" id="input-title-color" class="form-control" value="${d.title_color}" oninput="syncHbField('title_color', this.value)">
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Cỡ chữ tên lãnh tụ:</label>
                  <span id="val-title-size" class="badge badge-primary">${d.title_size}px</span>
                </div>
                <input type="range" class="form-range" min="26" max="64" value="${d.title_size}" oninput="syncHbField('title_size', Number(this.value)); document.getElementById('val-title-size').innerText = this.value + 'px';">
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group" style="padding-top: 8px;">
                <label style="font-weight: 600; font-size: 13.5px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" id="input-show-stars" ${d.show_stars ? 'checked' : ''} onchange="syncHbField('show_stars', this.checked)">
                  Hiển thị 2 ngôi sao vàng bên cạnh tên
                </label>
                <div class="form-help">
                  (Mặc định đã tắt để hoàn toàn đồng bộ với hình mẫu chuẩn)
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Dịch chuyển cụm chữ X:</label>
                  <span id="val-text-x" class="badge badge-primary">${d.text_x}px</span>
                </div>
                <input type="range" class="form-range" min="-200" max="200" step="5" value="${d.text_x}" oninput="syncHbField('text_x', Number(this.value)); document.getElementById('val-text-x').innerText = this.value + 'px';">
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Dịch chuyển cụm chữ Y:</label>
                  <span id="val-text-y" class="badge badge-primary">${d.text_y}px</span>
                </div>
                <input type="range" class="form-range" min="-150" max="150" step="5" value="${d.text_y}" oninput="syncHbField('text_y', Number(this.value)); document.getElementById('val-text-y').innerText = this.value + 'px';">
              </div>
            </div>
          </div>

          <!-- TAB 4: MẪU CHUẨN & NÂNG CAO -->
          <div id="hb-tab-pane-4" class="hb-tab-pane" style="display: none;">
            <div class="card" style="padding: 20px; margin-bottom: 25px; background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-magic" style="color: var(--accent-light);"></i> Hình mẫu chuẩn tham chiếu
              </h4>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5;">
                Tự động thiết lập đầy đủ tất cả thông số: Khung chữ nhật nền kem ấm (#FAF2E8), ảnh Bác giữ nguyên 100% màu sắc tự nhiên, font chữ trang nhã, và loại bỏ thanh trắng bên dưới theo đúng hình mẫu.
              </p>
              <button class="btn btn-primary" onclick="applyHbPreset('tolam')" style="font-weight: 600; padding: 10px 22px;">
                <i class="fas fa-check-circle"></i> Khôi phục về Hình mẫu chuẩn
              </button>
            </div>

            <div class="card" style="padding: 20px; background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-bars" style="color: var(--accent-light);"></i> Thanh chữ trắng chân trang ("Vững bước dưới cờ Đảng")
              </h4>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-weight: 600; font-size: 13.5px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" id="input-bottom-bar-enabled" ${d.bottom_bar_enabled ? 'checked' : ''} onchange="syncHbField('bottom_bar_enabled', this.checked)">
                  Bật thanh chữ trắng ở góc dưới bên phải
                </label>
              </div>
              <div class="form-help">
                * Mặc định tính năng này được Tắt để giống với hình mẫu chuẩn. Nếu cần bạn có thể tích chọn để bật lại.
              </div>
            </div>
          </div>

          <!-- TAB 5: BÀI THƠ PÁC BÓ -->
          <div id="hb-tab-pane-5" class="hb-tab-pane" style="display: none;">
            <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #fbbf24; padding: 14px 20px; border-radius: 8px; margin-bottom: 22px;">
              <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #fbbf24;">
                <i class="fas fa-feather-alt"></i> Section Bài Thơ: "Tức cảnh Pác Bó" (1941)
              </h4>
              <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                Bài thơ bất hủ của Chủ tịch Hồ Chí Minh sáng tác vào tháng 2 năm 1941 tại hang Cốc Bó, Hà Quảng, Cao Bằng.
              </p>
            </div>

            <div class="form-group" style="margin-bottom: 22px;">
              <label style="font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                <input type="checkbox" id="input-poem-enabled" ${d.poem_enabled !== false ? 'checked' : ''} onchange="syncHbField('poem_enabled', this.checked)">
                Hiển thị Section bài thơ trên trang Chi bộ
              </label>
            </div>

            <div class="form-grid" style="margin-bottom: 22px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tên bài thơ:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_title || 'TỨC CẢNH PÁC BÓ')}" oninput="syncHbField('poem_title', this.value)" style="margin-top: 6px; font-weight: 700;">
              </div>

              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Địa danh / Thời điểm sáng tác:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_subtitle || 'Hang Cốc Bó, Pác Bó, Hà Quảng, Cao Bằng (Tháng 2 - 1941)')}" oninput="syncHbField('poem_subtitle', this.value)" style="margin-top: 6px; font-style: italic;">
              </div>
            </div>

            <h5 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 18px 0 12px 0;">Bốn câu thơ thất ngôn:</h5>
            <div style="display: grid; gap: 12px; margin-bottom: 24px;">
              <div class="form-group">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Câu 1:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_line1 || '“Sáng ra bờ suối, tối vào hang,')}" oninput="syncHbField('poem_line1', this.value)">
              </div>
              <div class="form-group">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Câu 2:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_line2 || 'Cháo bẹ rau măng vẫn sẵn sàng.')}" oninput="syncHbField('poem_line2', this.value)">
              </div>
              <div class="form-group">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Câu 3:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_line3 || 'Bàn đá chông chênh dịch sử Đảng,')}" oninput="syncHbField('poem_line3', this.value)">
              </div>
              <div class="form-group">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Câu 4:</label>
                <input type="text" class="form-control" value="${escapeHtml(d.poem_line4 || 'Cuộc đời cách mạng thật là sang.”')}" oninput="syncHbField('poem_line4', this.value)" style="color: #f87171; font-weight: 600;">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Ý nghĩa lịch sử / Lời bình:</label>
              <textarea class="form-control" rows="3" oninput="syncHbField('poem_note', this.value)" style="margin-top: 6px; font-size: 13.5px; line-height: 1.5;">${escapeHtml(d.poem_note || 'Mùa xuân năm 1941, sau 30 năm bôn ba tìm đường cứu nước, Bác Hồ trở về Tổ quốc trực tiếp lãnh đạo cách mạng Việt Nam. Giữa núi rừng Pác Bó muôn trùng gian lao, bài thơ thể hiện khí phách lạc quan và phong thái ung dung, tự tại của Người.')}</textarea>
            </div>
          </div>

          <!-- TAB 6: DẢI ẢNH LÃNH TỤ & PHONG TRÀO QUỐC TẾ (MARQUEE) -->
          <div id="hb-tab-pane-6" class="hb-tab-pane" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 14px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h4 style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-users" style="color: #ef4444;"></i> Section Dải Ảnh Lãnh Tụ & Phong Trào Quốc Tế
                </h4>
                <p style="margin: 0; color: var(--text-muted); font-size: 13px;">
                  Tùy chỉnh toàn diện: Huy hiệu ★, Tiêu đề lớn song ngữ, Link nguồn tư liệu văn kiện Đảng, thông số chạy và danh sách hình ảnh lãnh tụ.
                </p>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <div class="btn-group" style="border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
                  <button class="btn btn-sm btn-secondary" onclick="applyMarqueePreset('leaders12')" title="Nạp 12 Lãnh tụ / Nhà Tư tưởng XHCN (WebP siêu nhẹ)">
                    <i class="fas fa-users" style="color: #ef4444;"></i> 12 Lãnh tụ WebP
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="applyMarqueePreset('leaders21')" title="Nạp trọn bộ 21 Lãnh tụ ĐCSVN (gồm 9 vị hiển thị sẵn card để tải ảnh)">
                    <i class="fas fa-star" style="color: #fbbf24;"></i> Trọn bộ 21 Lãnh tụ
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="applyMarqueePreset('congress7')" title="Nạp 7 mốc son Đại hội Đảng 1996 - 2026">
                    <i class="fas fa-landmark" style="color: #f97316;"></i> 7 Mốc Đại hội Đảng
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="applyMarqueePreset('all19')" title="Gộp cả Lãnh tụ và 7 Mốc Đại hội">
                    <i class="fas fa-layer-group" style="color: #38bdf8;"></i> Gộp cả dải ảnh
                  </button>
                </div>
                <select class="form-select form-select-sm" onchange="if(this.value){addLeaderFromDatabase(this.value); this.value='';}" style="font-size: 12px; font-weight: 600; color: var(--text-primary); border: 1px solid var(--border); background: var(--bg-input); max-width: 250px; height: 32px; cursor: pointer;">
                  <option value="">⚡ + Thêm nhanh từ 21 Lãnh tụ...</option>
                  ${LEADERS_DATABASE_20.map((l, li) => `<option value="${l.id}">${li + 1}. ${escapeHtml(l.name)} (${escapeHtml(l.year)})</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-primary" onclick="addMarqueeItem()" style="font-weight: 600; padding: 5px 14px;">
                  <i class="fas fa-plus"></i> Thêm ảnh thủ công
                </button>
              </div>
            </div>

            <!-- KHỐI 1: TIÊU ĐỀ & NGUỒN TƯ LIỆU VĂN KIỆN ĐẢNG (SONG NGỮ VI - EN) -->
            <div class="card" style="padding: 18px 20px; margin-bottom: 22px; background: var(--bg-card); border: 1px solid var(--border);">
              <h5 style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-heading" style="color: var(--accent-light);"></i> 1. Tiêu Đề, Huy Hiệu & Chú Thích Nguồn (Song Ngữ VI / EN)
              </h5>

              <!-- Hàng Huy hiệu (Badge) -->
              <div class="form-grid" style="margin-bottom: 14px;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">
                    <span style="color: #ef4444;">★</span> Huy hiệu / Nhãn đỏ trên cùng (Tiếng Việt):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: Phong trào cộng sản, công nhân quốc tế" value="${escapeHtml(d.marquee_badge || '')}" oninput="syncHbField('marquee_badge', this.value); updateMarqueeAdminPreview();" style="margin-top: 4px; font-weight: 600;">
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">
                    <span style="color: #38bdf8;">★</span> Huy hiệu / Nhãn đỏ trên cùng (Tiếng Anh - EN):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: International Communist and Workers' Movement" value="${escapeHtml(d.marquee_badge_en || '')}" oninput="syncHbField('marquee_badge_en', this.value)" style="margin-top: 4px;">
                </div>
              </div>

              <!-- Hàng Tiêu đề chính (Title) -->
              <div class="form-grid" style="margin-bottom: 14px;">
                <div class="form-group">
                  <label style="font-weight: 700; font-size: 13px; color: var(--text-primary);">
                    Tiêu đề lớn Section (Tiếng Việt):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: CÁC LÃNH TỤ VÀ CÁC NHÀ LÃNH ĐẠO NỔI TIẾNG" value="${escapeHtml(d.marquee_title || '')}" oninput="syncHbField('marquee_title', this.value); updateMarqueeAdminPreview();" style="margin-top: 4px; font-weight: 700; color: #fbbf24;">
                </div>
                <div class="form-group">
                  <label style="font-weight: 700; font-size: 13px; color: var(--text-secondary);">
                    Tiêu đề lớn Section (Tiếng Anh - EN):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: Prominent Leaders and Figures" value="${escapeHtml(d.marquee_title_en || '')}" oninput="syncHbField('marquee_title_en', this.value)" style="margin-top: 4px;">
                </div>
              </div>

              <!-- Hàng Nguồn tư liệu & URL -->
              <div class="form-grid" style="margin-bottom: 14px;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">
                    <i class="fas fa-bookmark" style="color: #f59e0b;"></i> Chú thích nguồn tư liệu (VI):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: Nguồn từ Tư liệu Văn kiện của Đảng" value="${escapeHtml(d.marquee_source_text || '')}" oninput="syncHbField('marquee_source_text', this.value); updateMarqueeAdminPreview();" style="margin-top: 4px;">
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">
                    <i class="fas fa-bookmark" style="color: #38bdf8;"></i> Chú thích nguồn tư liệu (EN):
                  </label>
                  <input type="text" class="form-control" placeholder="Ví dụ: Source: Documents & Archives of the Party" value="${escapeHtml(d.marquee_source_text_en || '')}" oninput="syncHbField('marquee_source_text_en', this.value)" style="margin-top: 4px;">
                </div>
                <div class="form-group full-width">
                  <label style="font-weight: 700; font-size: 13px; color: var(--accent-light); display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-link"></i> Đường dẫn liên kết nguồn (URL khi click vào nút Nguồn):
                  </label>
                  <div style="display: flex; gap: 8px; margin-top: 4px;">
                    <input type="text" class="form-control" placeholder="https://tulieuvankien.dangcongsan.vn/..." value="${escapeHtml(d.marquee_source_url || '')}" oninput="syncHbField('marquee_source_url', this.value); updateMarqueeAdminPreview();" style="flex: 1;">
                    ${d.marquee_source_url ? `
                      <a href="${escapeHtml(d.marquee_source_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; white-space: nowrap;">
                        <i class="fas fa-external-link-alt"></i> Mở link
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- Phụ đề (tùy chọn) -->
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-muted);">Phụ đề Section (Tùy chọn, để trống nếu không dùng):</label>
                <input type="text" class="form-control" placeholder="Ví dụ: Dấu ấn phát triển và chặng đường vinh quang của Đảng" value="${escapeHtml(d.marquee_subtitle || '')}" oninput="syncHbField('marquee_subtitle', this.value); updateMarqueeAdminPreview();" style="margin-top: 4px;">
              </div>
            </div>

            <!-- KHỐI 2: CẤU HÌNH HIỂN THỊ & TỐC ĐỘ CHẠY -->
            <div class="card" style="padding: 18px 20px; margin-bottom: 22px; background: var(--bg-card); border: 1px solid var(--border);">
              <h5 style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-sliders-h" style="color: var(--accent-light);"></i> 2. Thông Số Hiển Thị & Chuyển Động
              </h5>

              <div class="form-grid" style="margin-bottom: 18px;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                    <input type="checkbox" id="input-marquee-enabled" ${d.marquee_enabled !== false ? 'checked' : ''} onchange="syncHbField('marquee_enabled', this.checked); updateMarqueeAdminPreview();">
                    Hiển thị Section Dải ảnh trên trang Chi bộ
                  </label>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                    <input type="checkbox" id="input-marquee-pause" ${d.marquee_pause_hover !== false ? 'checked' : ''} onchange="syncHbField('marquee_pause_hover', this.checked); updateMarqueeAdminPreview();">
                    Tạm dừng chạy khi rê chuột vào (Pause on Hover)
                  </label>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: #ef4444;">
                    <input type="checkbox" id="input-marquee-paused" ${d.marquee_paused === true ? 'checked' : ''} onchange="syncHbField('marquee_paused', this.checked); updateMarqueeAdminPreview();">
                    <span>⏸️ <strong>Tạm dừng chạy luôn</strong> (Dải ảnh đứng yên, chỉ kéo qua lại bằng tay/chuột)</span>
                  </label>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                    <input type="checkbox" id="input-marquee-show-labels" ${d.marquee_show_labels === true ? 'checked' : ''} onchange="syncHbField('marquee_show_labels', this.checked); updateMarqueeAdminPreview();">
                    Hiển thị chữ số Năm/Nhãn trên ảnh (Label Overlay)
                  </label>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Chiều cao dải ảnh:</label>
                    <span id="val-marquee-height" class="badge badge-primary">${d.marquee_height || 260}px</span>
                  </div>
                  <input type="range" class="form-range" min="150" max="380" step="5" value="${d.marquee_height || 260}" oninput="syncHbField('marquee_height', Number(this.value)); document.getElementById('val-marquee-height').innerText = this.value + 'px'; updateMarqueeAdminPreview();">
                </div>

                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Tốc độ chạy (giây/vòng):</label>
                    <span id="val-marquee-speed" class="badge badge-primary">${d.marquee_speed || 35}s</span>
                  </div>
                  <input type="range" class="form-range" min="10" max="150" step="1" value="${d.marquee_speed || 35}" oninput="syncHbField('marquee_speed', Number(this.value)); document.getElementById('val-marquee-speed').innerText = this.value + 's'; updateMarqueeAdminPreview();">
                </div>

                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Khoảng cách giữa các ảnh:</label>
                    <span id="val-marquee-gap" class="badge badge-primary">${d.marquee_gap || 0}px</span>
                  </div>
                  <input type="range" class="form-range" min="0" max="30" step="2" value="${d.marquee_gap || 0}" oninput="syncHbField('marquee_gap', Number(this.value)); document.getElementById('val-marquee-gap').innerText = this.value + 'px'; updateMarqueeAdminPreview();">
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Màu chữ số Năm / Nhãn:</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                    <input type="color" id="input-marquee-label-color-picker" value="${d.marquee_label_color || '#8B0000'}" onchange="syncHbField('marquee_label_color', this.value); document.getElementById('input-marquee-label-color').value = this.value; updateMarqueeAdminPreview();" style="height: 36px; width: 44px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; background: var(--bg-input);">
                    <input type="text" id="input-marquee-label-color" class="form-control" value="${d.marquee_label_color || '#8B0000'}" oninput="syncHbField('marquee_label_color', this.value); document.getElementById('input-marquee-label-color-picker').value = this.value; updateMarqueeAdminPreview();" style="font-size: 13px;">
                  </div>
                </div>
              </div>
            </div>

            <!-- KHỐI 3: XEM TRƯỚC TRỰC TIẾP CHUẨN GIAO DIỆN THẬT -->
            <div class="card" style="margin-bottom: 25px; overflow: hidden; border: 1px solid var(--border);">
              <div class="card-header" style="background: var(--bg-secondary); padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 700; font-size: 14px;">
                  <i class="fas fa-play-circle" style="color: #fbbf24;"></i>
                  <span>3. Xem trước dải ảnh trực tiếp (Mô phỏng 100% giao diện trang Chi bộ)</span>
                </div>
                <span style="font-size: 11.5px; color: var(--text-muted);">Tự động cập nhật tức thì</span>
              </div>
              <div style="background: #090e1a; padding: 16px;">
                <div id="marquee-admin-preview-box" style="width: 100%; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; background: #FFF1E5; padding: 18px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
                  <!-- Populated by updateMarqueeAdminPreview() -->
                </div>
              </div>
            </div>

            <!-- KHỐI 4: DANH SÁCH TỪNG MỐC ẢNH / LÃNH TỤ -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <h5 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-list-ol" style="color: var(--accent-light);"></i> 
                  <span>4. Danh Sách Hình Ảnh Chi Tiết</span>
                  <span class="badge badge-primary" id="marquee-items-count">${(d.marquee_items || []).length}</span>
                </h5>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <button class="btn btn-sm btn-secondary" onclick="addAllMissingLeadersToMarquee()" title="Nạp toàn bộ lãnh tụ còn thiếu thành card để bạn tải ảnh lên" style="display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-user-plus" style="color: #fbbf24;"></i> Nạp đủ 21 Lãnh tụ
                  </button>
                  <select class="form-select form-select-sm" onchange="if(this.value){addLeaderFromDatabase(this.value); this.value='';}" style="font-size: 12px; font-weight: 600; color: var(--text-primary); border: 1px solid var(--border); background: var(--bg-input); max-width: 250px; height: 32px; cursor: pointer;">
                    <option value="">⚡ + Thêm nhanh từng vị...</option>
                    ${LEADERS_DATABASE_20.map((l, li) => `<option value="${l.id}">${li + 1}. ${escapeHtml(l.name)} (${escapeHtml(l.year)})</option>`).join('')}
                  </select>
                  <button class="btn btn-sm btn-primary" onclick="addMarqueeItem()">
                    <i class="fas fa-plus"></i> Thêm ảnh khác
                  </button>
                </div>
              </div>

              <!-- Dedicated Missing Leaders Card Shelf -->
              <div id="missing-leaders-container" style="margin-bottom: 22px;">
                <!-- Populated by renderMarqueeItemsList() -->
              </div>

              <div id="marquee-items-container" style="display: flex; flex-direction: column; gap: 14px;">
                <!-- Populated by renderMarqueeItemsList() -->
              </div>
            </div>

          </div>

          <!-- TAB 7: CHI BỘ ẤP GÒ CAO -->
          <div id="hb-tab-pane-7" class="hb-tab-pane" style="display: none;">
            <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 14px 20px; border-radius: 8px; margin-bottom: 22px;">
              <h4 style="margin: 0 0 6px 0; font-size: 15.5px; font-weight: 700; color: #38bdf8;">
                <i class="fas fa-sitemap"></i> Section: Chi Bộ Ấp Gò Cao (Tổ chức cơ sở Đảng)
              </h4>
              <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                Tổ chức cơ sở Đảng tại địa bàn dân cư, hạt nhân chính trị lãnh đạo toàn diện thuộc Đảng bộ xã Hậu Nghĩa.
              </p>
            </div>

            <div class="form-group" style="margin-bottom: 22px;">
              <label style="font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-primary);">
                <input type="checkbox" id="input-gocao-enabled" ${d.gocao_enabled !== false ? 'checked' : ''} onchange="syncHbField('gocao_enabled', this.checked)">
                Hiển thị Section Chi bộ Ấp Gò Cao trên trang Chi bộ
              </label>
            </div>

            <!-- Huy hiệu & Tiêu đề -->
            <div class="form-grid" style="margin-bottom: 18px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Huy hiệu / Badge (Tiếng Việt):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_badge || 'TỔ CHỨC CƠ SỞ ĐẢNG • ĐỊA BÀN DÂN CƯ')}" oninput="syncHbField('gocao_badge', this.value)" style="margin-top: 4px; font-weight: 600;">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Huy hiệu / Badge (Tiếng Anh - EN):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_badge_en || 'GRASSROOTS PARTY ORGANIZATION')}" oninput="syncHbField('gocao_badge_en', this.value)" style="margin-top: 4px;">
              </div>
            </div>

            <div class="form-grid" style="margin-bottom: 18px;">
              <div class="form-group">
                <label style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Tên Chi bộ (Tiếng Việt):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_title || 'CHI BỘ ẤP GÒ CAO')}" oninput="syncHbField('gocao_title', this.value)" style="margin-top: 4px; font-weight: 700; color: #fbbf24;">
              </div>
              <div class="form-group">
                <label style="font-weight: 700; font-size: 13px; color: var(--text-secondary);">Tên Chi bộ (Tiếng Anh - EN):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_title_en || 'GO CAO HAMLET PARTY CELL')}" oninput="syncHbField('gocao_title_en', this.value)" style="margin-top: 4px;">
              </div>
            </div>

            <!-- Phụ đề giới thiệu -->
            <div class="form-grid" style="margin-bottom: 18px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Phụ đề giới thiệu vai trò (Tiếng Việt):</label>
                <textarea class="form-control" rows="2" oninput="syncHbField('gocao_subtitle', this.value)" style="margin-top: 4px;">${escapeHtml(d.gocao_subtitle || '')}</textarea>
              </div>
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Phụ đề giới thiệu vai trò (Tiếng Anh - EN):</label>
                <textarea class="form-control" rows="2" oninput="syncHbField('gocao_subtitle_en', this.value)" style="margin-top: 4px;">${escapeHtml(d.gocao_subtitle_en || '')}</textarea>
              </div>
            </div>

            <!-- Lịch sử / Ghi chú -->
            <div class="form-grid" style="margin-bottom: 18px;">
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Ghi chú lịch sử / Địa giới cũ (Tiếng Việt):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_history_note || '')}" oninput="syncHbField('gocao_history_note', this.value)" style="margin-top: 4px;">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Ghi chú lịch sử / Địa giới cũ (Tiếng Anh - EN):</label>
                <input type="text" class="form-control" value="${escapeHtml(d.gocao_history_note_en || '')}" oninput="syncHbField('gocao_history_note_en', this.value)" style="margin-top: 4px;">
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  renderContent(html);
  initHbInteractiveCanvas();
}

function switchHbTab(tabIndex) {
  for (let i = 1; i <= 7; i++) {
    const pane = document.getElementById(`hb-tab-pane-${i}`);
    const btn = document.getElementById(`tab-btn-${i}`);
    if (pane && btn) {
      if (i === tabIndex) {
        pane.style.display = 'block';
        btn.classList.add('active');
        if (i === 6) {
          updateMarqueeAdminPreview();
          renderMarqueeItemsList();
        }
      } else {
        pane.style.display = 'none';
        btn.classList.remove('active');
      }
    }
  }
}

function updateMarqueeAdminPreview() {
  const box = document.getElementById('marquee-admin-preview-box');
  if (!box) return;
  const d = currentHbData;
  const items = (Array.isArray(d.marquee_items) && d.marquee_items.length > 0)
    ? d.marquee_items
    : DEFAULT_HB_CONFIG.marquee_items;

  let seq = items;
  if (seq.length > 0 && seq.length < 8) {
    seq = [...seq, ...seq];
  }

  const h = d.marquee_height || 260;
  const speed = d.marquee_speed || 35;
  const gap = d.marquee_gap || 0;
  const showLabels = d.marquee_show_labels === true;
  const labelColor = d.marquee_label_color || '#8B0000';
  const pauseHover = d.marquee_pause_hover !== false;

  const badgeText = d.marquee_badge !== undefined ? d.marquee_badge : 'Phong trào cộng sản, công nhân quốc tế';
  const mainTitle = d.marquee_title !== undefined ? d.marquee_title : 'Các lãnh tụ và các nhà lãnh đạo nổi tiếng';
  const sourceText = d.marquee_source_text || 'Nguồn từ Tư liệu Văn kiện của Đảng';
  const sourceUrl = d.marquee_source_url || '';
  const subtitle = d.marquee_subtitle || '';

  box.innerHTML = `
    <!-- Header preview -->
    <div style="text-align: center; padding: 10px 15px 16px 15px;">
      ${badgeText ? `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(192, 57, 43, 0.08);
          border: 1px solid rgba(192, 57, 43, 0.25);
          color: #A93226;
          padding: 3px 14px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        ">
          <span style="color: #D4AC0D; font-size: 10px;">★</span>
          <span>${escapeHtml(badgeText)}</span>
          <span style="color: #D4AC0D; font-size: 10px;">★</span>
        </div>
      ` : ''}

      ${mainTitle ? `
        <h3 style="
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 800;
          color: #68350B;
          letter-spacing: 1px;
          margin: 0 0 6px 0;
          text-transform: uppercase;
        ">
          ${escapeHtml(mainTitle)}
        </h3>
      ` : ''}

      ${sourceUrl ? `
        <div style="margin-bottom: 6px;">
          <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #8A5A36;
            text-decoration: none;
            font-style: italic;
            padding: 3px 12px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(220, 200, 185, 0.75);
          ">
            <span>${escapeHtml(sourceText)} —</span>
            <strong style="font-style: normal; color: #B03A2E;">${escapeHtml(mainTitle || 'Liên kết nguồn')}</strong>
            <i class="fas fa-external-link-alt" style="font-size: 10px; color: #c0392b;"></i>
          </a>
        </div>
      ` : ''}

      ${subtitle ? `
        <p style="font-size: 12.5px; color: #8A5A36; font-style: italic; margin: 0;">
          ${escapeHtml(subtitle)}
        </p>
      ` : ''}
    </div>

    <!-- Running track preview (Interactive Draggable) -->
    <div 
      id="admin-marquee-scroll-container"
      style="
        width: 100%; 
        overflow-x: scroll; 
        overflow-y: hidden; 
        position: relative; 
        height: ${h}px; 
        mask-image: linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%); 
        -webkit-mask-image: linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%);
        scrollbar-width: none;
        -ms-overflow-style: none;
        cursor: grab;
        user-select: none;
        touch-action: pan-y;
      "
    >
      <div 
        id="admin-marquee-track-el"
        class="admin-marquee-track ${pauseHover ? 'pause-on-hover' : ''}" 
        style="
          display: flex; 
          width: max-content; 
          height: 100%; 
          gap: ${gap}px;
        "
      >
        ${[...seq, ...seq, ...seq].map((it, idx) => `
          <div style="position: relative; display: inline-flex; height: 100%; flex-shrink: 0; overflow: hidden; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <img src="${escapeHtml(it.image)}" alt="" draggable="false" style="height: 100%; width: auto; display: block; object-fit: cover; pointer-events: none;" onerror="this.src='/assets/img/timeline_1996.png'">
            ${showLabels && (it.name || it.year) ? `
              <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 18px 6px 4px 6px; background: linear-gradient(to top, rgba(255,241,229,0.96) 0%, rgba(255,241,229,0.7) 60%, transparent 100%); text-align: center; pointer-events: none;">
                ${it.name ? `<div style="font-family: Georgia, serif; font-weight: 700; font-size: 12.5px; color: #3B291A; line-height: 1.15; margin-bottom: 2px; text-shadow: 0 1px 2px #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(it.name)}</div>` : ''}
                ${it.year ? `<span style="font-family: serif; font-weight: 800; font-size: 13.5px; color: ${labelColor}; text-shadow: 0 1px 2px #fff;">${escapeHtml(it.year)}</span>` : ''}
              </div>
            ` : ''}
            ${it.url && it.url.trim() ? `
              <div style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;" title="Có liên kết: ${escapeHtml(it.url)}">
                <i class="fas fa-link"></i>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 10px; font-size: 11.5px; color: var(--text-muted);">
      <i class="fas fa-arrows-alt-h" style="color: var(--accent-light);"></i>
      <span>Dùng chuột kéo qua kéo lại hoặc vuốt tay trên điện thoại để xem toàn bộ danh sách</span>
    </div>
  `;

  const isPaused = Boolean(d.marquee_paused === true || d.marquee_auto_scroll === false);
  initAdminMarqueeDraggable(speed, pauseHover, isPaused);
}

let adminMarqueeAnimId = null;

function initAdminMarqueeDraggable(speed, pauseHover, isPaused) {
  if (adminMarqueeAnimId) {
    cancelAnimationFrame(adminMarqueeAnimId);
    adminMarqueeAnimId = null;
  }
  const container = document.getElementById('admin-marquee-scroll-container');
  const track = document.getElementById('admin-marquee-track-el');
  if (!container || !track) return;

  const centerCopy = () => {
    const oneThird = track.scrollWidth / 3;
    if (oneThird > 0 && (container.scrollLeft === 0 || container.scrollLeft < oneThird / 2)) {
      container.scrollLeft = oneThird;
    }
  };

  setTimeout(centerCopy, 100);
  setTimeout(centerCopy, 400);

  let isDragging = false;
  let startX = 0;
  let scrollStart = 0;
  let isHovered = false;
  let lastTime = performance.now();

  const loop = (now) => {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const oneThird = track.scrollWidth / 3;
    if (oneThird > 0) {
      if (!isDragging) {
        if (container.scrollLeft >= 2 * oneThird) {
          container.scrollLeft -= oneThird;
        } else if (container.scrollLeft <= oneThird / 2) {
          container.scrollLeft += oneThird;
        }

        if (!isPaused && (!pauseHover || !isHovered)) {
          const pxPerSec = speed > 0 ? (oneThird / speed) : 35;
          container.scrollLeft += pxPerSec * dt;
        }
      }
    }
    adminMarqueeAnimId = requestAnimationFrame(loop);
  };
  adminMarqueeAnimId = requestAnimationFrame(loop);

  container.onmouseenter = () => { isHovered = true; };
  container.onmouseleave = () => { isHovered = false; };
  container.ondragstart = (e) => { e.preventDefault(); return false; };
  track.ondragstart = (e) => { e.preventDefault(); return false; };

  container.onpointerdown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    scrollStart = container.scrollLeft;
    container.style.cursor = 'grabbing';
    track.style.pointerEvents = 'none';
    try { container.setPointerCapture(e.pointerId); } catch (_) {}
  };

  container.onpointermove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    container.scrollLeft = scrollStart - dx;
    const oneThird = track.scrollWidth / 3;
    if (oneThird > 0) {
      if (container.scrollLeft >= 2 * oneThird) {
        container.scrollLeft -= oneThird;
        scrollStart -= oneThird;
      } else if (container.scrollLeft <= oneThird / 2) {
        container.scrollLeft += oneThird;
        scrollStart += oneThird;
      }
    }
  };

  container.onpointerup = (e) => {
    isDragging = false;
    container.style.cursor = 'grab';
    track.style.pointerEvents = 'auto';
    try {
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  container.onpointercancel = () => {
    isDragging = false;
    container.style.cursor = 'grab';
    track.style.pointerEvents = 'auto';
  };
}

function renderMarqueeItemsList() {
  const container = document.getElementById('marquee-items-container');
  if (!container) return;
  const d = currentHbData;
  if (!Array.isArray(d.marquee_items)) {
    d.marquee_items = JSON.parse(JSON.stringify(DEFAULT_HB_CONFIG.marquee_items));
  }

  // Update dynamic count badge
  const countBadge = document.getElementById('marquee-items-count');
  if (countBadge) {
    countBadge.innerText = d.marquee_items.length;
  }

  // 1. Identify missing leaders from LEADERS_DATABASE_20
  const existingNames = new Set(
    d.marquee_items.map(it => (it.name || '').trim().toLowerCase())
  );
  const existingUrls = new Set(
    d.marquee_items.filter(it => it.url).map(it => it.url.trim().toLowerCase())
  );

  const missingLeaders = LEADERS_DATABASE_20.filter(l => {
    const byName = existingNames.has(l.name.trim().toLowerCase());
    const byUrl = l.url && existingUrls.has(l.url.trim().toLowerCase());
    return !byName && !byUrl;
  });

  const needingPhotoInItems = d.marquee_items.filter(it => {
    return !it.image || it.image.includes('timeline_1996.png') || it.image.includes('template_error.png');
  });

  // 2. Render Dedicated Shelf for Missing Leaders
  const missingBox = document.getElementById('missing-leaders-container');
  if (missingBox) {
    if (missingLeaders.length === 0) {
      missingBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; color: #34d399; font-weight: 700; font-size: 13.5px;">
            <i class="fas fa-check-circle" style="font-size: 20px; color: #10b981;"></i>
            <span>Toàn bộ 21 Lãnh tụ trong Hồ sơ Tư liệu Văn kiện Đảng đã có mặt đầy đủ trong dải ảnh!</span>
          </div>
          ${needingPhotoInItems.length > 0 ? `
            <span class="badge badge-warning">
              ⚠️ Còn ${needingPhotoInItems.length} vị đang chờ tải ảnh chân dung bên dưới
            </span>
          ` : `
            <span class="badge badge-success">
              ✓ Dải ảnh đã hoàn thiện 100%
            </span>
          `}
        </div>
      `;
    } else {
      missingBox.innerHTML = `
        <div class="card" style="background: rgba(245, 158, 11, 0.03); border: 1.5px dashed rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="badge badge-warning">SẴN SÀNG TẢI ẢNH</span>
                <h6 style="margin: 0; font-size: 15px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-user-clock"></i> Các Lãnh Tụ Còn Thiếu (${missingLeaders.length} vị) — Bấm Tải Ảnh Lên Ngay
                </h6>
              </div>
              <p style="margin: 6px 0 0 0; font-size: 12.5px; color: var(--text-muted); max-width: 800px; line-height: 1.45;">
                Dưới đây là các vị lãnh tụ theo Tư liệu Văn kiện ĐCSVN chưa có trong dải ảnh. Bạn chỉ cần bấm nút <strong>"📷 Tải ảnh lên ngay"</strong> tại từng card để chọn ảnh từ máy tính, hệ thống sẽ tự động nạp ảnh kèm tên, năm sinh năm mất và link chính thức.
              </p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="addAllMissingLeadersToMarquee()" title="Tạo sẵn tất cả ${missingLeaders.length} card lãnh tụ vào dải ảnh để tải ảnh lần lượt" style="display: inline-flex; align-items: center; gap: 6px;">
              <i class="fas fa-layer-group"></i> Nạp đủ ${missingLeaders.length} Card vào dải ảnh
            </button>
          </div>

          <!-- Cards Grid for Missing Leaders -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
            ${missingLeaders.map(l => `
              <div class="card" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span class="badge badge-warning" style="font-size: 10px;">CHƯA CÓ ẢNH</span>
                    ${l.url ? `
                      <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--accent-light); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="Mở trang Tư liệu Văn kiện của Đảng">
                        <i class="fas fa-external-link-alt"></i> Tư liệu
                      </a>
                    ` : ''}
                  </div>

                  <!-- Silhouette avatar with upload click -->
                  <div 
                    onclick="document.getElementById('missing-file-${l.id}').click()" 
                    style="height: 110px; border-radius: 8px; background: var(--bg-input); border: 1.5px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 10px; transition: all 0.2s;"
                    onmouseover="this.style.borderColor='var(--accent)';" 
                    onmouseout="this.style.borderColor='var(--border)';"
                    title="Bấm để chọn file ảnh trên máy tính cho ${escapeHtml(l.name)}"
                  >
                    <i class="fas fa-camera" style="font-size: 26px; color: var(--text-muted); margin-bottom: 4px;"></i>
                    <span style="font-size: 11px; font-weight: 700; color: var(--text-primary);">Bấm chọn ảnh</span>
                    <span style="font-size: 10px; color: var(--text-muted);">(WebP, PNG, JPG)</span>
                  </div>

                  <div style="font-weight: 700; font-size: 14.5px; color: var(--text-primary); line-height: 1.25; margin-bottom: 2px;">
                    ${escapeHtml(l.name)}
                  </div>
                  <div style="font-size: 12.5px; font-weight: 700; color: #fbbf24; font-family: serif; margin-bottom: 6px;">
                    ${escapeHtml(l.year)}
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); line-height: 1.35; margin-bottom: 12px; min-height: 32px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(l.title || '')}">
                    ${escapeHtml(l.title || 'Nhà tư tưởng / Lãnh đạo phong trào vô sản')}
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px dashed var(--border);">
                  <input type="file" id="missing-file-${l.id}" accept="image/*" style="display: none;" onchange="uploadMissingLeaderImage('${l.id}', this)">
                  <button class="btn btn-sm btn-primary" onclick="document.getElementById('missing-file-${l.id}').click()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-upload"></i> Tải ảnh lên ngay
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="addLeaderFromDatabase('${l.id}')" style="width: 100%;">
                    <i class="fas fa-plus"></i> Thêm card trước
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // 3. Render Main Active Marquee Cards List
  if (d.marquee_items.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 30px; text-align: center; border: 1.5px dashed var(--border);">
        <p style="color: var(--text-muted); margin-bottom: 14px;">Chưa có ảnh nào trong dải ảnh.</p>
        <button class="btn btn-primary btn-sm" onclick="addMarqueeItem()">+ Thêm ảnh đầu tiên</button>
      </div>
    `;
    return;
  }

  container.innerHTML = d.marquee_items.map((it, idx) => {
    const hasRealImage = it.image && !it.image.includes('timeline_1996.png') && !it.image.includes('template_error.png');

    return `
    <div class="card" style="border: 1px solid ${hasRealImage ? 'var(--border)' : 'rgba(245, 158, 11, 0.4)'}; background: var(--bg-card); margin-bottom: 14px; border-radius: 12px; overflow: hidden;">
      
      <!-- Card Header: Index, Title, Status & Controls -->
      <div style="padding: 10px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span class="badge badge-primary" style="font-size: 12px;">#${idx + 1}</span>
          <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${escapeHtml(it.name || 'Ảnh chưa đặt tên')}</span>
          ${it.year ? `<span style="font-size: 12.5px; font-weight: 700; color: #fbbf24;">(${escapeHtml(it.year)})</span>` : ''}
          ${hasRealImage ? `
            <span class="badge badge-success"><i class="fas fa-check-circle"></i> Đã có ảnh</span>
          ` : `
            <span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Cần tải ảnh</span>
          `}
        </div>

        <!-- Quick-Fill Preset & Reorder/Delete buttons -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <select class="form-select form-select-sm" style="font-size: 11.5px; padding: 2px 8px; width: auto; max-width: 240px; height: 28px; background: var(--bg-input); border-color: var(--border); color: var(--text-secondary);" onchange="applyLeaderPresetToItem(${idx}, this.value)">
            <option value="">⚡ Chọn từ 21 Lãnh tụ...</option>
            ${LEADERS_DATABASE_20.map((l, li) => `
              <option value="${l.id}" ${(it.name && it.name.trim().toLowerCase() === l.name.trim().toLowerCase()) ? 'selected' : ''}>
                ${li + 1}. ${escapeHtml(l.name)} (${escapeHtml(l.year)})
              </option>
            `).join('')}
          </select>

          ${it.url ? `
            <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success" style="padding: 3px 8px; font-size: 11px;" title="Mở trang tư liệu gốc">
              <i class="fas fa-external-link-alt"></i>
            </a>
          ` : ''}

          <div class="btn-group" style="display: inline-flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
            <button class="btn btn-sm btn-secondary" onclick="moveMarqueeItem(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Di chuyển lên" style="padding: 4px 8px;">
              <i class="fas fa-arrow-up"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="moveMarqueeItem(${idx}, 1)" ${idx === d.marquee_items.length - 1 ? 'disabled' : ''} title="Di chuyển xuống" style="padding: 4px 8px;">
              <i class="fas fa-arrow-down"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteMarqueeItem(${idx})" title="Xoá ảnh này" style="padding: 4px 8px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Card Body: Thumbnail & Form fields -->
      <div style="padding: 16px 18px; display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap;">
        
        <!-- Thumbnail & Upload -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div 
            onclick="document.getElementById('marquee-file-${idx}').click()" 
            style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: var(--bg-input); border: 1.5px solid ${hasRealImage ? 'var(--border)' : '#fbbf24'}; flex-shrink: 0; cursor: pointer; position: relative;"
            title="Bấm để tải ảnh chân dung mới từ máy tính"
          >
            <img src="${escapeHtml(it.image)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/img/timeline_1996.png'">
            ${!hasRealImage ? `
              <div style="position: absolute; inset: 0; background: rgba(245, 158, 11, 0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #1c1917;">
                <i class="fas fa-camera" style="font-size: 16px; margin-bottom: 2px;"></i>
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase;">Tải ảnh</span>
              </div>
            ` : ''}
          </div>
          <input type="file" id="marquee-file-${idx}" accept="image/*" style="display: none;" onchange="uploadMarqueeItemImage(${idx}, this)">
          <button class="btn btn-sm ${hasRealImage ? 'btn-secondary' : 'btn-primary'}" onclick="document.getElementById('marquee-file-${idx}').click()" style="width: 80px; padding: 3px 0; font-size: 11px; font-weight: 600;">
            <i class="fas fa-upload"></i> ${hasRealImage ? 'Đổi ảnh' : 'Tải ảnh'}
          </button>
        </div>

        <!-- Fields Grid -->
        <div style="flex: 1; min-width: 280px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <!-- Image URL -->
          <div style="min-width: 220px;">
            <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 3px; display: block;">
              Đường dẫn ảnh:
            </label>
            <input type="text" class="form-control form-control-sm" value="${escapeHtml(it.image)}" oninput="updateMarqueeItem(${idx}, 'image', this.value)" style="font-size: 12px;">
          </div>

          <!-- Name / Person Label -->
          <div>
            <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 3px; display: block;">Tên nhân vật / Nhãn chính:</label>
            <input type="text" class="form-control form-control-sm" placeholder="VD: Karl Marx" value="${escapeHtml(it.name || '')}" oninput="updateMarqueeItem(${idx}, 'name', this.value)" style="font-size: 12px; font-weight: 700; color: var(--text-primary);">
          </div>

          <!-- Year / Sub-Label -->
          <div style="max-width: 160px;">
            <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 3px; display: block;">Năm / Mốc thời gian:</label>
            <input type="text" class="form-control form-control-sm" placeholder="VD: 1818 – 1883" value="${escapeHtml(it.year || '')}" oninput="updateMarqueeItem(${idx}, 'year', this.value)" style="font-weight: 700; color: #fbbf24; font-size: 12px;">
          </div>

          <!-- Title / Tooltip -->
          <div>
            <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 3px; display: block;">Tiêu đề / Chú thích tooltip:</label>
            <input type="text" class="form-control form-control-sm" placeholder="VD: Nhà triết học và kinh tế học" value="${escapeHtml(it.title || '')}" oninput="updateMarqueeItem(${idx}, 'title', this.value)" style="font-size: 12px;">
          </div>

          <!-- Destination URL -->
          <div style="grid-column: 1 / -1;">
            <label style="font-size: 11.5px; font-weight: 600; color: var(--accent-light); margin-bottom: 3px; display: flex; align-items: center; gap: 5px;">
              <i class="fas fa-link"></i>
              <span>Đường dẫn liên kết khi bấm vào ảnh (URL):</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(Để trống nếu chưa có link)</span>
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-control form-control-sm" placeholder="VD: https://tulieuvankien.dangcongsan.vn/..." value="${escapeHtml(it.url || '')}" oninput="updateMarqueeItem(${idx}, 'url', this.value)" style="font-size: 12px; flex: 1;">
              <select class="form-select form-select-sm" onchange="updateMarqueeItem(${idx}, 'target', this.value)" style="width: 120px; font-size: 12px; background: var(--bg-input); border-color: var(--border); color: var(--text-secondary);">
                <option value="_blank" ${it.target !== '_self' ? 'selected' : ''}>Mở tab mới</option>
                <option value="_self" ${it.target === '_self' ? 'selected' : ''}>Cùng tab</option>
              </select>
            </div>
          </div>
        </div>

      </div>

    </div>
    `;
  }).join('');
}

function updateMarqueeItem(idx, field, val) {
  if (!currentHbData.marquee_items || !currentHbData.marquee_items[idx]) return;
  currentHbData.marquee_items[idx][field] = val;
  updateMarqueeAdminPreview();
}

function applyLeaderPresetToItem(idx, leaderId) {
  if (!currentHbData.marquee_items || !currentHbData.marquee_items[idx]) return;
  const leader = LEADERS_DATABASE_20.find(l => l.id === leaderId);
  if (!leader) return;

  const item = currentHbData.marquee_items[idx];
  item.name = leader.name;
  item.year = leader.year;
  item.title = leader.title;
  item.url = leader.url;
  item.target = '_blank';

  if ((!item.image || item.image.includes('timeline_1996.png')) && leader.defaultImage) {
    item.image = leader.defaultImage;
  }

  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
  showToast(`Đã tự điền tên, năm và link cho "${leader.name}"!`, "success");
}

function addLeaderFromDatabase(leaderId) {
  const leader = LEADERS_DATABASE_20.find(l => l.id === leaderId);
  if (!leader) return;

  if (!Array.isArray(currentHbData.marquee_items)) {
    currentHbData.marquee_items = [];
  }
  const nextId = currentHbData.marquee_items.length + 1;
  currentHbData.marquee_items.push({
    id: nextId,
    image: leader.defaultImage || '/assets/img/timeline_1996.png',
    name: leader.name,
    year: leader.year,
    title: leader.title,
    url: leader.url,
    target: '_blank'
  });

  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
  showToast(`Đã thêm card "${leader.name}" vào dải ảnh! Bạn có thể bấm "Tải ảnh ngay" để chọn ảnh.`, "success");
}

function addAllMissingLeadersToMarquee() {
  if (!Array.isArray(currentHbData.marquee_items)) {
    currentHbData.marquee_items = [];
  }
  const existingNames = new Set(
    currentHbData.marquee_items.map(it => (it.name || '').trim().toLowerCase())
  );
  const existingUrls = new Set(
    currentHbData.marquee_items.filter(it => it.url).map(it => it.url.trim().toLowerCase())
  );
  
  let addedCount = 0;
  LEADERS_DATABASE_20.forEach(l => {
    const byName = existingNames.has(l.name.trim().toLowerCase());
    const byUrl = l.url && existingUrls.has(l.url.trim().toLowerCase());
    if (!byName && !byUrl) {
      currentHbData.marquee_items.push({
        id: currentHbData.marquee_items.length + 1,
        image: l.defaultImage || '/assets/img/timeline_1996.png',
        name: l.name,
        year: l.year,
        title: l.title,
        url: l.url,
        target: '_blank'
      });
      existingNames.add(l.name.trim().toLowerCase());
      addedCount++;
    }
  });

  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
  if (addedCount > 0) {
    showToast(`Đã thêm ${addedCount} card lãnh tụ còn thiếu vào dải ảnh! Bạn có thể bấm "Tải ảnh ngay" cho từng vị.`, "success");
  } else {
    showToast("Tất cả 21 Lãnh tụ đã có sẵn card trong dải ảnh!", "info");
  }
}

function addMarqueeItem() {
  if (!Array.isArray(currentHbData.marquee_items)) {
    currentHbData.marquee_items = [];
  }
  const nextId = currentHbData.marquee_items.length + 1;
  currentHbData.marquee_items.push({
    id: nextId,
    image: '/assets/img/timeline_1996.png',
    year: '2026',
    title: 'Mốc sự kiện mới',
    url: '',
    target: '_blank'
  });
  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
  showToast("Đã thêm mốc ảnh mới vào danh sách!", "success");
}

function deleteMarqueeItem(idx) {
  if (!confirm("Bạn có chắc chắn muốn xóa mốc ảnh này khỏi dải ảnh?")) return;
  currentHbData.marquee_items.splice(idx, 1);
  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
  showToast("Đã xóa ảnh!", "info");
}

function moveMarqueeItem(idx, dir) {
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= currentHbData.marquee_items.length) return;
  const temp = currentHbData.marquee_items[idx];
  currentHbData.marquee_items[idx] = currentHbData.marquee_items[targetIdx];
  currentHbData.marquee_items[targetIdx] = temp;
  renderMarqueeItemsList();
  updateMarqueeAdminPreview();
}

async function uploadMarqueeItemImage(idx, input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());

    if (res.success) {
      updateMarqueeItem(idx, 'image', res.path);
      renderMarqueeItemsList();
      showToast("Tải ảnh lên thành công!", "success");
    } else {
      showToast("Lỗi tải ảnh: " + (res.error || "Unknown"), "error");
    }
  } catch (err) {
    showToast("Lỗi mạng khi tải ảnh", "error");
  } finally {
    hideLoading();
  }
}

async function uploadMissingLeaderImage(leaderId, input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());

    if (res.success) {
      const leader = LEADERS_DATABASE_20.find(l => l.id === leaderId);
      if (!leader) return;

      if (!Array.isArray(currentHbData.marquee_items)) {
        currentHbData.marquee_items = [];
      }

      const existingIdx = currentHbData.marquee_items.findIndex(it => 
        (it.name && it.name.trim().toLowerCase() === leader.name.trim().toLowerCase()) ||
        (it.url && it.url === leader.url)
      );

      if (existingIdx >= 0) {
        currentHbData.marquee_items[existingIdx].image = res.path;
      } else {
        currentHbData.marquee_items.push({
          id: currentHbData.marquee_items.length + 1,
          image: res.path,
          name: leader.name,
          year: leader.year,
          title: leader.title,
          url: leader.url,
          target: '_blank'
        });
      }

      renderMarqueeItemsList();
      updateMarqueeAdminPreview();
      showToast(`Đã tải ảnh lên thành công cho lãnh tụ "${leader.name}"!`, "success");
    } else {
      showToast("Lỗi tải ảnh: " + (res.error || "Unknown"), "error");
    }
  } catch (err) {
    showToast("Lỗi mạng khi tải ảnh", "error");
  } finally {
    hideLoading();
  }
}

function applyMarqueePreset(type) {
  if (type === 'leaders12' || type === 'leaders10' || type === 'leaders5') {
    if (!confirm("Chuyển dải ảnh sang bộ 12 Lãnh tụ / Nhà Tư tưởng XHCN (định dạng WebP siêu nhẹ)?")) return;
    currentHbData.marquee_items = JSON.parse(JSON.stringify(MARQUEE_PRESET_LEADERS));
    currentHbData.marquee_height = 260;
    currentHbData.marquee_gap = 0;
    currentHbData.marquee_show_labels = true;
    showToast("Đã áp dụng bộ 12 Lãnh tụ WebP!", "success");
  } else if (type === 'leaders21' || type === 'leaders21_full') {
    if (!confirm("Chuyển dải ảnh sang trọn bộ 21 Lãnh tụ ĐCSVN (gồm 12 vị có sẵn WebP + 9 vị hiển thị sẵn card để bạn tải ảnh lên)?")) return;
    currentHbData.marquee_items = LEADERS_DATABASE_20.map((l, i) => ({
      id: i + 1,
      image: l.defaultImage || '/assets/img/timeline_1996.png',
      name: l.name,
      year: l.year,
      title: l.title,
      url: l.url,
      target: '_blank'
    }));
    currentHbData.marquee_height = 260;
    currentHbData.marquee_gap = 0;
    currentHbData.marquee_show_labels = true;
    showToast("Đã nạp trọn bộ 21 Lãnh tụ! Các card còn thiếu đã sẵn sàng để tải ảnh.", "success");
  } else if (type === 'congress7') {
    if (!confirm("Chuyển dải ảnh sang bộ 7 Mốc son Đại hội Đảng (1996 – 2026)?")) return;
    currentHbData.marquee_items = JSON.parse(JSON.stringify(MARQUEE_PRESET_CONGRESS));
    currentHbData.marquee_height = 215;
    currentHbData.marquee_gap = 0;
    currentHbData.marquee_show_labels = false;
    showToast("Đã áp dụng bộ 7 mốc Đại hội Đảng!", "success");
  } else if (type === 'all19' || type === 'all17' || type === 'all12' || type === 'all28') {
    if (!confirm("Gộp cả Lãnh tụ và 7 Mốc Đại hội thành chuỗi dải ảnh tự chạy?")) return;
    const baseLeaders = (currentHbData.marquee_items && currentHbData.marquee_items.length >= 21)
      ? currentHbData.marquee_items
      : LEADERS_DATABASE_20.map((l, i) => ({
          id: i + 1,
          image: l.defaultImage || '/assets/img/timeline_1996.png',
          name: l.name,
          year: l.year,
          title: l.title,
          url: l.url,
          target: '_blank'
        }));
    const combined = [
      ...JSON.parse(JSON.stringify(baseLeaders)),
      ...JSON.parse(JSON.stringify(MARQUEE_PRESET_CONGRESS))
    ].map((it, i) => ({ ...it, id: i + 1 }));
    currentHbData.marquee_items = combined;
    currentHbData.marquee_height = 250;
    currentHbData.marquee_gap = 0;
    currentHbData.marquee_show_labels = true;
    showToast(`Đã gộp toàn bộ ${combined.length} ảnh!`, "success");
  }
  renderTuTuongUI();
  switchHbTab(6);
}

function resetMarqueeToDefault() {
  applyMarqueePreset('leaders12');
}

function setHbDragTarget(target) {
  hbDragTarget = target;
  const btnP = document.getElementById('btn-drag-portrait');
  const btnD = document.getElementById('btn-drag-drum');
  const btnM = document.getElementById('btn-drag-master');
  const drumBox = document.getElementById('preview-hb-drum-box');
  const container = document.getElementById('preview-hb-main-container');
  
  [btnP, btnD, btnM].forEach(b => {
    if (b) {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
      b.style.background = '';
      b.style.color = '';
    }
  });

  if (target === 'portrait' && btnP) {
    btnP.classList.remove('btn-secondary');
    btnP.classList.add('btn-primary');
    if (drumBox) drumBox.style.cursor = 'default';
    if (container) container.style.cursor = 'default';
  } else if (target === 'drum' && btnD) {
    btnD.classList.remove('btn-secondary');
    btnD.classList.add('btn-primary');
    if (drumBox) drumBox.style.cursor = 'crosshair';
    if (container) container.style.cursor = 'default';
  } else if (target === 'master' && btnM) {
    btnM.classList.remove('btn-secondary');
    btnM.classList.add('btn-primary');
    if (drumBox) drumBox.style.cursor = 'ew-resize';
    if (container) container.style.cursor = 'ew-resize';
  }
}

function setPortraitColorMode(mode) {
  if (mode === 'natural') {
    syncHbField('portrait_grayscale', 0);
    syncHbField('portrait_blend_mode', 'normal');
    syncHbField('portrait_contrast', 100);
    syncHbField('portrait_brightness', 100);
    syncHbField('portrait_mask', false);
    showToast("Đã chuyển sang chế độ Màu Gốc Tự Nhiên!", "success");
  } else if (mode === 'bw') {
    syncHbField('portrait_grayscale', 100);
    syncHbField('portrait_blend_mode', 'normal');
    syncHbField('portrait_contrast', 115);
    syncHbField('portrait_brightness', 100);
    showToast("Đã chuyển sang Đen Trắng Cổ Điển!", "info");
  } else if (mode === 'multiply') {
    syncHbField('portrait_grayscale', 0);
    syncHbField('portrait_blend_mode', 'multiply');
    syncHbField('portrait_contrast', 105);
    syncHbField('portrait_brightness', 105);
    showToast("Đã chuyển sang Hòa Trộn Multiply!", "info");
  }

  // Cập nhật lại các slider trong UI
  const gSlider = document.getElementById('input-portrait-grayscale');
  const bSlider = document.getElementById('input-portrait-brightness');
  const cSlider = document.getElementById('input-portrait-contrast');
  const mSelect = document.getElementById('input-portrait-blend-mode');
  const maskCheck = document.getElementById('input-portrait-mask');

  if (gSlider) { gSlider.value = currentHbData.portrait_grayscale; document.getElementById('val-portrait-grayscale').innerText = currentHbData.portrait_grayscale + '%'; }
  if (bSlider) { bSlider.value = currentHbData.portrait_brightness; document.getElementById('val-portrait-brightness').innerText = currentHbData.portrait_brightness + '%'; }
  if (cSlider) { cSlider.value = currentHbData.portrait_contrast; document.getElementById('val-portrait-contrast').innerText = currentHbData.portrait_contrast + '%'; }
  if (mSelect) mSelect.value = currentHbData.portrait_blend_mode;
  if (maskCheck) maskCheck.checked = currentHbData.portrait_mask;
}

function syncHbField(key, val) {
  currentHbData[key] = val;
  updateHbPreviewDOM();
}

function stepHbScale(delta) {
  const current = currentHbData.banner_scale || 100;
  const next = Math.max(60, Math.min(150, current + delta));
  syncHbField('banner_scale', next);
  const inputMain = document.getElementById('input-banner-scale');
  const labelMain = document.getElementById('val-banner-scale');
  const inputTab = document.getElementById('input-drum-box-scale');
  const labelTab = document.getElementById('val-drum-box-scale');
  if (inputMain) inputMain.value = next;
  if (labelMain) labelMain.innerText = next + '%';
  if (inputTab) inputTab.value = next;
  if (labelTab) labelTab.innerText = next + '%';
}

function updateHbPreviewDOM() {
  const d = currentHbData;
  const wrapper = document.getElementById('preview-hb-wrapper');
  const container = document.getElementById('preview-hb-main-container');
  const drumBox = document.getElementById('preview-hb-drum-box');
  const drum = document.getElementById('preview-hb-drum');
  const subtitle = document.getElementById('preview-hb-subtitle');
  const title = document.getElementById('preview-hb-title');
  const titleWrapper = document.getElementById('preview-hb-title-wrapper');
  const starL = document.getElementById('preview-hb-star-left');
  const starR = document.getElementById('preview-hb-star-right');
  const titleBlock = document.getElementById('preview-hb-title-block');
  const portraitContainer = document.getElementById('preview-hb-portrait-container');
  const portrait = document.getElementById('preview-hb-portrait');
  const bottomBar = document.getElementById('preview-hb-bottom-bar');

  const scale = (d.banner_scale !== undefined ? Number(d.banner_scale) : 100) / 100;
  const baseH = Math.max(d.drum_box_height, d.portrait_max_height);

  if (wrapper) {
    wrapper.style.minHeight = Math.round(baseH * scale) + 'px';
  }

  if (container) {
    container.style.minHeight = baseH + 'px';
    container.style.left = (d.banner_offset_x || 0) + 'px';
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'bottom center';
  }

  if (drumBox) {
    drumBox.style.backgroundColor = d.drum_box_bg;
    drumBox.style.borderRadius = d.drum_box_radius + 'px';
    drumBox.style.minHeight = d.drum_box_height + 'px';
    drumBox.style.marginLeft = d.drum_box_margin_left + 'px';
  }

  if (drum) {
    drum.style.top = d.drum_y + '%';
    drum.style.left = d.drum_x + '%';
    drum.style.width = d.drum_size + 'px';
    drum.style.height = d.drum_size + 'px';
    drum.style.backgroundImage = `url('${d.drum_image}')`;
    drum.style.opacity = d.drum_opacity / 100;
    drum.style.transform = `translate(-50%, -50%) rotate(${d.drum_rotate}deg)`;
    drum.style.filter = `sepia(${d.drum_sepia}%) saturate(${d.drum_saturate}%) blur(${d.drum_blur}px)`;
    drum.style.mixBlendMode = d.drum_blend_mode;
  }

  if (subtitle) {
    subtitle.innerText = d.subtitle || '';
    subtitle.style.fontSize = d.subtitle_size + 'px';
    subtitle.style.color = d.subtitle_color;
  }

  if (title) {
    title.innerText = d.title || '';
    title.style.color = d.title_color;
  }

  if (titleWrapper) {
    titleWrapper.style.fontSize = d.title_size + 'px';
  }

  if (starL && starR) {
    starL.style.display = d.show_stars ? 'inline' : 'none';
    starR.style.display = d.show_stars ? 'inline' : 'none';
    starL.style.color = d.star_color;
    starR.style.color = d.star_color;
  }

  if (titleBlock) {
    titleBlock.style.transform = `translate(${d.text_x}px, ${d.text_y}px)`;
  }

  if (portraitContainer) {
    portraitContainer.style.transform = `translate(${d.portrait_x}px, ${d.portrait_y}px)`;
  }

  if (portrait) {
    portrait.src = d.portrait_image;
    portrait.style.maxHeight = d.portrait_max_height + 'px';
    portrait.style.mixBlendMode = d.portrait_blend_mode;
    portrait.style.opacity = d.portrait_opacity / 100;
    portrait.style.filter = `contrast(${d.portrait_contrast}%) brightness(${d.portrait_brightness}%) grayscale(${d.portrait_grayscale}%) blur(${d.portrait_blur}px)`;
    portrait.style.webkitMaskImage = d.portrait_mask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none';
    portrait.style.maskImage = d.portrait_mask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none';
    portrait.style.transform = `scale(${d.portrait_scale / 100}) ${d.portrait_flip ? 'scaleX(-1)' : ''}`;
  }

  if (bottomBar) {
    bottomBar.style.display = d.bottom_bar_enabled ? 'block' : 'none';
  }
}

function initHbInteractiveCanvas() {
  const portraitEl = document.getElementById('preview-hb-portrait-container');
  const drumBox = document.getElementById('preview-hb-drum-box');
  
  if (!portraitEl) return;

  // 1. Kéo thả Ảnh Bác (Section 2)
  let isDraggingPortrait = false;
  let startX = 0, startY = 0;
  let initPortX = 0, initPortY = 0;

  portraitEl.addEventListener('mousedown', (e) => {
    isDraggingPortrait = true;
    startX = e.clientX;
    startY = e.clientY;
    initPortX = currentHbData.portrait_x;
    initPortY = currentHbData.portrait_y;
    portraitEl.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingPortrait) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.round(initPortX + dx);
      const newY = Math.round(initPortY + dy);
      
      currentHbData.portrait_x = newX;
      currentHbData.portrait_y = newY;
      
      portraitEl.style.transform = `translate(${newX}px, ${newY}px)`;
      
      const sliderX = document.getElementById('input-portrait-x');
      const sliderY = document.getElementById('input-portrait-y');
      const valX = document.getElementById('val-portrait-x');
      const valY = document.getElementById('val-portrait-y');
      
      if (sliderX) sliderX.value = newX;
      if (sliderY) sliderY.value = newY;
      if (valX) valX.innerText = newX + 'px';
      if (valY) valY.innerText = newY + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingPortrait) {
      isDraggingPortrait = false;
      portraitEl.style.cursor = 'grab';
    }
  });

  // 2. Kéo thả Trống Đồng (Section 1)
  let isDraggingDrum = false;

  drumBox.addEventListener('mousedown', (e) => {
    if (hbDragTarget !== 'drum') return;
    if (e.target.closest('#preview-hb-portrait-container')) return;
    isDraggingDrum = true;
    updateDrumPosFromEvent(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingDrum && hbDragTarget === 'drum') {
      updateDrumPosFromEvent(e);
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingDrum = false;
  });

  // 3. Kéo thả Section Mẹ (Master Section)
  let isDraggingMaster = false;
  let startMasterX = 0;
  let initOffsetX = 0;

  const mainContainerEl = document.getElementById('preview-hb-main-container');
  if (mainContainerEl) {
    mainContainerEl.addEventListener('mousedown', (e) => {
      if (hbDragTarget !== 'master') return;
      isDraggingMaster = true;
      startMasterX = e.clientX;
      initOffsetX = currentHbData.banner_offset_x || 0;
      mainContainerEl.style.cursor = 'grabbing';
      e.preventDefault();
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (isDraggingMaster && hbDragTarget === 'master') {
      const dx = (e.clientX - startMasterX) / ((currentHbData.banner_scale || 100) / 100);
      const next = Math.round(initOffsetX + dx);
      syncHbField('banner_offset_x', next);
      
      const inputMain = document.getElementById('input-banner-offset-x');
      const labelMain = document.getElementById('val-banner-offset-x');
      const inputTab = document.getElementById('input-drum-box-offset-x');
      const labelTab = document.getElementById('val-drum-box-offset-x');

      if (inputMain) inputMain.value = next;
      if (labelMain) labelMain.innerText = (next > 0 ? '+' : '') + next + 'px';
      if (inputTab) inputTab.value = next;
      if (labelTab) labelTab.innerText = (next > 0 ? '+' : '') + next + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingMaster) {
      isDraggingMaster = false;
      if (mainContainerEl) mainContainerEl.style.cursor = hbDragTarget === 'master' ? 'ew-resize' : 'default';
    }
  });

  function updateDrumPosFromEvent(e) {
    const rect = drumBox.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    const clampedX = Math.max(0, Math.min(100, xPct));
    const clampedY = Math.max(0, Math.min(100, yPct));
    
    currentHbData.drum_x = clampedX;
    currentHbData.drum_y = clampedY;
    
    const drum = document.getElementById('preview-hb-drum');
    if (drum) {
      drum.style.left = clampedX + '%';
      drum.style.top = clampedY + '%';
    }

    const sliderX = document.getElementById('input-drum-x');
    const sliderY = document.getElementById('input-drum-y');
    const valX = document.getElementById('val-drum-x');
    const valY = document.getElementById('val-drum-y');
    
    if (sliderX) sliderX.value = clampedX;
    if (sliderY) sliderY.value = clampedY;
    if (valX) valX.innerText = clampedX + '%';
    if (valY) valY.innerText = clampedY + '%';
  }
}

function autoCenterMasterSection() {
  const wrapper = document.getElementById('preview-hb-wrapper');
  const container = document.getElementById('preview-hb-main-container');
  const drumBox = document.getElementById('preview-hb-drum-box');
  const portrait = document.getElementById('preview-hb-portrait');
  const portraitContainer = document.getElementById('preview-hb-portrait-container');

  if (!wrapper || !container || !drumBox) {
    showToast("Không tìm thấy khung xem trước để căn giữa!", "error");
    return;
  }

  // 1. Tạm thời reset left về 0 để đo toạ độ thực của các layout con
  const prevLeft = container.style.left;
  container.style.left = '0px';

  // Lấy toạ độ các phần tử
  const wrapperRect = wrapper.getBoundingClientRect();
  const drumRect = drumBox.getBoundingClientRect();
  
  // Toạ độ ảnh Bác
  let portRect = null;
  if (portrait && portrait.getBoundingClientRect().width > 0) {
    portRect = portrait.getBoundingClientRect();
  } else if (portraitContainer) {
    portRect = portraitContainer.getBoundingClientRect();
  }

  // Khôi phục left ban đầu
  container.style.left = prevLeft;

  let minLeft = drumRect.left;
  let maxRight = drumRect.right;

  if (portRect && portRect.width > 0) {
    minLeft = Math.min(minLeft, portRect.left);
    maxRight = Math.max(maxRight, portRect.right);
  }

  const currentScale = (currentHbData.banner_scale || 100) / 100;
  const contentCenter = (minLeft + maxRight) / 2;
  const wrapperCenter = (wrapperRect.left + wrapperRect.right) / 2;

  // Tính khoảng cách cần dịch chuyển về giữa trang
  const delta = (wrapperCenter - contentCenter) / (currentScale || 1);
  const newOffset = Math.round(delta);

  syncHbField('banner_offset_x', newOffset);

  const inputMain = document.getElementById('input-banner-offset-x');
  const labelMain = document.getElementById('val-banner-offset-x');
  const inputTab = document.getElementById('input-drum-box-offset-x');
  const labelTab = document.getElementById('val-drum-box-offset-x');

  if (inputMain) inputMain.value = newOffset;
  if (labelMain) labelMain.innerText = (newOffset > 0 ? '+' : '') + newOffset + 'px';
  if (inputTab) inputTab.value = newOffset;
  if (labelTab) labelTab.innerText = (newOffset > 0 ? '+' : '') + newOffset + 'px';

  showToast(`Đã căn giữa Section Mẹ thành công (${newOffset > 0 ? '+' : ''}${newOffset}px)! Bố cục con bên trong được giữ nguyên 100%.`, "success");
}

function stepHbOffsetX(delta) {
  const current = currentHbData.banner_offset_x || 0;
  const next = Math.max(-300, Math.min(300, current + delta));
  syncHbField('banner_offset_x', next);
  
  const inputMain = document.getElementById('input-banner-offset-x');
  const labelMain = document.getElementById('val-banner-offset-x');
  const inputTab = document.getElementById('input-drum-box-offset-x');
  const labelTab = document.getElementById('val-drum-box-offset-x');

  if (inputMain) inputMain.value = next;
  if (labelMain) labelMain.innerText = (next > 0 ? '+' : '') + next + 'px';
  if (inputTab) inputTab.value = next;
  if (labelTab) labelTab.innerText = (next > 0 ? '+' : '') + next + 'px';
}

function resetHbPositions() {
  currentHbData.portrait_x = 0;
  currentHbData.portrait_y = 0;
  currentHbData.drum_x = 47;
  currentHbData.drum_y = 71;
  currentHbData.text_x = 0;
  currentHbData.text_y = 0;
  currentHbData.banner_offset_x = 0;
  renderTuTuongUI();
  showToast("Đã đưa vị trí về mặc định chuẩn!", "info");
}

function applyHbPreset(preset) {
  if (preset === 'tolam') {
    currentHbData = {
      ...DEFAULT_HB_CONFIG,
      banner_scale: 100,
      banner_offset_x: 0,
      drum_box_bg: "#F2DFCE",
      drum_box_radius: 16,
      drum_box_height: 410,
      drum_box_margin_left: 140,
      drum_image: "/assets/img/background-trong-dong-png_095238288.png",
      drum_x: 47,
      drum_y: 71,
      drum_size: 560,
      drum_opacity: 32,
      portrait_image: "/assets/img/BacHo.png",
      portrait_x: 0,
      portrait_y: 0,
      portrait_scale: 100,
      portrait_max_height: 470,
      portrait_grayscale: 0,
      portrait_blend_mode: "normal",
      portrait_contrast: 100,
      portrait_brightness: 100,
      portrait_mask: false,
      portrait_flip: false,
      subtitle: "Chủ tịch",
      subtitle_size: 32,
      subtitle_color: "#3B291A",
      title: "HỒ CHÍ MINH",
      title_size: 46,
      title_color: "#68350B",
      show_stars: false,
      bottom_bar_enabled: false
    };
    renderTuTuongUI();
    showToast("Đã áp dụng Hình mẫu chuẩn!", "success");
  }
}

async function uploadHbPortrait(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());

    if (res.success) {
      syncHbField('portrait_image', res.path);
      const inputEl = document.getElementById('input-portrait-image');
      if (inputEl) inputEl.value = res.path;
      showToast("Tải ảnh Bác lên thành công!", "success");
    } else {
      showToast("Lỗi tải ảnh: " + (res.error || "Unknown"), "error");
    }
  } catch (err) {
    showToast("Lỗi mạng khi tải ảnh Bác", "error");
  } finally {
    hideLoading();
  }
}

async function uploadHbDrum(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);

  showLoading();
  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());

    if (res.success) {
      syncHbField('drum_image', res.path);
      const inputEl = document.getElementById('input-drum-image');
      if (inputEl) inputEl.value = res.path;
      showToast("Tải ảnh Trống Đồng lên thành công!", "success");
    } else {
      showToast("Lỗi tải ảnh: " + (res.error || "Unknown"), "error");
    }
  } catch (err) {
    showToast("Lỗi mạng khi tải ảnh Trống Đồng", "error");
  } finally {
    hideLoading();
  }
}

async function saveTuTuongSettings() {
  showLoading();
  try {
    const res = await fetch(`${API}/tu-tuong`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_banner: currentHbData })
    }).then(r => r.json());

    if (res.success) {
      showToast(res.message || "Đã lưu cài đặt Banner thành công!", "success");
    } else {
      showToast("Lỗi khi lưu: " + (res.error || "Unknown"), "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối máy chủ khi lưu: " + err.message, "error");
  } finally {
    hideLoading();
  }
}



