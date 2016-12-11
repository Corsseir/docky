/**
 * Created by corsseir on 12/11/16.
 */

const {PDFJS} = require('../libs/pdf.js')

class MetaData {
    static get(path, callback) {
        var result = []
        var data = {}

        PDFJS.workerSrc = 'libs/pdf.worker.js'
        PDFJS.getDocument(path).then(function (pdf) {
            pdf.getMetadata().then(function (metadata) {
                if (typeof metadata !== 'undefined') {
                    if (typeof metadata.info !== 'undefined') {
                        if (typeof metadata.info.Author !== 'undefined') {
                            if(metadata.info.Author !== '')
                            {
                                data['author'] = metadata.info.Author.split(' ').join('_')
                                result.push(data)
                            }
                        }

                        if (typeof metadata.info.Title !== 'undefined') {
                            if(metadata.info.Title !== '') {
                                data['title'] = metadata.info.Title.split(' ').join('_')
                                result.push(data)
                            }
                        }

                        callback && callback(result)
                    } else {
                        callback && callback(result)
                    }
                } else {
                    callback && callback(result)
                }
            }).catch(function(err) {
                callback && callback(result)
            })
        }).catch(function(err) {
            callback && callback(result)
        })
    }
}

exports.MetaData = MetaData