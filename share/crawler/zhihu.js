const jsdom = require('jsdom');
const http = require('http');
const fs = require('fs');

var url = 'https://www.zhihu.com/topic/19550429/hot'
catchPage(url);

// var index = 1;

function catchPage(url){
    http.get(url, function(res) {
        var html = '';
        res.on('data', function(data) {
            html += data;
        });
        res.on('end', function() {
            var  $ = cheerio.load(html,{
                decodeEntities: false
            })
            handleHtml($);
        });
    });
}



function handleHtml($){

    var html = $.html();
    var content = html;

    fs.writeFile('zhihu.txt',content,{
        flag:'w'
    });
}

