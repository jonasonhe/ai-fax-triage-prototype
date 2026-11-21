/*
 * Routing rules for incoming faxes.
 *
 * Rule: a fax is auto-filed to the EMR only when its patient match is 100%
 * and there is exactly one candidate chart. Everything else goes to manual
 * triage, where a staff member confirms the patient, checks the fields, and
 * pushes the fax to the EMR.
 *
 * Document-type confidence does not gate auto-filing. This is an open
 * product question; see README.
 */
(function (root) {
  const AUTO_FILE_MATCH_THRESHOLD = 100;

  function topCandidate(fax) {
    if (!fax.candidates || fax.candidates.length === 0) return null;
    return fax.candidates.slice().sort((a, b) => b.score - a.score)[0];
  }

  function decideRoute(fax) {
    const top = topCandidate(fax);
    if (!top) {
      return { route: 'triage', reason: 'No patient match found. Triage to find or create a chart.' };
    }
    if (top.score === AUTO_FILE_MATCH_THRESHOLD && fax.candidates.length === 1) {
      return { route: 'auto', reason: 'Patient match is 100%.' };
    }
    return {
      route: 'triage',
      reason: `Patient match is ${top.score}%. Auto-file requires ${AUTO_FILE_MATCH_THRESHOLD}%.`,
    };
  }

  const api = { AUTO_FILE_MATCH_THRESHOLD, topCandidate, decideRoute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TriageRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
