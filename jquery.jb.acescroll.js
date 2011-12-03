/*
 * ace-scroll - jQuery UI Widget 
 * Copyright (c) 2010 Jesse Baird
 *
 * http://jebaird.com/blog/ace-scroll-jquery-ui-google-wave-style-scroll-bar
 *
 * Depends:
 *   - jQuery 1.4
 *   - jQuery UI 1.8 (core, widget factory, draggable, position)
 *   - jQuery mousewheel plugin - Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 *  
 * events 
 * 	click - user clicked on track or scrollbar
 * 
 * TODO:
 * 	scrollbar auto size, change the size of the scroll bar based on the scroll content
 *
*/
(function($) {


    $.widget("jb.acescroll", {
		options: {
			scrollSpeed: 100,
			animationSpeed: 150,
			orientation: 'vertical',
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
				o = self.options,
				el = self.element;

            self.wrapper = $('<div class="jb-ace-scroll-wrapper">'+ 
            					'<div class="jb-ace-scroll-track">'+
            					'<div class="jb-ace-scroll-scrollbar">'+
            						'<div class="jb-ace-scroll-scrollbar-btn-up jb-ace-scroll-scrollbar-btn" data-dir="up"></div>'+
            						'<div class="jb-ace-scroll-scrollbar-middle"></div>'+
            						'<div class="jb-ace-scroll-scrollbar-btn-down jb-ace-scroll-scrollbar-btn" data-dir="down"></div>'+
            						'</div>'+
            					'</div>'+
            				'</div>').insertAfter(el);
            				
            self.scrollbar = self.wrapper.find('.jb-ace-scroll-scrollbar');
            
            self.isDragging = false;
            
            
            self.wrapper.addClass('jb-ace-scroll-orientation-' + o.orientation )
            
            self._positionWrapper();
                        
            if( o.orientation == 'vertical' ){
            	self._viewPort = el.innerHeight();
            	self._scrollProp = 'scrollTop';
            	self._axis = 'y';
            }else{
            	self._viewPort = el.innerWidth();
            	self._scrollProp = 'scrollTop';
            	self._axis = 'x';
            }
            
            self._positionWrapper();
            
            el
            .addClass('jb-ace-scroll-target')
            .bind( 'scroll.' + this.name,function(){
            	self._positionScrollbar();
            })
            .bind( 'mousewheel.' + this.name , function( event, delta, deltaX, deltaY){
        	//	console.log( 'mosuewheel', event, delta, deltaX, deltaY )
        		
        		if( self._isVert() ){
        			
        			   var dirY = deltaY > 0 ? 'Up' : 'Down',
		                	vel = (dirY=='Up')?-Math.abs(deltaY):Math.abs(deltaY);
		                	//
		              //  	console.log( this.scrollTop, this.scrollHeight )
		               	if( this[ self._scrollProp ] == 0 && dirY == 'Up' || this[ self._scrollProp ] + self._viewPort == this.scrollHeight && dirY=='Down'  ){
		                    //console.log('up false');
		                    return false;
		                }
		                
		                this.scrollTop =+ this.scrollTop + vel * o.scrollSpeed;
		        			
        		}else{
        			
        			   var dirX = deltaX > 0 ? 'Right' : 'Left',
                			vel = (dirX=='Left')?-Math.abs(deltaX):Math.abs(deltaX);
		                
		                this.scrollLeft =+ this.scrollLeft + vel * o.scrollSpeed;
        			
        		}
                event.preventDefault();

            })
            //trigger click event
            this.wrapper.delegate( 'div','mousedown', function( e ){
            	self._trigger('click' , e, {} )
            })
            //click on the track move to that point
            this.wrapper
            	.find('.jb-ace-scroll-track')
            	.bind('click.' + this.name, function( e ){
            		//figure out the scroll top from the e.layerY
            		if( self._isVert() ){
            			el.animate({
	                    	'scrollTop': self._pixelRatio() * e.layerY
	                	},o.animationSpeed);	
            		}else{
            			el.animate({
	                    	'scrollLeft': self._pixelRatio() * e.layerX
	                	},o.animationSpeed);	
            		}
            	})
            	.bind('mouseenter',function(){
            		$(this).addClass('jb-state-hover')
            	})
            	.bind('mouseleave',function(){
            		$(this).removeClass('jb-state-hover')
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
            			el.animate({
	                    	'scrollTop':'+='+(($(this).attr('data-dir')=='up')?-self._viewPort:self._viewPort)
	                	},o.animationSpeed,done);	
            		}else{
            			el.animate({
	                    	'scrollLeft':'+='+(($(this).attr('data-dir')=='up')?-self._viewPort:self._viewPort)
	                	},o.animationSpeed,done);	
            		}
	                
	            })
	            
	       	this.wrapper
	       		.find('.jb-ace-scroll-scrollbar-middle')
	       		.hover(function(e){
	                $(this).toggleClass('jb-state-hover')
	            })
	            .mousedown(function() {
					$(this).addClass( 'jb-state-hover')
				});
	            
            
           this.scrollbar.draggable({
                axis: self._axis,
                containment: 'parent',
                
                cancel: '.jb-ace-scroll-scrollbar-btn',
                start: function( e, ui ){
                	///if the scrollHeight is the same as the offsetHeight then we can scroll
                	if( self._isScrollable() == false ){
                		return false;
                	}
                	self.isDragging = true;
                	$(this).addClass('jb-state-active')
                },
                drag: function(e,ui) {
                	if( self._isVert() ){
                		el[0].scrollTop = self._pixelRatio() * ui.position.top;
                	}else{
                		el[0].scrollLeft = self._pixelRatio() * ui.position.left;	
                	}
                    
               },
               stop: function(){
                	self.isDragging = false;
                	$(this).removeClass('jb-state-active')
                }
            });
		},
				
		destroy: function() {			
			this.element.next().remove();
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
        //based on the scrolltop postiion the scrollbar
        _positionScrollbar: function(){
        	
        	if( this.isDragging ){
        		///if draggging return becuase it messes witht he view
        		return;
        	} 
        	if( this._isVert() ){
        		this.scrollbar.css( 'top',  ( this.element[ 0 ].scrollTop / this._pixelRatio()) )	
        	}else{
        		this.scrollbar.css( 'left',  ( this.element[ 0 ].scrollLeft / this._pixelRatio()) )
        	}
        	 
        },
        _positionWrapper: function(){
            var css = {};
            if( this._isVert() ){
            	css[ 'height' ] = this._viewPort;
            }else{
            	css[ 'width' ] = this._viewPort;
            }
            this.wrapper
	            .css(css)
	            .position( $.extend( this.options.position, { of:this.element}))
        },
        _isVert: function(){
        	return ( this.options.orientation == 'vertical' ) ? true : false;
        },
        _isScrollable: function(){
        	var isVert = this._isVert(),
        		element = this.element[0];
        	if( element.scrollHeight <= element.offsetHeight && isVert ){
        		//disable reset dragable and disable
        		return false;
        	}else if( element.scrollWidth <= element.offsetWidth && !isVert ){
        		return false;	
        	}
        	
        	return true;
        }
        
	});
})(jQuery);