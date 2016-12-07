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

class URLHandler {

    static downloadFile(url, callback) {
        download(url, function (fname) {
            let file = []
            if (fname != ''){
                callback && callback(null, fname)
            } else {
                callback && callback('get error', [])
            }
        })
    }

    static isFileInDb(url, callback){
        DatabaseOperation.File.GetAllFiles(null, null, null, function comp (err, rows){
            download(url, function (fname){
                if (fname === '') {
                    callback&&callback('err', null)
                } else {
                    createChecksum(fname, function (checksum) {
                        let r = rows.filter(isChecksumInArr, checksum)
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

function createChecksum (fpath, callback) {
    //console.log ('Tworze checksum')
    fpath = fpath.toString()
    let checksum = crypto.createHash('md5')
    let rs = fs.createReadStream(fpath)
    fs.readFile(fpath, function hashFile(err, data) {
        checksum.update(data, 'utf8')
        callback && callback(checksum.digest('hex'))
    })
}

function isChecksumInArr(element){
    return (element.Checksum === this)
}

function download(url, callback) {
    let parts = url.split('/')
    let parts2 = parts[parts.length - 1].split('.')
    //console.log(temp)
    let fname = path.join(temp, parts2[0] + '.pdf')
    //let fname =  temp + '/'  + parts2[0] + '.pdf'
    //fname = fname.toString()
    let pdf = fs.createWriteStream(fname)

    if (url.substring(0,5) ==='https') {
        //console.log('pobieram')
        https.get(url, function(response) {
            response.pipe(pdf)
            response.on('error', function() {
                //console.log('blad przy pobieraniu')
                callback && callback('')
            })
            response.on('end', function() {
                //console.log('pobrano')
                callback && callback(fname)
            })
        })
    } else if (url.substring(0,4) ==='http') {
        //console.log('pobieram')
        http.get(url, function(response) {
            response.pipe(pdf)
            response.on('error', function() {
                //console.log('blad przy pobieraniu')
                callback && callback('')
            })
            response.on('end', function() {
                //console.log('pobrano')
                callback && callback(fname)
            })
        })
    } else {
        //console.log('niepoprawny url')
        callback && callback('')
    }
}