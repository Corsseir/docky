/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
//node
const fs = require ('fs')
const scanner = require('./scanner.js').Scan
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation
const url = require('./urlHandler.js').URLHandler
const libraryMain = "./DockyLibrary"
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"

let path = require('path')
let pdfOpener = require('./pdfOpener.js').PDFopener
let adder = require('./addFile.js').AddFile

class IO {
    //funkcja przeznaczona do pierwszego uruchomienia

    static createLocalLib() {
        this.createDir(libraryMain)
        this.createDir(libraryPath)
        this.createDir(overwritePath)
    }

    //funkcja przeznaczona do przeszukiwania of wybranego z file dialog roota

    static scan(rootPath, callback) {
        let pdfs = scanner.scanDirs(rootPath)
        //console.log("Znalazłem: " + pdfs.length + " pdfów")

        if(pdfs.length === 0) {
            callback && callback(pdfs)
        } else {
            for (var i = 0; i < pdfs.length; i++) {
                if (pdfs[i].includes(libraryPath)) {
                    pdfs.splice(i, 1)
                } else {
                    //console.log("PDF: " + pdfs[i])
                }

                if(i === pdfs.length - 1) {
                    callback && callback(pdfs)
                }
            }
        }
    }

    static inSeqAdd (x, len, pdfs, self, collectionId, fileObj, callback){
        if( x < len ) {
            adder.addFile(pdfs[x], collectionId, function(result) {
                if (result.status === 'success'){
                    self.inSeqAdd(x+1, len, pdfs, self, collectionId, result.file, callback)
                } else {
                    self.inSeqAdd(x+1, len, pdfs, self, collectionId, {}, callback)
                }
            })
        }
        else {
            if (len === 1){
                callback({
                    'status': 'success',
                    'file': fileObj
                })

            } else {
                callback({
                    'status': 'success',
                    'count': len
                })
            }
        }
    }

    //Dodaje dowolną liczbę plików do lib i db, input to tablica
    static addToLibAndDb(pdfs, collectionId, callback) {
        let self = this
        let len = pdfs.length
        self.inSeqAdd(0, len, pdfs, self, collectionId, {}, callback)
    }

    static addToLibAndDbFromScan(pdfs, callback) {
        var self = this;

        DatabaseOperation.Collection.GetAllCollections('Zeskanowane', 1, null, null, function (err, rows) {
            if(rows.length === 0) {
                DatabaseOperation.Collection.CreateCollection("Zeskanowane", 1, function () {
                    var collectionId = this.lastID
                    self.addToLibAndDb(pdfs, collectionId, function () {
                        callback && callback(collectionId)
                    })
                })
            } else if(rows.length === 1) {
                self.addToLibAndDb(pdfs, rows[0].ID_Collection, function () {
                    //console.log('skończyłem')
                    callback && callback(rows[0].ID_Collection)
                })
            }
        })
    }


    //Utwórz katalog w wybranej ścieżce (synchroniczna)
    static createDir(path) {
        try {
            var stats = fs.lstatSync(path)
            //console.log("Katalog " + path + " już istnieje")
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fs.mkdirSync(path)
                //console.log("Stworzono katalog: " + path)
            }
            else {
                throw e
            }
        }
    }

    static copyFile(source, destination, callback) {
        fs.createReadStream(source).pipe(fs.createWriteStream(destination))
        callback && callback()
    }

    static editFile(previousLocation, newLocation, callback) {
        fs.rename(previousLocation, newLocation)
        callback && callback()
    }

    static removeFile(path, callback) {
        fs.exists(path, function (exists) {
            if (exists) {
                fs.unlink(path, function (err) {
                    if (err) {
                        alert("An error ocurred updating the file" + err.message)
                        //console.log(err);
                        return
                    }
                    //console.log("File succesfully deleted")
                    callback()
                })
            } else {
                alert("This file doesn't exist, cannot delete")
            }
        });
    }

    static addToOverwrite(err, result, filePath, ovPath, baseN, callback){
        if (err) {
            if (err.code === "EEXIST") {
                fs.readdir(ovPath, function getFolders(err, files) {
                    //console.log("Katalog o nazwie" + ovPath + "jest już utworzony w overwrite")
                    createOvFilePath(ovPath, baseN, files, function (newPath){
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                        createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                            callback && callback(resultObj)
                        })
                    })
                })
            }
        } else {
            //console.log("Katalog o nazwie" + ovPath + "zostanie utworzony w overwrite")
            var newPath = ovPath + "/" + baseN + "__1" + ".pdf"
            fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
            createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                callback && callback(resultObj)
            })
        }
    }
}

exports.IO = IO


//Dodaj plik do biblioteki, pomocnicza
// Uporządkowane addF, ponizej sama funkcja i funkcje jej dotycące
function createResult(resultObj, sysPath, libPath, type, callback) {
    resultObj.filesys = sysPath
    resultObj.local = libPath
    resultObj.type = type
    callback && callback (resultObj)
}

function createOvFilePath(ovFolderPath, baseN, files, callback) {
    var x = 0
    var max = 0
    for (var i = 0; i < files.length; i++) {
        var oldNumber = (parseInt(files[i].split("__").pop()))
        if (max < oldNumber) {
            max = oldNumber
        }
    }
    var newNumber = (max + 1).toString()
    var newName = "__" + newNumber
    var newPath = ovFolderPath + "/" + baseN + newName + ".pdf"
    callback && callback(newPath)
}