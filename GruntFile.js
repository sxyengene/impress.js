module.exports = function(grunt) {

  var watchifyPath = './share/watchify/';

  grunt.initConfig({
    less:{
      lesstask:{
        files:[{
          expand:true,
          cwd: watchifyPath + 'less',
          dest: watchifyPath + 'css',
          src:'*.less',
          ext:'.css'
        }]
      }
    },
    watchify:{
      example: {
        options:{
          keepalive:true
        },
        src: [ './share/watchify/less/*.less'],
        dest: 'share/watchify/bundle.js'
      }
    },
    watch:{
      watchtask:{
        files:[ './share/watchify/.bundle.js'],
        tasks:['less']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-watchify');

  grunt.registerTask('default', function(){
    grunt.task.run('watchify');
    // grunt.task.run('watch');
  });
};