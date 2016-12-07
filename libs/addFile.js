/**
 * Created by micha on 06.12.2016.
 */
//node
const fs = require ('fs')
const path = require ('path')
//own
const Database = require('./database.js').Database
const DO = require('./database.js').DatabaseOperation
let checksum = require('./checksum.js').ChecksumCreator
const urlHandler = require('./urlHandler.js').URLHandler
//other
//const {PDFJS} = require('../libs/pdf.js')
//consts
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"


class AddFile {

    static addFile(fpath, collectionId, callback){
        fpath = fpath.toString()

        if (fpath.substring(0,4) ==='http' || fpath.substring(0,5) ==='https') {
            urlHandler.downloadFile(fpath, (err, path) => {
                if (err) {
                    callback && callback(err, null)
                } else {
                    this.libAndDb(path, fpath, collectionId, callback)
                }
            })
        } else {
            this.libAndDb(fpath, '', collectionId, callback)
        }

    }

    static libAndDb(fpath, url, collectionId, callback){
        AddFileHelper.copyFileToLib(fpath,  (err, fileInfo) => {
            if (err){
                callback(err, null)
            } else {
                let currentDate = new Date ()
                fileInfo.Date = currentDate.toDateString()
                fileInfo.Url = url
                let tags = {"Autor":"A", "Tytul":"T"}
                DO.MultiInsert.InsertAllInfo(collectionId, fileInfo, tags, (fid) => {
                    callback(null, fid)
                })
            }
        })
    }

}
exports.AddFile = AddFile

class AddFileHelper {

    static copyFileToLib (fpath, callback) {
        //console.log('copy ' + fpath)
        let filename = path.basename(fpath, ".pdf")
        checksum.create(fpath, (err, checksum) =>{
            DO.File.GetAllFiles(null, null, null, (err, rows) => {
                if (err){
                    callback && callback({'status': 'error', 'name': filename}, null)
                } else {
                    let checksumInDb = rows.filter(AddFileFinder.isChecksumInDb, checksum)
                    if (checksumInDb.length < 1) {
                        PathHanlder.resolvePath(fpath, rows, (finalpath) => {
                            if (finalpath === fpath){
                                callback && callback ({'status': 'mkdirerr', 'name': filename}, null)
                            } else {
                                //console.log('resolved' + fpath)
                                PathHanlder.copyFile(fpath, finalpath, ()=> {
                                    let finfo = {'Filename':filename, 'Path':finalpath, 'Checksum':checksum}
                                    //console.log('copied ' + fpath)
                                    callback && callback (null, finfo)
                                })
                            }
                        })
                    } else {
                        callback && callback({'status': 'exist', 'name': filename}, null)
                    }
                }
            })
        })
    }

/*    static getMetadata(fpath){
        console.log('meta')
    }*/
}

class PathHanlder {
    static resolvePath(fpath, rows, callback){
        //console.log('resolve ' + fpath)
        let filename = path.basename(fpath, '.pdf')
        let possiblePath = libraryPath + "/" + filename + ".pdf"
        let pathInDb = rows.filter(AddFileFinder.isPathTaken, possiblePath)
        if (pathInDb.length < 1){
            callback && callback(possiblePath)
        } else {
            let ovDir = overwritePath + '/' + filename
            //console.log("Ovdir: " + ovDir)
            let ovs = rows.filter(AddFileFinder.isPathPart, ovDir)
            if (ovs.length < 1) {
                fs.mkdir(ovDir, (err)=> {
                    if (err) {
                        //console.log('error')
                        callback(fpath)
                    } else {
                        let finalPath = ovDir + "/" + filename + "__1.pdf"
                        callback && callback(finalPath)
                    }
                })
            } else {
                let max = 0
                ovs.forEach((ov) => {
                    let oldNumber = (parseInt((ov.Path.split("__").pop())))
                    if (oldNumber > max){
                        max = oldNumber
                    }
                })
                let finalPath = ovDir + "/" + filename + "__" + (max + 1).toString() + ".pdf"
                callback && callback(finalPath)
            }
        }
    }

    static copyFile(source, destination, callback) {
        fs.createReadStream(source).pipe(fs.createWriteStream(destination))
        callback && callback()
    }
}


class AddFileFinder {

    static isPathTaken(element){
        return element.Path === this
    }

    static isChecksumInDb(element){
        return element.Checksum === this
    }

    static isPathPart (element){
        return element.Path.includes(this)
    }

}