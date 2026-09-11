# 第10章 简化条件逻辑

## 260 分解条件表达式 (Decompose Conditional)

## 示例

```javascript
// Before
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * _winterRate + _winterServiceCharge;
} else {
  charge = quantity * _summerRate;
}

// After
if (isSummer(date)) {
  charge = summerCharge(quantity);
} else {
  charge = winterCharge(quantity);
}
```

### 动机

复杂的条件逻辑是编程中最常见的复杂度来源之一。分解条件表达式可以简化逻辑。

### 做法

1. 将条件表达式提炼为函数
2. 将条件分支的代码提炼为函数
3. 编译测试

---

## 263 合并条件表达式 (Consolidate Conditional)

## 示例

```javascript
// Before
if (anEmployee.seniority < 2) return 0;
if (anEmployee.monthsDisabled > 12) return 0;
if (anEmployee.isPartTime) return 0;

// After
if (isNotEligibleForDisability()) return 0;

function isNotEligibleForDisability() {
  return ((anEmployee.seniority < 2) ||
          (anEmployee.monthsDisabled > 12) ||
          (anEmployee.isPartTime));
}
```

### 动机

当多个条件表达式的结果相同时，应该将它们合并为一个。

### 做法

1. 确定这些条件表达式结果相同
2. 使用逻辑运算符合并条件表达式
3. 编译测试

---

## 266 以卫语句取代嵌套条件表达式 (Replace Nested Conditional with Guard Clauses)

## 示例

```javascript
// Before
function getPayAmount() {
  let result;
  if (isDead) {
    result = deadAmount();
  } else {
    if (isSeparated) {
      result = separatedAmount();
    } else {
      if (isRetired) {
        result = retiredAmount();
      } else {
        result = normalPayAmount();
      }
    }
  }
  return result;
}

// After
function getPayAmount() {
  if (isDead) return deadAmount();
  if (isSeparated) return separatedAmount();
  if (isRetired) return retiredAmount();
  return normalPayAmount();
}
```

### 动机

卫语句能够清晰地表达"在主要处理逻辑之前先做检查"的意图。

### 做法

1. 将条件表达式提炼为函数
2. 将条件分支改为卫语句
3. 编译测试

---

## 272 以多态取代条件表达式 (Replace Conditional with Polymorphism)

## 示例

```javascript
// Before
switch (bird.type) {
  case 'EuropeanSwallow':
    return bird.numberOfCoconuts * bird.airSpeedVelocity;
  case 'AfricanSwallow':
    return (bird.numberOfCoconuts > 0) ?
      bird.airSpeedVelocity - 2 * bird.loadFactor :
      bird.airSpeedVelocity;
  case 'NorwegianBlueParrot':
    return (bird.isNailed) ? 0 : bird.baseSpeed * bird.voltage;
}

// After
class EuropeanSwallow {
  get airSpeedVelocity() {
    return this.numberOfCoconuts * this.airSpeedVelocity;
  }
}
class AfricanSwallow {
  get airSpeedVelocity() {
    return (this.numberOfCoconuts > 0) ?
      this.airSpeedVelocity - 2 * this.loadFactor :
      this.airSpeedVelocity;
  }
}
class NorwegianBlueParrot {
  get airSpeedVelocity() {
    return (this.isNailed) ? 0 : this.baseSpeed * this.voltage;
  }
}
```

### 动机

如果面对的条件变化是根据类型码而选择不同的行为，就可以用多态来处理。

### 做法

1. 如果条件式是更大的函数中的一部分，先用分解条件表达式(260)将条件式提炼为独立函数
2. 使用以子类取代类型码(362)
3. 编译测试

---

## 289 引入特例 (Introduce Special Case)

曾用名：引入空对象 (Introduce Null Object)

## 示例

```javascript
// Before
if (customer === null) return "occupant";
else return customer.name;

// After
class UnknownCustomer {
  get name() {return "occupant";}
}
```

### 动机

一种常见的重复逻辑是出现在多处的数据检查逻辑。

### 做法

1. 为特例情况创建一个特例类
2. 编译测试
3. 在需要检查特例的地方，改为使用特例类

---

## 302 引入断言 (Introduce Assertion)

## 示例

```javascript
// Before
if (this.discountRate) {
  base = this.discountedPrice(base);
}

// After
assert(this.discountRate);
base = this.discountedPrice(base);
```

### 动机

断言可以明确地表述程序的状态，以及检查这些状态。

### 做法

1. 如果代码已经能够处理异常情况，就不需要断言
2. 如果代码无法处理异常情况，添加断言
3. 编译测试
