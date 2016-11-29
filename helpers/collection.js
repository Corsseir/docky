/**
 * Created by corss on 11/9/2016.
 */

class CollectionHelper {
    static getRootCollection(rows) {
        var rootCollection

        for(var i=0; i< rows.length; i++) {
            if(rows[i].ID_ParentCollection === null) {
                rootCollection = rows[i]
                break
            }
        }

        return rootCollection
    }
}

exports.CollectionHelper = CollectionHelper