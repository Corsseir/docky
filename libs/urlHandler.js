/**
 * Created by mike on 01/12/16.
 */
let DatabaseOperation = require('./database.js').DatabaseOperation
let http = require('http')
let https = require('https')
let fs = require('fs')
let crypto = require('crypto')
let temp = require('os').tmpdir()
let path = require('path')
let u = require('url')

class URLHandler {

    static downloadFile(url, callback) {
        UrlHelper.download(url, function (fname) {
            let file = []
            if (fname != ''){
                callback && callback(null, fname)
            } else {
                callback && callback('wrong_url', [])
            }
        })
    }

    static isFileInDb(url, callback){
        DatabaseOperation.File.GetAllFiles(null, null, null, function comp (err, rows){
            download(url, function (fname){
                if (fname === '') {
                    callback&&callback('err', null)
                } else {
                    UrlHelper.createChecksum(fname, function (checksum) {
                        let r = rows.filter(UrlHelper.isChecksumInArr, checksum)
                        if (r.length > 1) {
                            callback && callback(null, true)
                        } else {
                            callback && callback(null, false)
                        }
                    })
                }
            })
        })
    }
}

exports.URLHandler = URLHandler

class UrlHelper {

    static createChecksum (fpath, callback) {
        //console.log ('Tworze checksum')
        fpath = fpath.toString()
        let checksum = crypto.createHash('md5')
        let rs = fs.createReadStream(fpath)
        fs.readFile(fpath, function hashFile(err, data) {
            checksum.update(data, 'utf8')
            callback && callback(checksum.digest('hex'))
        })
    }

    static isChecksumInArr(element){
        return (element.Checksum === this)
    }

    static download(url, callback) {
        let parts = url.split('/')
        let parts2 = parts[parts.length - 1].split('.')
        //console.log(temp)
        let fname = path.join(temp, parts2[0] + '.pdf')
        //let fname =  temp + '/'  + parts2[0] + '.pdf'
        //fname = fname.toString()
        let pdf = fs.createWriteStream(fname)

        if (url.substring(0,5) ==='https') {
            //console.log('pobieram')
            let req = https.get(url, function(response) {
                response.pipe(pdf)
                response.on('error', function() {
                    //console.log('blad przy pobieraniu')
                    callback && callback('')
                })
                response.on('end', function() {
                    //console.log('pobrano')
                    if (response.statusCode === 200) {
                        callback && callback(fname)
                    } else {
                        callback && callback('')
                    }
                })
            })
            req.on('error', (err)=> {
                callback && callback('')
            })
            req.end()
        } else if (url.substring(0,4) ==='http') {
            //console.log('pobieram')
            let req = http.get(url, function(response) {
                console.log(response.statusCode)
                response.on('error', function() {
                    //console.log('blad przy pobieraniu')
                    callback && callback('')
                })
                response.on('end', function() {
                    //console.log('pobrano')
                    if (response.statusCode === 200) {
                        callback && callback(fname)
                    } else {
                        callback && callback('')
                    }
                })
            })
            req.on('error', (err)=> {
                callback && callback('')
            })
            req.end()
        } else {
            callback && callback('')
        }
    }
}