var _= _ || {};
var CanvasBackground = CanvasBackground || {};

var main = {};

(function () {


    /*============ PRIVATE VARIABLES AND METHODS ============*/


    /*============ PUBLIC ============*/

    main.start = function () {

        // start up the animated plaid custom shader and ThreeJS scene
        var canvasBackground = new CanvasBackground({
            canvas: $('canvas')
        });

        // cross browser scroll to function
        var scrollTo = function (targetTopOffset, duration) {
            if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
                $('body').animate({ scrollTop: targetTopOffset}, duration);
            } else {
                $('html,body').animate({ scrollTop: targetTopOffset}, duration);
            }
        };

        // back to top on mobile
        $('.back-to-top').click(function () {
            scrollTo(0, 0);
        });

        // animated navigation to clicked section
        $('.nav-button').click(function () {

            var element = $(this);
            var target = $(element.attr('data-target'));

            scrollTo(target.offset().top, 900);
        });

        // update the mastery items
        $('[data-mastery-percent]').each(function () {

            var masteryItem = $(this);
            var masteryPercent = masteryItem.attr('data-mastery-percent');

            var masteryA11y = $('<span class="sr-only">' + masteryPercent + ' percent proficient</span>');
            masteryItem.append(masteryA11y);

            masteryItem.attr('style', 'width:' + masteryPercent + '%');
        });

        // use the Waypoint library to show the mastery items
        $('.skill-set-group').each(function() {
            new Waypoint({
                element: this,
                offset: '50%',
                handler: function (direction, callee, symbol) {
                    $(this.element).addClass('show-group');
                }
            });
        });

        // use the Waypoint library to show and hide the Back to Top button
        var backToTopWaypoint = new Waypoint({
            element: $('.section-profile'),
            handler: function (direction) {

                if (direction === 'down') {
                    $('.back-to-top').addClass('back-to-top-active');
                } else {
                    $('.back-to-top').removeClass('back-to-top-active')
                }
            }
        });
    };

})();