module.exports = function(grunt) {

  var watchifyPath = './share/watchify/';

  grunt.initConfig({
    less:{
      lesstask:{
        files:[{
          expand:true,
          cwd:watchifyPath + 'less',
          dest:watchifyPath + 'css',
          src:'*.less',
          ext:'.css'
        }]
      }
    },
    watch: {
      watchtask:{
        files:[ watchifyPath + '*.less'],
        tasks:['less']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['watch']);
};