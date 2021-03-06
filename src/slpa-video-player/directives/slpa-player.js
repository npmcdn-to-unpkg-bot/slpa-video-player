/**
 * Created by JG on 2/20/2016.
 */
angular.module('slpaVideoPlayer.directives', [])

.directive('clip', function() {
  return{
    scope:{
      videosource:'@'
    },
    restrict: 'AE',
    replace: true,
    template: ' <md-card><div layout="row"><div flex ="66"><md-card><div block-ui="myBlock">'+
    '<div class=" card-media">'+
    '<video id="player" src="{{videosource | trustUrl}}" pause-video loaded-data '+
    'muted autoplay autobuffer controls'+'' +
    ' style="width: 100%!important;height: auto !important">' +
    '</video></div></div>'+
    '<md-card-content ng-show="true"><div layout-gt-sm="row">'+
    '<md-input-container class="md-block" flex-gt-sm>'+
    '<label>Clip name</label><input  ng-model="clip.name"></md-input-container>'+
    '<md-input-container class="md-block" flex-gt-sm>'+
    '<label>Start time</label><input type="number" ng-model="clip.startTime"></md-input-container></div>'+
    '<div layout-gt-sm="row"><md-input-container class="md-block" flex-gt-sm>'+
    '<md-switch ng-model="clip.persist">Persist</md-switch>'+
    '</md-input-container>'+
    '<md-input-container class="md-block" flex-gt-sm>'+
    '<label>End Time</label><input type="number" ng-model="clip.endTime"></md-input-container></div>'+
    '</md-card-content>'+
    '<md-fab-toolbar md-open="false" count="demo.count"'+
    'md-direction="left">'+
    '<md-fab-trigger class="align-with-text">'+
    '<md-button aria-label="menu" class="md-fab md-primary">'+
    '<md-icon class="material-icons md-light md-48"> menu </md-icon>'+
    '</md-button>'+
    '</md-fab-trigger>'+
    '<md-toolbar>'+
    '<md-fab-actions class="md-toolbar-tools">'+
    '<md-button class="md-accent md-raised" ng-click="deleteClip()" ng-hide="new">Eliminar</md-button>'+
    '<md-button class="md-raised md-accient" ng-click="saveClip()">Guardar</md-button>'+
    '<md-button class="md-raised md-primary" ng-click="resetClip()">Nuevo</md-button>'+
    '</md-fab-actions>'+
    '</md-toolbar>'+
    '</md-card></div><div flex="33"><md-card><md-card-content flex  layout-padding><md-list>'+
    '<md-list-item class="md-3-line secondary-button-padding" ng-repeat="item in clips track by $index"'+
    'ng-click="setSource(item,$index)"><img src="images/poster.jpg" class="md-avatar"/>'+
    '<div class="md-list-item-text" layout="column">'+
    '<h3>{{ item.name }}</h3><p>Start ({{ item.startTime|secondsToHHmmss }}) -  End ({{item.endTime|secondsToHHmmss}})'+
    '</p>'+
    //'<md-button class="md-secondary md-accent md-raised" ng-show="$index!=0" ng-click="deleteClip($index)">'+
    //'Delete</md-button>'+
    '</div></md-list-item><md-divider ></md-divider></md-list></md-card-content></md-card></div></div></md-card>',
    controller: function($scope, $element,$timeout,blockUI,$localStorage,hotkeys){
      $scope.videosourceOrigin=$scope.videosource;
      function guid() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      }
      function updateLocalData(item){
        if($scope.$storage.clips.map(function(x) {return x.id; }).indexOf(item.id)!==-1){
          var index=$scope.$storage.clips.indexOf(item);
          if(item.persist===false){
            $scope.$storage.clips.splice(index, 1);
          }else{
            $scope.$storage.clips[index]=item;
          }
        }else{
          if(item.persist!==false){
            $scope.$storage.clips.push(item);

          }
        }

      }
      var myBlock = blockUI.instances.get('myBlock');
      $scope.$storage=$localStorage.$default({clips:[] });
      $scope.onPlay=0;
      $scope.resetClip=function(){
        $scope.clip={
          id:null,
          name:null,
          startTime:null,
          endTime:null,
          source:null,
          playFragment:null,
          persist:false
        };
        $scope.new=true;
      };
      $scope.new=true;
      $scope.resetClip();
      $scope.clips=[];
      angular.element('#player').bind('loadeddata', function () {
        $scope.videoDuration=angular.element('#player')[0].duration;
        $scope.clips[0].endTime=$scope.videoDuration;
      });
      angular.element('#player').on('pause', function(){
        var current = $scope.clips.indexOf($scope.clip);

        if(current<$scope.clips.length-1) {

          if (angular.element('#player')[0].currentTime - $scope.clip.endTime > 0.1) {
            myBlock.start('Loading next clip..');

            $timeout(function () {
              myBlock.stop();

              $scope.videosource = $scope.clips[current + 1].playFragment;
            }, 3000);
          }
        }


      });
      $scope.clips.push({
        id:guid(),
        name:'Full Video',
        startTime:0,
        endTime:$scope.videoDuration,
        source:$scope.videosourceOrigin,
        playFragment:$scope.videosourceOrigin
      });
      angular.forEach($scope.$storage.clips, function(item){

        $scope.clips.push(item);
      });

      $scope.saveClip=function(item){
          $scope.clip.source=$scope.videosource;
          $scope.clip.playFragment=$scope.videosourceOrigin+'#t='+$scope.clip.startTime+','+$scope.clip.endTime;
        if($scope.new===true) {
          $scope.clip.id=guid();
          $scope.clips.push($scope.clip);
          updateLocalData($scope.clip);
          $scope.resetClip();
        }else{
          updateLocalData($scope.clip);
        }
      };
      $scope.deleteClip=function(){
        var index=$scope.onPlay;
        $scope.clips[index].persist=false;
        updateLocalData($scope.clips[index]);
        $scope.clips.splice(index, 1);
        $scope.resetClip();

      };
      $scope.setSource = function(item,index){
        $scope.videosource=item.playFragment;
        $scope.onPlay=index;
        if(index!==0){
          $scope.clip=item;
          $scope.new=false;

        }else {
          $scope.resetClip();
        }
      };

      hotkeys.add({
        combo: 'ctrl+up',
        description: 'Next',
        callback: function() {
          if( $scope.onPlay< $scope.clips.length-1){
            $scope.videosource=$scope.clips[$scope.onPlay+=1].playFragment;
          }
        }
      });

      hotkeys.add({
        combo: 'ctrl+down',
        description: 'Preview',
        callback: function() {
          if( $scope.onPlay >0){
            $scope.videosource=$scope.clips[$scope.onPlay-=1].playFragment;
          }
        }
      });
    },

  link: function(scope,elem,attrs){

    }
  };
});
