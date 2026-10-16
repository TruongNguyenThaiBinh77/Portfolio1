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
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle" };
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
    "teachings", "news", "bibliography", "resume-json"
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
            <label>Há»  (First Name)</label>
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
        <h2><i class="fas fa-ruler-combined"></i> Kích thước & Thu phóng Header (Header Scale & Sizing)</h2>
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
            <label>Màu ná» n trang web (Body Background)</label>
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
            <label>Màu ná» n thanh Menu (Header Background)</label>
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
            <label>Màu chữ đang chá» n (Header Active)</label>
            <div style="display: flex; gap: 10px;">
              <input type="color" id="colorpicker-navbar_active" value="${escHtml(data.navbar_active_text_color || "")}" oninput="document.getElementById('cfg-navbar_active_text_color').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_active_text_color" value="${escHtml(data.navbar_active_text_color || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_active').value = val;" style="flex: 1;" placeholder="Mặc định" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>Ảnh ná» n thanh Menu (Header Background Image)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-navbar_bg_image_preview" src="${data.navbar_bg_image ? `/assets/img/${data.navbar_bg_image}` : ''}" style="max-height: 40px; display: ${data.navbar_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-navbar_bg_image" value="${escHtml(data.navbar_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-navbar_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-navbar_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-navbar_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadNavbarBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-navbar_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chá» n file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeNavbarBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh thanh Menu:</label>
              <input type="range" id="cfg-navbar_bg_image_size" min="10" max="200" value="${data.navbar_bg_image_size || 100}" oninput="document.getElementById('navbar_bg_size_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_size_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_image_size || 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-navbar_bg_hue" min="0" max="360" value="${data.navbar_bg_hue || 0}" oninput="document.getElementById('navbar_bg_hue_val').innerText = this.value + 'Â°'" style="flex: 1;" />
              <span id="navbar_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_hue || 0}Â°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  (Opacity):</label>
              <input type="range" id="cfg-navbar_bg_opacity" min="0" max="100" value="${data.navbar_bg_opacity !== undefined ? data.navbar_bg_opacity : 100}" oninput="document.getElementById('navbar_bg_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_opacity !== undefined ? data.navbar_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-navbar_bg_overlay" value="${escHtml(data.navbar_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-navbar_bg_overlay').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-navbar_bg_overlay" value="${escHtml(data.navbar_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-navbar_bg_overlay').value = val;" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  màu đè:</label>
              <input type="range" id="cfg-navbar_bg_overlay_opacity" min="0" max="100" value="${data.navbar_bg_overlay_opacity !== undefined ? data.navbar_bg_overlay_opacity : 50}" oninput="document.getElementById('navbar_bg_overlay_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="navbar_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.navbar_bg_overlay_opacity !== undefined ? data.navbar_bg_overlay_opacity : 50}%</span>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Ảnh ná» n (Background Image)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-global_bg_image_preview" src="${data.global_bg_image ? `/assets/img/${data.global_bg_image}` : ''}" style="max-height: 40px; display: ${data.global_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-global_bg_image" value="${escHtml(data.global_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-global_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-global_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-global_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadGlobalBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-global_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chá» n file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeGlobalBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh ná» n:</label>
              <input type="range" id="cfg-global_bg_image_size" min="10" max="200" value="${data.global_bg_image_size || 100}" oninput="document.getElementById('global_bg_size_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_size_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_image_size || 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-global_bg_hue" min="0" max="360" value="${data.global_bg_hue || 0}" oninput="document.getElementById('global_bg_hue_val').innerText = this.value + 'Â°'" style="flex: 1;" />
              <span id="global_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_hue || 0}Â°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  (Opacity):</label>
              <input type="range" id="cfg-global_bg_opacity" min="0" max="100" value="${data.global_bg_opacity !== undefined ? data.global_bg_opacity : 100}" oninput="document.getElementById('global_bg_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_opacity !== undefined ? data.global_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-global_bg_overlay" value="${escHtml(data.global_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-global_bg_overlay').value = this.value;" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-global_bg_overlay" value="${escHtml(data.global_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-global_bg_overlay').value = val;" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  màu đè:</label>
              <input type="range" id="cfg-global_bg_overlay_opacity" min="0" max="100" value="${data.global_bg_overlay_opacity !== undefined ? data.global_bg_overlay_opacity : 50}" oninput="document.getElementById('global_bg_overlay_opacity_val').innerText = this.value + '%'" style="flex: 1;" />
              <span id="global_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.global_bg_overlay_opacity !== undefined ? data.global_bg_overlay_opacity : 50}%</span>
            </div>
            <span class="form-help">Hình ảnh sẽ nằm ở giữa tâm màn hình. File tải lên lưu trong assets/img.</span>
          </div>
          
          <div class="form-group full-width">
            <label>Ảnh ná» n toàn trang (Wallpaper / Body Background)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-body_bg_image_preview" src="${data.body_bg_image ? `/assets/img/${data.body_bg_image}` : ''}" style="max-height: 40px; display: ${data.body_bg_image ? 'block' : 'none'}; border: 1px solid #ccc; border-radius: 4px;" />
              <input type="text" id="cfg-body_bg_image" value="${escHtml(data.body_bg_image || "")}" style="flex: 1;" oninput="document.getElementById('cfg-body_bg_image_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-body_bg_image_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-body_bg_image_upload" accept="image/*" style="display: none;" onchange="uploadBodyBgImage(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-body_bg_image_upload').click()"><i class="fas fa-folder-open"></i> Chá» n file từ máy tính...</button>
              <button class="btn btn-danger" onclick="removeBodyBgImage()" title="Xóa ảnh"><i class="fas fa-trash"></i></button>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Thu phóng ảnh toàn trang:</label>
              <input type="range" id="cfg-body_bg_image_size" min="10" max="300" value="${!['cover', 'contain', 'auto', ''].includes(data.body_bg_image_size) ? data.body_bg_image_size : 100}" oninput="document.getElementById('body_bg_size_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_size_val" style="min-width: 40px; font-weight: bold;">${!['cover', 'contain', 'auto', ''].includes(data.body_bg_image_size) ? data.body_bg_image_size : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ổi màu ảnh (Hue):</label>
              <input type="range" id="cfg-body_bg_hue" min="0" max="360" value="${data.body_bg_hue || 0}" oninput="document.getElementById('body_bg_hue_val').innerText = this.value + 'Â°'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_hue_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_hue || 0}Â°</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  (Opacity):</label>
              <input type="range" id="cfg-body_bg_opacity" min="0" max="100" value="${data.body_bg_opacity !== undefined ? data.body_bg_opacity : 100}" oninput="document.getElementById('body_bg_opacity_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_opacity_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_opacity !== undefined ? data.body_bg_opacity : 100}%</span>
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Màu đè lên ảnh (Overlay):</label>
              <input type="color" id="colorpicker-body_bg_overlay" value="${escHtml(data.body_bg_overlay || "#ffffff")}" oninput="document.getElementById('cfg-body_bg_overlay').value = this.value; updateWallpaperPreview();" style="width: 50px; height: 38px; padding: 0;" />
              <input type="text" id="cfg-body_bg_overlay" value="${escHtml(data.body_bg_overlay || "")}" oninput="const val = this.value.startsWith('#') ? this.value : '#' + this.value; if(val.length===7) document.getElementById('colorpicker-body_bg_overlay').value = val; updateWallpaperPreview();" style="width: 100px;" placeholder="Trống = Không đè" />
            </div>
            <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
              <label style="margin: 0; min-width: 150px;">Ä ộ má»  màu đè:</label>
              <input type="range" id="cfg-body_bg_overlay_opacity" min="0" max="100" value="${data.body_bg_overlay_opacity !== undefined ? data.body_bg_overlay_opacity : 50}" oninput="document.getElementById('body_bg_overlay_opacity_val').innerText = this.value + '%'; updateWallpaperPreview();" style="flex: 1;" />
              <span id="body_bg_overlay_opacity_val" style="min-width: 40px; font-weight: bold;">${data.body_bg_overlay_opacity !== undefined ? data.body_bg_overlay_opacity : 50}%</span>
            </div>
            
            <div style="margin-top: 25px; border-top: 1px solid #444; padding-top: 15px;">
              <label><i class="fas fa-eye"></i> Xem trước (Live Preview)</label>
              <div id="wallpaper-live-preview" style="width: 100%; height: 250px; border: 2px dashed #666; border-radius: 8px; position: relative; overflow: hidden; background-color: ${data.global_bg_color || '#ffffff'}; margin-top: 10px;">
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
              <span class="form-help">Khung này hiển thị giả lập hình ná» n của trang web.</span>
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
            <label>Icon Tab (Favicon)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <img id="cfg-icon_preview" src="${data.icon ? `/assets/img/${data.icon}` : ''}" style="max-height: 40px; display: ${data.icon ? 'block' : 'none'}; border: 1px solid var(--border-color); border-radius: 4px;" />
              <input type="text" id="cfg-icon" value="${escHtml(data.icon || "")}" style="flex: 1;" oninput="document.getElementById('cfg-icon_preview').src = this.value ? '/assets/img/' + this.value : ''; document.getElementById('cfg-icon_preview').style.display = this.value ? 'block' : 'none';" />
              <input type="file" id="cfg-icon_upload" accept="image/*,.ico" style="display: none;" onchange="uploadFavicon(this)" />
              <button class="btn btn-secondary" onclick="document.getElementById('cfg-icon_upload').click()"><i class="fas fa-upload"></i> Tải icon lên</button>
            </div>
            <span class="form-help">VD: favicon.ico hoặc logo.png (file tải lên sẽ lưu trong assets/img)</span>
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
    showToast("âœ… Đã lưu! Jekyll đang rebuild (~30-60 giây). Sau đó F5 lại trang portfolio.", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
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
        <h2><i class="fas fa-edit"></i> Nội dung (Markdown)</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Nội dung (Tiếng Việt)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Nội dung (Tiếng Việt)', window._aboutContentVi, (val) => window._aboutContentVi = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
            <div style="flex: 1;">
              <label>Nội dung (Tiếng Anh)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Nội dung (Tiếng Anh)', window._aboutContentEn, (val) => window._aboutContentEn = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
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
  
  const finalBody = window._aboutContentVi;
  fm.content_en = window._aboutContentEn;

  try {
    await fetch(`${API}/about`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body: finalBody }),
    });
    showToast("Trang About đã được lưu!", "success");
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
            <div style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; word-break: break-word;">
              ${escHtml(study)}
            </div>
            
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.92rem; color: #334155; margin-bottom: 8px;">
              <i class="fa-solid fa-building-columns" style="color: #06b6d4; font-size: 0.98rem; margin-top: 3px; flex-shrink: 0;"></i>
              <span style="font-weight: 500; word-break: break-word;">${escHtml(orgLine || (isEn ? 'Institution name' : 'Tên trường/tổ chức'))}</span>
            </div>

            ${highlights.length > 0 ? `
              <ul style="margin: 0; padding-left: 18px; list-style-type: circle; color: #475569; font-size: 0.88rem; line-height: 1.6;">
                ${highlights.map(h => `<li style="margin-bottom: 3px;">${escHtml(h.replace('(theme)', '').trim())}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <!-- Logo -->
          ${logo ? `
            <div style="flex-shrink: 0; display: flex; align-items: flex-start; justify-content: center; padding: 4px; background: #fff; border: 1px dashed #e2e8f0; border-radius: 6px;" title="Logo: ${escHtml(logo)} (Kích thước: ${logoSizePx})">
              <img src="${logo.startsWith('/') || logo.startsWith('http') ? logo : '/assets/img/' + logo}" alt="${escHtml(inst || 'Logo')}" style="width: ${logoSizePx}; max-width: 260px; max-height: 110px; object-fit: contain; display: block;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:0.75rem;color:#ef4444;\\'>Ảnh lỗi</span>'" />
            </div>
          ` : `
            <div style="flex-shrink: 0; padding: 6px 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 0.72rem; color: #94a3b8; font-style: italic;">
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
      <div style="display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: ${index !== items.length - 1 ? '1px solid #f1f5f9' : 'none'}; align-items: flex-start;">
        <div style="flex: 0 0 120px;">
          <span style="background-color: var(--accent, #827717); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; display: inline-block; text-align: center; letter-spacing: 0.3px;">${escHtml(dateStr)}</span>
        </div>
        <div style="flex: 1; min-width: 280px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; word-break: break-word;">${escHtml(position)}</div>
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.92rem; color: #334155; margin-bottom: 6px;">
              <i class="fa-solid fa-briefcase" style="color: #3b82f6; font-size: 0.95rem; margin-top: 3px; flex-shrink: 0;"></i>
              <div style="flex: 1; min-width: 0; word-break: break-word;">
                <span style="font-weight: 500;">${escHtml(company || (isEn ? 'Company name' : 'Tên công ty/tổ chức'))}</span>
                ${loc ? `<span style="color: #64748b; font-size: 0.88rem; margin-left: 6px;">(${escHtml(loc)})</span>` : ''}
              </div>
            </div>
            ${summary ? `<p style="font-size: 0.88rem; color: #64748b; margin: 0 0 6px 0; word-break: break-word;">${escHtml(summary)}</p>` : ''}
            ${highlights.length > 0 ? `
              <ul style="margin: 0; padding-left: 18px; list-style-type: circle; color: #475569; font-size: 0.88rem; line-height: 1.6;">
                ${highlights.map(h => `<li style="margin-bottom: 3px;">${escHtml(h)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          ${logo ? `
            <div style="flex-shrink: 0; display: flex; align-items: flex-start; justify-content: center; padding: 4px; background: #fff; border: 1px dashed #e2e8f0; border-radius: 6px;" title="Logo: ${escHtml(logo)} (Kích thước: ${logoSizePx})">
              <img src="${logo.startsWith('/') || logo.startsWith('http') ? logo : '/assets/img/' + logo}" alt="${escHtml(company || 'Logo')}" style="width: ${logoSizePx}; max-width: 260px; max-height: 110px; object-fit: contain; display: block;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:0.75rem;color:#ef4444;\\'>Ảnh lỗi</span>'" />
            </div>
          ` : `
            <div style="flex-shrink: 0; padding: 6px 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 0.72rem; color: #94a3b8; font-style: italic;">Không có logo</div>
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
// Socials
// ============================================================================

async function loadSocials() {
  const data = await fetch(`${API}/socials`).then((r) => r.json());

  // Build form fields for each key
  const knownFields = [
    { key: "email", label: "Email", icon: "fa-envelope" },
    { key: "github_username", label: "GitHub Username", icon: "fa-github" },
    { key: "x_username", label: "X (Twitter) Username", icon: "fa-x-twitter" },
    { key: "linkedin_username", label: "LinkedIn Username", icon: "fa-linkedin" },
    { key: "scholar_userid", label: "Google Scholar ID", icon: "fa-graduation-cap" },
    { key: "orcid_id", label: "ORCID ID", icon: "fa-orcid" },
    { key: "inspirehep_id", label: "Inspire HEP ID", icon: "fa-atom" },
  ];

  let fieldsHtml = knownFields.map((f) => `
    <div class="form-group">
      <label><i class="fas ${f.icon}"></i> ${f.label}</label>
      <input type="text" id="social-${f.key}" value="${escHtml(String(data[f.key] || ''))}" />
    </div>
  `).join("");

  fieldsHtml += `
    <div class="form-group full-width" style="display: flex; gap: 15px;">
      <div style="flex: 1;">
        <label><i class="fas fa-file-pdf"></i> CV PDF (Tiếng Việt)</label>
        <input type="text" id="social-cv_pdf" value="${escHtml(data.cv_pdf || '')}" />
      </div>
      <div style="flex: 1;">
        <label><i class="fas fa-file-pdf"></i> CV PDF (Tiếng Anh)</label>
        <input type="text" id="social-cv_pdf_en" value="${escHtml(data.cv_pdf_en || '')}" />
      </div>
    </div>
  `;

  // Other/custom fields
  const customKeys = Object.keys(data).filter((k) =>
    !knownFields.find((f) => f.key === k) && k !== "cv_pdf" && k !== "cv_pdf_en" && k !== "rss_icon" && k !== "custom_social"
  );
  const customHtml = customKeys.map((k) => `
    <div class="form-group">
      <label>${k}</label>
      <input type="text" id="social-${k}" value="${escHtml(String(data[k] || ''))}" />
    </div>
  `).join("");

  renderContent(`
    <div class="section-intro">
      <p>Quản lý các liên kết mạng xã hội và file CV.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-share-alt"></i> Liên kết</h2>
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
        <h2><i class="fas fa-rss"></i> Tuỳ chọn khác</h2>
      </div>
      <div class="card-body">
        <div class="form-group row align-items-center">
          <div class="col-auto">
            <input type="checkbox" id="social-rss" ${data.rss_icon ? "checked" : ""} />
          </div>
          <div class="col">
            <label for="social-rss" class="mb-0">Hiển thị biểu tượng RSS</label>
          </div>
        </div>
        
        <h3 class="mt-4">Custom Social (Ví dụ)</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Logo URL</label>
            <input type="text" id="social-custom-logo" value="${escHtml(data.custom_social?.logo || '')}" />
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="social-custom-title" value="${escHtml(data.custom_social?.title || '')}" />
          </div>
          <div class="form-group full-width">
            <label>URL</label>
            <input type="text" id="social-custom-url" value="${escHtml(data.custom_social?.url || '')}" />
          </div>
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
      data.custom_social[key.replace('custom-', '')] = input.value;
    } else {
      data[key] = input.value;
    }
  });

  // Xóa các key rỗng nếu không cần thiết, hoặc có thể giữ lại để backend xử lý.
  Object.keys(data).forEach(k => {
    if (data[k] === "" && k !== "custom_social") delete data[k];
  });
  
  if (data.custom_social) {
    let hasCustom = false;
    Object.keys(data.custom_social).forEach(k => {
      if (data.custom_social[k] === "") delete data.custom_social[k];
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
    if (res.ok) {
      showToast("Đã lưu thông tin Socials!", "success");
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
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <h2><i class="fas fa-code-branch"></i> GitHub Repositories</h2>
        <button class="btn btn-sm btn-secondary" onclick="fetchGitHubReposFromApi()" style="font-size:12px;padding:6px 14px">
          <i class="fab fa-github" style="color:var(--accent-light);margin-right:6px"></i> Tải Repos từ GitHub
        </button>
      </div>
      <div class="card-body">
        <div class="dynamic-list" id="gh-repos-list">
          ${(data.github_repos || []).map((r, i) => `
            <div class="dynamic-item" style="padding:10px 16px">
              <div class="flex items-center justify-between">
                <input type="text" class="gh-repo" value="${escHtml(r)}" placeholder="owner/repo" style="flex:1;margin-right:10px" />
                <button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join("")}
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
      <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0,0,0,0.25); border-radius: 6px; border-left: 3px solid ${color}; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Xem trước thực tế:</span>
        <span id="${id}-preview" style="font-size: 1.25rem; font-weight: ${isBold ? '700' : '400'}; color: ${color}; transition: all 0.2s ease;">
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

function addGhRepo() {
  document.getElementById("gh-repos-list").insertAdjacentHTML("beforeend", `
    <div class="dynamic-item" style="padding:10px 16px">
      <div class="flex items-center justify-between">
        <input type="text" class="gh-repo" value="" placeholder="owner/repo" style="flex:1;margin-right:10px" />
        <button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `);
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
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`);
    if (!res.ok) throw new Error("Không thể tải dữ liệu từ GitHub API");
    const repos = await res.json();
    const list = document.getElementById("gh-repos-list");
    list.innerHTML = "";
    repos.forEach(r => {
      list.insertAdjacentHTML("beforeend", `
        <div class="dynamic-item" style="padding:10px 16px">
          <div class="flex items-center justify-between">
            <input type="text" class="gh-repo" value="${escHtml(r.full_name)}" placeholder="owner/repo" style="flex:1;margin-right:10px" />
            <button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.dynamic-item').remove()">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `);
    });
    showToast(`Đã tải thành công ${repos.length} repositories của ${username}! Nhấn "Lưu Repositories" để áp dụng.`, "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function saveRepositories() {
  const users = Array.from(document.querySelectorAll(".gh-user")).map((el) => el.value.trim()).filter(Boolean);
  const repos = Array.from(document.querySelectorAll(".gh-repo")).map((el) => el.value.trim()).filter(Boolean);

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

  const cardTitleColor = document.getElementById("repo-card-title-color") ? document.getElementById("repo-card-title-color").value.trim() : "#8c0303";

  try {
    // 1. Update _data/repositories.yml
    await fetch(`${API}/repositories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        github_users: users,
        repo_description_lines_max: 2,
        github_repos: repos,
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
      ? '<span class="badge" style="background:#e0e7ff; color:#3730a3; font-size:0.75rem; padding: 2px 8px; border-radius: 4px; margin-left: 8px;"><i class="fas fa-certificate mr-1"></i> Chứng chỉ</span>'
      : '<span class="badge" style="background:#fef3c7; color:#92400e; font-size:0.75rem; padding: 2px 8px; border-radius: 4px; margin-left: 8px;"><i class="fas fa-award mr-1"></i> Thành tích</span>';

    return `
    <div class="dynamic-item" style="padding: 14px 16px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm, 8px);">
      <div class="dynamic-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="flex: 1; padding-right: 12px;">
          <span class="dynamic-item-title" style="font-size: 0.98rem; font-weight: 600; color: #1e293b;">${escHtml(fm.title || t.slug)}</span>
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
      <div class="text-muted text-sm" style="font-size: 0.82rem; color: #64748b; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
        ${fm.year ? `<span><i class="far fa-calendar-alt mr-1"></i> ${escHtml(String(fm.year))}</span>` : ''}
        ${fm.organization ? `<span><i class="fas fa-building mr-1"></i> ${escHtml(fm.organization)}</span>` : ''}
        <span style="font-family: monospace; font-size: 0.75rem; color: #94a3b8;"><i class="fas fa-file-code mr-1"></i> ${t.slug}.md</span>
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
      <div class="dynamic-item" style="padding: 16px; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div class="dynamic-item-header" style="align-items: flex-start; margin-bottom: 6px;">
          <div style="flex: 1; padding-right: 12px;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
              ${fm.journal ? `<span class="badge" style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px;"><i class="fas fa-bookmark"></i> ${escHtml(fm.journal)}</span>` : ''}
              ${hasExternal ? `<span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 11px;"><i class="fas fa-external-link-alt"></i> Link online</span>` : ''}
              ${hasPdf ? `<span class="badge" style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px;"><i class="fas fa-file-pdf"></i> Có file PDF</span>` : ''}
            </div>
            <strong style="font-size: 15px; color: #1e293b;">${escHtml(fm.title || n.slug)}</strong>
            ${fm.title_en ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;"><em>${escHtml(fm.title_en)}</em></div>` : ''}
            ${fm.description ? `<p style="font-size: 13px; color: #475569; margin: 6px 0 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escHtml(fm.description)}</p>` : ''}
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
        <div style="font-size: 12px; color: #94a3b8; display: flex; gap: 12px; align-items: center; margin-top: 6px;">
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
                <i class="fa-solid fa-bookmark" style="font-size: 11px;"></i> <span id="news-badge-preview-text">Tên tạp chí xem trước</span>
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
                <i class="fa-solid fa-bookmark" style="font-size: 11px;"></i> <span id="news-badge-preview-text">${escHtml(fm.journal || "Tên tạp chí xem trước")}</span>
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
      <div class="modal show" id="imageSelectModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;">
        <div class="modal-dialog" style="background:#fff;padding:24px;border-radius:12px;max-width:480px;width:90%;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <h3 style="margin-top:0;font-size:17px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-image text-primary"></i> Chọn hình ảnh từ hệ thống
          </h3>
          <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Các file nằm trong thư mục <code>assets/img/</code>:</p>
          <select id="selected-image-dropdown" class="form-control" style="margin-bottom:15px;width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;" onchange="
            const v = this.value;
            document.getElementById('modal-img-preview').src = v;
          ">
            ${options}
          </select>
          <div style="text-align: center; margin-bottom: 20px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
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
      <div class="modal show" id="pdfSelectModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;">
        <div class="modal-dialog" style="background:#fff;padding:24px;border-radius:12px;max-width:480px;width:90%;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <h3 style="margin-top:0;font-size:17px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-file-pdf text-danger"></i> Chọn file PDF từ hệ thống
          </h3>
          <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Các file nằm trong thư mục <code>assets/pdf/</code>:</p>
          <select id="selected-pdf-dropdown" class="form-control" style="margin-bottom:20px;width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;">
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
    pub.citationKey = document.getElementById(`bib-key-${i}`).value.trim();
    pub.entryType = document.getElementById(`bib-type-${i}`).value;
    
    if (!pub.entryTags) pub.entryTags = {};
    const oldTags = pub.entryTags;
    oldTags.title = document.getElementById(`bib-title-${i}`).value.trim();
    oldTags.title_en = document.getElementById(`bib-title_en-${i}`).value.trim();
    oldTags.author = editors[`bib-author-${i}`] ? editors[`bib-author-${i}`].getMarkdown().trim() : '';
    oldTags.author_en = editors[`bib-author_en-${i}`] ? editors[`bib-author_en-${i}`].getMarkdown().trim() : '';
    oldTags.year = document.getElementById(`bib-year-${i}`).value.trim();
    oldTags.year_en = document.getElementById(`bib-year_en-${i}`).value.trim();
    
    const publisher = document.getElementById(`bib-publisher-${i}`).value.trim();
    const publisher_en = document.getElementById(`bib-publisher_en-${i}`).value.trim();
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

    oldTags.url = document.getElementById(`bib-url-${i}`).value.trim();
    oldTags.preview = document.getElementById(`bib-preview-${i}`).value.trim();
    oldTags.badge_name = document.getElementById(`bib-badge-name-${i}`).value.trim();
    oldTags.badge_name_en = document.getElementById(`bib-badge-name_en-${i}`).value.trim();
    oldTags.badge_color = document.getElementById(`bib-badge-color-text-${i}`).value;
    const textColorInput = document.getElementById(`bib-badge-text-color-text-${i}`);
    if (textColorInput) {
      oldTags.badge_text_color = textColorInput.value;
    }

    oldTags.abstract = editors[`bib-abstract-${i}`] ? editors[`bib-abstract-${i}`].getMarkdown().trim() : '';
    oldTags.abstract_en = editors[`bib-abstract_en-${i}`] ? editors[`bib-abstract_en-${i}`].getMarkdown().trim() : '';
    oldTags.annotation = editors[`bib-annotation-${i}`] ? editors[`bib-annotation-${i}`].getMarkdown().trim() : '';
    oldTags.annotation_en = editors[`bib-annotation_en-${i}`] ? editors[`bib-annotation_en-${i}`].getMarkdown().trim() : '';

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


