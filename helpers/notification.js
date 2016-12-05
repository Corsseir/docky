/**
 * Created by corsseir on 03.12.16.
 */

class Notification {
    block(callback) {
        $('.block').fadeIn(100, function () {
            callback && callback()
        })
    }

    unblock(callback) {
        $('.block').fadeOut(100, function () {
            callback && callback()
        })
    }

    show(content, time, callback) {
        var self = this
        var div = document.createElement('div')
        var i = document.createElement('i')
        var span = document.createElement('span')

        div = $(div)
        div.append(i)
        div.append(span)
        div.find('i').addClass('fa')
        div.find('i').addClass('fa-info-circle')
        div.find('span').text(content)
        div.addClass('notification')

        self.hide(function () {
            $('body').append(div)
            $('.notification').fadeIn(250, function () {
                if(time > 0) {
                    setTimeout(self.hide, time)
                }
                callback && callback()
            })
        })
    }

    hide(callback) {
        if($('.notification').length === 0) {
            callback && callback()
        } else {
            $('.notification').fadeOut(100, function () {
                $('.notification').remove()
                callback && callback()
            })
        }
    }
}

exports.Notification = Notification