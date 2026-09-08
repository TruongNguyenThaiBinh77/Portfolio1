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

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    navItems.forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    pageTitle.textContent = item.querySelector("span").textContent;
    if (breadcrumb) {
      breadcrumb.textContent = `Admin / ${item.querySelector("span").textContent}`;
    }
    loadSection(section);

    // Close mobile sidebar
    document.getElementById("sidebar").classList.remove("open");
    const backdrop = document.querySelector(".sidebar-backdrop");
    if (backdrop) backdrop.classList.remove("active");
  });
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
            <label>Màu ná» n (Background Color)</label>
            <input type="color" id="cfg-header_logo_bg" value="${escHtml(data.header_logo_bg || "#ffffff")}" />
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
// CV
// ============================================================================

async function loadCV() {
  const data = await fetch(`${API}/cv`).then((r) => r.json());
  const cv = data.cv || data;

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

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-user-circle"></i> Thông tin chung</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Họ tên (Tiếng Việt)</label>
              <input type="text" id="cv-name" value="${escHtml(cv.name || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Họ tên (Tiếng Anh)</label>
              <input type="text" id="cv-name_en" value="${escHtml(cv.name_en || '')}" />
            </div>
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Chức danh (Tiếng Việt)</label>
              <input type="text" id="cv-label" value="${escHtml(cv.label || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Chức danh (Tiếng Anh)</label>
              <input type="text" id="cv-label_en" value="${escHtml(cv.label_en || '')}" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>Email</label>
            <input type="text" id="cv-email" value="${escHtml(cv.email || '')}" />
          </div>
          <div class="form-group full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Địa điểm (Tiếng Việt)</label>
              <input type="text" id="cv-location" value="${escHtml(cv.location || '')}" />
            </div>
            <div style="flex: 1;">
              <label>Địa điểm (Tiếng Anh)</label>
              <input type="text" id="cv-location_en" value="${escHtml(cv.location_en || '')}" />
            </div>
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
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="fas fa-graduation-cap"></i> Học vấn (Education)</h2>
        <button class="btn btn-sm btn-primary" onclick="addDynamicItem('education-list', renderEducationItem)">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
        <div id="education-list" class="dynamic-list">${eduHtml}</div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2><i class="fas fa-briefcase"></i> Kinh nghiệm (Experience)</h2>
        <button class="btn btn-sm btn-primary" onclick="addDynamicItem('experience-list', renderExperienceItem)">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
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
  initSortable('education-list');
  initSortable('experience-list');
  initSortable('honors-list');
  initSortable('languages-list');
  initSortable('skills-list');
}

function renderEducationItem(edu = {}, i = 0) {
  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(edu.institution || "New Education")}</span>
        <button class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove()">
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
        <div class="form-group full-width" style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label>Logo File</label>
            <input type="text" class="edu-logo" value="${escHtml(edu.logo || "")}" />
          </div>
          <div style="flex: 1;">
            <label>Logo Size (e.g. 50px)</label>
            <input type="text" class="edu-logo-size" value="${escHtml(edu.logo_size || "")}" />
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

function renderExperienceItem(exp = {}, i = 0) {
  return `
    <div class="dynamic-item" data-index="${i}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title"><i class="fas fa-arrows-alt handle mr-2" style="cursor: grab; opacity: 0.5;"></i> ${escHtml(exp.company || exp.position || "New Experience")}</span>
        <button class="btn btn-sm btn-danger" onclick="this.closest('.dynamic-item').remove()">
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
  cv.email = document.getElementById("cv-email").value;
  cv.location = document.getElementById("cv-location").value;
  cv.location_en = document.getElementById("cv-location_en").value;
  cv.summary = document.getElementById("cv-summary").value;
  cv.summary_en = document.getElementById("cv-summary_en").value;

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
    showToast("CV đã được lưu thành công!", "success");
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
  const data = await fetch(`${API}/repositories`).then((r) => r.json());

  renderContent(`
    <div class="section-intro">
      <p>Quản lý danh sách GitHub users và repositories hiển thị trên trang Repositories.</p>
    </div>

    <div class="card">
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

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-code-branch"></i> GitHub Repositories</h2>
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
          <i class="fas fa-plus"></i> Thêm Repository
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-footer">
        <button class="btn btn-primary" onclick="saveRepositories()">
          <i class="fas fa-save"></i> Lưu Repositories
        </button>
      </div>
    </div>
  `);
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

async function saveRepositories() {
  const users = Array.from(document.querySelectorAll(".gh-user")).map((el) => el.value).filter(Boolean);
  const repos = Array.from(document.querySelectorAll(".gh-repo")).map((el) => el.value).filter(Boolean);

  try {
    await fetch(`${API}/repositories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        github_users: users,
        repo_description_lines_max: 2,
        github_repos: repos,
      }),
    });
    showToast("Repositories đã được lưu!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// Teaching
// ============================================================================

async function loadTeachings() {
  const teachings = await fetch(`${API}/teachings`).then((r) => r.json());

  const listHtml = teachings.map((t) => `
    <div class="dynamic-item">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escHtml(t.frontMatter.title || t.slug)}</span>
        <div class="dynamic-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="editTeaching('${t.slug}')">
            <i class="fas fa-edit"></i> Sửa
          </button>
        </div>
      </div>
      <div class="text-muted text-sm">
        ${escHtml(t.frontMatter.year || "")} ${escHtml(t.frontMatter.term || "")} &middot;
        ${escHtml(t.frontMatter.instructor || "")}
      </div>
    </div>
  `).join("");

  renderContent(`
    <div class="section-intro">
      <h2>Thành tích & Chứng nhận</h2>
      <p>Quản lý danh sách các giải thưởng, học bổng và chứng nhận đạt được.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-award"></i> Danh sách thành tích</h2>
      </div>
      <div class="card-body">
        <div class="dynamic-list">
          ${listHtml || '<div class="empty-state"><i class="fas fa-award"></i><p>Chưa có dữ liệu nào</p></div>'}
        </div>
      </div>
    </div>
  `);
}

async function editTeaching(slug) {
  showLoading();
  const data = await fetch(`${API}/teachings/${slug}`).then((r) => r.json());
  hideLoading();

  const fm = data.frontMatter;

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa thành tích: <strong>${escHtml(fm.title || slug)}</strong></p>
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
                <label>Title (Tiếng Việt)</label>
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
                Thành tích / Giải thưởng
              </label>
              <label style="display:flex; align-items:center; gap: 5px; cursor: pointer;">
                <input type="radio" name="teach-is-certificate" value="true" ${fm.is_certificate ? 'checked' : ''}>
                Chứng chỉ / Bằng cấp
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
            <input type="text" class="form-control" id="teach-certificate-url" value="${escHtml(fm.certificate || "")}" placeholder="/assets/pdf/cert.pdf hoặc link Google Drive">
            <button class="btn btn-secondary" style="white-space: nowrap;" onclick="document.getElementById('teach-file-upload').click()">Tải file lên</button>
            <input type="file" id="teach-file-upload" style="display:none;" accept="image/*,application/pdf" onchange="uploadCertificateFile(this)">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label class="custom-checkbox" style="display:flex; align-items:center; gap: 10px;">
            <input type="checkbox" id="teach-show-certificate" ${fm.show_certificate ? 'checked' : ''}>
            <span class="checkmark"></span>
            Hiển thị nút "Xem chứng nhận" trên trang web
          </label>
        </div>
      </div>
    </div>
    <div class="card mt-3">
      <div class="card-header">
        <h2><i class="fas fa-edit"></i> Nội dung (Markdown)</h2>
      </div>
      <div class="card-body">
        <div id="editor-container"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-footer">
        <button class="btn btn-secondary" onclick="loadTeachings()">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
        <button class="btn btn-primary" onclick="saveTeaching('${slug}')">
          <i class="fas fa-save"></i> Lưu
        </button>
      </div>
    </div>
  `);
  
  window._newsContentVi = data.body || '';
    window._newsContentEn = fm.content_en || '';
}

async function saveTeaching(slug) {
  const original = await fetch(`${API}/teachings/${slug}`).then((r) => r.json());
  const fm = original.frontMatter;

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

  const body = currentEditor ? currentEditor.getMarkdown() : "";

  try {
    await fetch(`${API}/teachings/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body }),
    });
    showToast("Khóa học đã được lưu!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// News
// ============================================================================

async function loadNews() {
  const news = await fetch(`${API}/news`).then((r) => r.json());

  const listHtml = news.map((n) => `
    <div class="dynamic-item">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escHtml(n.frontMatter.title || n.slug)}</span>
        <div class="dynamic-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="editNews('${n.slug}')">
            <i class="fas fa-edit"></i> Sửa
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteNews('${n.slug}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="text-muted text-sm">${escHtml(String(n.frontMatter.date || ""))}</div>
    </div>
  `).join("");

  renderContent(`
    <div class="section-intro">
      <p>Quản lý tin tức và thông báo trên trang chủ.</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-newspaper"></i> Danh sách tin tức</h2>
        <button class="btn btn-sm btn-secondary" onclick="createNews()">
          <i class="fas fa-plus"></i> Thêm mới
        </button>
      </div>
      <div class="card-body">
        <div class="dynamic-list">
          ${listHtml || '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Chưa có tin tức nào</p></div>'}
        </div>
      </div>
    </div>
  `);
}

function createNews() {
  renderContent(`
    <div class="section-intro">
      <p>Tạo tin tức mới</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2><i class="fas fa-plus-circle"></i> Tin tức mới</h2>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Slug (tên file, không dấu)</label>
            <input type="text" id="news-slug" placeholder="announcement_4" />
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="news-title" />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="text" id="news-date" placeholder="2026-01-01 12:00:00+0700" />
          </div>
          <div class="form-group">
            <label>Inline?</label>
            <select id="news-inline">
              <option value="true">Yes (short)</option>
              <option value="false">No (full post)</option>
            </select>
          </div>
        </div>
        <div class="form-group mt-4 full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Content (Tiếng Việt)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Content (Tiếng Việt)', window._newsContentVi, (val) => window._newsContentVi = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
            <div style="flex: 1;">
              <label>Content (Tiếng Anh)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Content (Tiếng Anh)', window._newsContentEn, (val) => window._newsContentEn = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
          </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" onclick="loadNews()">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
        <button class="btn btn-primary" onclick="saveNewNews()">
          <i class="fas fa-save"></i> Tạo
        </button>
      </div>
    </div>
  `);
  
  window._newsContentVi = '';
    window._newsContentEn = '';
}

async function saveNewNews() {
  const slug = document.getElementById("news-slug").value.trim();
  if (!slug) return showToast("Slug không được để trống", "error");

  const frontMatter = {
    layout: "post",
    title: document.getElementById("news-title").value,
    date: document.getElementById("news-date").value,
    inline: document.getElementById("news-inline").value === "true",
    related_posts: false,
  };
  const body = currentEditor ? currentEditor.getMarkdown() : "";

  try {
    const resp = await fetch(`${API}/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, frontMatter, body }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      return showToast(err.error || "Lỗi tạo tin tức", "error");
    }
    showToast("Tin tức đã được tạo!", "success");
    loadNews();
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function editNews(slug) {
  showLoading();
  const data = await fetch(`${API}/news/${slug}`).then((r) => r.json());
  hideLoading();

  const fm = data.frontMatter;
  
  // Format date to YYYY-MM-DD for date input
  const formattedDate = fm.date ? String(fm.date).split(" ")[0] : "";

  renderContent(`
    <div class="section-intro">
      <p>Chỉnh sửa tin tức: <strong>${escHtml(fm.title || slug)}</strong></p>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group full-width" style="display: flex; gap: 15px;">
              <div style="flex: 1;">
                <label>Title (Tiếng Việt)</label>
                <input type="text" id="news-title" value="${escHtml(fm.title || '')}" />
              </div>
              <div style="flex: 1;">
                <label>Title (Tiếng Anh)</label>
                <input type="text" id="news-title_en" value="${escHtml(fm.title_en || '')}" />
              </div>
            </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="news-date" value="${escHtml(formattedDate)}" />
          </div>
          <div class="form-group">
            <label>Inline?</label>
            <select id="news-inline">
              <option value="true" ${fm.inline ? "selected" : ""}>Yes</option>
              <option value="false" ${!fm.inline ? "selected" : ""}>No</option>
            </select>
          </div>
        </div>
        <div class="form-group mt-4 full-width" style="display: flex; gap: 15px;">
            <div style="flex: 1;">
              <label>Content (Tiếng Việt)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Content (Tiếng Việt)', window._newsContentVi, (val) => window._newsContentVi = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
            <div style="flex: 1;">
              <label>Content (Tiếng Anh)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" readonly value="..." style="flex: 1;" />
                <button class="btn btn-outline" onclick="openEditorModal('Content (Tiếng Anh)', window._newsContentEn, (val) => window._newsContentEn = val)"><i class="fas fa-edit"></i> Chỉnh sửa</button>
              </div>
            </div>
          </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" onclick="loadNews()">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
        <button class="btn btn-primary" onclick="saveExistingNews('${slug}')">
          <i class="fas fa-save"></i> Lưu
        </button>
      </div>
    </div>
  `);
  
  window._teachContentVi = data.body || '';
    window._teachContentEn = fm.content_en || '';
}

async function saveExistingNews(slug) {
  const original = await fetch(`${API}/news/${slug}`).then((r) => r.json());
  const fm = original.frontMatter;

  fm.title = document.getElementById("news-title").value;
  fm.date = document.getElementById("news-date").value;
  fm.inline = document.getElementById("news-inline").value === "true";

  const body = currentEditor ? currentEditor.getMarkdown() : "";

  try {
    await fetch(`${API}/news/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontMatter: fm, body }),
    });
    showToast("Tin tức đã được lưu!", "success");
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

async function deleteNews(slug) {
  if (!confirm(`Bạn có chắc muốn xóa "${slug}"?`)) return;

  try {
    await fetch(`${API}/news/${slug}`, { method: "DELETE" });
    showToast("Đã xóa tin tức!", "success");
    loadNews();
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, "error");
  }
}

// ============================================================================
// Bibliography (raw BibTeX editor)
// ============================================================================

let bibEntries = [];

async function loadBibliography() {
  showLoading();
  try {
    const data = await fetch(`${API}/bibliography_parsed`).then((r) => r.json());
    if (data.success) {
      bibEntries = data.entries || [];
    } else {
      showToast("Lỗi tải data: " + data.error, "error");
      bibEntries = [];
    }
  } catch(e) {
    console.error(e);
    showToast("Lỗi kết nối", "error");
    bibEntries = [];
  } finally {
    hideLoading();
  }

  renderBibliographyUI();
}

function renderBibliographyUI() {
  let html = `
    <div class="section-intro">
      <p>Quản lý các ấn phẩm (Publications). Bạn có thể tải ảnh đại diện và tùy chỉnh nhãn màu.</p>
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
            <div style="margin-bottom:15px;">
              <label>URL / Link tham khảo</label>
              <input type="text" class="form-control" id="bib-url-${index}" value="${escHtml(t.url || t.html || '')}">
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
    if (res.ok) {
      showToast("Đã lưu các ấn phẩm!", "success");
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

function initSortable(listId) {
  const el = document.getElementById(listId);
  if (!el) return;
  if (typeof Sortable !== 'undefined') {
    Sortable.create(el, {
      handle: '.handle',
      animation: 150
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
loadSection("site-settings");

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
      const parent = input.parentElement;
      const textInput = parent.querySelector('.edu-logo');
      const preview = parent.querySelector('.edu-logo-preview');
      
      if (textInput) textInput.value = res.filename;
      if (preview) {
        preview.src = '/assets/img/' + res.filename;
        preview.style.display = 'block';
      }
      showToast("Tải logo lên thành công!", "success");
    } else {
      showToast("Lỗi: " + res.error, "error");
    }
  } catch (err) {
    showToast("Lỗi tải logo lên", "error");
  } finally {
    hideLoading();
  }
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


