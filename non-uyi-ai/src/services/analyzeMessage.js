// Integration point for Sardor + Firdavs + Behruz.
// Replace this body with the Gemini call and parser; see README.md for the contract.
export default async function analyzeMessage(_message, _options = {}) {
  throw Object.assign(new Error('Gemini API hali ulanmagan. Demo rejimidan foydalaning.'), {
    code: 'NOT_CONFIGURED',
  });
}
