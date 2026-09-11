# Unit Test Anti-Patterns

Common mistakes that make tests untrustworthy, unmaintainable, or unreadable.

## Trust-Breaking Anti-Patterns

### 1. Logic in Tests

When tests contain logic, they can have bugs just like production code.

```typescript
// BAD - test logic mirrors production logic
test('greeting is correct', () => {
  const name = 'Alice';
  const result = makeGreeting(name);
  expect(result).toBe('Hello ' + name); // Bug: missing space matches!
});

// GOOD - hardcoded expected value
test('greeting is correct', () => {
  const result = makeGreeting('Alice');
  expect(result).toBe('Hello Alice');
});
```

**Why it's bad:** If the algorithm has a bug, the test will have the same bug and still pass.

### 2. Dynamic Expected Values

```typescript
// BAD - expected value calculated
test('calculates total', () => {
  const items = [10, 20, 30];
  const expected = items.reduce((a, b) => a + b, 0);
  expect(calculateTotal(items)).toBe(expected);
});

// GOOD - hardcoded expected value
test('calculates total', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60);
});
```

### 3. Tests Without Assertions

```typescript
// BAD - no assertion, always passes
test('processes data', () => {
  const result = processData(input);
  console.log(result); // Not an assertion!
});

// GOOD - explicit assertion
test('processes data', () => {
  const result = processData(input);
  expect(result.status).toBe('completed');
});
```

### 4. Never Seeing Test Fail

```typescript
// How to verify: intentionally break production code
const calculateTotal = (items) => {
  // return items.reduce((a, b) => a + b, 0);
  return 0; // Intentional bug
};

// If test still passes, the test is broken!
```

## Maintainability Anti-Patterns

### 5. beforeEach Abuse (Scroll Fatigue)

```typescript
// BAD - context scattered across file
describe('UserService', () => {
  let service, mockDb, mockLogger, user;

  beforeEach(() => {
    mockDb = createMockDb();
    mockLogger = createMockLogger();
    user = createTestUser();
    service = new UserService(mockDb, mockLogger);
  });

  // ... 200 lines later ...

  it('saves user', () => {
    service.save(user); // Where did 'user' come from?
    // Reader must scroll up to understand
  });
});

// GOOD - factory functions, context visible
const makeUserService = () => {
  const mockDb = createMockDb();
  return new UserService(mockDb);
};

it('saves user', () => {
  const service = makeUserService();
  const user = { name: 'Alice', email: 'alice@test.com' };

  service.save(user);

  expect(service.findByEmail('alice@test.com')).toBeDefined();
});
```

### 6. Shared Mutable State

```typescript
// BAD - tests can interfere with each other
let counter = 0;

test('first test', () => {
  counter++;
  expect(counter).toBe(1);
});

test('second test', () => {
  counter++;
  expect(counter).toBe(1); // FAILS! counter is 2
});

// GOOD - each test creates its own state
test('first test', () => {
  let counter = 0;
  counter++;
  expect(counter).toBe(1);
});
```

### 7. Testing Implementation Details

```typescript
// BAD - testing private/internal state
test('adds item to cart', () => {
  cart.add(item);
  expect(cart._items.length).toBe(1); // Private property!
  expect(cart._lastModified).toBeDefined(); // Implementation detail
});

// GOOD - testing public behavior
test('adds item to cart', () => {
  cart.add(item);
  expect(cart.getItems()).toHaveLength(1);
  expect(cart.contains(item)).toBe(true);
});
```

### 8. Overspecified Tests

```typescript
// BAD - breaks on any small change
test('formats message', () => {
  expect(formatMessage('Hi')).toBe('Message: Hi\n');
});

// GOOD - flexible matching
test('formats message', () => {
  expect(formatMessage('Hi')).toContain('Hi');
});
```

## Readability Anti-Patterns

### 9. Poor Test Names

```typescript
// BAD
test('test1', () => {});
test('it works', () => {});
test('should work correctly', () => {});

// GOOD - USE pattern (Unit, Scenario, Expected)
test('calculateTotal, given empty cart, returns zero', () => {});
test('UserService.save, when user exists, updates record', () => {});
```

### 10. Assertion Roulette

```typescript
// BAD - if first assertion fails, others never run
test('user creation', () => {
  expect(user.id).toBeDefined();
  expect(user.name).toBe('Alice');
  expect(user.email).toMatch(/@/);
  expect(user.createdAt).toBeDefined();
});

// GOOD - separate tests for separate concerns
test('user has id', () => {
  expect(user.id).toBeDefined();
});

test('user has correct name', () => {
  expect(user.name).toBe('Alice');
});
```

### 11. Magic Numbers/Strings

```typescript
// BAD - what does 42 mean?
test('calculates something', () => {
  const result = calculate(input);
  expect(result).toBe(42);
});

// GOOD - meaningful names or comments
test('calculates total with tax', () => {
  const subtotal = 38.18;
  const taxRate = 0.10;
  const expectedTotal = 42; // subtotal + 10% tax

  expect(calculateWithTax(subtotal, taxRate)).toBe(expectedTotal);
});
```

### 12. Giant Test Functions

```typescript
// BAD - too much in one test
test('user workflow', () => {
  // 50+ lines of setup
  // 10 different operations
  // 15 assertions
});

// GOOD - focused tests
test('user can register', () => { /* 5-10 lines */ });
test('registered user can login', () => { /* 5-10 lines */ });
test('logged in user can update profile', () => { /* 5-10 lines */ });
```

## Async Anti-Patterns

### 13. Not Waiting for Async

```typescript
// BAD - test completes before async operation
test('fetches data', () => {
  fetchData().then(result => {
    expect(result).toBeDefined(); // Never runs!
  });
  // Test ends immediately
});

// GOOD - properly await
test('fetches data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### 14. Callback Hell in Tests

```typescript
// BAD - nested callbacks
test('workflow', (done) => {
  step1((result1) => {
    step2(result1, (result2) => {
      step3(result2, (result3) => {
        expect(result3).toBe('done');
        done();
      });
    });
  });
});

// GOOD - async/await
test('workflow', async () => {
  const result1 = await step1();
  const result2 = await step2(result1);
  const result3 = await step3(result2);
  expect(result3).toBe('done');
});
```

## Mock Anti-Patterns

### 15. Verifying Stub Calls

```typescript
// BAD - stubs shouldn't be verified
test('uses config', () => {
  const stubConfig = jest.fn().mockReturnValue(10);
  calculator.setConfig(stubConfig);
  calculator.compute();
  expect(stubConfig).toHaveBeenCalled(); // Anti-pattern!
});

// GOOD - verify the result instead
test('uses config value', () => {
  const stubConfig = () => 10;
  calculator.setConfig(stubConfig);
  expect(calculator.compute()).toBe(20); // 10 * 2
});
```

### 16. Multiple Mocks Per Test

```typescript
// BAD - testing multiple concerns
test('saves user', () => {
  expect(mockDb.save).toHaveBeenCalled();
  expect(mockLogger.info).toHaveBeenCalled();
  expect(mockNotifier.send).toHaveBeenCalled();
});

// GOOD - one mock, one test
test('saves to database', () => {
  expect(mockDb.save).toHaveBeenCalledWith(user);
});

test('logs save operation', () => {
  expect(mockLogger.info).toHaveBeenCalled();
});
```

## Flaky Test Anti-Patterns

### 17. Time-Dependent Tests

```typescript
// BAD - depends on current time
test('formats date', () => {
  expect(formatDate(new Date())).toBe('2024-01-15');
});

// GOOD - use fixed date
test('formats date', () => {
  const fixedDate = new Date('2024-01-15T12:00:00Z');
  expect(formatDate(fixedDate)).toBe('2024-01-15');
});
```

### 18. Order-Dependent Tests

```typescript
// BAD - tests depend on execution order
let sharedState = null;

test('first creates data', () => {
  sharedState = createData();
});

test('second uses data', () => {
  expect(sharedState).toBeDefined(); // Fails if run alone!
});

// GOOD - each test is independent
test('creates and uses data', () => {
  const data = createData();
  expect(data).toBeDefined();
});
```

## Quick Reference: Anti-Pattern Fixes

| Anti-Pattern | Fix |
|--------------|-----|
| Logic in tests | Use hardcoded values |
| beforeEach abuse | Use factory functions |
| Shared state | Create fresh state per test |
| Implementation details | Test public behavior |
| Poor names | USE pattern |
| Multiple asserts | Split into focused tests |
| Not awaiting async | Use async/await |
| Verifying stubs | Only verify mocks |
| Multiple mocks | One mock per test |
| Time dependency | Use fixed dates |
