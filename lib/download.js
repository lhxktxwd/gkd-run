const download = require('download-git-repo')
const path = require('path')
const ora = require('ora')

module.exports = function(target){
    target = path.join(target||'.','download-temp')
    return new Promise((reslove,reject)=>{
        let url='https://github.com:lhxktxwd/create-react-app#master';
        const spinner = ora(`正在下载项目模板，源地址：${url}`)
        spinner.start();

        download(url,target,{clone:true},(err)=>{
            if(err){
                spinner.fail()
                reject(err)
            }else{
                spinner.succeed()
                // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
                reslove(target)
            }
        })
    })
}
