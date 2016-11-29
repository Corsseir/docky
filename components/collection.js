/**
 * Created by corsseir on 11/27/16.
 */

const ipc = require('electron').ipcMain

const Database = require('../libs/database').Database
const DatabaseOperation = require('../libs/database').DatabaseOperation
const IO = require('../libs/io.js').IO

class Collection {
    get(collectionID, callback) {
        DatabaseOperation.Collection.GetCollection(collectionID, function (err, collection) {
            var data = {
                'id': collection.ID_Collection,
                'name': collection.Name,
                'parent': collection.ID_ParentCollection,
            }
            callback(data)
        })
    }

    edit(data) {
        var id = data.id
        var name = data.name

        DatabaseOperation.Collection.GetCollection(id, function (err, collection) {
            DatabaseOperation.Collection.UpdateCollection(id, name, collection.ID_ParentCollection)
        })
    }

    remove(data, callback) {
        var self = this

        console.log(data)

        Database.serialize(function () {
            DatabaseOperation.File_Collection.GetAllFile_Collection(null, data.collectionID, null, null, function (err, fileCollections) {
                console.log(fileCollections.length)
                fileCollections.forEach(function (fileCollection) {
                    IO.removeFile(fileCollection.ID_File, fileCollection.ID_Collection, data.mode)
                })
            })
        })
        Database.serialize(function () {
            DatabaseOperation.Collection.GetAllCollections(null, data.collectionID, null, null, function (err, collections) {
                if(collections.length === 0) {
                    callback(data)
                } else {
                    collections.forEach(function (collection) {
                        var newData = {}
                        newData['collectionID'] = collection.ID_Collection
                        newData['collection'] = collection
                        newData['collectionPosition'] = collections[collections.length - 1]
                        newData['mode'] = data.mode
                        self.remove(newData, function (json) {
                            if(json.collectionPosition === json.collection) {
                                callback(data)
                            }
                        })
                    })
                }
            })
        })
    }

    init() {
        var self = this

        ipc.on('getCollection', function (event, arg) {
            self.get(arg.collectionID, function (data) {
                event.returnValue = data
            })
        })

        ipc.on('editCollection', function (event, arg) {
            self.edit(arg.data)
            event.returnValue = {'status': 'success'}
        })

        ipc.on('removeCollection', function (event, arg) {
            self.remove(arg.data, function (data) {
                DatabaseOperation.Collection.DeleteCollection(data.collectionID)
            })
            event.returnValue = {'status': 'success'}
        })
    }
}

new Collection().init()