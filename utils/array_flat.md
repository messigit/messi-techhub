要实现这样的需求，其实不难，只是对后端返回的数据源有要求，如果后端返回的数据能够很清楚的表现出节点与节点之间的层级关系，那么前端实现起来就易如反掌。
回到顶部
2.数据源格式

一般来说，要想动态的渲染出一个树形菜单，如下所示的数据源格式对前端开发人员来说是十分友好的。
```
var data = [
	{
    name: "父节点1",
    children: [
      {
        name: "子节点11",
        children:[
          {
            name: "叶子节点111",
            children:[]
          },
          {
            name: "叶子节点112",
            children:[]
          },
          {
            name: "叶子节点113",
            children:[]
          },
          {
            name: "叶子节点114",
            children:[]
          }
        ]
      }
     //...
    ]
  },
];
```
后端返回这样的数据源格式，节点之间的层级关系一目了然，前端人员拿到数据，只需进行递归遍历，并判断children.length是否等于0，等于0表明当前节点已为叶子节点，停止遍历即可。在上一篇博文vue+element UI以组件递归方式实现多级导航菜单中，动态渲染多级导航菜单，也是推荐使用这种数据源格式的。
回到顶部
3.问题痛点

虽然前端人员想法是好的，但是在后端，这些数据通常是存储在关系型数据库中，后端开发将数据从数据库中取出来返回给前端的数据往往这样子的：
```
const data =[
  { id:1,   pid:0,  name:"父节点1"     },           
  { id:11,  pid:1,  name:"父节点11"    },
  { id:111, pid:11, name:"叶子节点111" },
  { id:112, pid:11, name:"叶子节点112" },
  { id:113, pid:11, name:"叶子节点113" },
  { id:114, pid:11, name:"叶子节点114" },
  { id:12,  pid:1,  name:"父节点12"    },
  { id:121, pid:12, name:"叶子节点121" },
  { id:122, pid:12, name:"叶子节点122" },
  { id:123, pid:12, name:"叶子节点123" },
  { id:124, pid:12, name:"叶子节点124" },
  { id:13,  pid:1,  name:"父节点13"    },
  { id:2,   pid:0,  name:"父节点2"     },
  { id:21,  pid:2,  name:"父节点21"    },
  { id:211, pid:21, name:"叶子节点211" },
  { id:212, pid:21, name:"叶子节点212" },
  { id:213, pid:21, name:"叶子节点213" },
  { id:214, pid:21, name:"叶子节点214" },
  { id:22,  pid:2,  name:"父节点22"    },
  { id:221, pid:22, name:"叶子节点221" },
  { id:222, pid:22, name:"叶子节点222" },
  { id:223, pid:22, name:"叶子节点223" },
  { id:224, pid:22, name:"叶子节点224" },
  { id:23,  pid:2,  name:"父节点23"    },
  { id:231, pid:23, name:"叶子节点231" },
  { id:232, pid:23, name:"叶子节点232" },
  { id:233, pid:23, name:"叶子节点233" },
  { id:234, pid:23, name:"叶子节点234" },
  { id:3,   pid:0,  name:"父节点3"     }
];
```
其中，层级关系是通过id和pid提现的，id为节点的序号，pid为该节点的父节点序号，如果为顶级节点，则其pid为0。

其实，这样的数据格式对前端来说，也不是不能用，就是没有上面那种格式用起来方便，所以，有时候前端同学就得去跪舔后端人员：

“后端大哥，能不能给我返回像这样子的数据呀？”

如果前端同学是个妹子还好，撒个娇就完事了，可如果是个汉子，后端大哥往往会回应你：

“滚，给你返回数据就不错了，还挑三拣四，想要啥样子的自己造去。”
回到顶部
4.解决方案

为了防止被后端同学怼（其实以上对话是博主亲身经历，摔~~~），我们前端人员果断自己动手，丰衣足食。

为了解决上述问题，博主自己写了两个方法，来实现两种数据源格式互相转化。我们姑且称理想数据格式为“嵌套型格式”，后端返回的格式为“扁平型格式”，那么两个互转方法代码如下：
```
/**
 * 将一个普通的节点数组（带有指向父节点的指针）转换为嵌套的数据结构。
 * @param {*} data  一组数据
 * @param {*} option 包含以下字段的对象：
 *      parentProperty（String）：可以找到父节点链接的属性的名称。默认值：'pid'。
 *      childrenProperty（String）：将存储子节点的属性的名称。默认值：'children'。
 *      idProperty（String）：唯一的节点标识符。默认值：'id'。
 *      nameProperty（String）：节点的名称。默认值：'name'。
 */
function FlatToNested(data, option) {
  option = option || {};
  let idProperty = option.idProperty || 'id';
  let parentProperty = option.parentProperty || 'pid';
  let childrenProperty = option.childrenProperty || 'children';
  let res = [],
    tmpMap = [];
  for (let i = 0; i < data.length; i++) {
    tmpMap[data[i][idProperty]] = data[i];
    if (tmpMap[data[i][parentProperty]] && data[i][idProperty] != data[i][parentProperty]) {
      if (!tmpMap[data[i][parentProperty]][childrenProperty])
        tmpMap[data[i][parentProperty]][childrenProperty] = [];
      tmpMap[data[i][parentProperty]][childrenProperty].push(data[i]);
    } else {
      res.push(data[i]);
    }
  }
  return res;
}

/**
 * 嵌套型格式转扁平型格式
 * @param {Array} data 
 */
function NestedToFlat(data，pid) { 
  var res = []
  for (var i = 0; i < data.length; i++) {
    res.push({
      id: data[i].id,
      name: data[i].name,
      pid: pid || 0
    })
    if (data[i].children) {
      res = res.concat(NestedToFlat(data[i].children, data[i].id));
    }
  }
  return res;
}
```
回到顶部
5.使用方法
5.1 ”扁平型格式“转”嵌套型格式“

如果在实际开发中后端返回的数据跟如下实例数据中字段一致的情况下：
```
//示例数据
const data =[
  { id:1,   pid:0,  name:"父节点1"     },           
  { id:11,  pid:1,  name:"父节点11"    },
  { id:111, pid:11, name:"叶子节点111" },
  { id:112, pid:11, name:"叶子节点112" },
  { id:113, pid:11, name:"叶子节点113" },
  { id:114, pid:11, name:"叶子节点114" },
  { id:12,  pid:1,  name:"父节点12"    },
  { id:121, pid:12, name:"叶子节点121" },
  { id:122, pid:12, name:"叶子节点122" }
  //...
];

那么直接调用方法

FlatToNested(data)

即可将扁平化数据转化成嵌套型数据。

如果返回的数据和示例数据的字段不一致，那么您也无需更改源代码，方法提供了可配置选项，如下所示：

例如，您收到这样的数据：

const data =[
    { _id:1,   parentID:0,  text:"父节点1"     },           
    { _id:11,  parentID:1,  text:"父节点11"    },
    { _id:111, parentID:11, text:"叶子节点111" },
    { _id:112, parentID:11, text:"叶子节点112" },
    { _id:113, parentID:11, text:"叶子节点113" },
    { _id:114, parentID:11, text:"叶子节点114" },
    { _id:12,  parentID:1,  text:"父节点12"    },
    { _id:121, parentID:12, text:"叶子节点121" },
    { _id:122, parentID:12, text:"叶子节点122" }
    //...
  ];

那么，您可以这样调用函数：

FlatToNested(nodes,{
    idProperty:'_id',            //唯一的节点标识符。
    nameProperty:'text',         //节点的名称。
    parentProperty:'parentID',  //可以找到父节点链接的属性的名称。
    childrenProperty:'son'      //将存储子节点的属性的名称。
})
```
5.2 ”嵌套型格式“转”扁平型格式“
```
假如有如下嵌套型格式的数据：

let data = [
  {
      id:1,
      name:'根节点',
      children:[
        {
          id:11,
          name: '父节点11',
          children: [
            {
              id:111,
              name:'父节点111',
            },
            {
              id:112,
              name:'父节点112',
            }
          ]
        },
        {
          id:12,
          name:'父节点12',
        }
      ]
  }
]

那么直接调用方法

NestedToFlat(data)

即可将嵌套型数据转化成扁平型数据:

[
  { id: 1, name: '根节点', pid: 0 },
  { id: 11, name: '父节点11', pid: 1 },
  { id: 111, name: '父节点111', pid: 11 },
  { id: 112, name: '父节点112', pid: 11 },
  { id: 12, name: '父节点12', pid: 1 }
]
```