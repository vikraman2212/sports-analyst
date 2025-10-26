/**
 * Contract Test: Analysis Session OpenAPI Specification
 * 
 * This test validates that the OpenAPI YAML file exists and has the expected
 * structure for the future backend API. Since the backend is deferred for the
 * prototype phase, this test ensures the contract file is valid YAML and
 * contains the minimum expected OpenAPI structure.
 * 
 * Expected to PASS (validates placeholder file structure).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Analysis Session OpenAPI Contract', () => {
  const contractPath = path.join(
    process.cwd(),
    '..',
    'specs',
    'speed-001-cricket-ball-tracking',
    'contracts',
    'analysis-session.openapi.yaml'
  );

  it('should have analysis-session.openapi.yaml file', () => {
    expect(fs.existsSync(contractPath)).toBe(true);
  });

  it('should be valid YAML', () => {
    const fileContent = fs.readFileSync(contractPath, 'utf8');
    expect(() => yaml.load(fileContent)).not.toThrow();
  });

  it('should be a valid OpenAPI 3.x specification', () => {
    const fileContent = fs.readFileSync(contractPath, 'utf8');
    const spec = yaml.load(fileContent) as any;

    // Validate OpenAPI version
    expect(spec).toHaveProperty('openapi');
    expect(spec.openapi).toMatch(/^3\./); // OpenAPI 3.x

    // Validate info section
    expect(spec).toHaveProperty('info');
    expect(spec.info).toHaveProperty('title');
    expect(spec.info).toHaveProperty('version');
  });

  it('should have paths defined (even if deferred)', () => {
    const fileContent = fs.readFileSync(contractPath, 'utf8');
    const spec = yaml.load(fileContent) as any;

    expect(spec).toHaveProperty('paths');
    expect(typeof spec.paths).toBe('object');
  });

  it('should document future backend API endpoints', () => {
    const fileContent = fs.readFileSync(contractPath, 'utf8');
    const spec = yaml.load(fileContent) as any;

    // For now, we just check that paths is an object
    // Future: validate specific endpoints like /api/analysis/sessions
    expect(spec.paths).toBeDefined();
    
    // The spec may be minimal/placeholder for prototype phase
    // This test ensures the structure exists for future expansion
  });

  it('should include info description explaining deferral status', () => {
    const fileContent = fs.readFileSync(contractPath, 'utf8');
    const spec = yaml.load(fileContent) as any;

    expect(spec.info).toHaveProperty('description');
    expect(typeof spec.info.description).toBe('string');
    
    // Should mention that this is a placeholder/deferred
    const description = spec.info.description.toLowerCase();
    expect(
      description.includes('deferred') || 
      description.includes('placeholder') ||
      description.includes('future')
    ).toBe(true);
  });
});
