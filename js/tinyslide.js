(function ($, window, document, undefined) {

  var defaults = {
    autoplay: 4000,
    hoverPause: true,
    slide: ">figure",
    slides: ">aside",
    beforeTransition: function(){},
    afterTransition: function(){}
  };


  var Tiny = function(container, options){
      var _ = this;

      this.options = $.extend({}, defaults, options),
      this.container = container,
      this.slideContainer = $(this.options.slides,this.container),
      this.slides = $(this.options.slide, this.slideContainer),
      this.numSlides = this.slides.length,
      this.currentSlideIndex = 0,
      this.timer,
      this.debounce,
      this.slideWidth,
      this.slideNavigator,
      this.slideNavigatorItems,
      this.$w = $(window),

      //mobile
      this.dragThreshold = .05,
      this.dragStart = null,
      this.percentage = 0,
      this.dragTarget,
      this.previousDragTarget,
      this.delta = 0
    ;

    this.api = {
      getSlide: function(index){
        _.api.pause();
        _.currentSlideIndex = index;
        _.showSlide();
      },

      nextSlide: function(){
        var index = _.currentSlideIndex;
        index++;
        index = (index >= _.numSlides) ? 0 : index;
        _.api.getSlide(index);
      },

      prevSlide: function(){
        var index = _.currentSlideIndex;
        index--;
        index = (index < 0) ? _.numSlides - 1 : index;
        _.currentSlideIndex = index;
        _.api.getSlide(index);
      },

      play: function(){
        //disable autoplay if set to 0
        if( _.options.autoplay == 0 ){
          return;
        }

        _.timer = setTimeout(function(){
          _.api.nextSlide();
        }, _.options.autoplay);
      },

      pause: function(){
        clearTimeout(_.timer);
      }

    }

    this.touchStart = function(event){

      if (_.dragStart !== null) { return; }
      if (event.originalEvent.touches) {
        event = event.originalEvent.touches[0];
      }

      // where in the viewport was touched
      _.dragStart = event.clientX;

      // make sure we're dealing with a slide
      _.dragTarget = _.slides.eq(_.currentSlideIndex)[0];

      _.previousDragTarget = _.slides.eq(_.currentSlideIndex-1)[0];
    }

    this.touchMove = function(event){

      if (_.dragStart === null) { return; }
      if (event.originalEvent.touches) {
        event = event.originalEvent.touches[0];
      }

      _.delta = _.dragStart - event.clientX;
      _.percentage = _.delta / _.$w.width();

      // Don't drag element. This is important.
      return false;
    }
    this.touchEnd = function(){

      _.dragStart = null;

      if (_.percentage >= _.dragThreshold) {
        _.api.nextSlide();
      }
      else if ( Math.abs(_.percentage) >= _.dragThreshold ) {
        _.api.prevSlide();
      }

      percentage = 0;
    }

    this.init = function(){
      _.dimensions();
      _.drawNavigator();
      _.showSlide();
      _.api.play();

      _.container.on({
        'touchstart': _.touchStart,
        'touchmove': _.touchMove,
        'touchend': _.touchEnd
      });

      _.slideContainer.on({
        'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend': _.transitionEnd
      });

      _.$w.resize(function(){
        _.debounce && clearTimeout(_.debounce);
        _.debounce = setTimeout(function(){
          _.dimensions();
          _.showSlide();
        }
        , 20);
      });

    }

    this.drawNavigator = function() {

      if( _.numSlides < 2 ){
        return;
      }

      var output = "<div class='navigator'><ul>\n";
      for(var i=0; i < _.numSlides; i++){
        output += "<li data-index='"+i+"'><span>"+i+"</span></li>\n";
      }
      output += "</ul>";

      _.slideNavigator = $(output);
      _.container.append(_.slideNavigator);
      _.container.addClass('has-navigator');

      _.slideNavigatorItems = $("li",_.slideNavigator);
      $(_.slideNavigatorItems.get(0)).addClass("active");

      _.slideNavigator.on("click","li",function(){
        _.api.getSlide( $(this).data('index') );
      });
    }

    this.dimensions = function(){
      var width = 0;

      _.slideWidth = _.container.width();

      _.slides.each(function(i, slide){
        $(slide).width(_.slideWidth);
      });

      _.slideContainer.width( ( _.slideWidth * _.numSlides) );
    }

    this.translate = function(x){
      _.slideContainer.css('transform','translateX('+x+'px)');
    }

    this.transitionEnd = function(){

      _.slides.each(function(i, slide){
        var $slide = $(slide);
        $slide.toggleClass('active', (i == _.currentSlideIndex ));
      });

      _.options.afterTransition(this);

      _.api.play();
    }
    this.showSlide = function(){

      _.api.pause();

      _.options.beforeTransition(this);

      _.translate( -1 * _.currentSlideIndex * _.slideWidth );

      _.slideNavigatorItems.each(function(i){
        $(this).toggleClass('active', (i == _.currentSlideIndex ));
      });

    }

    this.init();

    return this.api;

  }

  $.fn["tiny"] = function(options) {
    return this.each(function () {
      if ( !$.data(this, 'api_tiny') ) {
        $.data(this, 'api_tiny',
         new Tiny($(this), options)
        );
      }
    });
  };

})(jQuery, window, document);
