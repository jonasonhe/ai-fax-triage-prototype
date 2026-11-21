/*
 * Sample data. Every patient, clinic, and chart number here is fictional.
 * Do not replace with real patient information.
 */
(function (root) {
  const SAMPLE_FAXES = [
    {
      id: 'f1',
      received: '09:14',
      source: 'Northside Family Clinic',
      docType: 'Lab result',
      docConfidence: 97,
      pages: 2,
      candidates: [
        { id: 'c1', name: 'Alex Sample', dob: '1985-03-14', chart: '10432', score: 100,
          signals: { name: 'match', dob: 'match', phone: 'match' } },
      ],
      extracted: {
        name: 'Alex Sample', dob: '1985-03-14', phone: '(604) 555-0101',
        docType: 'Lab result', date: '2026-11-18', referring: 'Dr. R. Sample',
        reason: 'CBC with differential', urgency: 'Routine', queue: 'Lab results',
      },
    },
    {
      id: 'f2',
      received: '09:02',
      source: 'Riverview Orthopedics',
      docType: 'Referral',
      docConfidence: 91,
      pages: 3,
      candidates: [
        { id: 'c2', name: 'Taylor Sample', dob: '1979-07-02', chart: '11873', score: 100,
          signals: { name: 'match', dob: 'match', phone: 'match' } },
      ],
      extracted: {
        name: 'Taylor Sample', dob: '1979-07-02', phone: '(604) 555-0144',
        docType: 'Referral', date: '2026-11-18', referring: 'Dr. M. Patel',
        reason: 'Knee pain, MRI review', urgency: 'Routine', queue: 'Referrals',
      },
    },
    {
      id: 'f3',
      received: '08:47',
      source: 'Harbour Cardiology',
      docType: 'Referral',
      docConfidence: 88,
      pages: 3,
      candidates: [
        { id: 'c3', name: 'Jordan Test', dob: '1984-06-02', chart: '20817', score: 88,
          signals: { name: 'match', dob: 'match', phone: 'differs' } },
        { id: 'c4', name: 'Jordan Tessier', dob: '1984-06-20', chart: '19044', score: 81,
          signals: { name: 'close', dob: 'differs', phone: 'match' } },
      ],
      extracted: {
        name: 'Jordan Test', dob: '1984-06-02', phone: '(604) 555-0132',
        docType: 'Referral', date: '2026-11-19', referring: 'Dr. R. Lee',
        reason: 'Palpitations, ECG review', urgency: 'Routine', queue: 'Cardiology triage',
      },
    },
    {
      id: 'f4',
      received: '08:31',
      source: 'Eastside Pediatrics',
      docType: 'Consult note',
      docConfidence: 93,
      pages: 1,
      candidates: [],
      extracted: {
        name: 'Morgan Example', dob: '1990-01-30', phone: '(604) 555-0188',
        docType: 'Consult note', date: '2026-11-17', referring: 'Dr. K. Thompson',
        reason: 'Follow-up visit', urgency: 'Routine', queue: 'Pediatrics',
      },
    },
    {
      id: 'f5',
      received: '08:05',
      source: 'Downtown Imaging',
      docType: 'Imaging report',
      docConfidence: 95,
      pages: 1,
      candidates: [
        { id: 'c5', name: 'Casey Sample', dob: '1968-11-09', chart: '15502', score: 100,
          signals: { name: 'match', dob: 'match', phone: 'match' } },
      ],
      extracted: {
        name: 'Casey Sample', dob: '1968-11-09', phone: '(604) 555-0166',
        docType: 'Imaging report', date: '2026-11-16', referring: 'Dr. S. Okafor',
        reason: 'Chest X-ray', urgency: 'Routine', queue: 'Imaging',
      },
    },
  ];

  const api = { SAMPLE_FAXES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TriageData = api;
})(typeof window !== 'undefined' ? window : globalThis);
