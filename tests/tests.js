(function(window, jQuery) {

	var startTests = function() {
		var op = respimage._;
		var currentSrcSupported = "currentSrc" in document.createElement("img");

		var saveCache = {};

		var forceElementParsing = function( element, options ) {
			if ( true || !element[ op.ns ] ) {
				element[ op.ns ] = {};
				op.parseSets( element, element.parentNode, options || {} );
			}
		};
		respimage.config("noCache", true);
		respimage();

		// reset stubbing

		module( "method", {
			setup: function() {
				var prop;
				for ( prop in op ) {
					if ( op.hasOwnProperty( prop ) ) {
						saveCache[ prop ] = op[ prop ];
					}
				}
			},

			teardown: function() {
				var prop;
				for ( prop in saveCache ) {
					if ( op.hasOwnProperty(prop) && saveCache[prop] != op[ prop ] ) {
						op[prop] = saveCache[prop];
					}
				}
			}
		});

		test( "respimage: Picture fill is loaded and has its API ready", function() {
			ok( window.respimage );

			ok( window.respimage._ );

			ok( window.respimage._.fillImg );

			ok( window.respimage._.fillImgs );
		});

		test( "respimage: global integration test", function() {

			op.DPR = 1;

			op.calcLength = function() {
				return 310;
			};
			var countedElements = 0;
			var polyfillElements = 10;
			var $srcsetImageW = $( "<img />" )
					.attr({
						srcset: "medium.jpg 480w,\n small.jpg  320w"
					})
					.prependTo("#qunit-fixture")
				;
			var $srcsetImageX = $( "<img />" )
					.attr({
						srcset: "oneX.jpg 1x, twoX.jpg 2x"
					})
					.prependTo("#qunit-fixture")
				;

			var $normalImg = $(".prop-check");

			window.respimage();

			$( "img[srcset], picture > img" ).each( function() {
				if ( $(this).prop( op.ns ) ){
					countedElements++;
				}

				respimage._.fillImg( this, {} );

				if ( $(this).prop( op.ns ) ) {
					countedElements++;
				}
			} );

			if ( window.HTMLPictureElement && op.supSrcset ) {
				equal( countedElements, 0, "respimage is noop in supporting browsers");
			} else if ( !window.HTMLPictureElement && !op.supSrcset ) {
				equal( countedElements, polyfillElements * 2, "respimage finds all elements and polyfills them");
			}

			if ( window.HTMLPictureElement ) {
				equal( $("picture > img" ).prop( op.ns ), undefined, "respimage doesn't touch images in supporting browsers." );
			} else {

				ok( $("picture > img" ).prop( op.ns ), "respimage modifies images in non-supporting browsers." );
			}

			if ( window.HTMLPictureElement || op.supSrcset ) {

				equal( ($srcsetImageX.prop( op.ns ) || { supported: true }).supported, true, "respimage doesn't touch images in supporting browsers." );
				equal( $srcsetImageX.prop( "src" ), "", "respimage doesn't touch image src in supporting browsers." );
				equal( imgGet.call( $srcsetImageX[0], "srcset" ), "oneX.jpg 1x, twoX.jpg 2x", "respimage doesn't touch image srcset in supporting browsers." );

			} else {
				ok( $srcsetImageX.prop( op.ns ), "respimage modifies images in non-supporting browsers." );
				equal( $srcsetImageX.prop( "src" ), op.makeUrl( "oneX.jpg" ), "respimage changes source of image" );
			}

			if ( window.HTMLPictureElement || (op.supSrcset && op.supSizes) ) {
				equal( $srcsetImageW.prop( op.ns ), undefined, "respimage doesn't touch images in supporting browsers." );
				equal( $srcsetImageW.prop( "src" ), "", "respimage doesn't touch image sources in supporting browsers." );
			} else {
				ok( $srcsetImageW.prop( op.ns ), "respimage modifies images in non-supporting browsers." );
				equal( $srcsetImageW.prop( "src" ), op.makeUrl( "small.jpg" ), "respimage changes source of image" );
			}

			equal( $normalImg.prop( op.ns ), undefined, "respimage doesn't touch normal images in any browsers." );
			equal( $normalImg.prop( "src" ), op.makeUrl( "bar" ), "respimage leaves src attribute of normal images untouched." );

			if ( !window.HTMLPictureElement ) {
				window.respimage( { elements: $normalImg } );
				ok( $normalImg.prop( op.ns).supported, "respimage doesn't touch normal images in any browsers too much even if it is called explicitly." );
				equal( $normalImg.prop( "src" ), op.makeUrl( "bar" ), "respimage leaves src attribute of normal images untouched." );
			}

			if ( !op.supSizes ) {
				op.DPR = 2;

				op.calcLength = function() {
					return 360;
				};

				window.respimage( { reevaluate: true } );

				if ( !op.supSrcset ) {
					equal( $srcsetImageX.prop( "src" ), op.makeUrl("twoX.jpg"), "respimage changes source of image" );
				}
				equal( $srcsetImageW.prop( "src" ), op.makeUrl( "medium.jpg" ), "respimage changes source of image" );
			}
		});

		test("parseSets", function() {
			//forceElementParsing
			var $srcsetImageW = $( "<img />" )
					.attr({
						srcset: "medium.jpg 480w,\n small.jpg  320w",
						src: "normalw.jpg"
					})
					.prependTo("#qunit-fixture")
				;
			var $srcsetImageX = $( "<img />" )
					.attr({
						srcset: "twoX.jpg 2x, threeX.png 3x",
						src: "normalx.jpg"
					})
					.prependTo("#qunit-fixture")
				;
			var $source = $( document.createElement( "source" ) )
				.attr({
					srcset: "twoX.jpg 2x, threeX.png 3x",
					media: "(min-width: 800px)"
				});
			var $pictureSet = $( "<picture />" )
					.append( $source )
					.append("<img src='normal.jpg' />")
					.prependTo("#qunit-fixture")
				;

			$.each([
				{
					name: "srcset with w descriptor + additional src",
					elem: $srcsetImageW,
					sets: 1,
					candidates: [ 2 ]
				},
				{
					name: "picture srcset with x descriptor + additional src",
					elem: $srcsetImageX,
					sets: 1,
					candidates: [ 3 ]
				},
				{
					name: "picture srcset with x descriptor + additional src",
					elem: $pictureSet.find( "img" ),
					sets: 2,
					candidates: [ 2, 1 ]
				}
			], function(i, testData) {

				forceElementParsing( testData.elem[0] );
				var sets = testData.elem.prop( op.ns ).sets;
				equal( sets.length, testData.sets, "parseSets parses right amount of sets. " + testData.name );

				$.each( sets, function( i, set ) {
					op.parseSet( set );
					equal( set.cands.length, testData.candidates[ i ], "parseSets parses right amount of candidates inside a set. " + testData.name );
				} );

			});
		});

		test("calcLength", function() {
			var calcTest = (function() {
				var fullWidthEl = document.createElement( "div" );
				document.documentElement.insertBefore( fullWidthEl, document.documentElement.firstChild );

				var gotWidth = op.calcLength("calc(766px - 1em)");

				return ( Modernizr.csscalc ? gotWidth === 750 : (gotWidth === fullWidthEl.offsetWidth || $(window).width()) );
			}());

			equal( op.calcLength("750px"), 750, "returns int value of width string" );
			ok( calcTest, "If `calc` is supported, `calc(766px - 1em)` returned `750px`. If `calc` is unsupported, the value was discarded and defaulted to `100vw`.");
		});

		test("calcListLength", function() {
			var width;
			var invalidSizes = "(min-width: 1px) 1002pysa, (min-width: 2px) -20px";
			var sizes = "	(max-width: 30em) 1000px,	(max-width: 50em) 750px, 500px	";

			op.matchesMedia = function(media) {
				return true;
			};

			width = op.calcListLength(sizes);

			equal(width, 1000, "returns 1000 when match media returns true");

			width = op.calcListLength(invalidSizes + ", (min-width: 2px) 10px");
			equal(width, 10, "iterates through until finds valid value");

			width = op.calcListLength(invalidSizes);
			equal(width, op.vW, "if no valid size is given defaults to viewport width");

			op.matchesMedia = function(media) {
				return !media || false;
			};

			width = op.calcListLength(sizes);
			equal(width, 500, "returns 500 when match media returns false");

			op.matchesMedia = function(media) {
				return !media || media == "(max-width: 50em)";
			};
			width = op.calcListLength(sizes);
			equal(width, 750, "returns 750px when match media returns true on (max-width: 50em)");
		});

		test("parseSize", function() {
			var size1 = "";
			var expected1 = {
				length: null,
				media: null
			};
			deepEqual(op.parseSize(size1), expected1, "Length and Media are empty");

			var size2 = "( max-width: 50em ) 50%";
			var expected2 = {
				length: "50%",
				media: "( max-width: 50em )"
			};
			deepEqual(op.parseSize(size2), expected2, "Length and Media are properly parsed");

			var size3 = "(min-width:30em) calc(30% - 15px)";
			var expected3 = {
				length: "calc(30% - 15px)",
				media: "(min-width:30em)"
			};
			deepEqual(op.parseSize(size3), expected3, "Length and Media are properly parsed");
		});

		test("setRes", function() {
			var srcset, expected, sizes;
			// Basic test
			var runGetCandiate = function(candidate, sizes) {
				return $.map(op.setRes( { srcset: candidate, sizes: sizes || null } ), function( can ) {
					return {
						res: can.res,
						url: can.url
					};
				});
			};

			srcset = "images/pic-medium.png";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly");

			srcset = "images/pic-medium.png 1x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "images/pic-medium.png, images/pic-medium-2x.png 2x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				},
				{
					res: 2,
					url: "images/pic-medium-2x.png"
				}
			];

			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "images/pic-medium.png 1x, images/pic-medium-2x.png 2x";
			expected = [
				{
					res: 1,
					url: "images/pic-medium.png"
				},
				{
					res: 2,
					url: "images/pic-medium-2x.png"
				}
			];

			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly");

			// Test with multiple spaces
			srcset = "			images/pic-medium.png		 1x		,		 images/pic-medium-2x.png		 2x		";
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			// Test with decimals
			srcset = "			images/pic-smallest.png		0.25x	,		images/pic-small.png		0.5x	, images/pic-medium.png 1x";
			expected = [
				{
					res: 0.25,
					url: "images/pic-smallest.png"
				},
				{
					res: 0.5,
					url: "images/pic-small.png"
				},
				{
					res: 1,
					url: "images/pic-medium.png"
				}
			];
			//deepEqual(runGetCandiate(srcset), expectedFormattedCandidates4, "`" + srcset + "` is parsed correctly" );

			// Test with "sizes" passed with a px length specified
			srcset = "			images/pic-smallest.png		 250w		,		 images/pic-small.png		 500w		, images/pic-medium.png 1000w";
			sizes = "1000px";
			deepEqual(runGetCandiate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly");

			// Test with "sizes" passed with % lengths specified
			srcset = "\npic320.png 320w	, pic640.png		640w, pic768.png 768w, \
			\npic1536.png 1536w, pic2048.png	2048w	";
			sizes = "	(max-width: 30em) 100%,	(max-width: 50em) 50%, 33%";
			expected = [
				{
					res: 0.5,
					url: "pic320.png"
				},
				{
					res: 1,
					url: "pic640.png"
				},
				{
					res: 1.2,
					url: "pic768.png"
				},
				{
					res: 2.4,
					url: "pic1536.png"
				},
				{
					res: 3.2,
					url: "pic2048.png"
				}
			];

			op.calcLength = function() {
				return 640;
			};

			op.matchesMedia = function() {
				return true;
			};

			deepEqual(runGetCandiate(srcset, sizes), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo,bar.png 320w, bar,baz.png 320w, ";
			expected = [
				{
					url: "foo,bar.png",
					res: 0.5
				},{
					url: "bar,baz.png",
					res: 0.5
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo,bar.png 320w,bar,baz.png 320w";
			expected = [
				{
					url: "foo,bar.png",
					res: 0.5
				},{
					url: "bar,baz.png",
					res: 0.5
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo.png 1x, bar.png -2x";
			expected = [
				{
					url: "foo.png",
					res: 1
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "foo.png 1x, bar.png 2q";
			expected = [
				{
					url: "foo.png",
					res: 1
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 1x, bar.png 2x";
			expected = [
				{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 1
				},{
					url: "bar.png",
					res: 2
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "2.png 1x,1.png 2x";
			expected = [
				{
					url: "2.png",
					res: 1
				},{
					url: "1.png",
					res: 2
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg 2x, 1x.gif 1x, data:image/png;base64,iVBORw0KGgoAAAANSUhEUg";
			expected = [
				{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 2
				},{
					url: "1x.gif",
					res: 1
				},{
					url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg",
					res: 1
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "400.gif 400w, 6000.gif 6000w";
			expected = [
				{
					url: "400.gif",
					res: 0.625
				},{
					url: "6000.gif",
					res: 9.375
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "800.gif 2x, 1600.gif 1600w";
			expected = [
				{
					url: "800.gif",
					res: 2
				},{
					url: "1600.gif",
					res: 2.5
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = "1x,,  ,   x    ,2x	, 1x.gif, , 3x, 4x.gif 4x 100h,,, 5x.gif 5, dx.gif dx, 2x.gif   2x,";
			expected = [
				{
					url: "1x",
					res: 1
				},{
					url: "x",
					res: 1
				},{
					url: "2x",
					res: 1
				},{
					url: "1x.gif",
					res: 1
				},{
					url: "3x",
					res: 1
				},{
					url: "2x.gif",
					res: 2
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			srcset = ",,,,foo.png 1x, ,,,,,bar 2x, , ,bar2 3x";
			expected = [
				{
					url: "foo.png",
					res: 1
				},
				{
					url: "bar",
					res: 2
				},
				{
					url: "bar2", //why not ,bar2?
					res: 3
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );

			op.calcLength = function() {
				return 100;
			};

			srcset = "foo.png 2e2w, bar.jpg 1e2w";
			expected = [
				{
					url: "foo.png",
					res: 2
				},
				{
					url: "bar.jpg",
					res: 1
				}
			];
			deepEqual(runGetCandiate(srcset), expected, "`" + srcset + "` is parsed correctly" );
		});

		test( "op.mMQ", function() {
			op.vW = 480;
			op.getEmValue = function() {
				return 2;
			};

			ok( op.mMQ( "(min-width: 480px)" ) );
			ok( !op.mMQ( "(min-width: 481px)" ) );
			ok( op.mMQ( "(min-width: 479px)" ) );

			ok( op.mMQ( "(max-width: 480px)" ) );
			ok( op.mMQ( "(max-width: 481px)" ) );
			ok( !op.mMQ( "(max-width: 479px)" ) );

			ok( !op.mMQ( "(orientation: landscape)" ) );

			ok( op.mMQ( "(min-width: 240em)" ) );
			ok( !op.mMQ( "(min-width: 241em)" ) );
			ok( op.mMQ( "(min-width: 239em)" ) );

			ok( op.mMQ( "(max-width: 240em)" ) );
			ok( op.mMQ( "(max-width: 241em)" ) );
			ok( !op.mMQ( "(max-width: 239em)" ) );

			ok( !op.mMQ( "(min-width: 240ups)" ) );

		} );

		test("supportsType", function() {
			expect( 5 );

			// Test widely supported mime types.
			ok( op.supportsType( "image/jpeg" ) );

			ok( op.supportsType( "image/png" ) );

			ok( op.supportsType( "image/gif" ) );

			// if the type attribute is supported it should return true
			ok( op.supportsType( "" ) );

			// if the type attribute is supported it should return true
			ok( op.supportsType( null ) );
		});

		test("applySetCandidate", function() {
			var image, candidates;

			var fullPath = op.makeUrl("foo300");

			candidates = [
				{ res: 100, url: "foo100", set: {}, desc: {} },
				{ res: 200, url: "foo200", set: {}, desc: {} },
				{ res: 300, url: "foo300", set: {}, desc: {} }
			];

			image = document.createElement("img");

			image [op.ns ] = {};

			op.DPR = 300;

			op.applySetCandidate( candidates, image );

			equal(op.makeUrl( image.src ), op.makeUrl( candidates[2].url ), "uses the url from the best px fit" );

			if (!currentSrcSupported) {
				deepEqual( op.makeUrl( image.currentSrc ), op.makeUrl( candidates[2].url ), "uses the url from the best px fit" );
			}

			image.src = fullPath;
			image.currentSrc = fullPath;
			image [op.ns ].curSrc = fullPath;

			op.applySetCandidate( candidates, image );

			deepEqual(image.src, fullPath, "src left alone when matched" );

			if (!currentSrcSupported) {
				deepEqual(image.currentSrc, fullPath, "currentSrc left alone when matched" );
			}

		});

		test("getSet returns the first matching `source`", function() {
			var img = $( ".first-match" )[ 0 ];
			var firstsource = img.parentNode.getElementsByTagName( "source" )[ 0 ];

			forceElementParsing( img );

			equal( op.getSet( img ).srcset, firstsource.getAttribute( "srcset" ) );
		});

		test( "getSet returns 'pending' when a source type is pending", function() {
			var img = $(".pending-check")[0];
			op.types["foo"] = "pending";

			forceElementParsing( img );

			equal( op.getSet( img ), "pending", "pending type should be false" );
		});

		test( "getSet returns source when it matches the media", function() {
			var img = $( ".match-check ")[ 0 ];
			op.matchesMedia = function() {
				return true;
			};

			forceElementParsing( img );

			equal( op.getSet( img ).srcset, img.parentNode.getElementsByTagName( "source" )[0].getAttribute( "srcset" ) );
		});

		test( "getMatch returns false when no match is found", function() {
			op.matchesMedia = function( media ) {
				return !media || false;
			};

			var img = $( ".no-match-check ")[0];

			forceElementParsing( img );

			equal( op.getSet( img ), false );
		});

		test( "getSet returns false when no srcset is found", function() {
			var img = $( ".no-srcset-check ")[0];

			forceElementParsing( img );

			equal( op.getSet( img ), false );
		});

		test( "respimage ignores elements when they are marked with a property", function() {
			expect( 0 );

			var mockPicture = {
				nodeName: "PICTURE"
			};

			mockPicture[ op.ns ] = {
				evaled: true
			};

			respimage({ reevaluate: false, elements: [ mockPicture ] });
		});

		test( "respimage marks elements with a property", function() {
			// NOTE requires at least one child image for the propery to be set
			var mockPicture = $( ".prop-check" )[0];

			// make sure there are candidates to consider
			op.processSourceSet = function() {
				return [ { url: "foo" } ];
			};

			respimage({ reevaluate: false, elements: [ mockPicture ] });
			if ( !window.HTMLPictureElement ) {
				ok( mockPicture[ op.ns ].evaled );
			} else {
				ok( !mockPicture[ op.ns ] );
			}
		});

		test( "`img` with `sizes` but no `srcset` shouldn’t fail silently", function() {
			expect( 0 );
			var el = document.createElement( "img" );

			el.setAttribute( "sizes", "100vw" );
			el.setAttribute( "class", "no-src" );

			jQuery( "#qunit-fixture" ).append( el );

			try { respimage({ reevaluate: false, elements: jQuery( ".no-src" ) }); } catch (e) { console.log( e ); ok( false ); }
		});
	};

	if( window.blanket ) {
		blanket.beforeStartTestRunner({
			callback: function() {
				setTimeout(startTests, QUnit.urlParams.coverage ? 500 : 0); //if blanketjs fails set a higher timeout
			}
		});
	} else {
		startTests();
	}

})( window, jQuery );
