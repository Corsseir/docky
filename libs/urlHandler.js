/**
 * Created by mike on 01/12/16.
 */
let DatabaseOperation = require('./database.js').DatabaseOperation
const IO = require('./io.js').IO
let http = require('http')
let https = require('https')
let fs = require('fs')
const downloadPath = './DockyDownloads'
class URLHandler {

    static addFileFromURL(url) {
        downloadFile(url, function (fname) {
            let file = []
            file.push(fname)
            IO.addToLibAndDbFromScan(file)
        })
    }

    static isFileInDb(url, callback){
        DatabaseOperation.File.GetAllFiles(null, null, null, function comp (err, rows){
            downloadFile(url, function (fname){
                IO.createChecksum(fname, function (checksum){
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

function isChecksumInArr(element){
    return (element.Checksum === this)
}

function downloadFile(url, callback) {
    let parts = url.split('/')
    let parts2 = parts[parts.length - 1].split('.')
    IO.createDir(downloadPath)
    let fname = downloadPath + '/' + parts2[0] + '.pdf'

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