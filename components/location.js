/**
 * Created by corsseir on 11/27/16.
 */

const {ipcMain} = require('electron')
const {Database, DatabaseOperation} = require('../libs/database')

class Location {
    constructor() {
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
}

new Location()