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

// Serve admin UI
app.use("/admin", express.static(path.join(ROOT, "admin")));
app.use("/assets", express.static(path.join(ROOT, "assets"))); // Serve assets for admin preview

// Redirect /admin to /admin/index.html
app.get("/admin", (req, res) => {
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
      header_logo_size: config.header_logo_size || "40px",
      header_logo_height: config.header_logo_height || "auto",
      header_logo_bg: config.header_logo_bg || "",
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
    
    const { frontMatter } = readMarkdown(pagePath);
    res.json({
      title: frontMatter.title || "",
      title_en: frontMatter.title_en || "",
      description: frontMatter.description || "",
      description_en: frontMatter.description_en || ""
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
    
    if (req.body.title !== undefined) frontMatter.title = req.body.title;
    if (req.body.title_en !== undefined) frontMatter.title_en = req.body.title_en;
    if (req.body.description !== undefined) frontMatter.description = req.body.description;
    if (req.body.description_en !== undefined) frontMatter.description_en = req.body.description_en;
    
    writeMarkdown(pagePath, frontMatter, body);
    res.json({ success: true, message: "Page updated" });
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
// API: Socials (_data/socials.yml)
// ============================================================================

app.get("/api/socials", (req, res) => {
  try {
    const data = readYaml(path.join(ROOT, "_data", "socials.yml"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/socials", (req, res) => {
  try {
    writeYaml(path.join(ROOT, "_data", "socials.yml"), req.body);
    res.json({ success: true });
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
    content = content.replace(/=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, '= "{$1}"$2');
    
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
// API: Image upload
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
