/**
 * Created by corsseir on 11/26/16.
 */

const ipc = require('electron').ipcMain

const Database = require('../libs/database').Database
const DatabaseOperation = require('../libs/database').DatabaseOperation

class File {
    getTag(tagID, callback) {
        var data = {}

        DatabaseOperation.Tag.GetTag(tagID, function (err, tag) {
            data['tag'] = tag.Value
            callback(data)
        })
    }

    getFileData(fileID, callback) {
        var data = {}

        DatabaseOperation.File.GetFile(fileID, function (err, file) {
            data['name'] = file.Filename
            data['tagIDs'] = []

            DatabaseOperation.File_Tag.GetAllFile_Tag(fileID, null, null, null, function (err, fileTags) {
                fileTags.forEach(function (fileTag) {
                    data['tagIDs'].push(fileTag.ID_Tag)
                })
                callback(data)
            })
        })
    }

    copy(data, callback) {
        DatabaseOperation.File_Collection.GetAllFile_Collection(data.fileID, data.collectionID, null, null, function (err, fileCollections) {
            if(fileCollections.length === 0) {
                DatabaseOperation.File_Collection.CreateFile_Collection(data.fileID, data.collectionID)
                callback({'status': 'success'})
            } else {
                callback({'status': 'exist'})
            }
        })
    }

    init() {
        var self = this

        ipc.on('getFileData', function (event, arg) {
            self.getFileData(arg.fileID, function (data) {
                event.returnValue = {'data': data}
            })
        })

        ipc.on('getTag', function (event, arg) {
            self.getTag(arg.tagID, function (data) {
                event.returnValue = {'data': data}
            })
        })

        ipc.on('copyFile', function (event, arg) {
            self.copy(arg.data, function (result) {
                event.returnValue = result
            })
        })
    }
}

new File().init()

