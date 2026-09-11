# 第9章 重新组织数据

## 240 拆分变量 (Split Variable)

曾用名：移除对参数的赋值 (Remove Assignments to Parameters)
曾用名：分解临时变量 (Split Temp)

## 示例

```javascript
// Before
let temp = 2 * (height + width);
console.log(temp);
temp = height * width;
console.log(temp);

// After
const perimeter = 2 * (height + width);
console.log(perimeter);
const area = height * width;
console.log(area);
```

### 动机

变量有各种不同的用途。除了循环变量和结果收集变量外，其他变量应该只被赋值一次。

### 做法

1. 在待分解变量的声明及其第一次被赋值处，修改其名称
2. 如果可能的话，将新的变量声明为不可修改
3. 以该变量的第二次赋值动作为界，修改此前对该变量的所有引用，让它们引用新变量
4. 测试
5. 重复上述过程，直至到达最后一处赋值

---

## 244 字段改名 (Rename Field)

## 示例

```javascript
// Before
class Organization {
  get name() {...}
}

// After
class Organization {
  get title() {...}
}
```

### 动机

命名很重要，对于程序中广泛使用的记录结构，其中字段的命名格外重要。

### 做法

1. 如果记录的作用域较小，可以直接修改所有该字段的代码，然后测试
2. 如果记录还未封装，请先使用封装记录(162)
3. 在对象内部对私有字段改名，对应调整内部访问该字段的函数
4. 测试
5. 运用函数改名(124)给访问函数改名

---

## 248 以查询取代派生变量 (Replace Derived Variable with Query)

## 示例

```javascript
// Before
get discountedTotal() {return this._discountedTotal;}
set discount(aNumber) {
  const old = this._discount;
  this._discount = aNumber;
  this._discountedTotal += old - aNumber;
}

// After
get discountedTotal() {return this._baseTotal - this._discount;}
set discount(aNumber) {this._discount = aNumber;}
```

### 动机

可变数据是软件中最大的错误源头之一。有些变量其实可以很容易地随时计算出来。

### 做法

1. 识别出所有对变量做更新的地方
2. 新建一个函数，用于计算该变量的值
3. 用引入断言(302)断言该变量和计算函数始终给出同样的值
4. 测试
5. 修改读取该变量的代码，令其调用新建的函数
6. 测试
7. 用移除死代码(237)去掉变量的声明和赋值

---

## 252 将引用对象改为值对象 (Change Reference to Value)

反向重构：将值对象改为引用对象(256)

## 示例

```javascript
// Before
class Product {
  applyDiscount(arg) {this._price.amount -= arg;}
}

// After
class Product {
  applyDiscount(arg) {
    this._price = new Money(this._price.amount - arg, this._price.currency);
  }
}
```

### 动机

值对象通常更容易理解，主要因为它们是不可变的。

### 做法

1. 检查重构目标是否为不可变对象，或者是否可修改为不可变对象
2. 用移除设值函数(331)逐一去掉所有设值函数
3. 提供一个基于值的相等性判断函数

---

## 256 将值对象改为引用对象 (Change Value to Reference)

反向重构：将引用对象改为值对象(252)

## 示例

```javascript
// Before
let customer = new Customer(customerData);

// After
let customer = customerRepository.get(customerData.id);
```

### 动机

如果共享的数据需要更新，将其复制多份的做法就会遇到巨大的困难。

### 做法

1. 为相关对象创建一个仓库（如果还没有这样一个仓库的话）
2. 确保构造函数有办法找到关联对象的正确实例
3. 修改宿主对象的构造函数，令其从仓库中获取关联对象
