# 第7章 封装

## 162 封装记录 (Encapsulate Record)

## 示例

```javascript
// Before
const organization = {name: "Acme Gooseberries", country: "GB"};

// After
class Organization {
  constructor(data) {
    this._name = data.name;
    this._country = data.country;
  }
  get name() {return this._name;}
  set name(aString) {this._name = aString;}
  get country() {return this._country;}
  set country(aCountryCode) {this._country = aCountryCode;}
}
const organization = new Organization({name: "Acme Gooseberries", country: "GB"});
```

### 动机

记录型结构是编程中非常常用的结构。但记录型结构的问题在于，它将数据暴露给所有人，没有任何封装。

### 做法

1. 创建一个类，将记录结构作为构造函数参数
2. 为每个字段创建取值和设值函数
3. 修改原记录的所有使用者，改用新类
4. 编译测试

---

## 170 封装集合 (Encapsulate Collection)

## 示例

```javascript
// Before
class Person {
  getCourses() {return this._courses;}
  setCourses(aList) {this._courses = aList;}
}

// After
class Person {
  get courses() {return this._courses.slice();}
  addCourse(aCourse) {...}
  removeCourse(aCourse) {...}
}
```

### 动机

对于集合字段，永远不应该提供取值函数，而应该提供添加/删除元素的函数。

### 做法

1. 在集合类中添加添加/删除元素的方法
2. 修改集合的所有使用者，改用新的方法
3. 编译测试
4. 将取值函数改为返回集合的副本
5. 编译测试

---

## 174 以对象取代基本类型 (Replace Primitive with Object)

## 示例

```javascript
// Before
orders.filter(o => o.priority === 'high')
  .forEach(o => o.priority = 'normal');

// After
orders.filter(o => o.priority.higherThan(new Priority('normal')))
  .forEach(o => o.priority = new Priority('normal'));
```

### 动机

一开始，你可能会用一个简单的数据项表示简单的概念，但随着需求增加，需要给这些数据添加行为。

### 做法

1. 为基本类型创建一个类
2. 创建转换函数，将基本类型转为新类
3. 修改所有使用基本类型的地方

---

## 178 以查询取代临时变量 (Replace Temp with Query)

曾用名：以查询取代临时变量

## 示例

```javascript
// Before
const basePrice = this._quantity * this._itemPrice;
if (basePrice > 1000) {
  return basePrice * 0.95;
} else {
  return basePrice * 0.98;
}

// After
get basePrice() {return this._quantity * this._itemPrice;}
if (this.basePrice > 1000) {
  return this.basePrice * 0.95;
} else {
  return this.basePrice * 0.98;
}
```

### 动机

临时变量的问题是，它们只在所属函数内可见，会导致重复代码。

### 做法

1. 检查变量是否在最终返回之前被重新赋值
2. 检查变量是否只被计算一次
3. 将计算提炼为函数
4. 内联变量

---

## 182 提炼类 (Extract Class)

## 示例

```javascript
// Before
class Person {
  get name() {...}
  get officeAreaCode() {return this._officeAreaCode;}
  set officeAreaCode(arg) {this._officeAreaCode = arg;}
  get officeNumber() {return this._officeNumber;}
  set officeNumber(arg) {this._officeNumber = arg;}
}

// After
class Person {
  get name() {...}
  get officeAreaCode() {return this._telephoneNumber.areaCode;}
  set officeAreaCode(arg) {this._telephoneNumber.areaCode = arg;}
  get officeNumber() {return this._telephoneNumber.number;}
  set officeNumber(arg) {this._telephoneNumber.number = arg;}
}
class TelephoneNumber {
  get areaCode() {...}
  set areaCode(arg) {...}
  get number() {...}
  set number(arg) {...}
}
```

### 动机

当一个类承担了过多责任时，应该将其分解。

### 做法

1. 决定如何分解类
2. 创建一个新类，用以表示从旧类中分离出来的责任
3. 从旧类中搬移字段和函数

---

## 186 内联类 (Inline Class)

## 示例

```javascript
// Before
class Person {
  get officeAreaCode() {return this._telephoneNumber.areaCode;}
  set officeAreaCode(arg) {this._telephoneNumber.areaCode = arg;}
  get officeNumber() {return this._telephoneNumber.number;}
  set officeNumber(arg) {this._telephoneNumber.number = arg;}
}
class TelephoneNumber {...}

// After
class Person {
  get officeAreaCode() {return this._officeAreaCode;}
  set officeAreaCode(arg) {this._officeAreaCode = arg;}
  get officeNumber() {return this._officeNumber;}
  set officeNumber(arg) {this._officeNumber = arg;}
}
```

### 动机

如果一个类的责任太少，不再有独立存在的价值，就应该内联回去。

### 做法

1. 在目标类中声明源类的公共函数
2. 将所有对源类的函数调用改为对目标类的调用
3. 删除源类

---

## 189 隐藏委托关系 (Hide Delegate)

## 示例

```javascript
// Before
manager = aPerson.department.manager;

// After
manager = aPerson.manager;

// 在Person类中
class Person {
  get manager() {return this.department.manager;}
}
```

### 动机

客户端通过一个服务对象来调用另一个对象，会导致客户端与服务对象之间产生耦合。

### 做法

1. 对于每个委托函数，在服务对象中创建一个简单的委托函数
2. 调整客户端，改为调用服务对象的委托函数
3. 编译测试
4. 每次调整后删除客户端中对被委托对象的访问

---

## 192 移除中间人 (Remove Middle Man)

## 示例

```javascript
// Before
manager = aPerson.manager;

// After
manager = aPerson.department.manager;
```

### 动机

如果一个类的中间人函数过多，应该让客户端直接调用受托对象。

### 做法

1. 为受托对象创建一个取值函数
2. 对于每个中间人函数，将其替换为直接调用受托对象
3. 编译测试
4. 删除所有中间人函数

---

## 195 替换算法 (Substitute Algorithm)

## 示例

```javascript
// Before
function foundPerson(people) {
  for (let i = 0; i < people.length; i++) {
    if (people[i] === "Don") {
      return "Don";
    }
    if (people[i] === "John") {
      return "John";
    }
    if (people[i] === "Kent") {
      return "Kent";
    }
  }
  return "";
}

// After
function foundPerson(people) {
  const candidates = ["Don", "John", "Kent"];
  return people.find(p => candidates.includes(p)) || "";
}
```

### 动机

当你发现可以通过更清晰的方式实现同一个功能时，就应该替换算法。

### 做法

1. 准备好替换算法
2. 运行测试
3. 用新算法替换旧算法
4. 如果调用者需要，修改接口以适应新算法
