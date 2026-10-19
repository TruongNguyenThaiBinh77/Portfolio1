const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const matter = require("gray-matter");
const multer = require("multer");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;
const ROOT = __dirname;
const JEKYLL_CONTAINER = "pflio-jekyll-1";

// Restart Jekyll container so it rebuilds with new config/content
function restartJekyll() {
  exec(`docker restart ${JEKYLL_CONTAINER}`, (err, stdout, stderr) => {
    if (err) {
      console.error("[Jekyll] Restart failed:", err.message);
    } else {
      console.log("[Jekyll] Restarted container to rebuild site.");
    }
  });
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve admin UI with no-cache headers to prevent stale JS files
app.use("/admin", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
}, express.static(path.join(ROOT, "admin")));
app.use("/assets", express.static(path.join(ROOT, "assets"))); // Serve assets for admin preview
app.use("/assets", express.static(path.join(ROOT, "portfolio-react", "public", "assets")));

// Redirect /admin to /admin/index.html
app.get("/admin", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(ROOT, "admin", "index.html"));
});

// Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(ROOT, "assets", "img");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// ============================================================================
// Helper functions
// ============================================================================

function readYaml(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return yaml.load(content);
}



function readMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = matter(content);
  return {
    frontMatter: parsed.data,
    body: parsed.content,
  };
}

function readJson(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

// Live Reload SSE Clients
let sseClients = [];
app.get("/api/live-reload", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Allow cross-origin if Next.js calls this directly
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  sseClients.push(res);
  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

function notifyLiveReload() {
  sseClients.forEach(client => client.write("data: reload\n\n"));
}

function writeYaml(filePath, data) {
  const content = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, content, "utf8");
  notifyLiveReload();
}

function writeMarkdown(filePath, frontMatter, body) {
  const content = matter.stringify(body, frontMatter);
  fs.writeFileSync(filePath, content, "utf8");
  notifyLiveReload();
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  notifyLiveReload();
}

// ============================================================================
// API: Site Config (_config.yml) — only personal/site settings, not plugins
// ============================================================================

app.get("/api/config", (req, res) => {
  try {
    const config = readYaml(path.join(ROOT, "_config.yml"));
    let footerText = config.footer_text || "";
    // Hide injected script from frontend editor
    footerText = footerText.replace(/<script class="logo-inject">[\s\S]*?<\/script>/g, "").trim();

    // Return only editable fields
    res.json({
      first_name: config.first_name || "",
      middle_name: config.middle_name || "",
      last_name: config.last_name || "",
      title: config.title || "",
      description: config.description || "",
      description_en: config.description_en || "",
      keywords: config.keywords || "",
      lang: config.lang || "en",
      global_bg_color: config.global_bg_color || "",
      global_bg_image: config.global_bg_image || "",
      global_bg_image_size: config.global_bg_image_size || "",
      global_bg_hue: config.global_bg_hue || 0,
      global_bg_opacity: config.global_bg_opacity !== undefined ? config.global_bg_opacity : 100,
      global_bg_overlay: config.global_bg_overlay || "",
      global_bg_overlay_opacity: config.global_bg_overlay_opacity !== undefined ? config.global_bg_overlay_opacity : 50,
      body_bg_image: config.body_bg_image || "",
      body_bg_image_size: config.body_bg_image_size || "cover",
      body_bg_hue: config.body_bg_hue || 0,
      body_bg_opacity: config.body_bg_opacity !== undefined ? config.body_bg_opacity : 100,
      body_bg_overlay: config.body_bg_overlay || "",
      body_bg_overlay_opacity: config.body_bg_overlay_opacity !== undefined ? config.body_bg_overlay_opacity : 50,
      global_hover_color: config.global_hover_color || "",
      navbar_bg_color: config.navbar_bg_color || "",
      navbar_bg_image: config.navbar_bg_image || "",
      navbar_bg_image_size: config.navbar_bg_image_size || "",
      navbar_bg_hue: config.navbar_bg_hue || 0,
      navbar_bg_opacity: config.navbar_bg_opacity !== undefined ? config.navbar_bg_opacity : 100,
      navbar_bg_overlay: config.navbar_bg_overlay || "",
      navbar_bg_overlay_opacity: config.navbar_bg_overlay_opacity !== undefined ? config.navbar_bg_overlay_opacity : 50,
      navbar_text_color: config.navbar_text_color || "",
      navbar_active_text_color: config.navbar_active_text_color || "",
      url: config.url || "",
      baseurl: config.baseurl || "",
      nav_names: config.nav_names || {},
      footer_text: footerText,
      blog_name: config.blog_name || "",
      blog_description: config.blog_description || "",
      icon: config.icon || "",
      header_logo: config.header_logo || "",
      header_logo_size: config.header_logo_size || "56px",
      header_logo_height: config.header_logo_height || "32px",
      header_logo_bg: config.header_logo_bg || "",
      navbar_scale: config.navbar_scale !== undefined ? config.navbar_scale : 88,
      navbar_padding_y: config.navbar_padding_y || "3px",
      navbar_font_size: config.navbar_font_size || "13.5px",
      navbar_brand_size: config.navbar_brand_size || "15px",
      header_top: config.header_top || "20px",
      header_margin_x: config.header_margin_x || "20px",
      header_width: config.header_width || "calc(100% - 40px)",
      header_max_width: config.header_max_width || "1400px",
      header_border_radius: config.header_border_radius || "12px",
      header_shadow: config.header_shadow !== undefined ? config.header_shadow : true,
      header_border_color: config.header_border_color || "rgba(255, 255, 255, 0.2)",
      top_banner_bg_color: config.top_banner_bg_color || "#AE0100",
      top_banner_height: config.top_banner_height || "280px",
      top_banner_title: config.top_banner_title || "ĐẠI HỘI ĐẠI BIỂU TOÀN QUỐC LẦN THỨ XIV CỦA ĐẢNG",
      top_banner_enabled: config.top_banner_enabled !== undefined ? config.top_banner_enabled : true,
      footer_text_en: config.footer_text_en || "",
      blog_name_en: config.blog_name_en || "",
      blog_description_en: config.blog_description_en || "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/config", (req, res) => {
  try {
    const configPath = path.join(ROOT, "_config.yml");
    const raw = fs.readFileSync(configPath, "utf8");
    
    // Parse current YAML
    const config = yaml.load(raw);
    const fields = req.body;

    // Update only the editable fields
    // Update only the editableFields
    const editableFields = [
      "title", "title_en", "first_name", "first_name_bold", "middle_name", "middle_name_bold", "last_name", "last_name_bold",
      "keywords", "lang", "url", "baseurl",
      "blog_name", "blog_name_en", "blog_description", "blog_description_en", "icon",
      "description", "description_en", "footer_text", "footer_text_en",
      "header_logo", "header_logo_size", "header_logo_height", "header_logo_bg",
      "navbar_scale", "navbar_padding_y", "navbar_font_size", "navbar_brand_size",
      "header_top", "header_margin_x", "header_width", "header_max_width", "header_border_radius", "header_shadow", "header_border_color",
      "top_banner_bg_color", "top_banner_height", "top_banner_title", "top_banner_enabled",
      "global_bg_color", "global_bg_image", "global_bg_image_size", "global_bg_hue", "global_bg_opacity", "global_bg_overlay", "global_bg_overlay_opacity", "global_hover_color",
      "body_bg_image", "body_bg_image_size", "body_bg_hue", "body_bg_opacity", "body_bg_overlay", "body_bg_overlay_opacity",
      "navbar_bg_color", "navbar_bg_image", "navbar_bg_image_size", "navbar_bg_hue", "navbar_bg_opacity", "navbar_bg_overlay", "navbar_bg_overlay_opacity",
      "navbar_text_color", "navbar_active_text_color",
      "nav_names",
      "section_titles", "section_titles_en", "section_titles_color"
    ];
    
    editableFields.forEach(key => {
      if (fields[key] !== undefined) {
        config[key] = fields[key];
      }
    });

    // Handle logo injection logic cleanly
    let cleanFooter = (config.footer_text || "").replace(/<script class="logo-inject">[\s\S]*?<\/script>/g, "").trim();
    if (config.header_logo) {
       let script = `\n<script class="logo-inject">
       document.addEventListener("DOMContentLoaded", function() {
             const container = document.querySelector('.navbar .container');
             const img = document.createElement('img');
             img.src = '{{ site.baseurl }}/assets/img/${config.header_logo}';
             img.style.width = '${config.header_logo_size || '40px'}';
             img.style.height = '${config.header_logo_height || 'auto'}';
             ${config.header_logo_bg ? `img.style.backgroundColor = '${config.header_logo_bg}';` : ''}
             ${config.header_logo_bg ? `img.style.padding = '5px'; img.style.borderRadius = '5px';` : ''}
             img.style.marginRight = '15px';
             img.style.verticalAlign = 'middle';
             const link = document.createElement('a');
             link.href = '{{ site.baseurl }}/';
             link.style.display = 'flex';
             link.style.alignItems = 'center';
             link.appendChild(img);
             if (container) {
                container.prepend(link);
             }
       });
       </script>`;
       config.footer_text = cleanFooter + script;
    } else {
       config.footer_text = cleanFooter;
    }

    // Dump back to YAML
    const newYaml = yaml.dump(config, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });
    
    fs.writeFileSync(configPath, newYaml, "utf8");
    notifyLiveReload();
    
    // Restart Jekyll so it picks up the new _config.yml
    restartJekyll();
    
    res.json({ success: true, message: "Config saved. Jekyll is rebuilding (30-60 giây)..." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// API: Pages Metadata (Title, Description)
// ============================================================================

app.get("/api/pages/:name", (req, res) => {
  try {
    const pageName = req.params.name;
    const pagePath = path.join(ROOT, "_pages", `${pageName}.md`);
    if (!fs.existsSync(pagePath)) return res.status(404).json({ error: "Page not found" });
    
    const { frontMatter, body } = readMarkdown(pagePath);
    res.json({
      title: frontMatter.title || "",
      title_en: frontMatter.title_en || "",
      description: frontMatter.description || "",
      description_en: frontMatter.description_en || "",
      ...frontMatter,
      body: body
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/pages/:name", (req, res) => {
  try {
    const pageName = req.params.name;
    const pagePath = path.join(ROOT, "_pages", `${pageName}.md`);
    if (!fs.existsSync(pagePath)) return res.status(404).json({ error: "Page not found" });
    
    const { frontMatter, body } = readMarkdown(pagePath);
    const { body: newBody, ...fields } = req.body;
    
    Object.assign(frontMatter, fields);
    
    writeMarkdown(pagePath, frontMatter, newBody !== undefined ? newBody : body);
    res.json({ success: true, message: "Page updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Tu Tuong Page & Hero Banner Settings (_pages/tu-tuong.md)
// ============================================================================

const defaultHeroBanner = {
  banner_scale: 100,
  drum_box_bg: "#F2DFCE",
  drum_box_radius: 16,
  drum_box_height: 410,
  drum_box_margin_left: 140,
  drum_image: "/assets/img/background-trong-dong-png_095238288.png",
  drum_x: 68,
  drum_y: 50,
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
  poem_line1_en: "“Morning by the stream, evening in the cave,",
  poem_line2_en: "Maize soup and bamboo shoots always ready.",
  poem_line3_en: "A shaky stone slab to translate the Party history,",
  poem_line4_en: "What a glorious revolutionary life!”",
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

app.get("/api/tu-tuong", (req, res) => {
  try {
    const pagePath = path.join(ROOT, "_pages", "tu-tuong.md");
    if (!fs.existsSync(pagePath)) return res.status(404).json({ error: "Page not found" });

    const { frontMatter, body } = readMarkdown(pagePath);
    const hero_banner = {
      ...defaultHeroBanner,
      ...(frontMatter.hero_banner || {})
    };

    res.json({
      frontMatter,
      hero_banner,
      body
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tu-tuong", (req, res) => {
  try {
    const pagePath = path.join(ROOT, "_pages", "tu-tuong.md");
    if (!fs.existsSync(pagePath)) return res.status(404).json({ error: "Page not found" });

    const { frontMatter, body } = readMarkdown(pagePath);
    const { hero_banner, ...otherFields } = req.body;

    if (hero_banner) {
      frontMatter.hero_banner = {
        ...(frontMatter.hero_banner || {}),
        ...hero_banner
      };
    }
    Object.assign(frontMatter, otherFields);

    writeMarkdown(pagePath, frontMatter, body);
    res.json({ success: true, message: "Đã lưu cấu hình banner thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: About Page (_pages/about.md)
// ============================================================================

app.get("/api/about", (req, res) => {
  try {
    const data = readMarkdown(path.join(ROOT, "_pages", "about.md"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/about", (req, res) => {
  try {
    const { frontMatter, body } = req.body;
    writeMarkdown(path.join(ROOT, "_pages", "about.md"), frontMatter, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: CV Data (_data/cv.yml)
// ============================================================================

app.get("/api/cv", (req, res) => {
  try {
    const data = readYaml(path.join(ROOT, "_data", "cv.yml"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/cv", (req, res) => {
  try {
    writeYaml(path.join(ROOT, "_data", "cv.yml"), req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Socials (_data/socials.yml & _config.yml)
// ============================================================================

app.get("/api/socials", (req, res) => {
  try {
    const configPath = path.join(ROOT, "_config.yml");
    const config = fs.existsSync(configPath) ? readYaml(configPath) || {} : {};
    const socialsDataPath = path.join(ROOT, "_data", "socials.yml");
    let socialsData = {};
    if (fs.existsSync(socialsDataPath)) {
      try {
        socialsData = readYaml(socialsDataPath) || {};
      } catch (e) {
        socialsData = {};
      }
    }

    const cleanVal = (val, dummy) => {
      if (!val) return "";
      const str = String(val).trim();
      return str === dummy ? "" : str;
    };

    const merged = {
      email: socialsData.email !== undefined ? socialsData.email : (config.email || ""),
      orcid_id: socialsData.orcid_id !== undefined ? socialsData.orcid_id : cleanVal(config.orcid_id, "0000-0000-0000-0000"),
      scholar_userid: socialsData.scholar_userid !== undefined ? socialsData.scholar_userid : cleanVal(config.scholar_userid || config.google_scholar_id, "your_id"),
      scopus_id: socialsData.scopus_id !== undefined ? socialsData.scopus_id : cleanVal(config.scopus_id, "1111111111"),
      github_username: socialsData.github_username !== undefined ? socialsData.github_username : (config.github_username || ""),
      linkedin_username: socialsData.linkedin_username !== undefined ? socialsData.linkedin_username : cleanVal(config.linkedin_username, "your_username"),
      research_gate_profile: socialsData.research_gate_profile !== undefined ? socialsData.research_gate_profile : cleanVal(config.research_gate_profile, "your_profile"),
      kaggle_id: socialsData.kaggle_id !== undefined ? socialsData.kaggle_id : cleanVal(config.kaggle_id, "your_id"),
      discord_id: socialsData.discord_id !== undefined ? socialsData.discord_id : cleanVal(config.discord_id, "your_id"),
      rss_icon: socialsData.rss_icon !== undefined ? Boolean(socialsData.rss_icon) : (config.rss_icon !== undefined ? Boolean(config.rss_icon) : true),
      rss_url: socialsData.rss_url !== undefined ? socialsData.rss_url : (config.rss_url || "/feed.xml"),
      semanticscholar_id: socialsData.semanticscholar_id !== undefined ? socialsData.semanticscholar_id : cleanVal(config.semanticscholar_id || config.semantic_scholar_id, "your_id"),
      x_username: socialsData.x_username !== undefined ? socialsData.x_username : (config.x_username || ""),
      inspirehep_id: socialsData.inspirehep_id !== undefined ? socialsData.inspirehep_id : (config.inspirehep_id || ""),
      cv_pdf: socialsData.cv_pdf !== undefined ? socialsData.cv_pdf : (config.cv_pdf || ""),
      cv_pdf_en: socialsData.cv_pdf_en !== undefined ? socialsData.cv_pdf_en : (config.cv_pdf_en || ""),
      custom_social: socialsData.custom_social !== undefined ? socialsData.custom_social : (config.custom_social || null),
      ...socialsData
    };
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/socials", (req, res) => {
  try {
    const payload = req.body || {};
    const configPath = path.join(ROOT, "_config.yml");
    let config = fs.existsSync(configPath) ? readYaml(configPath) || {} : {};

    const socialKeys = [
      "email",
      "orcid_id",
      "scholar_userid",
      "scopus_id",
      "github_username",
      "linkedin_username",
      "research_gate_profile",
      "kaggle_id",
      "discord_id",
      "rss_icon",
      "rss_url",
      "semanticscholar_id",
      "x_username",
      "inspirehep_id",
      "cv_pdf",
      "cv_pdf_en",
      "custom_social"
    ];

    socialKeys.forEach(k => {
      if (k in payload) {
        config[k] = payload[k] === "" ? null : payload[k];
      }
    });

    if ("scholar_userid" in payload) {
      config.google_scholar_id = payload.scholar_userid === "" ? null : payload.scholar_userid;
    }
    if ("semanticscholar_id" in payload) {
      config.semantic_scholar_id = payload.semanticscholar_id === "" ? null : payload.semanticscholar_id;
    }

    // Write to _config.yml
    const newYaml = yaml.dump(config, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });
    fs.writeFileSync(configPath, newYaml, "utf8");

    // Write to _data/socials.yml
    const socialsDataPath = path.join(ROOT, "_data", "socials.yml");
    writeYaml(socialsDataPath, payload);

    res.json({ success: true, message: "Đã lưu thông tin mạng xã hội thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Repositories (_data/repositories.yml)
// ============================================================================

app.get("/api/repositories", (req, res) => {
  try {
    const data = readYaml(path.join(ROOT, "_data", "repositories.yml"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/repositories", (req, res) => {
  try {
    writeYaml(path.join(ROOT, "_data", "repositories.yml"), req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Bật/Tắt ẩn repo trên UI
app.post("/api/repositories/toggle-visibility", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_data", "repositories.yml");
    const data = readYaml(filePath) || {};
    const repo = (req.body.repo || "").trim();
    if (!repo) {
      return res.status(400).json({ error: "Thiếu tên repository" });
    }

    if (!Array.isArray(data.hidden_repos)) {
      data.hidden_repos = [];
    }

    let isHidden;
    if (typeof req.body.hidden === "boolean") {
      isHidden = req.body.hidden;
      if (isHidden && !data.hidden_repos.includes(repo)) {
        data.hidden_repos.push(repo);
      } else if (!isHidden) {
        data.hidden_repos = data.hidden_repos.filter(r => r !== repo);
      }
    } else {
      // Toggle nếu không chỉ định giá trị cụ thể
      const idx = data.hidden_repos.indexOf(repo);
      if (idx >= 0) {
        data.hidden_repos.splice(idx, 1);
        isHidden = false;
      } else {
        data.hidden_repos.push(repo);
        isHidden = true;
      }
    }

    writeYaml(filePath, data);
    res.json({ 
      success: true, 
      repo, 
      isHidden, 
      hidden_repos: data.hidden_repos,
      message: isHidden ? `Đã ẩn repo "${repo}" khỏi trang UI` : `Đã hiển thị repo "${repo}" lên trang UI`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Cập nhật ẩn/hiện hàng loạt (Batch toggle)
app.post("/api/repositories/batch-visibility", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_data", "repositories.yml");
    const data = readYaml(filePath) || {};
    const action = req.body.action; // 'hide_all', 'show_all', 'set_list'

    if (!Array.isArray(data.hidden_repos)) {
      data.hidden_repos = [];
    }

    if (action === "show_all") {
      data.hidden_repos = [];
    } else if (action === "hide_all") {
      data.hidden_repos = Array.isArray(data.github_repos) ? [...data.github_repos] : [];
    } else if (action === "set_list" && Array.isArray(req.body.hidden_repos)) {
      data.hidden_repos = req.body.hidden_repos.map(r => String(r).trim()).filter(Boolean);
    }

    writeYaml(filePath, data);
    res.json({ success: true, hidden_repos: data.hidden_repos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Resume (assets/json/resume.json)
// ============================================================================

app.get("/api/resume", (req, res) => {
  try {
    const data = readJson(path.join(ROOT, "assets", "json", "resume.json"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/resume", (req, res) => {
  try {
    writeJson(path.join(ROOT, "assets", "json", "resume.json"), req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Teaching (_teachings/*.md)
// ============================================================================

app.get("/api/teachings", (req, res) => {
  try {
    const dir = path.join(ROOT, "_teachings");
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    const teachings = files.map((f) => {
      const data = readMarkdown(path.join(dir, f));
      return {
        slug: f.replace(".md", ""),
        filename: f,
        ...data,
      };
    });
    res.json(teachings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/teachings/:slug", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_teachings", `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    const data = readMarkdown(filePath);
    res.json({ slug: req.params.slug, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/teachings/:slug", (req, res) => {
  try {
    const { frontMatter, body } = req.body;
    const filePath = path.join(ROOT, "_teachings", `${req.params.slug}.md`);
    writeMarkdown(filePath, frontMatter, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/teachings", (req, res) => {
  try {
    const { slug, frontMatter, body } = req.body;
    const finalSlug = slug || `achievement-${Date.now()}`;
    const filePath = path.join(ROOT, "_teachings", `${finalSlug}.md`);
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: "File already exists" });
    }
    writeMarkdown(filePath, frontMatter, body);
    res.json({ success: true, slug: finalSlug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/teachings/:slug", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_teachings", `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    fs.unlinkSync(filePath);
    notifyLiveReload();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: News (_news/*.md)
// ============================================================================

app.get("/api/news", (req, res) => {
  try {
    const dir = path.join(ROOT, "_news");
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    const news = files.map((f) => {
      const data = readMarkdown(path.join(dir, f));
      return {
        slug: f.replace(".md", ""),
        filename: f,
        ...data,
      };
    });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/news/:slug", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_news", `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    const data = readMarkdown(filePath);
    res.json({ slug: req.params.slug, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/news/:slug", (req, res) => {
  try {
    const { frontMatter, body } = req.body;
    const filePath = path.join(ROOT, "_news", `${req.params.slug}.md`);
    writeMarkdown(filePath, frontMatter, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/news", (req, res) => {
  try {
    const { slug, frontMatter, body } = req.body;
    const filePath = path.join(ROOT, "_news", `${slug}.md`);
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: "File already exists" });
    }
    writeMarkdown(filePath, frontMatter, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/news/:slug", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_news", `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Bibliography (_bibliography/papers.bib) — raw text editing
// ============================================================================

app.get("/api/bibliography", (req, res) => {
  try {
    const content = fs.readFileSync(
      path.join(ROOT, "_bibliography", "papers.bib"),
      "utf8"
    );
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bibliography", (req, res) => {
  try {
    fs.writeFileSync(
      path.join(ROOT, "_bibliography", "papers.bib"),
      req.body.content,
      "utf8"
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Parsed Bibliography (for Visual Editor)
// ============================================================================

app.get("/api/bibliography_parsed", (req, res) => {
  try {
    let content = fs.readFileSync(
      path.join(ROOT, "_bibliography", "papers.bib"),
      "utf8"
    );
    // Sanitize for bibtex-parse-js
    content = content.replace(/^---[\s\S]*?---\n/g, '');
    content = content.replace(/@string\{.*?\}/gi, '');
    content = content.replace(/^\s*([a-zA-Z0-9_-]+)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(,?\s*)$/gm, '  $1 = "{$2}"$3');
    
    const bibtexParse = require(path.join(ROOT, 'portfolio-react', 'node_modules', 'bibtex-parse-js'));
    let parsed = bibtexParse.toJSON(content);
    res.json({ success: true, entries: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message, entries: [] });
  }
});

app.put("/api/bibliography_parsed", (req, res) => {
  try {
    const entries = req.body.entries;
    let output = "---\n---\n\n@string{aps = {American Physical Society,}}\n\n";
    entries.forEach(pub => {
      output += `@${pub.entryType}{${pub.citationKey},\n`;
      for(let k in pub.entryTags) {
         output += `  ${k.padEnd(15)} = {${pub.entryTags[k]}},\n`;
      }
      output = output.replace(/,\n$/, '\n');
      output += `}\n\n`;
    });
    fs.writeFileSync(
      path.join(ROOT, "_bibliography", "papers.bib"),
      output,
      "utf8"
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Image & File upload
// ============================================================================

app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    // Also copy to React App so Next.js can serve it immediately
    const reactImgPath = path.join(ROOT, "portfolio-react", "public", "assets", "img");
    if (fs.existsSync(reactImgPath)) {
      fs.copyFileSync(req.file.path, path.join(reactImgPath, req.file.filename));
    }

    res.json({
      success: true,
      filename: req.file.filename,
      path: `/assets/img/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storage for generic files (including PDF)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPdf = /\.pdf$/i.test(file.originalname);
    const dest = isPdf ? path.join(ROOT, "assets", "pdf") : path.join(ROOT, "assets", "files");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploadFile = multer({ storage: fileStorage });

app.post("/api/upload-file", uploadFile.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const isPdf = /\.pdf$/i.test(req.file.originalname);
    const targetSubdir = isPdf ? "pdf" : "files";
    
    // Also copy to React App public directory so Next.js can serve it immediately
    const reactDestDir = path.join(ROOT, "portfolio-react", "public", "assets", targetSubdir);
    if (!fs.existsSync(reactDestDir)) fs.mkdirSync(reactDestDir, { recursive: true });
    fs.copyFileSync(req.file.path, path.join(reactDestDir, req.file.filename));

    res.json({
      success: true,
      filename: req.file.filename,
      path: `/assets/${targetSubdir}/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pdfs", (req, res) => {
  try {
    const dir = path.join(ROOT, "assets", "pdf");
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter((f) => /\.pdf$/i.test(f));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List images in assets/img
app.get("/api/images", (req, res) => {
  try {
    const dir = path.join(ROOT, "assets", "img");
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// API: Locale data (_data/vi.yml, _data/en.yml)
// ============================================================================

app.get("/api/locale/:lang", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_data", `${req.params.lang}.yml`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    const data = readYaml(filePath);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/locale/:lang", (req, res) => {
  try {
    const filePath = path.join(ROOT, "_data", `${req.params.lang}.yml`);
    writeYaml(filePath, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Start server
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n  ╔═══════════════════════════════════════════════╗`);
  console.log(`  ║   🚀 Admin Panel running                      ║`);
  console.log(`  ║   📋 http://localhost:${PORT}/admin              ║`);
  console.log(`  ║   📡 API: http://localhost:${PORT}/api            ║`);
  console.log(`  ║   🌐 Portfolio: http://localhost:8080           ║`);
  console.log(`  ╚═══════════════════════════════════════════════╝\n`);
});
