/**
 * Created by corsseir on 11/27/16.
 */

const {ipcMain} = require('electron')
const {Database, DatabaseOperation} = require('../libs/database.js')
const {IO} = require('../libs/io.js')
const {Dialog} = require('../helpers/dialog.js')
const {File} = require('./file.js')

class Collection {
    get(collectionID, callback) {
        DatabaseOperation.Collection.GetCollection(collectionID, function (err, collection) {
            var data = collection
            callback && callback(data)
        })
    }

    add(data, callback) {
        DatabaseOperation.Collection.GetAllCollections(data.name, data.parent, null, null, function (err, collections) {
            if(collections.length === 0) {
                DatabaseOperation.Collection.CreateCollection(data.name, data.parent, function () {
                    DatabaseOperation.Collection.GetCollection(this.lastID, function (err, collection) {
                        var result = {
                            'collection': collection,
                            'status': 'success'
                        }
                        callback && callback(result)
                    })
                })
            }
            else {
                var result = {
                    'collection': null,
                    'status': 'exist'
                }
                callback && callback(result)
            }
        })
    }

    edit(data, callback) {
        DatabaseOperation.Collection.GetCollection(data.id, function (err, collection) {
            if(data.name === collection.Name) {
                callback && callback({'status': 'equal'})
            } else{
                DatabaseOperation.Collection.GetAllCollections(data.name, data.parent, null, null, function (err, collections) {
                    if(collections.length === 0) {
                        DatabaseOperation.Collection.UpdateCollection(data.id, data.name, data.parent)
                        callback && callback({'status': 'success'})
                    } else {
                        callback && callback({'status': 'exist'})
                    }
                })
            }
        })
    }

    removeFiles(data, callback) {
        DatabaseOperation.File_Collection.GetAllFile_Collection(null, data.collectionID, null, null, function (err, fileCollections) {
            var quantity = fileCollections.length
            var i = 0

            if(quantity === 0) {
                callback && callback()
            } else {
                fileCollections.forEach(function (fileCollection) {
                    new File().remove({
                        'fileID': fileCollection.ID_File,
                        'collectionID': fileCollection.ID_Collection,
                        'mode': data.mode
                    }, function () {
                        i++

                        if(i === quantity) {
                            callback && callback()
                        }
                    })
                })
            }
        })
    }

    removeCollections(data, self, callback) {
        DatabaseOperation.Collection.GetAllCollections(null, data.collectionID, null, null, function (err, collections) {
            if(collections.length === 0) {
                callback(data, {'status': 'success'})
            } else {
                collections.forEach(function (collection) {
                    var newData = {}
                    newData['collectionID'] = collection.ID_Collection
                    newData['collection'] = collection
                    newData['collectionPosition'] = collections[collections.length - 1]
                    newData['mode'] = data.mode
                    self.remove(newData, function (json) {
                        if(json.collectionPosition === json.collection) {
                            callback(data, {'status': 'success'})
                        }
                    })
                })
            }
        })
    }

    remove(data, callback) {
        var self = this

        self.removeFiles(data, function () {
            self.removeCollections(data, self, function (data, result) {
                callback && callback(data, result)
            })
        })
    }

    childrenCollections(collectionID, callback) {
        DatabaseOperation.Collection.GetAllCollections(null, collectionID, 'ID_Collection', 'ASC', function (err, collections) {
            var quantity = collections.length
            var i = 0
            var data = []

            if(quantity === 0) {
                callback && callback(data)
            } else {
                Database.serialize(function () {
                    collections.forEach(function (collection) {
                        DatabaseOperation.Collection.GetCollection(collection.ID_Collection, function (err, collection) {
                            data.push(collection)
                            i++

                            if(i === quantity) {
                                callback && callback(data)
                            }
                        })
                    })
                })
            }
        })
    }

    childrenFiles(collectionID, data, callback) {
        DatabaseOperation.File_Collection.GetAllFile_Collection(null, collectionID, 'ID_File', 'ASC', function (err, fileCollections) {
            var quantity = fileCollections.length
            var i = 0

            if(quantity === 0) {
                callback && callback(data)
            } else {
                Database.serialize(function () {
                    fileCollections.forEach(function (fileCollection) {
                        DatabaseOperation.File.GetFile(fileCollection.ID_File, function (err, file) {
                            data.push(file)
                            i++

                            if (i === quantity) {
                                callback && callback(data)
                            }
                        })
                    })
                })
            }
        })
    }

    children(self, collectionID, callback) {
        self.childrenCollections(collectionID, function (data) {
            self.childrenFiles(collectionID, data, function (data) {
                callback && callback(data)
            })
        })
    }

    scan(path, callback) {
        IO.scan(path, function(pdfs) {
            if(pdfs.length === 0) {
                callback && callback({'status': 'notFound'})
            } else {
                IO.addToLibAndDbFromScan(pdfs, function (collectionID) {
                    callback && callback({'status': 'found', 'collectionID': collectionID})
                })
            }
        })
    }

    constructor() {
        var self = this

        ipcMain.on('getCollection', function (event, arg) {
            self.get(arg.collectionID, function (data) {
                event.returnValue = data
            })
        })

        ipcMain.on('getChildren', function (event, arg) {
            self.children(self, arg.collectionID, function (data) {
                event.returnValue = data
            })
        })

        ipcMain.on('addCollection', function (event, arg) {
            self.add(arg.data, function (result) {
                event.returnValue = result
            })
        })

        ipcMain.on('editCollection', function (event, arg) {
            self.edit(arg.data, function (result) {
                event.returnValue = result
            })
        })

        ipcMain.on('removeCollection', function (event, arg) {
            self.remove(arg.data, function (data, result) {
                DatabaseOperation.Collection.DeleteCollection(data.collectionID)
                console.log(result)
                event.returnValue = result
            })
        })

        ipcMain.on('scanCollection', function (event, arg) {
            self.scan(arg.path, function (result) {
                event.returnValue = result
            })
        })
    }
}

new Collection()

exports.Collection = Collection