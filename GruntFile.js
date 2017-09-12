module.exports = function(grunt) {

  var watchifyPath = 'share/watchify/';

  grunt.initConfig({
    less:{
      lesstask:{
        files:[{
          expand:true,
          cwd:'./share/watchify/less',
          dest:'./share/watchify/css',
          src:'*.less',
          ext:'.css'
        }]
      }
    },
    watch: {
      watchtask:{
        files:['./less/*.less'],
        tasks:['less']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['less']);

};