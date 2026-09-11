# Mocks and Stubs - Detailed Patterns

## Understanding the Difference

### Stubs: Fake Input Dependencies

Stubs replace **incoming** dependencies - they provide data or behavior that your code needs to function.

**Key characteristics:**
- Simulate return values
- Replace configuration services, data providers
- Never verify if called (that's implementation detail)
- Multiple stubs per test is fine

```typescript
// Stub example: fake configuration
const stubConfig = {
  getLogLevel: () => 'debug',
  getMaxRetries: () => 3,
};

test('logger uses configured level', () => {
  const logger = new Logger(stubConfig);
  // We test the RESULT, not that getLogLevel was called
  expect(logger.level).toBe('debug');
});
```

### Mocks: Verify Output Dependencies

Mocks replace **outgoing** dependencies - they verify that your code correctly interacts with external systems.

**Key characteristics:**
- Verify method calls and arguments
- Replace loggers, notification services, external APIs
- Usually ONE mock per test (one requirement per test)
- The assertion is on the mock itself

```typescript
// Mock example: verify logging
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

test('password verifier logs success', () => {
  const verifier = new PasswordVerifier(mockLogger);

  verifier.verify('ValidPass123');

  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.stringContaining('PASSED')
  );
});
```

## Injection Patterns

### 1. Parameter Injection (Simplest)

```typescript
// Production code
const verifyPassword = (password: string, logger: Logger) => {
  if (isValid(password)) {
    logger.info('Password valid');
    return true;
  }
  return false;
};

// Test
test('logs when password is valid', () => {
  const mockLogger = { info: jest.fn(), error: jest.fn() };

  verifyPassword('Valid123', mockLogger);

  expect(mockLogger.info).toHaveBeenCalled();
});
```

### 2. Factory Function Injection

```typescript
// Production code
const makePasswordVerifier = (getLogger = () => realLogger) => {
  return {
    verify: (password: string) => {
      const logger = getLogger();
      // ... use logger
    }
  };
};

// Test
test('uses injected logger', () => {
  const mockLogger = { info: jest.fn() };
  const verifier = makePasswordVerifier(() => mockLogger);

  verifier.verify('test');

  expect(mockLogger.info).toHaveBeenCalled();
});
```

### 3. Constructor Injection (OOP)

```typescript
// Production code
class PasswordVerifier {
  constructor(private logger: Logger) {}

  verify(password: string) {
    this.logger.info('Verifying...');
    // ...
  }
}

// Test
test('verifier logs during verification', () => {
  const mockLogger = { info: jest.fn(), error: jest.fn() };
  const verifier = new PasswordVerifier(mockLogger);

  verifier.verify('test');

  expect(mockLogger.info).toHaveBeenCalledWith('Verifying...');
});
```

### 4. Module Mocking (Jest)

Use when you can't modify the production code:

```typescript
// Production code (unchanged)
import { logger } from './logger';

export const verifyPassword = (password: string) => {
  logger.info('Verifying...');
  // ...
};

// Test
jest.mock('./logger');
import { logger } from './logger';
import { verifyPassword } from './verifier';

test('logs during verification', () => {
  verifyPassword('test');

  expect(logger.info).toHaveBeenCalledWith('Verifying...');
});
```

## Common Mistakes

### 1. Verifying Stub Calls (Anti-pattern)

```typescript
// BAD - verifying a stub (implementation detail)
const stubConfig = { getValue: jest.fn().mockReturnValue(5) };
calculator.compute();
expect(stubConfig.getValue).toHaveBeenCalled(); // Don't do this!

// GOOD - verify the result instead
const stubConfig = { getValue: () => 5 };
const result = calculator.compute();
expect(result).toBe(10);
```

### 2. Multiple Mocks Per Test

```typescript
// BAD - testing multiple requirements
test('password verification', () => {
  const mockLogger = { info: jest.fn() };
  const mockNotifier = { send: jest.fn() };

  verifier.verify('test');

  expect(mockLogger.info).toHaveBeenCalled();
  expect(mockNotifier.send).toHaveBeenCalled(); // Second mock!
});

// GOOD - separate tests for each requirement
test('logs verification attempt', () => {
  const mockLogger = { info: jest.fn() };
  verifier.verify('test');
  expect(mockLogger.info).toHaveBeenCalled();
});

test('sends notification on verification', () => {
  const mockNotifier = { send: jest.fn() };
  verifier.verify('test');
  expect(mockNotifier.send).toHaveBeenCalled();
});
```

### 3. Over-Specifying Mock Expectations

```typescript
// BAD - too specific, brittle
expect(mockLogger.info).toHaveBeenCalledWith(
  'Password verification started at 2024-01-15 10:30:00 for user john@example.com'
);

// GOOD - focus on essential content
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.stringContaining('verification')
);
```

## Jest Mock Utilities

### Creating Mocks

```typescript
// Simple mock function
const mockFn = jest.fn();
mockFn.mockReturnValue(42);

// Mock with implementation
const mockFn = jest.fn((x) => x * 2);

// Mock module
jest.mock('./module', () => ({
  functionA: jest.fn(),
  functionB: jest.fn().mockReturnValue('mocked'),
}));
```

### Resetting Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clears call history
  // OR
  jest.resetAllMocks(); // Clears history + return values
});
```

### Assertion Matchers

```typescript
// Called at all
expect(mock).toHaveBeenCalled();

// Called specific times
expect(mock).toHaveBeenCalledTimes(2);

// Called with specific args
expect(mock).toHaveBeenCalledWith('arg1', 'arg2');

// Partial matching
expect(mock).toHaveBeenCalledWith(
  expect.objectContaining({ key: 'value' })
);

// Last call
expect(mock).toHaveBeenLastCalledWith('final');
```

## Partial Mocks (Extract and Override)

When you need to mock only part of a class:

```typescript
// Production code
class RealLogger {
  info(msg: string) { /* real implementation */ }
  error(msg: string) { /* real implementation */ }
  debug(msg: string) { /* real implementation */ }
}

// Test - override only what you need
class TestableLogger extends RealLogger {
  logged: string[] = [];

  info(msg: string) {
    this.logged.push(msg);
  }
  // error() and debug() remain real
}

test('logs info messages', () => {
  const logger = new TestableLogger();
  verifier.setLogger(logger);

  verifier.verify('test');

  expect(logger.logged).toContain('verification');
});
```

## Guidelines Summary

| Guideline | Rationale |
|-----------|-----------|
| Prefer stubs over mocks | Less coupling to implementation |
| One mock per test | One requirement per test |
| Don't verify stub calls | Stubs are input, not output |
| Use partial matching | More resilient to changes |
| Reset between tests | Prevent test pollution |
| Inject dependencies | Makes testing possible |
