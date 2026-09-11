# 第12章 处理继承关系

## 350 函数上移 (Pull Up Method)

反向重构：函数下移(359)

## 示例

```javascript
// Before
class Employee {
  get name() {...}
}
class Salesman extends Employee {
  get name() {...}
}
class Engineer extends Employee {
  get name() {...}
}

// After
class Employee {
  get name() {...}
}
class Salesman extends Employee {...}
class Engineer extends Employee {...}
```

### 动机

避免重复代码是很重要的。如果某个函数在各个子类中的函数体都相同，就应该上移。

### 做法

1. 检查待提升函数，确定它们是完全一致的
2. 如果函数签名不同，使用改变函数声明(124)统一签名
3. 在超类中新建一个函数
4. 移除子类中的函数
5. 测试

---

## 353 字段上移 (Pull Up Field)

反向重构：字段下移(361)

## 示例

```javascript
// Before
class Employee {...}
class Salesman extends Employee {
  private String name;
}
class Engineer extends Employee {
  private String name;
}

// After
class Employee {
  protected String name;
}
class Salesman extends Employee {...}
class Engineer extends Employee {...}
```

### 动机

如果各子类拥有重复字段，可以将其提升到超类中。

### 做法

1. 针对待提升字段，检查它们的所有使用点
2. 如果字段名称不同，先使用变量改名(137)统一名称
3. 在超类中新建一个字段
4. 移除子类中的字段

---

## 355 构造函数本体上移 (Pull Up Constructor Body)

## 示例

```javascript
// Before
class Party {}
class Employee extends Party {
  constructor(name, id, monthlyCost) {
    super();
    this._id = id;
    this._name = name;
    this._monthlyCost = monthlyCost;
  }
}

// After
class Party {
  constructor(name) {
    this._name = name;
  }
}
class Employee extends Party {
  constructor(name, id, monthlyCost) {
    super(name);
    this._id = id;
    this._monthlyCost = monthlyCost;
  }
}
```

### 动机

如果各个子类中的构造函数有共同行为，可以将它们上移到超类。

### 做法

1. 如果超类还没有构造函数，先为其定义一个
2. 使用移动语句(223)将子类中构造函数的公共语句移动到超类
3. 测试

---

## 359 函数下移 (Push Down Method)

反向重构：函数上移(350)

## 示例

```javascript
// Before
class Employee {
  get quota {...}
}
class Engineer extends Employee {...}
class Salesman extends Employee {...}

// After
class Employee {...}
class Engineer extends Employee {...}
class Salesman extends Employee {
  get quota {...}
}
```

### 动机

如果超类中的某个函数只与一个（或少数几个）子类有关，最好将其从超类中挪走。

### 做法

1. 将超类中的函数本体复制到需要此函数的子类中
2. 删除超类中的函数
3. 测试

---

## 361 字段下移 (Push Down Field)

反向重构：字段上移(353)

## 示例

```javascript
// Before
class Employee {
  private String quota;
}
class Engineer extends Employee {...}
class Salesman extends Employee {...}

// After
class Employee {...}
class Engineer extends Employee {...}
class Salesman extends Employee {
  protected String quota;
}
```

### 动机

如果某个字段只被一个子类（或少数子类）用到，就将其搬移到需要该字段的子类中。

### 做法

1. 在所有需要该字段的子类中声明该字段
2. 将该字段从超类中移除
3. 测试

---

## 362 以子类取代类型码 (Replace Type Code with Subclasses)

包含旧重构：以State/Strategy取代类型码
反向重构：移除子类(369)

## 示例

```javascript
// Before
function createEmployee(name, type) {
  return new Employee(name, type);
}

// After
function createEmployee(name, type) {
  switch (type) {
    case "engineer": return new Engineer(name);
    case "salesman": return new Salesman(name);
    case "manager": return new Manager(name);
  }
}
```

### 动机

继承有两个诱人之处：可以用多态处理条件逻辑；某些字段或函数只对特定类型有意义。

### 做法

1. 自封装类型码字段
2. 任选一个类型码取值，为其创建子类
3. 创建选择器逻辑，把类型码参数映射到新子类
4. 测试
5. 针对每个类型码，重复上述过程

---

## 369 移除子类 (Remove Subclass)

曾用名：以字段取代子类 (Replace Subclass with Fields)
反向重构：以子类取代类型码(362)

## 示例

```javascript
// Before
class Person {
  get genderCode() {return "X";}
}
class Male extends Person {
  get genderCode() {return "M";}
}
class Female extends Person {
  get genderCode() {return "F";}
}

// After
class Person {
  get genderCode() {return this._genderCode;}
}
```

### 动机

子类存在的成本是阅读者要花心思理解它的用意。如果子类的用处太少，就不值得存在了。

### 做法

1. 使用以工厂函数取代构造函数(334)，把子类构造函数包装到超类
2. 新建一个字段，用于代表子类的类型
3. 删除子类

---

## 375 提炼超类 (Extract Superclass)

## 示例

```javascript
// Before
class Department {
  get totalAnnualCost() {...}
  get name() {...}
}
class Employee {
  get annualCost() {...}
  get name() {...}
}

// After
class Party {
  get name() {...}
  get annualCost() {...}
}
class Department extends Party {
  get annualCost() {...}
}
class Employee extends Party {
  get annualCost() {...}
}
```

### 动机

如果两个类在做相似的事，可以利用继承机制把相似之处提炼到超类。

### 做法

1. 为原本的类新建一个空白的超类
2. 使用构造函数本体上移(355)、函数上移(350)和字段上移(353)，将共同元素上移
3. 测试

---

## 380 折叠继承体系 (Collapse Hierarchy)

## 示例

```javascript
// Before
class Employee {...}
class Salesman extends Employee {...}

// After
class Employee {...}
```

### 动机

如果类与其超类已经没多大差别，不值得再作为独立的类存在，应该合并。

### 做法

1. 选择想移除的类（超类或子类）
2. 使用字段上移(353)、字段下移(361)、函数上移(350)和函数下移(359)将所有元素移到同一个类
3. 调整引用，令其引用合并后留下的类
4. 移除目标类
5. 测试

---

## 381 以委托取代子类 (Replace Subclass with Delegate)

曾用名：以委托取代继承

## 示例

```javascript
// Before
class Order {
  get daysOverdrawn() {...}
}
class PriorityOrder extends Order {
  get daysOverdrawn() {...}
}

// After
class Order {
  get priorityDelegate() {...}
  get daysOverdrawn() {...}
}
```

### 动机

继承是一件很棒的工具，但它总是被误用。如果继承不再适用，可以用委托替代。

### 做法

1. 创建一个委托类，将子类特有字段搬移到委托类
2. 为每个子类创建一个委托实例
3. 使用搬移函数(198)将子类函数搬移到委托类
4. 测试
5. 删除子类

---

## 399 以委托取代超类 (Replace Superclass with Delegate)

## 示例

```javascript
// Before
class Category {...}
class UICategory extends Category {...}

// After
class Category {...}
class UICategory {
  get category() {...}
}
```

### 动机

超类与子类的关系如果不再有意义，可以用委托替代继承。

### 做法

1. 创建一个委托类，将超类字段搬移到委托类
2. 为子类创建一个委托实例
3. 使用搬移函数(198)将继承的函数搬移到委托类
4. 删除继承关系
