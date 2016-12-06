/**
 * Created by corsseir on 04.12.16.
 */

const {ipcMain} = require('electron')
const {Database, DatabaseOperation} = require('../libs/database.js')

class Tag {
    get(fileID, callback) {
        var data = {'tag': []}

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

    getAll(callback) {
        DatabaseOperation.Tag.GetAllTags(null, null, 'ID_Tag', 'ASC', function (err, tags) {
            callback && callback(tags)
        })
    }

    unique(tags, callback){
        var firstIndex
        var secondIndex
        var result = tags

        for(var i = 0; i < tags.length; i++) {
            firstIndex = result.indexOf(tags[i])
            secondIndex = result.lastIndexOf(tags[i])

            if(firstIndex !== secondIndex) {
                result.splice(secondIndex, 1)
                i--
            }

            if(i === tags.length - 1) {
                callback && callback(result)
            }
        }
    }

    add(data, callback) {
        var self = this

        if(data.tag !== '') {
            var tags = data.tag.split(' ')
            var i = 0

            self.unique(tags, function (result) {
                var quantity = result.length

                result.forEach(function (tag) {
                    Database.serialize(function () {
                        DatabaseOperation.Tag.GetAllTags(null, tag, null, null, function (err, tags) {
                            Database.serialize(function () {
                                if (tags.length === 1) {
                                    DatabaseOperation.File_Tag.CreateFile_Tag(data.id, tags[0].ID_Tag)
                                } else if (tags.length === 0) {
                                    DatabaseOperation.Tag.CreateTag('Tag', tag, function () {
                                        DatabaseOperation.File_Tag.CreateFile_Tag(data.id, this.lastID)
                                    })
                                }

                                i++

                                if(i === quantity) {
                                    callback && callback()
                                }
                            })
                        })
                    })
                })
            })
        } else {
            callback && callback()
        }
    }

    remove(fileID, callback) {
        DatabaseOperation.File_Tag.GetAllFile_Tag(fileID, null, null, null, function (err, fileTagByFile) {
            var quantity = fileTagByFile.length
            var i = 0

            if(quantity === 0) {
                callback && callback()
            } else {
                fileTagByFile.forEach(function (fileTag) {
                    DatabaseOperation.File_Tag.GetAllFile_Tag(null, fileTag.ID_Tag, null, null, function (err, fileTagByTag) {
                        if (fileTagByTag.length === 1) {
                            DatabaseOperation.Tag.DeleteTag(fileTagByTag[0].ID_Tag)
                        } else {
                            DatabaseOperation.File_Tag.DeleteFile_Tag(fileID, fileTag.ID_Tag)
                        }

                        i++

                        if(i === quantity) {
                            callback && callback()
                        }
                    })
                })
            }
        })
    }

    init() {
        var self = this

        ipcMain.on('getTags', function (event, arg) {
            self.get(arg.fileID, function (data) {
                event.returnValue = data
            })
        })
    }
}

new Tag().init()

exports.Tag = Tag