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
  fileContents = fileContents.replace(/=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, '= "{$1}"$2');

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
