function throttle(func, delay) {
    let run = true
    return function () {
      if (!run) {
        return  // 如果开关关闭了，那就直接不执行下边的代码
      }
      run = false // 持续触发的话，run一直是false，就会停在上边的判断那里
      setTimeout(() => {
        func.apply(this, arguments)
        run = true // 定时器到时间之后，会把开关打开，我们的函数就会被执行
      }, delay)
    }
  }

用法：

box.onmousemove = throttle(function (e) {
  box.innerHTML = `${e.clientX}, ${e.clientY}`
}, 1000)
