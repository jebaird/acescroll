/*
 * ace-scroll - jQuery UI Widget 
 * Copyright (c) 2011 Jesse Baird
 * *
 * Depends:
 *   - jQuery 1.4
 *   - jQuery UI 1.8.16 (core, widget factory, draggable, position)
 *   - jQuery mousewheel plugin - Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 *  
 * events 
 * 	click - user clicked on track or scrollbar
 * 	scroll - the scrollPos has changed
 *
*/
(function($) {
	
	var abs = Math.abs;

    $.widget("jb.acescroll", {
		options: {
			scrollSpeed: 100,
			animationSpeed: 150,
			orientation: 'vertical',
			//numeric value in % or false to disable(use css value and is always that width)
			minScrollBarWidth: 10,
			//hide the scrollbar if the  content is not scrollable, show it if it is
			//TODO: make work like css overflow property, none, auto, scroll
			autoHide: true,
			//in ms how fast we check the target element for scrollChanges like resize or content chagnes
			//set to 0 to disable
			scrollChangeInterval: 500,
			position: {
				my:'left top',
                at:'right top',
                offset:'5 0',
                collision:'none'
			}
		},
		name: 'jb-ace-scroll',
				
		_create: function() {
			
			var self = this,
				options = self.options,
				element = self.element;
				
				
			//add the target class first thinng. makes sure the math for the scrollDim will be correct	
			element.addClass('jb-ace-scroll-target')
			 
            self.wrapper = $('<div class="jb-ace-scroll-wrapper jb-ace-scroll">'+ 
            					'<div class="jb-ace-scroll-track">'+
            					'<div class="jb-ace-scroll-scrollbar">'+
            						'<div class="jb-ace-scroll-scrollbar-btn-up jb-ace-scroll-scrollbar-btn" data-dir="up"></div>'+
            						'<div class="jb-ace-scroll-scrollbar-middle"></div>'+
            						'<div class="jb-ace-scroll-scrollbar-btn-down jb-ace-scroll-scrollbar-btn" data-dir="down"></div>'+
            						'</div>'+
            					'</div>'+
            				'</div>'
            				).insertAfter(element);
            				
            self.scrollbar = self.wrapper.find('.jb-ace-scroll-scrollbar');
            
            self.isDragging = false;
            
            
            self.wrapper.addClass('jb-ace-scroll-orientation-' + options.orientation )
            
            
            if( options.orientation == 'vertical' ){
            	self._scrollProp = 'scrollTop';
            	self._axis = 'y';
            }else{
            	self._scrollProp = 'scrollLeft';
            	self._axis = 'x';
            }
            
            
            self._positionWrapper();
            
            //keep track if the wrapper is visible, used when we check the element for scroll changes
            self._isWrapperVisible = true;           
           
            
           element
            .bind( 'scroll.' + this.name,function( event ){
            	self._positionScrollbar();
            	
            	self._eventHelper('scroll', event, {} )
            	
            	return self._getScrollDimension('scroll', event, {} );

            })
            .bind( 'mousewheel.' + this.name , function( event, delta, deltaX, deltaY){
        		//console.log( 'mosuewheel', event, delta, deltaX, deltaY );
        		
        		var target = event.target;
        		//console.log( target, self._isScrollable( target ))
        		/*
        		 * if the event target can be scrolled and is not this element, let it do so
        		 * could be a another div with scroll, textarea or another acescroll instance
        		 */
        		if( self._isScrollable( target ) && target != element[ 0 ]){
        			return;	
        		}
        		//vertical 
        		if( self._isVert() ){
        			
        			   var dirY = deltaY > 0 ? 'Up' : 'Down',
		                	vel = (dirY=='Up')?-abs(deltaY):abs(deltaY);
		                
		               	if( this[ self._scrollProp ] == 0 && dirY == 'Up' || this[ self._scrollProp ] + self._viewPort == this.scrollHeight && dirY=='Down'  ){
		               		//can't scroll any more
		                    return;
		                }else{
		                	//only prevent the default if we can can scroll on this element
		                	this.scrollTop =+ this.scrollTop + vel * options.scrollSpeed;	
		                	return false;
		                }
		                
		                
        		}else{
        			//horizontal
        			
        			   var dirX = deltaX > 0 ? 'Right' : 'Left',
                			vel = (dirX=='Left')?-abs(deltaX):abs(deltaX);
		                //TODO: add scroll check like vertical has, i currenty dont have a mouse that has horz scrolling
		                this.scrollLeft =+ this.scrollLeft + vel * options.scrollSpeed;
        			
        		}

            })
            .bind('resize.' + this.name, function( event ) {
            	self._positionWrapper();
            });
            
            /*
             * bind events on the track and scrollbar
             * 
             */
            
            //trigger click event
            this.wrapper.delegate( 'div','mousedown', function( event ){
            	return self._eventHelper('click', event, {} )
            })
            //click on the track move to that point
            this.wrapper
            	.find('.jb-ace-scroll-track')
            	.bind('click.' + this.name, function( e ){
            		//figure out the scroll top from the e.layerY
            		if( self._isVert() ){
            			element.animate({
	                    	'scrollTop': self._pixelRatio() * e.layerY
	                	},options.animationSpeed);	
            		}else{
            			element.animate({
	                    	'scrollLeft': self._pixelRatio() * e.layerX
	                	},options.animationSpeed);	
            		}
            	})
            	.bind('mouseenter.' + this.name,function(){
            		self.wrapper.addClass('jb-state-hover')
            	})
            	.bind('mouseleave.' + this.name,function(){
            		if( self.isDragging == true ){
            			return;
            		}
            		self.wrapper.removeClass('jb-state-hover')
            	})
            	.bind('mousedown.' + this.name,function(){
            		
            		self.wrapper.addClass('jb-state-active')
            	})
            	.bind('mouseup.' + this.name,function(){
            		
            		self.wrapper.removeClass('jb-state-active')
            	})
            	

            
            
            this.wrapper.find('div.jb-ace-scroll-scrollbar-btn')
	            .hover(function(e){
	                $(this).toggleClass('jb-state-hover')
	            })
	            //TODO this interaction is kinda funky
	            .bind('click.' + this.name ,function(e){
	            	self.isDragging = true;
	            	var done = function(){
	            		//console.log( 'done')
	            		self.isDragging = false;
	            	}
	                if( self._isVert() ){
            			element.animate({
	                    	'scrollTop':'+='+(($(this).attr('data-dir')=='up')?-self._viewPort:self._viewPort)
	                	},options.animationSpeed,done);	
            		}else{
            			element.animate({
	                    	'scrollLeft':'+='+(($(this).attr('data-dir')=='up')?-self._viewPort:self._viewPort)
	                	},options.animationSpeed,done);	
            		}
	                
	            })
	            
            
           this.scrollbar.draggable({
                axis: self._axis,
                containment: 'parent',
                
                cancel: '.jb-ace-scroll-scrollbar-btn',
                start: function( e, ui ){
                	///if the scrollHeight is the same as the offsetHeight then we can scroll
                	if( self._isScrollable( element[ 0 ] ) == false ){
                		return false;
                	}
                	self.isDragging = true;
                	// $(this).addClass('jb-state-active')
                	// self.wrapper.find('.jb-ace-scroll-track').addClass('jb-state-active')
                },
                drag: function(e,ui) {
                	if( self._isVert() ){
                		element[0].scrollTop = self._pixelRatio() * ui.position.top;
                	}else{
                		element[0].scrollLeft = self._pixelRatio() * ui.position.left;	
                	}
                    
               },
               stop: function(){
                	self.isDragging = false;
                	// $(this).removeClass('jb-state-active')
                	
                	self.wrapper.removeClass('jb-state-active jb-state-hover')
                }
            });
            
            //recursively called
            
            self._handleElementChange();
		},
				
		destroy: function() {			
			this.wrapper.remove();
			//remove wrapper and mouse wheel events
			$(window).unbind("resize");
		},
		//TODO: fix this up
		_setOption: function( key, value) {
			
			//if( option == 'orientation')
			$.Widget.prototype._setOption.apply( this, arguments );
			
			switch( key ){
				case 'position': 
					this._positionWrapper();
					break;
			}
           
		},
        /*
            get the ratio of pixs to the target to scroll bar
        */
        _pixelRatio: function(){
          	if( this._isVert() ){
          		return (
          				( this.element[0].scrollHeight - this._viewPort)
          				/
          				( this._viewPort - this.scrollbar.outerHeight() )
          		);
          	}else{
          		return (
          				( this.element[0].scrollWidth - this._viewPort)
          				/
          				( this._viewPort - this.scrollbar.outerWidth() )
          		);
          	}
        },
        //used to set the scrollbar in the right position within the track
        _positionScrollbar: function(){
        	
        	if( this.isDragging ){
        		///if draggging return becuase it messes witht the view
        		return;
        	} 
        	if( this._isVert() ){
        		this.scrollbar.css( 'top',  ( this.element[ 0 ].scrollTop / this._pixelRatio()) )	
        	}else{
        		this.scrollbar.css( 'left',  ( this.element[ 0 ].scrollLeft / this._pixelRatio()) )
        	}
        	 
        },
        //sets the s
        _positionWrapper: function(){
            var css = {},
            	element = this.element;
            if( this._isVert() ){
            	
            	this._viewPort = element.innerHeight();
            	css[ 'height' ] = this._viewPort;
            	

            }else{
            	
				this._viewPort = element.innerWidth();
            	css[ 'width' ] = this._viewPort;
            }
            
            this.wrapper
	            .css(css)
	            .position( $.extend( this.options.position, { of:this.element}))
	        
	        //since the wrapper _getScrollPosition might have changed make sure the scrollbar postion is perportional to it 
	       	//set the width before posiion, insures that the bar doesnt overhang on the track
	        this.setScrollBarWidth();
	        this._positionScrollbar();
	        
        },
        _isVert: function(){
        	return ( this.options.orientation == 'vertical' ) ? true : false;
        },
        /*
         * check if an element can be scrolled
         */
        _isScrollable: function( element ){
        	if( element.scrollHeight > element.offsetHeight || element.scrollWidth > element.offsetWidth ){
        		return true;
        	}
        	
        	return false;
        },

        _eventHelper: function( eventName, event, options ){
        	var isVert = this._isVert(),
        		element = this.element[0];
        	
        	return this._trigger( 
        		eventName, 
        		event, 
        		$.extend(
        			{},
        			{
        				scrollDimension: this._getScrollDimension(),
        				scrollPosition: this._getScrollPosition(),
        				viewPort: this._viewPort
        			},
        			options
        		) 
        	)
        },

        //make the scrollbar size relitave to the scrollHeight/Width
        setScrollBarWidth: function(){
        	//this.scrollbar
        	//disabled option
        	if( this.options.minScrollBarWidth === false ){
        		return;
        	}
        	//figure out how many "pages" are in the scrollable and devide that by 100 to get the height perenctage
        	var height = 100 / Math.ceil( this._getScrollDimension() / this._viewPort ) ;
        	
        	//console.log( 'height ', height, this._getScrollDimension(), this.element.css('overflow') )
        	
        	if( height < this.options.minScrollBarWidth ){
        		height = this.options.minScrollBarWidth;
        	}
        	if( this._isVert() ){
        		this.scrollbar.css( 'height', height +'%' )	
        	}else{
        		this.scrollbar.css( 'width', height +'%' )
        	}
        	
        	
        },
        //returns scrollHeight or scrollWidth depening orentation
        _getScrollDimension: function(){
        	var element = this.element[ 0 ];
        	return ( this._isVert() ) ? element.scrollHeight : element.scrollWidth;
        },
        //get the scrollbar position
        _getScrollPosition: function(){
        	var element = this.element[ 0 ];
        	return ( this._isVert() ) ? element.scrollTop : element.scrollLeft;
        },
        
        /*
         * ran at an interval
         * 	catches scroll postion and changes and if the element if visible it will show / hide the scrollbar
         */
        _handleElementChange: function(){
        	var self = this,
        		isScrollable = this._isScrollable( this.element[ 0 ] );
    	
        	
        	if( this._getScrollDimension() != this._prevScrollDimension && this._prevScrollDimension != undefined && isScrollable == true ){
        		
        		this.setScrollBarWidth();
        	
        	//hide the scrollbar if not scrollable
        	}else if( isScrollable == false && this.options.autoHide == true && this._isWrapperVisible == true ){
        		
        		this.wrapper.hide();
        		this._isWrapperVisible = false;
        		
        	}else if( isScrollable == true && this.options.autoHide == true && this._isWrapperVisible == false ){
        		
        		this.wrapper.show();
        		//makes sure it gets positioned on the correctly based on the visible position
        		this._positionWrapper();
        		this._isWrapperVisible = true;
        	
        	}
        	
        	this._prevScrollDimension = this._getScrollDimension();
        	
        	//call again
        	if( this.options.scrollChangeInterval != 0 ){
        		setTimeout( 
	        		function(){
	        			self._handleElementChange()
	        		}, 
	        		this.options.scrollChangeInterval 
	        	);
        	}
        }
        
        
	});
})(jQuery);