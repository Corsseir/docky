/**
 * Created by mike on 01/12/16.
 */
let DatabaseOperation = require('./database.js').DatabaseOperation
let http = require('http')
let https = require('https')
let fs = require('fs')
let crypto = require('crypto')
let temp = require('os').tmpdir()

class URLHandler {

    static downloadFile(url, callback) {
        download(url, function (fname) {
            let file = []
            console.log('Rozpoczynam przekazanie ' + fname + ' ooo ')
            file.push(fname)
            callback && callback(file)
        })
    }

    static isFileInDb(url, callback){
        DatabaseOperation.File.GetAllFiles(null, null, null, function comp (err, rows){
            download(url, function (fname){
                createChecksum(fname, function (checksum){
                    let r = rows.filter(isChecksumInArr, checksum)
                    if (r.length > 1) {
                        callback && callback(true)
                    } else {
                        callback && callback(false)
                    }
                })
            })
        })
    }
}

exports.URLHandler = URLHandler

function createChecksum (fpath, callback) {
    console.log ('Tworze checksum')
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
    console.log(temp)
    let fname =  temp + '' + parts2[0] + '.pdf'
    let pdf = fs.createWriteStream(fname)

    if (url.substring(0,5) ==='https') {
        console.log('pobieram')
        https.get(url, function(response) {
            response.pipe(pdf)
            response.on('end', function() {
                console.log('pobrano')
                callback && callback(fname)
            })
        })
    } else if (url.substring(0,4) ==='http') {
        console.log('pobieram')
        http.get(url, function(response) {
            response.pipe(pdf)
            response.on('end', function() {
                console.log('pobrano')
                callback && callback(fname)
            })
        })
    } else {
        console.log('niepoprawny url')
    }
}