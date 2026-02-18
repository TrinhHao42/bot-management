/**
 * Check if the given string contains any of the senior level keywords.
 */
function containsSeniorKeywords(text: string): boolean {
  const normalized = text.toLowerCase();
  const seniorKeywords = ['senior', 'lead', 'manager', 'head', 'director', 'sr', 'sr.'];
  return seniorKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Check if the given string contains valid junior/middle keywords.
 * Or if it lacks senior keywords and generally appears to be entry-to-middle level.
 */
function isAllowedLevel(title: string, description?: string): boolean {
  if (containsSeniorKeywords(title)) return false;
  if (description && containsSeniorKeywords(description)) return false;

  // Ideally, if it doesn't contain senior keywords, we might allow it.
  // But stricter rule: Filter for Intern, Fresher, Junior, and Middle levels only.
  const allowed = ['intern', 'fresher', 'junior', 'middle', 'jr', 'mid'];
  const titleLower = title.toLowerCase();
  
  // If it explicitly has an allowed keyword, it's good (provided it has no senior keywords).
  if (allowed.some(keyword => titleLower.includes(keyword))) {
    return true;
  }

  // If there are no clear keywords, we might default to allow if it's generally safe, 
  // but to be perfectly strict to the prompt:
  // "Strict Logic: Filter for Intern, Fresher, Junior, and Middle levels only. Automatically discard any senior/lead roles."
  
  // We'll allow it if there are no senior keywords, but typically titles without level mean "middle/general".
  return true;
}

export const filterUtils = {
  isAllowedLevel,
  containsSeniorKeywords,
};
