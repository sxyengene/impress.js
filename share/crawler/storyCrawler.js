const cheerio = require('cheerio');
const http = require('http');
const fs = require('fs');

var host = 'http://m.wukongks.com';
var path = '/book/read?bkid=56983105&crid=';
var crid = '3644001';

var url = host+path+crid;
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

    var title = $('.title').text();
    var text = $('.text').html();
    var content = '';

    text = text.replace(/\<p\>/g,'');
    text = text.replace(/\<\/p\>/g,'\n');
    content = title + '\n' + text;


    fs.writeFile('a.txt',content,{
        flag:'a'
    });

    if(crid == 3877627){
        return;
    }
    
    var html = $.html();
    crid = html.match(/crid=(.*)\&/)[1];
    url = host+path+crid;
    catchPage(url);
}

