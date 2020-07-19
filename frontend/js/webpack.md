 常用的webpack优化方法

阅读目录

    1. 前言
    2. 提高 Webpack 打包速度
        2.1 优化Loader搜索范围
        2.2 cache-loader缓存loader处理结果
        2.3 使用多线程处理打包
        2.4 DllPlugin&DllReferencePlugin
        2.5 noParse
        2.6 IgnorePlugin
        2.7 打包文件分析工具
        2.8 费时分析
        2.9 一些小的优化点
    3. 减少 Webpack 打包后的文件体积
        3.1 对图片进行压缩和优化
        3.2 删除无用的CSS样式
        3.3 以CDN方式加载资源
        3.4 开启Tree Shaking
        3.5 开启Scope Hoisting
        3.6 按需加载&动态加载
    4. 总结

 
回到顶部
1. 前言

关于webpack，相信现在的前端开发人员一定不会陌生，因为它已经成为前端开发人员必不可少的一项技能，它的官方介绍如下：

    webpack 是一个模块打包器。webpack的主要目标是将 JavaScript 文件打包在一起，打包后的文件用于在浏览器中使用，但它也能够胜任转换(transform)、打包(bundle)或包裹(package)任何资源(resource or asset)。

在日常开发工作中，我们除了会使用webpack以及会编写它的配置文件之外，我们还需要了解一些关于webpack性能优化的方法，这样在实际工作就能够如虎添翼，增强自身的竞争力。

关于webpack优化的方法我将其分为两大类，如下：

    可以提高webpack打包速度，减少打包时间的优化方法
    可以让 Webpack 打出来的包体积更小的优化方法

OK，废话不多说，接下来我们就来分别了解一下优化方法。
回到顶部
2. 提高 Webpack 打包速度
2.1 优化Loader搜索范围

对于 Loader 来说，影响打包效率首当其冲必属 Babel 了。因为 Babel 会将代码转为字符串生成 AST，然后对 AST 继续进行转变最后再生成新的代码，项目越大，转换代码越多，效率就越低。当然了，我们是有办法优化的。

首先我们可以优化 Loader 的文件搜索范围，在使用loader时,我们可以指定哪些文件不通过loader处理,或者指定哪些文件通过loader处理。
```
module.exports = {
  module: {
    rules: [
      {
        // js 文件才使用 babel
        test: /\.js$/,
        use: ['babel-loader'],
        // 只处理src文件夹下面的文件
        include: path.resolve('src'),
        // 不处理node_modules下面的文件
        exclude: /node_modules/
      }
    ]
  }
}
```

对于 Babel 来说，我们肯定是希望只作用在 JS 代码上的，然后 node_modules 中使用的代码都是编译过的，所以我们也完全没有必要再去处理一遍。

另外，对于babel-loader，我们还可以将 Babel 编译过的文件缓存起来，下次只需要编译更改过的代码文件即可，这样可以大幅度加快打包时间。

loader: 'babel-loader?cacheDirectory=true'

2.2 cache-loader缓存loader处理结果

在一些性能开销较大的 loader 之前添加 cache-loader，以将处理结果缓存到磁盘里，这样下次打包可以直接使用缓存结果而不需要重新打包。
```
module.exports = {
  module: {
    rules: [
      {
        // js 文件才使用 babel
        test: /\.js$/,
        use: [
          'cache-loader',
          ...loaders
        ],
      }
    ]
  }
}
```
那这么说的话，我给每个loder前面都加上cache-loader，然而凡事物极必反，保存和读取这些缓存文件会有一些时间开销，所以请只对性能开销较大的 loader 使用 cache-loader。关于这个cache-loader更详细的使用方法请参照这里cache-loader
2.3 使用多线程处理打包

受限于Node是单线程运行的，所以 Webpack 在打包的过程中也是单线程的，特别是在执行 Loader 的时候，长时间编译的任务很多，这样就会导致等待的情况。那么我们可以使用一些方法将 Loader 的同步执行转换为并行，这样就能充分利用系统资源来提高打包速度了。
2.3.1 HappyPack

happypack ，快乐的打包。人如其名，就是能够让Webpack把打包任务分解给多个子线程去并发的执行，子线程处理完后再把结果发送给主线程。

```
module: {
  rules: [
    {
        test: /\.js$/,
        // 把对 .js 文件的处理转交给 id 为 babel 的 HappyPack 实例
        use: ['happypack/loader?id=babel'],
        exclude: path.resolve(__dirname, 'node_modules'),
    },
    {
        test: /\.css$/,
        // 把对 .css 文件的处理转交给 id 为 css 的 HappyPack 实例
        use: ['happypack/loader?id=css']
    }
  ]
},
plugins: [
  	new HappyPack({
        id: 'js', //ID是标识符的意思，ID用来代理当前的happypack是用来处理一类特定的文件的
        threads: 4, //你要开启多少个子进程去处理这一类型的文件
        loaders: [ 'babel-loader' ]
    }),
    new HappyPack({
        id: 'css',
        threads: 2,
        loaders: [ 'style-loader', 'css-loader' ]
    })
]
```


2.3.2 thread-loader

thread-loader ，在worker 池(worker pool)中运行加载器loader。把thread-loader 放置在其他 loader 之前， 放置在这个 thread-loader 之后的 loader 就会在一个单独的 worker 池(worker pool)中运行。
```
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve('src'),
        use: [
          {
              loader: "thread-loader",
              // 有同样配置的 loader 会共享一个 worker 池(worker pool)
              options: {
                  // 产生的 worker 的数量，默认是 cpu 的核心数
                  workers: 2,

                  // 一个 worker 进程中并行执行工作的数量
                  // 默认为 20
                  workerParallelJobs: 50,

                  // 额外的 node.js 参数
                  workerNodeArgs: ['--max-old-space-size', '1024'],

                  // 闲置时定时删除 worker 进程
                  // 默认为 500ms
                  // 可以设置为无穷大， 这样在监视模式(--watch)下可以保持 worker 持续存在
                  poolTimeout: 2000,

                  // 池(pool)分配给 worker 的工作数量
                  // 默认为 200
                  // 降低这个数值会降低总体的效率，但是会提升工作分布更均一
                  poolParallelJobs: 50,

                  // 池(pool)的名称
                  // 可以修改名称来创建其余选项都一样的池(pool)
                  name: "my-pool"
              }
          }, 
          {
              loader:'babel-loader'
          }
        ]
      }
    ]
  }
}
```
同样，thread-loader也不是越多越好，也请只在耗时的 loader 上使用。
2.3.3 webpack-parallel-uglify-plugin

在 Webpack3 中，我们一般使用 UglifyJS 来压缩代码，但是这个是单线程运行的，也就是说多个js文件需要被压缩，它需要一个个文件进行压缩。所以说在正式环境打包压缩代码速度非常慢(因为压缩JS代码需要先把代码解析成AST语法树，再去应用各种规则分析和处理AST，导致这个过程耗时非常大)。为了加快效率，我们可以使用 webpack-parallel-uglify-plugin 插件，该插件会开启多个子进程，把对多个文件压缩的工作分别给多个子进程去完成，但是每个子进程还是通过UglifyJS去压缩代码。无非就是变成了并行处理该压缩了，并行处理多个子任务，提高打包效率。来并行运行 UglifyJS，从而提高效率。

在 Webpack4 中，我们就不需要以上这些操作了，只需要将 mode 设置为 production 就可以默认开启以上功能。代码压缩也是我们必做的性能优化方案，当然我们不止可以压缩 JS 代码，还可以压缩 HTML、CSS 代码，并且在压缩 JS 代码的过程中，我们还可以通过配置实现比如删除 console.log 这类代码的功能。
```
let ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
module.exports = {
    module: {},
    plugins: [
        new ParallelUglifyPlugin({
            workerCount：3，//开启几个子进程去并发的执行压缩。默认是当前运行电脑的cPU核数减去1
            uglifyJs:{
                output:{
                    beautify:false，//不需要格式化
                    comments:false，//不保留注释
                }，
                compress:{
                    warnings:false，//在Uglify]s除没有用到的代码时不输出警告
                    drop_console:true，//删除所有的console语句，可以兼容ie浏览器
                    collapse_vars:true，//内嵌定义了但是只用到一次的变量
                    reduce_vars:true，//取出出现多次但是没有定义成变量去引用的静态值
                }
            }，
        })
    ]
}
```
关于该插件更加详细的用法请参照这里webpack-parallel-uglify-plugin
2.4 DllPlugin&DllReferencePlugin

DllPlugin 可以将特定的类库提前打包成动态链接库，在一个动态链接库中可以包含给其他模块调用的函数和数据，把基础模块独立出来打包到单独的动态连接库里，当需要导入的模块在动态连接库里的时候，模块不用再次被打包，而是去动态连接库里获取。这种方式可以极大的减少打包类库的次数，只有当类库更新版本才有需要重新打包，并且也实现了将公共代码抽离成单独文件的优化方案。

这里我们可以先将react、react-dom单独打包成动态链接库，首先新建一个新的webpack配置文件：webpack.dll.js
```
const path = require('path');
const DllPlugin = require('webpack/lib/DllPlugin');
module.exports = {
	// 想统一打包的类库
    entry:['react','react-dom'],
    output:{
        filename: '[name].dll.js',  //输出的动态链接库的文件名称，[name] 代表当前动态链接库的名称
        path:path.resolve(__dirname,'dll'),  // 输出的文件都放到 dll 目录下
        library: '_dll_[name]',//存放动态链接库的全局变量名称,例如对应 react 来说就是 _dll_react
    },
    plugins:[
        new DllPlugin({
            // 动态链接库的全局变量名称，需要和 output.library 中保持一致
            // 该字段的值也就是输出的 manifest.json 文件 中 name 字段的值
            // 例如 react.manifest.json 中就有 "name": "_dll_react"
            name: '_dll_[name]',
            // 描述动态链接库的 manifest.json 文件输出时的文件名称
            path: path.join(__dirname, 'dll', '[name].manifest.json')
        })
    ]
}
```
然后我们需要执行这个配置文件生成依赖文件:

webpack --config webpack.dll.js --mode development

接下来我们需要使用 DllReferencePlugin 将依赖文件引入项目中
```
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')
module.exports = {
  // ...省略其他配置
  plugins: [
    new DllReferencePlugin({
      // manifest 就是之前打包出来的 json 文件
      manifest:path.join(__dirname, 'dll', 'react.manifest.json')
    })
  ]
}
```
2.5 noParse

module.noParse 属性，可以用于配置那些模块文件的内容不需要进行解析（即无依赖） 的第三方大型类库（例如jquery,lodash）等，使用该属性让 Webpack 不扫描该文件，以提高整体的构建速度。
```
module.exports = {
    module: {
      noParse: /jquery|lodash/, // 正则表达式
      // 或者使用函数
      noParse(content) {
        return /jquery|lodash/.test(content)
      }
    }
}
```
2.6 IgnorePlugin

IgnorePlugin用于忽略某些特定的模块，让 webpack 不把这些指定的模块打包进去。
```
module.exports = {
  // ...省略其他配置
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale/,/moment$/)
  ]
}
```
webpack.IgnorePlugin()参数中第一个参数是匹配引入模块路径的正则表达式，第二个参数是匹配模块的对应上下文，即所在目录名。
2.7 打包文件分析工具

webpack-bundle-analyzer插件的功能是可以生成代码分析报告，帮助提升代码质量和网站性能。
```
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
module.exports={
      plugins: [
          new BundleAnalyzerPlugin({
            generateStatsFile: true, // 是否生成stats.json文件
          })  
        // 默认配置的具体配置项
        // new BundleAnalyzerPlugin({
        //   analyzerMode: 'server',
        //   analyzerHost: '127.0.0.1',
        //   analyzerPort: '8888',
        //   reportFilename: 'report.html',
        //   defaultSizes: 'parsed',
        //   openAnalyzer: true,
        //   generateStatsFile: false,
        //   statsFilename: 'stats.json', 
        //   statsOptions: null,
        //   excludeAssets: null,
        //   logLevel: info
        // })
  ]
}
```
使用方式：

"generateAnalyzFile": "webpack --profile --json > stats.json", // 生成分析文件
"analyz": "webpack-bundle-analyzer --port 8888 ./dist/stats.json" // 启动展示打包报告的http服务器

2.8 费时分析

speed-measure-webpack-plugin，打包速度测量插件。这个插件可以测量webpack构建速度，可以测量打包过程中每一步所消耗的时间，然后让我们可以有针对的去优化代码。

const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin');
const smw = new SpeedMeasureWebpackPlugin();
// 用smw.wrap()包裹webpack的所有配置项
module.exports =smw.wrap({
    module: {},
    plugins: []
});

2.9 一些小的优化点

我们还可以通过一些小的优化点来加快打包速度

    resolve.extensions：用来表明文件后缀列表，默认查找顺序是 ['.js', '.json']，如果你的导入文件没有添加后缀就会按照这个顺序查找文件。我们应该尽可能减少后缀列表长度，然后将出现频率高的后缀排在前面
    resolve.alias：可以通过别名的方式来映射一个路径，能让 Webpack 更快找到路径
```
module.exports ={
    // ...省略其他配置
    resolve: {
        extensions: [".js",".jsx",".json",".css"],
        alias:{
            "jquery":jquery
        }
    }
};
```
回到顶部
3. 减少 Webpack 打包后的文件体积
3.1 对图片进行压缩和优化

image-webpack-loader这个loder可以帮助我们对打包后的图片进行压缩和优化，例如降低图片分辨率，压缩图片体积等。
```
module.exports ={
    // ...省略其他配置
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|gif|jpeg|ico)$/,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            mozjpeg: {
                                progressive: true,
                                quality: 65
                            },
                            optipng: {
                                enabled: false,
                            },
                            pngquant: {
                                quality: '65-90',
                                speed: 4
                            },
                            gifsicle: {
                                interlaced: false,
                            },
                            webp: {
                                quality: 75
                            }
                        }
                    }
                ]
            }
        ]
    }
};
```
3.2 删除无用的CSS样式

有时候一些时间久远的项目，可能会存在一些CSS样式被迭代废弃，需要将其剔除掉，此时就可以使用purgecss-webpack-plugin插件，该插件可以去除未使用的CSS，一般与 glob、glob-all 配合使用。

注意：此插件必须和CSS代码抽离插件mini-css-extract-plugin配合使用。
```
例如我们有样式文件style.css：

body{
    background: red
}
.class1{
    background: red
}

这里的.class1显然是无用的，我们可以搜索src目录下的文件，删除无用的样式。

const glob = require('glob');
const PurgecssPlugin = require('purgecss-webpack-plugin');

module.exports ={
    // ...
    plugins: [
        // 需要配合mini-css-extract-plugin插件
        new PurgecssPlugin({
            paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, 
                  {nodir: true}), // 不匹配目录，只匹配文件
            })
        }),
    ]
}
```
3.3 以CDN方式加载资源

我们知道，一般常用的类库都会发布在CDN上，因此，我们可以在项目中以CDN的方式加载资源，这样我们就不用对资源进行打包，可以大大减少打包后的文件体积。

以CDN方式加载资源需要使用到add-asset-html-cdn-webpack-plugin插件。我们以CDN方式加载jquery为例：
```
const AddAssetHtmlCdnPlugin = require('add-asset-html-cdn-webpack-plugin')

module.exports ={
    // ...
    plugins: [
        new AddAssetHtmlCdnPlugin(true,{
            'jquery':'https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js'
        })
    ],
    //在配置文件中标注jquery是外部的，这样打包时就不会将jquery进行打包了
    externals:{
      'jquery':'$'
    }
}
```
3.4 开启Tree Shaking

Tree-shaking，摇晃树。顾名思义就是当我们摇晃树的时候，树上干枯的没用的叶子就会掉下来。类比到我们的代码中就是将没用的代码摇晃下来,从而实现删除代码中未被引用的代码。

这个功能在webpack4中，当我们将mode设置为production时，会自动进行tree-shaking。
```
来看下面代码：

main.js

import { minus } from "./calc";
console.log(minus(1,1));

calc.js

import {test} from './test';
export const sum = (a, b) => {
  return a + b + 'sum';
};
export const minus = (a, b) => {
  return a - b + 'minus';
};

test.js

export const test = ()=>{
    console.log('hello')
}
console.log(test());
```
观察上述代码其实我们主要使用minus方法,test.js代码是有副作用的!所谓"副作用"，官方文档如下解释：

    「副作用」的定义是，在导入时会执行特殊行为的代码，而不是仅仅暴露一个 export 或多个 export。举例说明，例如 polyfill，它影响全局作用域，并且通常不提供 export。

对上述代码进行打包后发现'hello'依然会被打印出来,这时候我们需要在package.json中配置配置不使用副作用：
```
{
  "sideEffects": false
}
```
如果这样设置，默认就不会导入css文件啦，因为我们引入css也是通过import './style.css'

这里重点就来了,tree-shaking主要针对es6模块,我们可以使用require语法导入css,但是这样用起来有点格格不入,所以我们可以配置css文件不是副作用，如下：
```
{
    "sideEffects":[
        "**/*.css"
    ]
}
```
3.5 开启Scope Hoisting

Scope Hoisting 可以让 Webpack 打包出来的代码文件更小、运行的更快， 它又译作 "作用域提升"，是在 Webpack3 中新推出的功能。

由于最初的webpack转换后的模块会包裹上一层函数,import会转换成require，因为函数会产生大量的作用域，运行时创建的函数作用域越多，内存开销越大。而Scope Hoisting 会分析出模块之间的依赖关系，尽可能的把打包出来的模块合并到一个函数中去，然后适当地重命名一些变量以防止命名冲突。这个功能在webpack4中，当我们将mode设置为production时会自动开启。
```
比如我们希望打包两个文件

let a = 1;
let b = 2;
let c = 3;
let d = a+b+c
export default d;
// 引入d
import d from './d';
console.log(d)

最终打包后的结果会变成 console.log(6)，这样的打包方式生成的代码明显比之前的少多了，并且减少多个函数后内存占用也将减少。如果你希望在开发模式development中开启这个功能，只需要使用插件 webpack.optimize.ModuleConcatenationPlugin() 就可以了。

module.exports = {
  // ...
  plugins: [
    // 开启 Scope Hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),
  ]
}
```
3.6 按需加载&动态加载

必大家在开发单页面应用项目的时候，项目中都会存在十几甚至更多的路由页面。如果我们将这些页面全部打包进一个文件的话，虽然将多个请求合并了，但是同样也加载了很多并不需要的代码，耗费了更长的时间。那么为了首页能更快地呈现给用户，我们肯定是希望首页能加载的文件体积越小越好，这时候我们就可以使用按需加载，将每个路由页面单独打包为一个文件。在给单页应用做按需加载优化时，一般采用以下原则：

    对网站功能进行划分，每一类一个chunk
    对于首次打开页面需要的功能直接加载，尽快展示给用户,某些依赖大量代码的功能点可以按需加载
    被分割出去的代码需要一个按需加载的时机

动态加载目前并没有原生支持，需要babel的插件：plugin-syntax-dynamic-import。安装此插件并且在.babelrc中配置：
```
{
  // 添加
  "plugins": ["transform-vue-jsx", "transform-runtime"],
  
}

例如如下示例：

index.js

let btn = document.createElement('button');
btn.innerHTML = '点击加载视频';
btn.addEventListener('click',()=>{
    import(/* webpackChunkName: "video" */'./video').then(res=>{
        console.log(res.default);
    });
});
document.body.appendChild(btn);

webpack.config.js

module.exports = {
    // ...
    output:{
      chunkFilename:'[name].min.js'
    }
}
```
这样打包后的结果最终的文件就是 video.min.js，并且刚启动项目时不会加载该文件，只有当用户点击了按钮时才会动态加载该文件。
回到顶部
4. 总结

以上就是一些常用的webpack优化手段，当然webpack优化手段还有很多，并且用法也有很多。需要的话可以阅读官方文档来深入学习。