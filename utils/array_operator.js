//参数p为原对象
//参数c为原对象的类型，若原对象为数组，则传入c为[],若原对象是对象传入c为{}，也可不传默认为{}
function deepCopy(p,c){
var c = c || {};
for(var i in p){
　　if(typeof p[i] === "object"){
　　　　　c[i] = (p[i].constructor === Array)?[]:{};
　　　　　deepCopy(p[i],c[i])
　　　　}else{
　　　　　　c[i] = p[i]
　　　　}
　　}
　　return c;
}

//定义数组arr1
var arr1 = [1,2,3,4]
//将arr1拷贝给arr2
var arr2 = deepCopy(arr1,[]);
//向arr1中尾部添加一个元素5
arr1.push(5);
console.log('arr1:',arr1);
console.log('arr2:',arr2);

