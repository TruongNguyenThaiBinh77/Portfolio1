export const dynamic = 'force-dynamic';
import { getPageContent, getCvData, getConfig } from '../../../lib/config';
import PrintButton from '../../../components/PrintButton';

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
  if (cvData.name) generalInfo.push({ name: 'Full Name', value: cvData.name });
  if (cvData.label) generalInfo.push({ name: 'Current position', value: cvData.label });
  if (cvData.email) generalInfo.push({ name: 'Email', value: cvData.email });
  if (cvData.location) generalInfo.push({ name: 'Location', value: cvData.location });
  // Add languages from the Languages section if they exist
  const languages = cvData.sections?.Languages || [];
  if (languages.length > 0) {
    const langNames = languages.map(lang => lang.name).filter(Boolean).join(', ');
    if (langNames) generalInfo.push({ name: 'Languages', value: langNames });
  }

  const education = cvData.sections?.Education || [];
  const experience = cvData.sections?.Experience || [];
  const honors = cvData.sections?.['Honors and Awards'] || [];

  return (
    <div className="container mt-5" role="main">
      <div className="post">
        <header className="post-header">
          <h1 className="post-title">
            {fm.title || "Curriculum Vitae"}
            {fm.cv_pdf && <PrintButton />}
          </h1>
          {fm.description && <p className="desc">{fm.description}</p>}
        </header>

        <article>
          <div className="cv">
            {/* General Information */}
            <div className="card mt-3 p-3">
              <h3 className="card-title font-weight-light" style={{ color: config.section_titles_color || 'inherit' }}>{st.cv_general || (lang === 'vi' ? 'Thông tin chung' : 'General Information')}</h3>
              <div className="card-body p-0">
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    {generalInfo.map((info, idx) => (
                      <tr key={idx}>
                        <td className="p-1 pr-2 font-weight-bold" style={{ width: '20%', verticalAlign: 'top' }}>{info.name}</td>
                        <td className="p-1 pl-2 font-weight-light" style={{ width: '80%' }}>{info.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Education */}
            <div className="card mt-3 p-3">
              <h3 className="card-title font-weight-light" style={{ color: config.section_titles_color || 'inherit' }}>{st.cv_education || (lang === 'vi' ? 'Học vấn' : 'Education')}</h3>
              <div className="card-body p-0">
                <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                  {education.map((edu, idx) => (
                    <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== education.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                      <div className="row">
                        <div className="col-xs-2 cl-sm-2 col-md-2 text-center" style={{ width: '75px' }}>
                          <span className="badge font-weight-bold text-uppercase align-middle" style={{ backgroundColor: 'var(--global-theme-color)', color: 'white', minWidth: '75px', padding: '5px' }}>
                            {edu.start_date} - {edu.end_date}
                          </span>
                        </div>
                        <div className="col-xs-10 cl-sm-10 col-md-10 mt-2 mt-md-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h6 className="title font-weight-bold ml-1 ml-md-4">{edu.studyType}</h6>
                            <h6 className="ml-1 ml-md-4" style={{ fontSize: '0.95rem', fontWeight: '300' }}>
                              {[edu.institution, edu.location, edu.area].filter(Boolean).join(', ')}
                            </h6>
                            {edu.highlights && edu.highlights.length > 0 && (
                              <ul className="items" style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '0' }} className="ml-1 ml-md-4">
                                {edu.highlights.map((point, pIdx) => {
                                  // check if it has (theme) to color it
                                  const isTheme = point.includes('(theme)');
                                  const cleanPoint = point.replace('(theme)', '').trim();
                                  return (
                                    <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start' }}>
                                      <span style={{ marginRight: '0.5rem', color: '#6c757d', fontSize: '0.9rem', lineHeight: '1.5' }}>&#x25E6;</span>
                                      <span className="item" style={{ fontSize: '0.95rem', fontWeight: '300', lineHeight: '1.5', color: isTheme ? 'var(--global-theme-color)' : 'inherit' }}>{cleanPoint}</span>
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

            {/* Experience */}
            <div className="card mt-3 p-3">
              <h3 className="card-title font-weight-light" style={{ color: config.section_titles_color || 'inherit' }}>{st.cv_experience || (lang === 'vi' ? 'Kinh nghiệm' : 'Experience')}</h3>
              <div className="card-body p-0">
                <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                  {experience.map((exp, idx) => (
                    <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== experience.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                      <div className="row">
                        <div className="col-xs-2 cl-sm-2 col-md-2 text-center" style={{ width: '75px' }}>
                          <span className="badge font-weight-bold text-uppercase align-middle" style={{ backgroundColor: 'var(--global-theme-color)', color: 'white', minWidth: '75px', padding: '5px' }}>
                            {exp.start_date} - {exp.end_date}
                          </span>
                        </div>
                        <div className="col-xs-10 cl-sm-10 col-md-10 mt-2 mt-md-0">
                          <h6 className="title font-weight-bold ml-1 ml-md-4">{exp.position}</h6>
                          <h6 className="ml-1 ml-md-4" style={{ fontSize: '0.95rem', fontWeight: '300' }}>{exp.company}</h6>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Honors and Awards */}
            <div className="card mt-3 p-3">
              <h3 className="card-title font-weight-light" style={{ color: config.section_titles_color || 'inherit' }}>{st.cv_honors || (lang === 'vi' ? 'Giải thưởng và Thành tựu' : 'Honors and Awards')}</h3>
              <div className="card-body p-0">
                <ul className="list-group list-group-flush" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                  {honors.map((honor, idx) => (
                    <li className="list-group-item p-3" key={idx} style={{ borderBottom: idx !== honors.length - 1 ? '1px solid #e9ecef' : 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                      <div className="row">
                        <div className="col-xs-2 cl-sm-2 col-md-2 text-center" style={{ width: '75px' }}>
                          <span className="badge font-weight-bold text-uppercase align-middle" style={{ backgroundColor: 'var(--global-theme-color)', color: 'white', minWidth: '75px', padding: '5px' }}>
                            {honor.date}
                          </span>
                        </div>
                        <div className="col-xs-10 cl-sm-10 col-md-10 mt-2 mt-md-0">
                          <ul className="items" style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '0' }} className="ml-1 ml-md-4">
                            <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                              <span style={{ marginRight: '0.5rem', color: '#6c757d', fontSize: '0.9rem', lineHeight: '1.5' }}>&#x25E6;</span>
                              <span className="item" style={{ fontSize: '0.95rem', fontWeight: '300', lineHeight: '1.5' }}>{honor.title}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </article>
      </div>
    </div>
  );
}
