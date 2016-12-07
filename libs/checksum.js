/**
 * Created by micha on 06.12.2016.
 */
let crypto = require('crypto')
const fs = require ('fs')

class ChecksumCreator {
    static create(fpath, callback) {
        fpath = fpath.toString()
        let checksum = crypto.createHash('md5')
        let rs = fs.createReadStream(fpath)
        fs.readFile(fpath, function hashFile(err, data) {
            if (err){
                callback && callback('fileErr', null)
            } else {
                checksum.update(data, 'utf8')
                callback && callback(null, checksum.digest('hex'))
            }
        })
    }
}
exports.ChecksumCreator = ChecksumCreator