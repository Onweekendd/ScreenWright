# 第6章 第一组重构

> 曾用名：提炼函数 (Extract Method)

## 示例

```javascript
// Before
function printOwing() {
  let outstanding = 0;
  console.log("*************************");
  console.log("****** Customer Owes ******");
  console.log("*************************");

  // calculate outstanding
  for (const o of this.orders) {
    outstanding += o.amount;
  }

  // print details
  console.log(`name: ${this.name}`);
  console.log(`amount: ${outstanding}`);
}

// After
function printOwing() {
  let outstanding = 0;
  printBanner();

  // calculate outstanding
  for (const o of this.orders) {
    outstanding += o.amount;
  }

  // print details
  printDetails(outstanding);
}

function printBanner() {
  console.log("*************************");
  console.log("****** Customer Owes ******");
  console.log("*************************");
}

function printDetails(outstanding) {
  console.log(`name: ${this.name}`);
  console.log(`amount: ${outstanding}`);
}
```

### 动机

提炼函数是最常用的重构之一。当你看到一个函数过长，或者一段代码需要注释才能理解时，就应该考虑提炼函数。

### 做法

1. 创建一个新函数，根据这段代码的用途来命名
2. 将提炼出的代码从原函数复制到新函数中
3. 检查提炼出的代码，是否引用了原函数中的局部变量
4. 检查提炼出的代码，是否使用了仅限于原函数的成员
5. 将变量作为参数传递给新函数
6. 用对新函数的调用替换原代码

---

## 115 内联函数 (Inline Function)

## 示例

```javascript
// Before
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}
function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5;
}

// After
function getRating(driver) {
  return (driver.numberOfLateDeliveries > 5) ? 2 : 1;
}
```

### 动机

一组函数只是对另一个函数的简单委托，这种间接毫无意义，应该内联。

### 做法

1. 检查函数，确认它不具备多态性
2. 找出函数的所有被调用点
3. 将调用点替换为函数体
4. 每次替换后执行测试
5. 删除函数定义

---

## 119 提炼变量 (Extract Variable)

## 示例

```javascript
// Before
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);

// After
const basePrice = order.quantity * order.itemPrice;
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
const shipping = Math.min(basePrice * 0.1, 100);
return basePrice - quantityDiscount + shipping;
```

### 动机

表达式可能非常复杂，难以理解。此时可以用变量来解释其含义。

### 做法

1. 确认要提炼的表达式没有副作用
2. 声明一个不可修改的变量
3. 将表达式赋值给这个变量
4. 替换原表达式

---

## 123 内联变量 (Inline Variable)

## 示例

```javascript
// Before
let basePrice = anOrder.basePrice;
return (basePrice > 1000);

// After
return (anOrder.basePrice > 1000);
```

### 动机

当变量名字并不比表达式本身更具表现力时，应该内联变量。

### 做法

1. 检查变量是否只被赋值一次
2. 检查变量是否在表达式中被引用
3. 用表达式替换变量
4. 删除变量声明

---

## 124 改变函数声明 (Change Function Declaration)

曾用名：函数改名 (Rename Function)

## 示例

```javascript
// Before
function circum(radius) {return 2 * Math.PI * radius;}

// After
function circumference(radius) {return 2 * Math.PI * radius;}
```

### 动机

函数名是最重要的文档。好的函数名能清楚表达函数的用途。

### 做法

**简单情况 - 只修改名字**：
1. 检查函数是否被覆写
2. 声明一个新函数，复制旧函数体
3. 修改旧函数，令其调用新函数
4. 找到所有调用旧函数的点，改为调用新函数
5. 删除旧函数

**复杂情况 - 修改参数**：
1. 如果需要移除参数，先检查调用处是否用到
2. 如果需要添加参数，用引入参数对象(140)考虑是否应该将参数组织成对象

---

## 132 封装变量 (Encapsulate Variable)

## 示例

```javascript
// Before
let defaultOwner = {firstName: "Martin", lastName: "Fowler"};

// After
let defaultOwner = new Person({firstName: "Martin", lastName: "Fowler"});
class Person {
  constructor(data) {
    this._firstName = data.firstName;
    this._lastName = data.lastName;
  }
  get firstName() {return this._firstName;}
  get lastName() {return this._lastName;}
}
```

### 动机

对于所有可变数据，只要它的作用域超出单个函数，就应该把它封装起来。

### 做法

1. 创建封装函数，用于访问和修改变量
2. 执行静态检查
3. 修正所有调用点，改用新的封装函数
4. 限制变量的可见性

---

## 137 变量改名 (Rename Variable)

## 示例

```javascript
// Before
const a = height * width;

// After
const area = height * width;
```

### 动机

好的命名是编程中最重要的事情之一。好的变量名能清晰表达变量的用途。

### 做法

1. 检查变量是否被广泛使用
2. 如果变量作用域较小，直接改名
3. 如果变量作用域较大，先用提炼变量(119)缩小作用域

---

## 140 引入参数对象 (Introduce Parameter Object)

## 示例

```javascript
// Before
function amountInvoiced(startDate, endDate) {...}
function amountReceived(startDate, endDate) {...}
function amountOverdue(startDate, endDate) {...}

// After
function amountInvoiced(dateRange) {...}
function amountReceived(dateRange) {...}
function amountOverdue(dateRange) {...}
```

### 动机

一组参数总是同时出现，可以组合成一个对象。

### 做法

1. 创建一个新类，用于表示这组参数
2. 用改变函数声明(124)添加新参数
3. 修改所有调用点，传入新对象
4. 编译测试

---

## 144 组合函数为类 (Combine Functions into Class)

## 示例

```javascript
// Before
function base(aReading) {...}
function taxableCharge(aReading) {...}
function calculateBaseCharge(aReading) {...}

// After
class Reading {
  base() {...}
  taxableCharge() {...}
  calculateBaseCharge() {...}
}
```

### 动机

如果一组函数彼此之间有大量交互，可以把它们组合成类。

### 做法

1. 创建一个空类
2. 用搬移函数(198)把所有函数搬移到类中
3. 编译测试

---

## 149 组合函数为变换 (Combine Functions into Transform)

## 示例

```javascript
// Before
function base(aReading) {...}
function taxableCharge(aReading) {...}

// After
function enrichReading(argument) {
  const result = _.cloneDeep(argument);
  result.baseCharge = base(result);
  result.taxableCharge = taxableCharge(result);
  return result;
}
```

### 动机

可以使用变换对象来组织计算逻辑，将源数据拷贝一份并在其上进行计算。

### 做法

1. 创建一个变换函数，输入源数据并返回变换后的数据
2. 在变换函数中复制源数据
3. 添加计算字段
4. 从原函数中提取计算逻辑到变换函数中

---

## 155 拆分阶段 (Split Phase)

## 示例

```javascript
// Before
function priceOrder(product, quantity, shippingMethod) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  const shippingPerCase = (shippingMethod === 'truck') ?
    shippingTruckFee(product, shippingMethod) :
    shippingAirFee(product, shippingMethod);
  const price = basePrice - discount + shippingPerCase * quantity;
  return price;
}

// After
function priceOrder(product, quantity, shippingMethod) {
  const priceData = calculatePricingData(product, quantity);
  return applyShipping(priceData, shippingMethod);
}

function calculatePricingData(product, quantity) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;
  return {basePrice: basePrice, discount: discount, quantity: quantity};
}

function applyShipping(priceData, shippingMethod) {
  const shippingPerCase = (shippingMethod === 'truck') ?
    shippingTruckFee(priceData, shippingMethod) :
    shippingAirFee(priceData, shippingMethod);
  return priceData.basePrice - priceData.discount + shippingPerCase * priceData.quantity;
}
```

### 动机

当一段代码同时做两件事时，应该将其拆分为两个独立的阶段。

### 做法

1. 将第二个阶段的代码提炼为新函数
2. 测试
3. 创建中间数据结构作为第二个阶段的输入
4. 测试
5. 将第一个阶段的代码提炼为返回中间数据结构的函数
6. 测试
