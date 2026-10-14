export const dynamic = 'force-dynamic';
import { getPageContent, getCvData, getConfig } from '../../../lib/config';
import PrintButton from '../../../components/PrintButton';
import CvQuickNav from '../../../components/CvQuickNav';

const getLogoSize = (size) => {
  if (!size) return '60px';
  return /^\d+$/.test(size.toString().trim()) ? `${size}px` : size;
};

export default async function CV({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const { data: fm } = getPageContent('cv.md', lang);
  const cvData = getCvData(lang)?.cv || {};
  const config = getConfig(lang);
  const st = lang === 'vi' ? (config.section_titles || {}) : (config.section_titles_en || {});

  const generalInfo = [];
  if (cvData.name) generalInfo.push({ name: lang === 'vi' ? 'Họ và tên' : 'Full Name', value: cvData.name });
  if (cvData.label) generalInfo.push({ name: lang === 'vi' ? 'Vị trí hiện tại' : 'Current position', value: cvData.label });
  if (cvData.email) generalInfo.push({ name: 'Email', value: cvData.email });
  if (cvData.location) generalInfo.push({ name: lang === 'vi' ? 'Địa điểm' : 'Location', value: cvData.location });
  
  // Add languages from the Languages section if they exist
  const languages = cvData.sections?.Languages || [];
  if (languages.length > 0) {
    const langNames = languages.map(l => l.name).filter(Boolean).join(', ');
    if (langNames) generalInfo.push({ name: lang === 'vi' ? 'Ngôn ngữ' : 'Languages', value: langNames });
  }

  // Add custom info fields (e.g. Tổ chức / Organization, Đơn vị, v.v.)
  const customInfo = cvData.custom_info || [];
  if (Array.isArray(customInfo)) {
    customInfo.forEach(item => {
      const fieldName = lang === 'en' ? (item.name_en || item.name) : (item.name || item.name_en);
      const fieldValue = lang === 'en' ? (item.value_en || item.value) : (item.value || item.value_en);
      if (fieldName && fieldValue) {
        generalInfo.push({ name: fieldName, value: fieldValue });
      }
    });
  }

  const education = cvData.sections?.Education || [];
  const experience = cvData.sections?.Experience || [];
  const honors = cvData.sections?.['Honors and Awards'] || [];
  const skills = cvData.sections?.Skills || [];

  // Title styling options from frontMatter & config
  const pageTitleBold = fm.page_title_bold !== false;
  const pageTitleColor = fm.page_title_color || config.section_titles_color || '#8c0303';

  const generalTitle = (lang === 'en' ? fm.general_title_en : fm.general_title) || st.cv_general || (lang === 'vi' ? 'Thông tin chung' : 'General Information');
  const generalTitleBold = fm.general_title_bold !== false;
  const generalTitleColor = fm.general_title_color || config.section_titles_color || '#8c0303';

  const educationTitle = (lang === 'en' ? fm.education_title_en : fm.education_title) || (lang === 'vi' ? 'Học vấn' : 'Education');
  const educationTitleBold = fm.education_title_bold !== false;
  const educationTitleColor = fm.education_title_color || config.section_titles_color || '#8c0303';

  const experienceTitle = (lang === 'en' ? fm.experience_title_en : fm.experience_title) || st.cv_experience || (lang === 'vi' ? 'Kinh nghiệm' : 'Experience');
  const experienceTitleBold = fm.experience_title_bold !== false;
  const experienceTitleColor = fm.experience_title_color || config.section_titles_color || '#8c0303';

  const honorsTitle = (lang === 'en' ? fm.honors_title_en : fm.honors_title) || st.cv_honors || (lang === 'vi' ? 'Giải thưởng và Thành tựu' : 'Honors and Awards');
  const honorsTitleBold = fm.honors_title_bold !== false;
  const honorsTitleColor = fm.honors_title_color || config.section_titles_color || '#8c0303';

  const skillsTitle = (lang === 'en' ? fm.skills_title_en : fm.skills_title) || st.cv_skills || (lang === 'vi' ? 'Kỹ năng chuyên môn' : 'Skills');
  const skillsTitleBold = fm.skills_title_bold !== false;
  const skillsTitleColor = fm.skills_title_color || config.section_titles_color || '#8c0303';

  // Build sections for Quick Navigation (TOC)
  const navSections = [
    { id: 'general-info', label: generalTitle },
    ...(education.length > 0 ? [{ id: 'education', label: educationTitle }] : []),
    ...(experience.length > 0 ? [{ id: 'experience', label: experienceTitle }] : []),
    ...(honors.length > 0 ? [{ id: 'honors-awards', label: honorsTitle }] : []),
    ...(skills.length > 0 ? [{ id: 'skills', label: skillsTitle }] : []),
  ];

  return (
    <div className="container mt-5" role="main" style={{ maxWidth: '1140px' }}>
      <div className="post">
        <header className="post-header mb-4">
          <h1
            className="post-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontWeight: pageTitleBold ? '700' : '400',
              color: pageTitleColor || 'inherit',
            }}
          >
            <span style={{ color: pageTitleColor || 'inherit' }}>{fm.title || (lang === 'vi' ? 'Sơ yếu lý lịch' : 'Curriculum Vitae')}</span>
            {fm.cv_pdf && <PrintButton />}
          </h1>
          {fm.description && <p className="desc" style={{ color: 'var(--global-text-color-light)', fontSize: '0.95rem' }}>{fm.description}</p>}
        </header>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {/* Quick Navigation / Thao tác nhanh bên trái */}
          <CvQuickNav sections={navSections} lang={lang} />

          {/* Nội dung CV bên phải */}
          <article style={{ flex: 1, minWidth: 0 }}>
            <div className="cv">
              {/* General Information */}
              <div className="card mt-3 p-3" id="general-info" style={{ scrollMarginTop: '85px' }}>
                <h3
                  className="card-title"
                  style={{
                    color: generalTitleColor || config.section_titles_color || 'inherit',
                    fontWeight: generalTitleBold ? '700' : '400',
                  }}
                >
                  {generalTitle}
                </h3>
                <div className="card-body p-0">
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      {generalInfo.map((info, idx) => (
                        <tr key={idx}>
                          <td className="p-1 pr-2 font-weight-bold" style={{ width: '22%', verticalAlign: 'top', color: 'var(--global-text-color)' }}>
                            {info.name}
                          </td>
                          <td className="p-1 pl-2 font-weight-light" style={{ width: '78%', color: 'var(--global-text-color)' }}>
                            {info.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Education */}
              {education.length > 0 && (
                <div className="card mt-4 p-3" id="education" style={{ scrollMarginTop: '85px' }}>
                  <h3
                    className="card-title"
                    style={{
                      color: educationTitleColor || config.section_titles_color || 'inherit',
                      fontWeight: educationTitleBold ? '700' : '400',
                    }}
                  >
                    {educationTitle}
                  </h3>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                      {education.map((edu, idx) => (
                        <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== education.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                          <div className="row">
                            <div className="col-12 col-md-3 col-lg-2 text-center text-md-left mb-2 mb-md-0">
                              <span className="badge font-weight-bold text-uppercase align-middle" style={{ 
                                backgroundColor: 'var(--global-theme-color)', 
                                color: 'white', 
                                minWidth: '75px', 
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}>
                                {edu.start_date} - {edu.end_date}
                              </span>
                            </div>
                            <div className="col-12 col-md-9 col-lg-10 mt-2 mt-md-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <h6 className="title font-weight-bold ml-1 ml-md-4" style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--global-text-color)' }}>
                                  {edu.studyType}
                                </h6>
                                {/* Tên trường đại học với Icon fa-building-columns màu cyan/teal như hình mẫu */}
                                <div className="ml-1 ml-md-4" style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  fontSize: '0.95rem', 
                                  marginBottom: '8px',
                                  color: 'var(--global-text-color)' 
                                }}>
                                  <i className="fa-solid fa-building-columns" style={{ color: '#06b6d4', fontSize: '1.02rem', flexShrink: 0 }}></i>
                                  <span style={{ fontWeight: '500' }}>
                                    {[edu.institution, edu.location, edu.area].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                                {edu.highlights && edu.highlights.length > 0 && (
                                  <ul className="items ml-1 ml-md-4" style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '0' }}>
                                    {edu.highlights.map((point, pIdx) => {
                                      const isTheme = point.includes('(theme)');
                                      const cleanPoint = point.replace('(theme)', '').trim();
                                      return (
                                        <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                                          <span style={{ marginRight: '0.5rem', color: '#6c757d', fontSize: '0.9rem', lineHeight: '1.5' }}>&#x25E6;</span>
                                          <span className="item" style={{ fontSize: '0.93rem', fontWeight: '300', lineHeight: '1.5', color: isTheme ? 'var(--global-theme-color)' : 'inherit' }}>
                                            {cleanPoint}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                              {edu.logo && (
                                <div style={{ marginLeft: '15px', flexShrink: 0 }}>
                                  <img src={`/assets/img/${edu.logo}`} alt="Logo" style={{ width: getLogoSize(edu.logo_size), objectFit: 'contain' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <div className="card mt-4 p-3" id="experience" style={{ scrollMarginTop: '85px' }}>
                  <h3
                    className="card-title"
                    style={{
                      color: experienceTitleColor || config.section_titles_color || 'inherit',
                      fontWeight: experienceTitleBold ? '700' : '400',
                    }}
                  >
                    {experienceTitle}
                  </h3>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                      {experience.map((exp, idx) => (
                        <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== experience.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                          <div className="row">
                            <div className="col-12 col-md-3 col-lg-2 text-center text-md-left mb-2 mb-md-0">
                              <span className="badge font-weight-bold text-uppercase align-middle" style={{ 
                                backgroundColor: 'var(--global-theme-color)', 
                                color: 'white', 
                                minWidth: '75px', 
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}>
                                {exp.start_date} - {exp.end_date}
                              </span>
                            </div>
                            <div className="col-12 col-md-9 col-lg-10 mt-2 mt-md-0">
                              <h6 className="title font-weight-bold ml-1 ml-md-4" style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--global-text-color)' }}>
                                {exp.position}
                              </h6>
                              <div className="ml-1 ml-md-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', marginBottom: '6px', color: 'var(--global-text-color)' }}>
                                <i className="fa-solid fa-briefcase" style={{ color: '#3b82f6', fontSize: '0.95rem', flexShrink: 0 }}></i>
                                <span style={{ fontWeight: '500' }}>{exp.company}</span>
                                {exp.location && <span style={{ color: '#64748b', fontSize: '0.88rem' }}>({exp.location})</span>}
                              </div>
                              {exp.summary && (
                                <p className="ml-1 ml-md-4" style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '6px' }}>
                                  {exp.summary}
                                </p>
                              )}
                              {exp.highlights && exp.highlights.length > 0 && (
                                <ul className="items ml-1 ml-md-4" style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '0' }}>
                                  {exp.highlights.map((point, pIdx) => (
                                    <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                                      <span style={{ marginRight: '0.5rem', color: '#6c757d', fontSize: '0.9rem', lineHeight: '1.5' }}>&#x25E6;</span>
                                      <span style={{ fontSize: '0.92rem', fontWeight: '300', lineHeight: '1.5', color: 'var(--global-text-color)' }}>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Honors and Awards */}
              {honors.length > 0 && (
                <div className="card mt-4 p-3" id="honors-awards" style={{ scrollMarginTop: '85px' }}>
                  <h3
                    className="card-title"
                    style={{
                      color: honorsTitleColor || config.section_titles_color || 'inherit',
                      fontWeight: honorsTitleBold ? '700' : '400',
                    }}
                  >
                    {honorsTitle}
                  </h3>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                      {honors.map((honor, idx) => (
                        <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== honors.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                          <div className="row">
                            <div className="col-12 col-md-3 col-lg-2 text-center text-md-left mb-2 mb-md-0">
                              <span className="badge font-weight-bold text-uppercase align-middle" style={{ 
                                backgroundColor: 'var(--global-theme-color)', 
                                color: 'white', 
                                minWidth: '75px', 
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}>
                                {honor.date}
                              </span>
                            </div>
                            <div className="col-12 col-md-9 col-lg-10 mt-2 mt-md-0">
                              <ul className="items ml-1 ml-md-4" style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '0' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fa-solid fa-award" style={{ color: '#eab308', fontSize: '1rem', flexShrink: 0 }}></i>
                                  <span className="item" style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--global-text-color)' }}>
                                    {honor.title}
                                  </span>
                                  {honor.issuer && (
                                    <span style={{ color: '#64748b', fontSize: '0.88rem' }}>– {honor.issuer}</span>
                                  )}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {skills.length > 0 && (
                <div className="card mt-4 p-3" id="skills" style={{ scrollMarginTop: '85px' }}>
                  <h3
                    className="card-title"
                    style={{
                      color: skillsTitleColor || config.section_titles_color || 'inherit',
                      fontWeight: skillsTitleBold ? '700' : '400',
                    }}
                  >
                    {skillsTitle}
                  </h3>
                  <div className="card-body p-2">
                    <div className="row">
                      {skills.map((skill, idx) => (
                        <div className="col-12 col-md-6 mb-3" key={idx}>
                          <div style={{
                            padding: '14px',
                            border: '1px solid var(--global-divider-color, #e2e8f0)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--global-card-bg-color, transparent)',
                            height: '100%'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--global-text-color)' }}>
                                {skill.icon && <i className={`fa-solid ${skill.icon}`} style={{ color: 'var(--global-theme-color)' }}></i>}
                                <span>{skill.name}</span>
                              </div>
                              {skill.level && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  backgroundColor: 'color-mix(in srgb, var(--global-theme-color) 12%, transparent)',
                                  color: 'var(--global-theme-color)',
                                  fontWeight: '600'
                                }}>
                                  {skill.level}
                                </span>
                              )}
                            </div>
                            {skill.keywords && skill.keywords.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {skill.keywords.map((kw, kIdx) => (
                                  <span key={kIdx} style={{
                                    fontSize: '0.8rem',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--global-code-bg-color, rgba(0,0,0,0.05))',
                                    color: 'var(--global-text-color)',
                                    border: '1px solid var(--global-divider-color, #e2e8f0)',
                                  }}>
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
