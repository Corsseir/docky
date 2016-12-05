/**
 * Created by micha on 02.12.2016.
 */
const fs = require('fs')
const db = require('./database.js').DatabaseOperation

class FileWatcher {
    static startWatch(){
        db.Location.GetAllLocations(null, null, null, null, function(err, rows){
            if (!err){
                for (let i = 0; i < rows.length; i++){
                    fs.access(rows[i].Location, fs.constants.R_OK, function(err) {
                        if (err) {
                            db.Location.DeleteLocation(rows[i].ID_Location)
                            console.log("Usunieto " + rows[i].Location)
                        } else {
                            if (rows[i].Type === "global"){
                                watch(rows[i])
                            }
                        }
                    })
                }
            }
        })
    }

    static startSingleWatch(locationID) {
        db.Location.GetLocation(locationID, function(err, row){
            fs.access(row.Location, fs.constants.R_OK, function(err) {
                if (err) {
                    db.Location.DeleteLocation(row.ID_Location)
                    console.log("Usunieto " + row.Location)
                } else {
                    watch(row)
                }
            })
        })
    }

}
exports.FileWatcher = FileWatcher

function watch (row) {
    fs.watch(row.Location, function (eventType, filename){
        if (eventType === 'rename'){
            fs.access(row.Location, fs.constants.R_OK, function(err) {
                if (err) {
                    db.Location.DeleteLocation(row.ID_Location)
                    console.log('Usunieto ' + row.Location)
                }
            })
        }
    })
}



