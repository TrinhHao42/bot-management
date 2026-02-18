export function extractLevelFromTitle(title: string): string {
  const t = title.toLowerCase();
  
  if (t.includes('intern') || t.includes('thực tập') || t.includes('sinh viên')) return 'Intern';
  if (t.includes('fresher') || t.includes('mới tốt nghiệp') || t.includes('trainee') || t.includes('học việc') || t.includes('entry level')) return 'Fresher';
  if (t.includes('senior') || t.includes('sr.') || t.includes('sr ') || t.includes('chuyên viên cao cấp') || t.includes('tổ trưởng')) return 'Senior';
  if (t.includes('lead') || t.includes('trưởng nhóm') || t.includes('team lead') || t.includes('leader')) return 'Lead';
  if (t.includes('manager') || t.includes('quản lý') || t.includes('trưởng phòng') || t.includes('head') || t.includes('supervisor')) return 'Manager';
  if (t.includes('principal') || t.includes('fellow') || t.includes('staff engineer')) return 'Principal';
  if (t.includes('middle') || t.includes('mid-level') || t.includes('vững') || t.includes('mid ')) return 'Middle';
  if (t.includes('junior') || t.includes('jr.') || t.includes('jr ') || t.includes('nhân viên')) return 'Junior';
  if (t.includes('expert') || t.includes('chuyên gia')) return 'Expert';
  if (t.includes('architect') || t.includes('kiến trúc sư')) return 'Architect';
  if (t.includes('director') || t.includes('giám đốc')) return 'Director';
  if (t.includes('cto') || t.includes('vp') || t.includes('chief')) return 'Executive';

  return 'unknown';
}

export function mapExperienceToLevel(expStr: string, currentLevel: string = 'unknown'): string {
  if (currentLevel !== 'unknown') return currentLevel;

  const exp = expStr.toLowerCase();
  
  // Handle specific years
  const yearMatch = exp.match(/(\d+)\s*(năm|year)/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    if (years === 0) return 'Fresher';
    if (years <= 1) return 'Junior';
    if (years <= 4) return 'Middle';
    if (years >= 5) return 'Senior';
  }

  if (exp.includes('không yêu cầu') || exp.includes('no experience')) return 'Fresher/Junior';
  if (exp.includes('dưới 1 năm')) return 'Junior';
  if (exp.includes('trên 5 năm')) return 'Senior';

  return 'unknown';
}

export function refineLevel(title: string, expStr: string = ''): string {
  const titleLevel = extractLevelFromTitle(title);
  if (titleLevel !== 'unknown') return titleLevel;
  
  return mapExperienceToLevel(expStr);
}
