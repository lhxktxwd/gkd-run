const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const remove = require("../lib/remove")
const fs = require("fs")
const path = require("path")

module.exports = function(context){
    const metadata = context.metadata
    const tempSrc = context.template
    const dest = './' + context.root
    let package_temp_content;

    if(!tempSrc){
        return Promise.reject(new Error(`无效的source：${tempSrc}`))
    }

    return new Promise((resolve,reject)=>{
        const metalsmith = Metalsmith(process.cwd())
        .metadata(metadata)
        .clean(false)
        .source(tempSrc)
        .destination(dest)

        //模板中忽略配置文件的地址
        const tempIgnorePath = path.resolve(process.cwd(),path.join(tempSrc,'templates.ignore'))
        //模板中packjson配置文件的地址
        const tempPackJsonPath = path.resolve(process.cwd(),path.join(tempSrc,'package_temp.json'))

        //处理ignore
        if(fs.existsSync(tempIgnorePath)){
            // 定义一个用于移除模板中被忽略文件的metalsmith插件
            metalsmith.use((files, metalsmith, done) => {
            const meta = metalsmith.metadata()
            // 先对ignore文件进行渲染，然后按行切割ignore文件的内容，拿到被忽略清单
            const ignores = Handlebars
                .compile(fs.readFileSync(ignoreFile).toString())(meta)
                .split('\n').map(s => s.trim().replace(/\//g, "\\")).filter(item => item.length);
            //删除被忽略的文件
            for (let ignorePattern of ignores) {
                if (files.hasOwnProperty(ignorePattern)) {
                    delete files[ignorePattern];
                }
            }
                done()
            })
        }

        //处理package
        if(fs.existsSync(tempPackJsonPath)){
            metalsmith.use((files, metalsmith, done) => {
                const meta = metalsmith.metadata();
                package_temp_content = Handlebars.compile(fs.readFileSync(tempPackJsonPath).toString())(meta);
                done();
            })
            metalsmith.use((files, metalsmith, done) => {
                const meta = metalsmith.metadata()
                Object.keys(files).forEach(fileName => {
                    const t = files[fileName].contents.toString()
                    if (fileName === "package.json")
                        files[fileName].contents = new Buffer(package_temp_content);
                    else
                        files[fileName].contents = new Buffer(Handlebars.compile(t)(meta));
                })
                done()
            }).build(err => {
                remove(tempSrc);
                err ? reject(err) : resolve(context);
            })
        }else{
            metalsmith.build(err => {
                remove(tempSrc);
                err ? reject(err) : resolve(context);
            })
        }
    })
}