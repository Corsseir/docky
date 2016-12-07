/**
 * Created by corsseir on 11/26/16.
 */

const {ipcMain} = require('electron')
const {Database, DatabaseOperation} = require('../libs/database.js')
const {IO} = require('../libs/io.js')
const {Tag} = require('./tag.js')
const {Location} = require('./location.js')
const fs = require ('fs')

class File {
    get(fileID, callback) {
        var data = {}

        DatabaseOperation.File.GetFile(fileID, function (err, file) {
            data['file'] = file
            callback && callback(data)
        })
    }

    add(data, callback) {
        if(fs.existsSync(data.path) || data.path.substring(0,4) ==='http') {
            IO.addToLibAndDb([data.path], data.parent, function (result) {
                if (result.status === 'success') {
                    DatabaseOperation.File.GetFile(result.fileID, function (err, file) {
                        result['file'] = file
                        if (data.tag.length !== 0) {
                            data['id'] = file.ID_File
                            new Tag().add(data, function () {
                                callback && callback(result)
                            })
                        } else {
                            callback && callback(result)
                        }
                    })
                } else {
                    callback && callback(result)
                }
            })
        } else {
            callback && callback({'status': 'not_exist'})
        }
    }

    edit(data, callback) {
        DatabaseOperation.File.GetFile(data.id, function (err, file) {
            var equal = false

            if(file.Filename === data.name) {
                equal = true
            }

            new Location().edit(data, file, equal, function () {
                new Tag().remove(data.id, function () {
                    new Tag().add(data, function () {
                        DatabaseOperation.File.UpdateFile(data.id, file.ID_BLOB, data.name, file.Checksum)
                        callback && callback({'status': 'success'})
                    })
                })
            })
        })
    }

    remove(data, callback) {
        var fileID = data.fileID
        var collectionID = data.collectionID
        var mode = data.mode

        DatabaseOperation.File_Collection.GetAllFile_Collection(fileID, null, null, null, function (err, rows) {
            var quantity = rows.length

            if(quantity === 1 || mode === 'global') {
                new Tag().remove(fileID, function () {
                    new Location().remove(fileID, function (paths) {
                        var quantity = paths.length
                        var i = 0

                        if(quantity === 0) {
                            callback && callback({'status': 'success'})
                        } else {
                            paths.forEach(function (path) {
                                IO.removeFile(path, function () {
                                    DatabaseOperation.File.DeleteFile(fileID)
                                })

                                i++

                                if(i === quantity) {
                                    callback && callback({'status': 'success'})
                                }
                            })
                        }
                    })
                })
            } else {
                DatabaseOperation.File_Collection.DeleteFile_Collection(fileID, collectionID)
                callback && callback({'status': 'success'})
            }
        })
    }

    copy(data, callback) {
        DatabaseOperation.File_Collection.GetAllFile_Collection(data.fileID, data.collectionID, null, null, function (err, fileCollections) {
            if(fileCollections.length === 0) {
                DatabaseOperation.File_Collection.CreateFile_Collection(data.fileID, data.collectionID)
                callback && callback({'status': 'success'})
            } else {
                callback && callback({'status': 'exist'})
            }
        })
    }

    cut(data, callback) {
        console.log(data.previousCollectionID)
        this.copy(data, function(result) {
            if(result.status === 'success') {
                DatabaseOperation.File_Collection.DeleteFile_Collection(data.fileID, data.previousCollectionID)
                callback && callback(result)
            } else {
                callback && callback(result)
            }
        })
    }

    init() {
        var self = this

        ipcMain.on('getFile', function (event, arg) {
            self.get(arg.fileID, function (data) {
                event.returnValue = data
            })
        })

        ipcMain.on('addFile', function (event, arg) {
            self.add(arg.data, function (result) {
                event.returnValue = result
            })
        })

        ipcMain.on('editFile', function (event, arg) {
            self.edit(arg.data, function (result) {
                event.returnValue = result
            })
        })

        ipcMain.on('removeFile', function (event, arg) {
            self.remove(arg.data, function (result) {
                event.returnValue = result
            })
        })

        ipcMain.on('copyFile', function (event, arg) {
            self.copy(arg.data, function (data) {
                event.sender.send('copyFileDone', data)
            })
        })

        ipcMain.on('cutFile', function (event, arg) {
            self.cut(arg.data, function (data) {
                event.sender.send('cutFileDone', data)
            })
        })
    }
}

new File().init()

exports.File = File

