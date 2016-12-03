/**
 * Created by corsseir on 11/26/16.
 */

const ipc = require('electron').ipcMain

const Database = require('../libs/database').Database
const DatabaseOperation = require('../libs/database').DatabaseOperation

class File {
    get(fileID, callback) {
        var data = {}

        DatabaseOperation.File.GetFile(fileID, function (err, file) {
            data['name'] = file.Filename
            data['tag'] = []
            console.log(fileID)

            DatabaseOperation.File_Tag.GetAllFile_Tag(fileID, null, null, null, function (err, fileTags) {
                var quantity = fileTags.length
                var i = 0

                if(quantity === 0) {
                    callback && callback(data)
                } else {
                    Database.serialize(function () {
                        fileTags.forEach(function (fileTag) {
                            DatabaseOperation.Tag.GetTag(fileTag.ID_Tag, function (err, tag) {
                                data['tag'].push(tag.Value)
                                console.log(data)
                                i++
                                console.log(i)
                                if (i === quantity) {
                                    callback && callback(data)
                                }
                            })
                        })
                    })
                }
            })
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

    constructor() {
        var self = this

        ipc.on('getFile', function (event, arg) {
            self.get(arg.fileID, function (data) {
                event.returnValue = data
            })
        })

        ipc.on('copyFile', function (event, arg) {
            self.copy(arg.data, function (data) {
                event.sender.send('copyFileDone', data)
            })
        })

        ipc.on('cutFile', function (event, arg) {
            self.cut(arg.data, function (data) {
                event.sender.send('cutFileDone', data)
            })
        })
    }
}

new File()

exports.File = File

