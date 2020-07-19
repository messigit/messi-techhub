# 1. 前言

使用原生`JS`实现`call`和`apply`函数，充分了解其内部原理。`call`和`apply`都是为了解决改变`this`的指向。作用都相同，只是传参的方式不同。除了第一个参数外，`call`可以接受一个参数列表，`apply`只接受一个参数数组。

[回到顶部](https://www.cnblogs.com/wangjiachen666/p/11275856.html#_labelTop)

# 2. call函数



## 2.1 描述

**call()** 方法使用一个指定的 `this` 值和单独给出的一个或多个参数来调用一个函数。



## 2.2 语法

```javascript
fun.call(thisArg, arg1, arg2, ...)
```



## 2.3 参数

- **thisArg**：可选的。在 *fun* 函数运行时指定的 `this` 值*。*需要注意的是，指定的 `this` 值并不一定是该函数执行时真正的 `this` 值，如果这个函数在[`非严格模式`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Strict_mode)下运行，则指定为 `null`和 `undefined`的 `this` 值会自动指向全局对象（浏览器中就是 window 对象），同时值为原始值（数字，字符串，布尔值）的 `this` 会指向该原始值的自动包装对象。
- **arg1, arg2, ...**:可选的。指定的参数列表。



## 2.4 返回值

使用调用者提供的 `this` 值和参数调用该函数的返回值。若该方法没有返回值，则返回 `undefined`。



## 2.5 实现

```javascript
Function.prototype.myCall = function (context){
  if (typeof this !== 'function') {
     throw new TypeError('Error')
  }
  if (context === null || context === undefined) {
     context = window    // 指定为 null 和 undefined 的 this 值会自动指向全局对象(浏览器中为window)
  } else {
     context = Object(context) // 值为原始值（数字，字符串，布尔值）的 this 会指向该原始值的实例对象
  }

  context.fn = this
  //通过参数伪数组将context后面的参数取出来
  let args = [...arguments].slice(1)
  let result = context.fn(...args)
  //删除 fn
  delete context.fn
  return result
}
```

实现思路：

- 首先，判断调用`mycall`的是不是函数，如果不是，则直接抛出异常；
- 接着，判断是否传入了第一个参数`context`，也就是要指定的`this`值，如果没有传入，则默认为`window`全局对象；
- 然后，谁将来调用`mycall`，那么`this`就是谁，将其赋给`context.fn`;
- 然后，通过参数伪数组将`context`后面的参数取出来,并传给`context.fn`获得执行结果`result`；
- 最后，删除掉`context.fn`，并将`result`返回；

[回到顶部](https://www.cnblogs.com/wangjiachen666/p/11275856.html#_labelTop)

# 3. aplly函数



## 3.1 描述

**apply()** 方法调用一个具有给定`this`值的函数，以及作为一个数组（或[类似数组对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Indexed_collections#Working_with_array-like_objects)）提供的参数。



## 3.2 语法

```javascript
func.apply(thisArg, [argsArray])
```



## 3.3 参数

- **thisArg**:可选的。在 *func* 函数运行时使用的 `this` 值。请注意，`this`可能不是该方法看到的实际值：如果这个函数处于[非严格模式](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Strict_mode)下，则指定为 `null` 或 `undefined` 时会自动替换为指向全局对象，原始值会被包装。
- **argsArray**:可选的。一个数组或者类数组对象，其中的数组元素将作为单独的参数传给 `func` 函数。如果该参数的值为 `null`或  `undefined`，则表示不需要传入任何参数。从ECMAScript 5 开始可以使用类数组对象。



## 3.4 返回值

调用有指定`**this**`值和参数的函数的结果。



## 3.5 实现

```javascript
Function.prototype.myApply = function (context) {
   if (typeof this !== 'function') {
      throw new TypeError('Error')
   }
   if (context === null || context === undefined) {
        context = window     // 指定为 null 和 undefined 的 this 值会自动指向全局对象(浏览器中为window)
    } else {
        context = Object(context) // 值为原始值（数字，字符串，布尔值）的 this 会指向该原始值的实例对象
    }

    context.fn = this
    let result 
    //判断是否存在第二个参数
    //如果存在就将第二个参数也展开
    if(arguments[1]) {
        result = context.fn(...arguments[1])
    } else {
        result = context.fn()
    }
    delete context.fn
    return result
}
```

实现思路：

- 首先，判断调用`myapply`的是不是函数，如果不是，则直接抛出异常；
- 接着，判断是否传入了第一个参数`context`，也就是要指定的`this`值，如果没有传入，则默认为`window`全局对象；
- 然后，谁将来调用`myapply`，那么`this`就是谁，将其赋给`context.fn`;
- 然后，判断是否传入了第二个参数，如果传入了则将其使用展开运算符`...`传给`context.fn`获得执行结果`result`，如果没有传入，则直接调用`context.fn`获得执行结果`result`；
- 最后，删除掉`context.fn`，并将`result`返回；

[回到顶部](https://www.cnblogs.com/wangjiachen666/p/11275856.html#_labelTop)

# 4. bind函数



## 4.1 描述

**bind()**方法创建一个新的函数，在**bind()**被调用时，这个新函数的`this`被`bind`的第一个参数指定，其余的参数将作为新函数的参数供调用时使用。



## 4.2 语法

```javascript
func.bind(thisArg[, arg1[, arg2[, ...]]])
```



## 4.3 参数

- **thisArg:**调用绑定函数时作为`this`参数传递给目标函数的值。 如果使用`new`运算符构造绑定函数，则忽略该值。当使用`bind`在`setTimeout`中创建一个函数（作为回调提供）时，作为`thisArg`传递的任何原始值都将转换为`object`。如果`bind`函数的参数列表为空，执行作用域的`this`将被视为新函数的`thisArg`。
- **arg1, arg2, ...:**当目标函数被调用时，预先添加到绑定函数的参数列表中的参数。



## 4.4 返回值

返回一个原函数的拷贝，并拥有指定的**this**值和初始参数。



## 4.5 实现

```javascript
Function.prototype.mybind = function (context) {
    if (typeof this !== 'function') {
        throw new TypeError('Error')
    }
    const _this = this 
    const args = [...arguments].slice(1)
    //返回一个函数
    return function F () {
        if (this instanceof F) {           // this是否是F的实例 也就是返回的F是否通过new调用
            return new _this(...args, ...arguments)
        }
        return _this.apply(context,args.concat(...arguments))
    }
}
```

实现思路：

- 首先，判断调用`mybind`的是不是函数，如果不是，则直接抛出异常；
- 接着，谁将来调用`mybind`，那么`this`就是谁，将其赋给`_this`，缓存一下;
- 然后，通过参数伪数组将`context`后面的参数(预先添加到绑定函数的参数)取出来，记作`args`,
- 然后，返回一个函数，并判断如果使用`new`运算符构造绑定函数，则忽略传入的第一个参数`context`，并将预先添加到绑定函数的参数`args`和将来传入新函数的参数`arguments`分别通过展开运算符`...`依次传入给调用`mybind`的调用者，并将结果返回。
- 最后，如果不是使用`new`运算符构造绑定函数，则对调用者使用`apply`方法，将传入的第一个参数以及预先添加到绑定函数的参数`args`和将来传入新函数的参数`arguments`分别通过展开运算符`...`依次传入给调用`mybind`的调用者，并将结果返回；

（完）