/**
 * testResumeImport.js
 * Verification and test suite for AI Resume Import and Profile Vault Integration.
 */

const assert = require('assert');
const fieldMapper = require('../services/fieldMapper.service');
const resumeParser = require('../services/resumeParser.service');

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AI RESUME IMPORT TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Normalization Tests
  console.log('--- 1. Field Normalization Tests ---');

  test('normalizeCGPA: removes "/ 10" and text', () => {
    assert.strictEqual(fieldMapper.normalizeCGPA('8.6 / 10'), '8.6');
    assert.strictEqual(fieldMapper.normalizeCGPA('9.2 CGPA'), '9.2');
    assert.strictEqual(fieldMapper.normalizeCGPA('7.8'), '7.8');
    assert.strictEqual(fieldMapper.normalizeCGPA('8.45/10'), '8.45');
  });

  test('normalizePercentage: cleans percentage symbols', () => {
    assert.strictEqual(fieldMapper.normalizePercentage('88.5%'), '88.5');
    assert.strictEqual(fieldMapper.normalizePercentage('92.0 %'), '92.0');
    assert.strictEqual(fieldMapper.normalizePercentage('75'), '75');
  });

  test('normalizeUrl: prepends https:// if missing', () => {
    assert.strictEqual(fieldMapper.normalizeUrl('linkedin.com/in/nikhil'), 'https://linkedin.com/in/nikhil');
    assert.strictEqual(fieldMapper.normalizeUrl('github.com/nikhil'), 'https://github.com/nikhil');
    assert.strictEqual(fieldMapper.normalizeUrl('https://portfolio.me'), 'https://portfolio.me');
  });

  test('normalizePhone: cleans spaces and preserves country code', () => {
    const res = fieldMapper.normalizePhone('+91 98765 43210');
    assert.strictEqual(res.replace(/\s/g, ''), '+919876543210');
  });

  test('normalizeSkills: deduplicates and cleans skill list', () => {
    const raw = ['Python', 'Java', 'python', 'SQL', 'React', 'JAVA'];
    const res = fieldMapper.normalizeSkills(raw);
    assert.strictEqual(res, 'Python, Java, SQL, React');
  });

  test('normalizePassingYear: extracts 4-digit graduation year', () => {
    assert.strictEqual(fieldMapper.normalizePassingYear('2026'), '2026');
    assert.strictEqual(fieldMapper.normalizePassingYear('Batch of 2025'), '2025');
  });

  // 2. Semantic Field Mapping Tests
  console.log('\n--- 2. Semantic Field Mapping Tests ---');

  test('mapToStandardField: maps Location/City synonyms to currentCity', () => {
    const match1 = fieldMapper.mapToStandardField('Current Location');
    assert.strictEqual(match1?.fieldId, 'currentCity');

    const match2 = fieldMapper.mapToStandardField('Where do you live?');
    assert.strictEqual(match2?.fieldId, 'currentCity');

    const match3 = fieldMapper.mapToStandardField('City');
    assert.strictEqual(match3?.fieldId, 'currentCity');
  });

  test('mapToStandardField: maps GitHub Profile synonyms to githubLink', () => {
    const match1 = fieldMapper.mapToStandardField('GitHub Profile');
    assert.strictEqual(match1?.fieldId, 'githubLink');

    const match2 = fieldMapper.mapToStandardField('GitHub URL');
    assert.strictEqual(match2?.fieldId, 'githubLink');
  });

  test('mapToStandardField: maps College / University to collegeName', () => {
    const match = fieldMapper.mapToStandardField('College / University');
    assert.strictEqual(match?.fieldId, 'collegeName');
  });

  test('mapToStandardField: maps CGPA to cgpa', () => {
    const match = fieldMapper.mapToStandardField('Cumulative GPA');
    assert.strictEqual(match?.fieldId, 'cgpa');
  });

  // 3. Fallback Extraction & Resume Content Parsing
  console.log('\n--- 3. Resume Text Extraction & Fallback Parser Tests ---');

  const sampleResumeText = `
Nikhil Puppalwar
Pune, Maharashtra | nikhil.puppalwar@example.com | +91 9876543210
linkedin.com/in/nikhil-puppalwar | github.com/nikhilpuppalwar | leetcode.com/nikhil

EDUCATION
Pimpri Chinchwad College of Engineering (PCCOE), Pune
Bachelor of Technology in Computer Engineering (2023 - 2027)
CGPA: 8.6 / 10 | 12th HSC: 89.2% | 10th SSC: 92.4%

TECHNICAL SKILLS
Languages: Python, Java, JavaScript, C++, SQL
Frameworks: React, Node.js, Express, MongoDB, Tailwind
Tools & Platforms: Git, Docker, AWS, Linux, VS Code

EXPERIENCE
Full Stack Intern at TechCorp (June 2025 - August 2025)
- Developed RESTful microservices and optimized database queries by 35%.

PROJECTS
OppTrack Clinical Placement Platform
- Built end-to-end full-stack portal with AI autofill and deadline tracking.
`;

  test('deterministicFallbackExtract: extracts candidate personal, academic and skills details', () => {
    const result = resumeParser.deterministicFallbackExtract(sampleResumeText);
    assert.ok(result.fields.length >= 6, 'Should extract at least 6 fields');

    const name = result.fields.find(f => f.id === 'candidateName');
    assert.ok(name && name.value.includes('Nikhil'), 'Candidate name should be extracted');

    const email = result.fields.find(f => f.id === 'personalEmail');
    assert.strictEqual(email?.value, 'nikhil.puppalwar@example.com');

    const cgpa = result.fields.find(f => f.id === 'cgpa');
    assert.strictEqual(cgpa?.value, '8.6');

    const github = result.fields.find(f => f.id === 'githubLink');
    assert.strictEqual(github?.value, 'https://github.com/nikhilpuppalwar');

    const skills = result.fields.find(f => f.id === 'technicalSkills');
    assert.ok(skills && skills.value.includes('Python') && skills.value.includes('React'), 'Skills extracted');
  });

  // 4. Vault Diff Analysis Tests
  console.log('\n--- 4. Profile Vault Diff Analysis (NEW, UPDATED, IDENTICAL, CONFLICT) ---');

  test('processAndDiffResumeFields: correctly detects NEW, UPDATED, IDENTICAL, CONFLICT', () => {
    const mockProfile = {
      candidateName: 'Nikhil Puppalwar', // IDENTICAL
      personalEmail: 'old.email@example.com', // UPDATED
      cgpa: '6.5', // CONFLICT (diff > 1.5)
      fields: [
        { id: 'technicalSkills', label: 'Skills', value: 'C++, Python' } // APPEND / MERGE
      ]
    };

    const extracted = [
      { id: 'candidateName', label: 'Full Name', value: 'Nikhil Puppalwar', confidence: 0.99 },
      { id: 'personalEmail', label: 'Personal Email', value: 'nikhil.puppalwar@example.com', confidence: 0.98 },
      { id: 'cgpa', label: 'CGPA', value: '8.6', confidence: 0.95 },
      { id: 'currentCity', label: 'Current City', value: 'Pune', confidence: 0.90 }, // NEW
      { id: 'technicalSkills', label: 'Skills', value: 'Python, React, Node.js', confidence: 0.92 } // APPEND
    ];

    const diff = resumeParser.processAndDiffResumeFields(extracted, mockProfile);

    const nameDiff = diff.find(d => d.fieldId === 'candidateName');
    assert.strictEqual(nameDiff?.status, 'identical');
    assert.strictEqual(nameDiff?.action, 'keep');

    const emailDiff = diff.find(d => d.fieldId === 'personalEmail');
    assert.strictEqual(emailDiff?.status, 'updated');
    assert.strictEqual(emailDiff?.action, 'accept');

    const cgpaDiff = diff.find(d => d.fieldId === 'cgpa');
    assert.strictEqual(cgpaDiff?.status, 'conflict');

    const cityDiff = diff.find(d => d.fieldId === 'currentCity');
    assert.strictEqual(cityDiff?.status, 'new');
    assert.strictEqual(cityDiff?.action, 'accept');

    const skillsDiff = diff.find(d => d.fieldId === 'technicalSkills');
    assert.strictEqual(skillsDiff?.action, 'append');
  });

  // 5. File Validation & Security Tests
  console.log('\n--- 5. File Validation & Security Tests ---');

  await testAsync('extractResumeText: rejects unsupported file types', async () => {
    let threw = false;
    try {
      await resumeParser.extractResumeText({
        buffer: Buffer.from('console.log("hello")'),
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload'
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('Unsupported file type'), 'Should flag unsupported file type');
    }
    assert.ok(threw, 'Should have thrown error on .exe');
  });

  await testAsync('extractResumeText: rejects empty file buffer', async () => {
    let threw = false;
    try {
      await resumeParser.extractResumeText({
        buffer: Buffer.alloc(0),
        originalname: 'resume.pdf',
        mimetype: 'application/pdf'
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('empty'), 'Should reject empty buffer');
    }
    assert.ok(threw, 'Should have thrown error on empty buffer');
  });

  await testAsync('extractResumeText: rejects oversized file (>10MB)', async () => {
    let threw = false;
    try {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await resumeParser.extractResumeText({
        buffer: largeBuffer,
        originalname: 'resume.pdf',
        mimetype: 'application/pdf'
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('10MB'), 'Should reject >10MB file');
    }
    assert.ok(threw, 'Should have thrown error on oversized file');
  });

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
