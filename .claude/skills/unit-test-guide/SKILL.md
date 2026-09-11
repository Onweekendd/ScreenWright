---
name: unit-test-guide
description: |
  Guide for writing excellent unit tests based on "The Art of Unit Testing" principles.
  Use this skill when: (1) Writing new unit tests, (2) Reviewing test code quality,
  (3) Refactoring existing tests, (4) Designing testable code, (5) Setting up test
  structure and organization. Covers test naming (USE pattern), AAA pattern, mocks vs
  stubs, the three pillars (trustworthiness, maintainability, readability), avoiding
  test logic, handling async code, and common anti-patterns.
---

# Unit Test Guide

Guide for writing excellent unit tests based on "The Art of Unit Testing" principles.

## Core Concepts

### Three Pillars of Good Tests

Every test must have these three properties:

1. **Trustworthiness** - Tests should fail only when there's a real bug. No false positives.
2. **Maintainability** - Tests shouldn't require frequent changes for minor production code updates.
3. **Readability** - Anyone should understand what's being tested just by reading the test.

### Entry Points and Exit Points

- **Entry Point**: The function/method you call to trigger the work unit
- **Exit Points** (3 types):
  1. **Return value** - The function returns something
  2. **State change** - Observable state modification
  3. **Third-party call** - Calling external dependencies (use mocks)

## Test Structure

### AAA Pattern (Arrange-Act-Assert)

```typescript
test('verifyPassword, given failing rule, returns errors', () => {
  // Arrange - setup inputs and dependencies
  const fakeRule = () => ({ passed: false, reason: 'too short' });

  // Act - call the entry point
  const errors = verifyPassword('abc', [fakeRule]);

  // Assert - check the exit point
  expect(errors[0]).toContain('too short');
});
```

### USE Naming Convention

Test names should include three parts:
- **U**nit under test - What function/class is being tested
- **S**cenario - The input or condition
- **E**xpected result - The expected behavior

```typescript
// Good: All three parts present
test('verifyPassword, given failing rule, returns errors', () => {});

// Bad: Missing context
test('it works', () => {});
```

### Structured with describe/it

```typescript
describe('PasswordVerifier', () => {
  describe('with a failing rule', () => {
    it('returns errors containing the rule reason', () => {
      // test code
    });

    it('returns exactly one error', () => {
      // test code
    });
  });
});
```

## Mocks vs Stubs

### When to Use Each

| Type | Purpose | Verify? |
|------|---------|---------|
| **Stub** | Provide fake input data | NO |
| **Mock** | Verify output interactions | YES |

### Key Rules

- Use **stubs** for input dependencies (data coming IN)
- Use **mocks** for output dependencies (calls going OUT)
- Only ONE mock per test (testing one requirement)
- Multiple stubs per test is OK
- Never verify calls on stubs - that's implementation detail

```typescript
// Stub example - fake input
const fakeConfig = { getLogLevel: () => 'info' };

// Mock example - verify output
const mockLogger = { info: jest.fn() };
// ... later
expect(mockLogger.info).toHaveBeenCalledWith('message');
```

## Anti-Patterns to Avoid

### 1. Logic in Tests

Never use these in tests:
- `if/else` statements
- `for/while` loops
- `try/catch` blocks
- String concatenation in assertions

```typescript
// BAD - logic duplicates production code
expect(result).toBe("hello" + name);

// GOOD - hardcoded expected value
expect(result).toBe("hello abc");
```

### 2. Multiple Asserts on Different Concerns

```typescript
// BAD - tests multiple things
test('login works', () => {
  expect(result.token).toBeDefined();
  expect(result.user.name).toBe('John');
  expect(loggerMock).toHaveBeenCalled();
});

// GOOD - one concern per test
test('login returns token', () => {
  expect(result.token).toBeDefined();
});
```

### 3. Overusing beforeEach

Causes "scroll fatigue" - reader must scroll to understand test context.

```typescript
// BAD - state scattered across beforeEach
describe('tests', () => {
  let verifier, errors;
  beforeEach(() => { /* setup hidden here */ });

  it('does something', () => {
    // Where does verifier come from?
  });
});

// GOOD - factory functions keep context visible
const makeVerifier = () => new PasswordVerifier();

it('does something', () => {
  const verifier = makeVerifier();
  // Clear where verifier comes from
});
```

### 4. Testing Implementation Details

```typescript
// BAD - testing internal state
expect(calculator._lastResult).toBe(5);

// GOOD - testing public behavior
expect(calculator.getResult()).toBe(5);
```

## Writing Maintainable Tests

### Use Factory Functions

```typescript
const makeVerifier = () => new PasswordVerifier();
const makeFailingRule = (reason: string) =>
  () => ({ passed: false, reason });
const makePassingRule = () =>
  () => ({ passed: true, reason: '' });

test('with failing rule, returns error', () => {
  const verifier = makeVerifier();
  verifier.addRule(makeFailingRule('too short'));

  const errors = verifier.verify('abc');

  expect(errors[0]).toContain('too short');
});
```

### Use Partial String Matching

```typescript
// BAD - brittle to formatting changes
expect(error).toBe('Error: password too short');

// GOOD - focuses on essential content
expect(error).toContain('too short');
```

### Parameterized Tests

```typescript
describe('uppercase rule', () => {
  test.each([
    ['Abc', true],
    ['aBc', true],
    ['abc', false],
  ])('given %s, returns %s', (input, expected) => {
    const result = hasUppercase(input);
    expect(result).toBe(expected);
  });
});
```

## Async Testing

### Prefer async/await Over Callbacks

```typescript
// BAD - callback style, harder to read
test('fetches data', (done) => {
  fetchData().then((result) => {
    expect(result).toBe('data');
    done();
  });
});

// GOOD - async/await, follows AAA pattern
test('fetches data', async () => {
  const result = await fetchData();
  expect(result).toBe('data');
});
```

### Extract Entry Points for Pure Logic

When testing async code, extract the pure logic into separate testable functions:

```typescript
// Production code
const processResponse = (text: string) => {
  return text.includes('success')
    ? { status: 'ok' }
    : { status: 'error' };
};

// Test the pure function separately
test('processResponse with success text returns ok', () => {
  expect(processResponse('success!')).toEqual({ status: 'ok' });
});
```

## Test File Organization

### Naming Convention

- `*.test.ts` or `*.spec.ts`
- Place next to source file OR in `__tests__` folder
- Be consistent across project

### Structure Template

```typescript
// 1. Imports
import { functionUnderTest } from './module';

// 2. Factory functions (if needed)
const makeTestData = () => ({ /* ... */ });

// 3. Tests organized by unit
describe('functionUnderTest', () => {
  describe('scenario 1', () => {
    it('expected behavior', () => {});
  });

  describe('scenario 2', () => {
    it('expected behavior', () => {});
  });
});
```

## Quick Checklist

Before committing tests, verify:

- [ ] Test name follows USE pattern (Unit, Scenario, Expected)
- [ ] Test follows AAA pattern with clear sections
- [ ] No logic (if/for/try) in test code
- [ ] Assertions use hardcoded expected values
- [ ] Only one mock per test (stubs are OK)
- [ ] No verification of stub calls
- [ ] Factory functions used for repeated setup
- [ ] Each test is independent (no shared mutable state)
- [ ] Test fails when it should (introduce a bug to verify)

## References

For detailed patterns and examples:
- [Mocks and Stubs patterns](references/mocks-stubs.md)
- [Common anti-patterns](references/anti-patterns.md)
