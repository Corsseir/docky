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

//consts
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"


class AddFile {

    static addFile(fpath, collectionId, tags, callback){
        fpath = fpath.toString()

        if (fpath.substring(0,4) ==='http' || fpath.substring(0,5) ==='https') {
            urlHandler.downloadFile(fpath, (err, path) => {
                if (err) {
                    callback && callback({'status': 'error', 'file': err})
                } else {
                    this.libAndDb(path, fpath, collectionId, tags, callback)
                }
            })
        } else {
            this.libAndDb(fpath, '', collectionId, tags, callback)
        }

    }

    static libAndDb(fpath, url, collectionId, tags, callback){
        AddFileHelper.copyFileToLib(fpath,  (err, fileInfo) => {
            if (err){
                if (fileInfo){
                    callback(fileInfo)
                } else {
                    callback({'status': 'error', 'file': err})
                }
            } else {
                let currentDate = new Date ()
                fileInfo.Date = currentDate.toISOString()
                fileInfo.Url = url

                if(tags.length != 0) {
                    if(tags.length === 2) {
                        fileInfo.Autor = tags[0].author
                        fileInfo.Tytul = tags[0].title
                    } else if(tags.length === 1) {
                        if(typeof tags[0].author !== 'undefined'){
                            fileInfo.Autor = tags[0].author
                        } else if(typeof tags[0].title !== 'undefined') {
                            fileInfo.Tytul = tags[0].title
                        }
                    }
                }

                DO.MultiInsert.InsertAllInfo(collectionId, fileInfo, (err, fid) => {
                    fileInfo.ID_File = fid
                    callback && callback({'status': 'success', 'file': fileInfo})
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
                                callback && callback ({'status': 'error', 'name': 'mkdir err'}, null)
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
                        callback && callback({'status': 'exist', 'file': checksumInDb[0]}, {'status': 'exist', 'file': checksumInDb[0]})
                    }
                }
            })
        })
    }

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