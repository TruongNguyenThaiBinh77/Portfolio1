import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import matter from 'gray-matter';

// Root of the Jekyll site (one level up from portfolio-react)
const ROOT = path.join(process.cwd(), '..');

export function getConfig(lang = 'vi') {
  const fileContents = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  let config = yaml.load(fileContents) || {};
  config = JSON.parse(JSON.stringify(config));
  if (lang === 'en') {
    Object.keys(config).forEach(key => {
      if (key.endsWith('_en')) {
        const baseKey = key.replace('_en', '');
        if (config[key]) config[baseKey] = config[key];
      }
    });
  }
  return config;
}

export function getPageContent(fileName, lang = 'vi') {
  const filePath = path.join(ROOT, '_pages', fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  let { data, content } = matter(fileContents);
  data = JSON.parse(JSON.stringify(data || {}));
  if (lang === 'en') {
    Object.keys(data).forEach(key => {
      if (key.endsWith('_en')) {
        const baseKey = key.replace('_en', '');
        if (data[key]) data[baseKey] = data[key];
      }
    });
    if (data.content_en) content = data.content_en;
  }
  return { data, content };
}

export function getNews(lang = 'vi') {
  const newsDir = path.join(ROOT, '_news');
  if (!fs.existsSync(newsDir)) return [];
  const files = fs.readdirSync(newsDir);
  const news = files
    .filter(f => f.endsWith('.md'))
    .map(fileName => {
      const fileContents = fs.readFileSync(path.join(newsDir, fileName), 'utf8');
      let { data, content } = matter(fileContents);
      data = JSON.parse(JSON.stringify(data || {}));
      if (lang === 'en') {
        Object.keys(data).forEach(key => {
          if (key.endsWith('_en')) {
            const baseKey = key.replace('_en', '');
            if (data[key]) data[baseKey] = data[key];
          }
        });
        if (data.content_en) content = data.content_en;
      }
      let date = data.date;
      if (!date && fileName.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = fileName.substring(0, 10);
      }
      return {
        slug: fileName.replace('.md', ''),
        frontMatter: data,
        date: date,
        content: content
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return news;
}

export function getCvData(lang = 'vi') {
  const filePath = path.join(ROOT, '_data', 'cv.yml');
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, 'utf8');
  let data = yaml.load(fileContents);
  if (lang === 'en' && data && data.cv) {
    const cv = data.cv;
    // Translate root level fields in cv
    Object.keys(cv).forEach(key => {
      if (key.endsWith('_en')) {
        const baseKey = key.replace('_en', '');
        if (cv[key]) cv[baseKey] = cv[key];
      }
    });

    const translateArray = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key.endsWith('_en')) {
            const baseKey = key.replace('_en', '');
            if (item[key]) item[baseKey] = item[key];
          }
        });
      });
    };
    if (cv.sections?.Education) translateArray(cv.sections.Education);
    if (cv.sections?.Experience) translateArray(cv.sections.Experience);
    if (cv.sections?.['Honors and Awards']) translateArray(cv.sections['Honors and Awards']);
    if (cv.sections?.Languages) translateArray(cv.sections.Languages);
    if (cv.sections?.Skills) translateArray(cv.sections.Skills);
    if (cv.custom_info) translateArray(cv.custom_info);
  }
  return data;
}

export function getTeachings(lang = 'vi') {
  const dirPath = path.join(ROOT, '_teachings');
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  const teachings = files
    .filter(f => f.endsWith('.md'))
    .map(fileName => {
      const fileContents = fs.readFileSync(path.join(dirPath, fileName), 'utf8');
      let { data, content } = matter(fileContents);
      data = JSON.parse(JSON.stringify(data || {}));
      if (lang === 'en') {
        Object.keys(data).forEach(key => {
          if (key.endsWith('_en')) {
            const baseKey = key.replace('_en', '');
            if (data[key]) data[baseKey] = data[key];
          }
        });
        if (data.content_en) content = data.content_en;
      }
      return {
        slug: fileName.replace('.md', ''),
        frontMatter: data,
        content: content
      };
    });
  teachings.sort((a, b) => {
    if (b.frontMatter.year !== a.frontMatter.year) {
      return (b.frontMatter.year || 0) - (a.frontMatter.year || 0);
    }
    const terms = { 'Fall': 3, 'Summer': 2, 'Spring': 1, 'Winter': 0 };
    return (terms[b.frontMatter.term] || 0) - (terms[a.frontMatter.term] || 0);
  });
  return teachings;
}

export function getPublications(lang = 'vi') {
  const filePath = path.join(ROOT, '_bibliography', 'papers.bib');
  if (!fs.existsSync(filePath)) return [];
  let fileContents = fs.readFileSync(filePath, 'utf8');
  
  // Sanitize for bibtex-parse-js
  // 1. Remove YAML frontmatter
  fileContents = fileContents.replace(/^---[\s\S]*?---\n/g, '');
  // 2. Remove @string definitions as they can cause issues
  fileContents = fileContents.replace(/@string\{.*?\}/gi, '');
  // 3. Fix unquoted values (e.g., publisher = aps,) which bibtex-parse-js chokes on if @string is missing
  fileContents = fileContents.replace(/^\s*([a-zA-Z0-9_-]+)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(,?\s*)$/gm, '  $1 = "{$2}"$3');

  try {
    const bibtexParse = require('bibtex-parse-js');
    const parsed = bibtexParse.toJSON(fileContents);
    
    if (lang === 'en') {
      parsed.forEach(pub => {
        if (pub.entryTags) {
          Object.keys(pub.entryTags).forEach(key => {
            if (key.endsWith('_en')) {
              const baseKey = key.replace('_en', '');
              if (pub.entryTags[key]) pub.entryTags[baseKey] = pub.entryTags[key];
            }
            else if (key.endsWith('_EN')) {
              const baseKey = key.replace('_EN', '');
              if (pub.entryTags[key]) pub.entryTags[baseKey] = pub.entryTags[key];
            }
          });
        }
      });
    }
    
    return parsed;
  } catch (e) {
    console.error("Error parsing bibtex:", e);
    return [];
  }
}

export function getRepositories() {
  const filePath = path.join(ROOT, '_data', 'repositories.yml');
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents) || {};
}

export function getAllArticles(lang = 'vi') {
  const news = getNews(lang);
  const bibPubs = getPublications(lang);
  
  const articles = [];
  const seenKeys = new Set();
  
  // 1. Process from _news (highest fidelity with full markdown content and YAML frontmatter)
  news.forEach(item => {
    const fm = item.frontMatter || {};
    if (!fm.title) return;
    
    const titleNormalized = (fm.title || '').trim().toLowerCase();
    seenKeys.add(titleNormalized);
    if (item.slug) seenKeys.add(item.slug.toLowerCase());

    let year = '2026';
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) year = d.getFullYear().toString();
    } else if (fm.year) {
      year = fm.year.toString();
    }

    let dateStr = "";
    let dateParts = [];
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        if (lang === 'vi') {
          const monthsVi = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
          dateParts = [monthsVi[d.getMonth()], d.getDate().toString() + ",", d.getFullYear().toString()];
          dateStr = dateParts.join(' ');
        } else {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          dateParts = [months[d.getMonth()], d.getDate().toString() + ",", d.getFullYear().toString()];
          dateStr = dateParts.join(' ');
        }
      } else {
        dateStr = item.date;
        dateParts = item.date.split(' ');
      }
    }

    let jBg = fm.journal_bg_color;
    let jColor = fm.journal_color;
    let jBorder = fm.journal_border_color;
    
    if (!jBg || !jColor) {
      const jLower = (fm.journal || '').toLowerCase();
      if (jLower.includes('quản lý nhà nước') || jLower.includes('quan ly nha nuoc')) {
        jBg = jBg || '#fef3c7'; // Vàng đồng
        jColor = jColor || '#92400e';
        jBorder = jBorder || '#fcd34d';
      } else if (jLower.includes('thanh niên') || jLower.includes('thanh nien')) {
        jBg = jBg || '#e0f2fe'; // Xanh thanh thiên
        jColor = jColor || '#0369a1';
        jBorder = jBorder || '#7dd3fc';
      } else {
        jBg = jBg || '#fee2e2';
        jColor = jColor || '#991b1b';
        jBorder = jBorder || '#fca5a5';
      }
    }

    articles.push({
      id: item.slug,
      slug: item.slug,
      title: fm.title,
      title_en: fm.title_en,
      author: fm.author || 'Trương Nguyễn Thái Bình',
      author_en: fm.author_en || 'Truong Nguyen Thai Binh',
      institution: fm.institution,
      institution_en: fm.institution_en,
      journal: fm.journal || '',
      journal_en: fm.journal_en || '',
      journal_bg_color: jBg,
      journal_color: jColor,
      journal_border_color: jBorder,
      volume: fm.volume || '',
      pages: fm.pages || '',
      year: year,
      date: item.date,
      dateStr: dateStr,
      dateParts: dateParts,
      url: fm.external_url || fm.link,
      pdf: fm.pdf || fm.pdf_url,
      preview: fm.preview || (item.slug.includes('quan-ly-nha-nuoc') ? 'TCQLNC.jpg' : (item.slug.includes('cong-nghiep-van-hoa') ? 'TCTN.jpg' : '')),
      badge_name: fm.badge_name || (lang === 'vi' ? 'TẠP CHÍ' : 'JOURNAL'),
      badge_name_en: fm.badge_name_en || 'JOURNAL',
      badge_color: fm.badge_color || (item.slug.includes('quan-ly-nha-nuoc') ? '#b91c1c' : '#1e3a8a'),
      badge_text_color: fm.badge_text_color || '#ffffff',
      sidebox_text: fm.sidebox_text !== undefined ? fm.sidebox_text : (fm.badge_name || (item.slug.includes('quan-ly-nha-nuoc') ? 'APIN' : 'TẠP CHÍ')),
      sidebox_bg_color: fm.sidebox_bg_color || fm.badge_color || (item.slug.includes('quan-ly-nha-nuoc') ? '#800000' : '#1e3a8a'),
      sidebox_text_color: fm.sidebox_text_color || fm.badge_text_color || '#ffffff',
      sidebox_image: fm.sidebox_image || fm.preview || (item.slug.includes('quan-ly-nha-nuoc') ? 'TCQLNC.jpg' : (item.slug.includes('cong-nghiep-van-hoa') ? 'TCTN.jpg' : '')),
      sidebox_width: fm.sidebox_width || 115,
      metric_badges: fm.metric_badges || item.metric_badges || (
        item.slug && item.slug.includes('quan-ly-nha-nuoc')
          ? [
              { label: 'IF', value: 'Chưa có data' },
              { label: 'Q', value: 'Chưa có data' },
              { label: 'FWCI', value: 'Chưa có data' },
              { label: 'ISSN', value: '0868-2828' },
              { label: 'HĐCDGS', value: '0.75 - 1.0' },
            ]
          : item.slug && item.slug.includes('cong-nghiep-van-hoa')
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
      ),
      abstract: fm.description || fm.abstract || (item.content ? item.content.replace(/^#+\s+/gm, '').trim() : ''),
      abstract_en: fm.description_en || fm.abstract_en,
      content: item.content,
      frontMatter: {
        ...fm,
        journal_bg_color: jBg,
        journal_color: jColor,
        journal_border_color: jBorder,
        sidebox_text: fm.sidebox_text !== undefined ? fm.sidebox_text : (fm.badge_name || (item.slug.includes('quan-ly-nha-nuoc') ? 'APIN' : 'TẠP CHÍ')),
        sidebox_bg_color: fm.sidebox_bg_color || fm.badge_color || (item.slug.includes('quan-ly-nha-nuoc') ? '#800000' : '#1e3a8a'),
        sidebox_text_color: fm.sidebox_text_color || fm.badge_text_color || '#ffffff',
        sidebox_image: fm.sidebox_image || fm.preview || (item.slug.includes('quan-ly-nha-nuoc') ? 'TCQLNC.jpg' : (item.slug.includes('cong-nghiep-van-hoa') ? 'TCTN.jpg' : '')),
        sidebox_width: fm.sidebox_width || 115,
        metric_badges: fm.metric_badges || item.metric_badges || (
          item.slug && item.slug.includes('quan-ly-nha-nuoc')
            ? [
                { label: 'IF', value: 'Chưa có data' },
                { label: 'Q', value: 'Chưa có data' },
                { label: 'FWCI', value: 'Chưa có data' },
                { label: 'ISSN', value: '0868-2828' },
                { label: 'HĐCDGS', value: '0.75 - 1.0' },
              ]
            : item.slug && item.slug.includes('cong-nghiep-van-hoa')
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
        ),
      },
    });
  });

  // 2. Process entries from papers.bib that are not in _news
  bibPubs.forEach(pub => {
    const tags = pub.entryTags || {};
    const title = tags.TITLE || tags.title;
    if (!title) return;
    const titleNormalized = title.trim().toLowerCase();
    const key = pub.citationKey ? pub.citationKey.toLowerCase() : '';
    
    // Check if already in list
    const existing = articles.find(a => 
      (a.title && a.title.trim().toLowerCase() === titleNormalized) ||
      (key && a.slug && a.slug.toLowerCase().includes(key)) ||
      (key && a.id && a.id.toLowerCase().includes(key))
    );

    if (existing) {
      if (!existing.volume && (tags.volume || tags.VOLUME)) existing.volume = tags.volume || tags.VOLUME;
      if (!existing.pages && (tags.pages || tags.PAGES)) existing.pages = tags.pages || tags.PAGES;
      if (!existing.preview && (tags.preview || tags.PREVIEW)) existing.preview = tags.preview || tags.PREVIEW;
      if (!existing.pdf && (tags.pdf || tags.PDF)) existing.pdf = tags.pdf || tags.PDF;
      if (!existing.url && (tags.url || tags.URL)) existing.url = tags.url || tags.URL;
      if (!existing.badge_name && (tags.badge_name || tags.BADGE_NAME)) existing.badge_name = tags.badge_name || tags.BADGE_NAME;
      if (!existing.badge_color && (tags.badge_color || tags.BADGE_COLOR)) existing.badge_color = tags.badge_color || tags.BADGE_COLOR;
      if (tags.journal_bg_color && !existing.journal_bg_color) existing.journal_bg_color = tags.journal_bg_color;
      if (tags.journal_color && !existing.journal_color) existing.journal_color = tags.journal_color;
      if (tags.journal_border_color && !existing.journal_border_color) existing.journal_border_color = tags.journal_border_color;
      return;
    }

    seenKeys.add(titleNormalized);
    if (key) seenKeys.add(key);

    const year = tags.year || tags.YEAR || '2026';
    const month = tags.month || tags.MONTH || '10';
    const dateStr = lang === 'vi' ? `Tháng ${parseInt(month) || 10}, ${year}` : `${month}, ${year}`;

    let jBg = tags.journal_bg_color || tags.JOURNAL_BG_COLOR;
    let jColor = tags.journal_color || tags.JOURNAL_COLOR;
    let jBorder = tags.journal_border_color || tags.JOURNAL_BORDER_COLOR;
    if (!jBg || !jColor) {
      const jLower = (tags.journal || tags.JOURNAL || '').toLowerCase();
      if (jLower.includes('quản lý nhà nước') || jLower.includes('quan ly nha nuoc')) {
        jBg = jBg || '#fef3c7'; // Vàng đồng
        jColor = jColor || '#92400e';
        jBorder = jBorder || '#fcd34d';
      } else if (jLower.includes('thanh niên') || jLower.includes('thanh nien')) {
        jBg = jBg || '#e0f2fe'; // Xanh thanh thiên
        jColor = jColor || '#0369a1';
        jBorder = jBorder || '#7dd3fc';
      } else {
        jBg = jBg || '#fee2e2';
        jColor = jColor || '#991b1b';
        jBorder = jBorder || '#fca5a5';
      }
    }

    articles.push({
      id: pub.citationKey || titleNormalized,
      slug: pub.citationKey,
      title: title,
      title_en: tags.title_en || tags.TITLE_EN,
      author: tags.author || tags.AUTHOR || 'Trương Nguyễn Thái Bình',
      author_en: tags.author_en || tags.AUTHOR_EN,
      institution: tags.institution || tags.INSTITUTION,
      institution_en: tags.institution_en || tags.INSTITUTION_EN,
      journal: tags.journal || tags.JOURNAL || tags.booktitle || tags.BOOKTITLE || '',
      journal_en: tags.journal_en || tags.JOURNAL_EN,
      journal_bg_color: jBg,
      journal_color: jColor,
      journal_border_color: jBorder,
      volume: tags.volume || tags.VOLUME || '',
      pages: tags.pages || tags.PAGES || '',
      year: year,
      date: `${year}-${month.padStart(2, '0')}-01`,
      dateStr: dateStr,
      dateParts: [lang === 'vi' ? `Tháng ${parseInt(month) || 10}` : month, '01,', year],
      url: tags.url || tags.URL || tags.html || tags.HTML,
      pdf: tags.pdf || tags.PDF,
      preview: tags.preview || tags.PREVIEW,
      badge_name: tags.badge_name || tags.BADGE_NAME || (lang === 'vi' ? 'TẠP CHÍ' : 'JOURNAL'),
      badge_name_en: tags.badge_name_en || tags.BADGE_NAME_EN || 'JOURNAL',
      metric_badges: [
        { label: 'IF', value: 'Chưa có data' },
        { label: 'Q1', value: 'Chưa có data' },
        { label: 'FWCI', value: 'Chưa có data' },
      ],
      abstract: tags.abstract || tags.ABSTRACT,
      abstract_en: tags.abstract_en || tags.ABSTRACT_EN,
      content: '',
      frontMatter: {
        title: title,
        title_en: tags.title_en || tags.TITLE_EN,
        journal: tags.journal || tags.JOURNAL,
        journal_en: tags.journal_en || tags.JOURNAL_EN,
        journal_bg_color: jBg,
        journal_color: jColor,
        journal_border_color: jBorder,
        author: tags.author || tags.AUTHOR,
        author_en: tags.author_en || tags.AUTHOR_EN,
        description: tags.abstract || tags.ABSTRACT,
        description_en: tags.abstract_en || tags.ABSTRACT_EN,
        external_url: tags.url || tags.URL,
        pdf: tags.pdf || tags.PDF,
        volume: tags.volume || tags.VOLUME,
        pages: tags.pages || tags.PAGES,
        metric_badges: [
          { label: 'IF', value: 'Chưa có data' },
          { label: 'Q1', value: 'Chưa có data' },
          { label: 'FWCI', value: 'Chưa có data' },
        ],
      }
    });
  });

  // Sort descending by date/year
  articles.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : (parseInt(a.year) || 0) * 10000;
    const timeB = b.date ? new Date(b.date).getTime() : (parseInt(b.year) || 0) * 10000;
    return timeB - timeA;
  });

  return articles;
}

