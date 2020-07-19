// func是我们需要包装的事件回调, delay是每次推迟执行的等待时间
function debounce(func, delay) {
  // 定时器
  let timeout = null;
  return function() {
    // 每次事件被触发时，都去清除之前的旧定时器，旧定时器的回调就不会执行。
    if(timer) {
        clearTimeout(timeout) 
    ｝
    timeout = setTimeout(() => {
      func.apply(this, arguments)
    }, delay)
  }
}

用法：

 box.onmousemove = debounce(function (e) {
    box.innerHTML = `${e.clientX}, ${e.clientY}`
  }, 1000)
