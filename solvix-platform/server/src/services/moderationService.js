/**
 * Automated Content Moderation Engine
 * Matches Synopsis Flowchart: "Post Problem Anonymous -> Passes Moderation? -> Store in Knowledge Base"
 */

const BLOCKED_TERMS = [
  'spam', 'scam', 'phishing', 'malware', 'ddos', 'keylogger',
  'buy cheap', 'click here for free', 'hate speech', 'kill yourself'
];

function moderateContent({ title = '', description = '', content = '' }) {
  const combined = `${title} ${description} ${content}`.trim();

  if (combined.length < 12) {
    return {
      passed: false,
      reason: 'Content is too short. Please provide meaningful details so others can help.'
    };
  }

  const lower = combined.toLowerCase();
  const matched = BLOCKED_TERMS.find((term) => lower.includes(term));
  if (matched) {
    return {
      passed: false,
      reason: `Moderation alert: Prohibited or unsafe term detected ("${matched}"). Please revise.`
    };
  }

  // Check excessive repetitive spam characters
  if (/(.)\1{12,}/.test(combined)) {
    return {
      passed: false,
      reason: 'Moderation alert: Repetitive character spam detected.'
    };
  }

  return { passed: true, reason: 'Approved by Solvix Automated Moderation' };
}

module.exports = { moderateContent };
