/**
 * Created by corsseir on 11/27/16.
 */

const {ipcMain} = require('electron')
const {Database, DatabaseOperation} = require('../libs/database')
const {IO} = require('../libs/io.js')
const fs = require ('fs')

let path = require('path')

class Location {
    init() {
        var self = this

        ipcMain.on('getLocation', function (event, arg) {
            self.get(arg.fileID, function (data) {
                event.returnValue = data
            })
        })
    }

    get(fileID, callback) {
        var data = {}

        DatabaseOperation.File_Location.GetAllFile_Location(fileID, null, null, null, function (err, fileLocations) {
            var quantity = fileLocations.length
            var i = 0

            fileLocations.forEach(function (fileLocation) {
                DatabaseOperation.Location.GetLocation(fileLocation.ID_Location, function (err, location) {
                    data[location.Type] = {
                        'path': location.Location
                    }
                    i++

                    if(i === quantity) {
                        callback(data)
                    }
                })
            })
        })
    }

    getNewPath(data, file, callback) {
        DatabaseOperation.File_Location.GetAllFile_Location(data.id, null, null, null, function (err, fileLocations) {
            fileLocations.forEach(function (fileLocation) {
                DatabaseOperation.Location.GetLocation(fileLocation.ID_Location, function (err, location) {
                    if (location.Type === 'local') {
                        var oldLocation = location.Location
                        var baseN = path.basename(oldLocation, '.pdf').toString()
                        var firstIndex = oldLocation.indexOf('Overwrite')
                        var lastIndex
                        var overwrite = firstIndex
                        var part
                        var newLocation

                        if(firstIndex !== -1) {
                            lastIndex = oldLocation.lastIndexOf(baseN)
                            part = oldLocation.slice(firstIndex, lastIndex)
                            oldLocation = oldLocation.replace(part, '')
                            firstIndex = oldLocation.lastIndexOf('__')
                            lastIndex = oldLocation.lastIndexOf('.')
                            part = oldLocation.slice(firstIndex, lastIndex)
                            oldLocation = oldLocation.replace(part, '')
                        }

                        newLocation = oldLocation.replace(file.Filename, data.name)

                        if (fs.existsSync(newLocation)) {
                            var ovPath

                            baseN = path.basename(newLocation, ".pdf").toString()
                            ovPath = './DockyLibrary/Zeskanowane/Overwrite/' + baseN
                            fs.mkdir(ovPath, function(err) {
                                IO.addToOverwrite(err, {}, location.Location, ovPath, baseN, function (result) {
                                    IO.removeFile(location.Location, function () {
                                        callback && callback(result.local, location)
                                    })
                                })
                            })
                        } else {
                            if(overwrite !== -1) {
                                IO.copyFile(location.Location, newLocation, function () {
                                    IO.removeFile(location.Location, function () {
                                        callback && callback(newLocation, location)
                                    })
                                })
                            } else {
                                IO.editFile(location.Location, newLocation, function () {
                                    callback && callback(newLocation, location)
                                })
                            }
                        }
                    }
                })
            })
        })
    }

    edit(data, file, equal, callback) {
        var self = this

        if(equal) {
            callback && callback()
        } else {
            self.getNewPath(data, file, function (newLocation, location) {
                DatabaseOperation.Location.UpdateLocation(location.ID_Location, location.Type, newLocation)
                callback && callback()
            })
        }
    }

    remove(fileID, callback) {
        var paths = []

        DatabaseOperation.File_Location.GetAllFile_Location(fileID, null, null, null, function (err, fileLocations) {
            var quantity = fileLocations.length
            var i = 0

            if(quantity === 0) {
                callback && callback(paths)
            } else {
                fileLocations.forEach(function (fileLocation) {
                    Database.serialize(function () {
                        DatabaseOperation.Location.GetLocation(fileLocation.ID_Location, function (err, location) {
                            if (location.Type === 'local') {
                                paths.push(location.Location)
                            }

                            DatabaseOperation.Location.DeleteLocation(fileLocation.ID_Location)
                            i++

                            if(i === quantity) {
                                callback && callback(paths)
                            }
                        })
                    })
                })
            }
        })
    }
}

new Location().init()

exports.Location = Location