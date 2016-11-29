/**
 * Created by corss on 11/9/2016.
 */

class FileHelper {
    static search(id, rows) {
        var file

        for(var i=0; i< rows.length; i++) {
            if(rows[i].ID_File === parseInt(id)) {
                file = rows[i]
                break
            }
        }

        return file
    }
}

exports.CollectionHelper = FileHelper