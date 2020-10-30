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
        var scrollTo = function (targetTopOffset, duration, callBack) {

            callBack = callBack || $.noop;

            if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
                $('body').animate({ scrollTop: targetTopOffset}, duration, callBack);
            } else {
                $('html,body').animate({ scrollTop: targetTopOffset}, duration, callBack);
            }
        };

        // back to top on mobile
        $('.back-to-top').click(function () {
            window.scroll({
                top: 0, 
                left: 0,
                behavior: 'smooth'
            });
        });

        // animated navigation to clicked section
        $('.nav-button').click(function () {

            var element = $(this);
            var target = $(element.attr('data-target'));

            scrollTo(target.offset().top, 900, function () {
                target.attr('tabindex', '-1');
                target.focus();
            });
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
        var skillsWaypoint = new Waypoint({
            element: $('.skill-set-group-row'),
            offset: '50%',
            handler: function (direction, callee, symbol) {
                $(this.element).addClass('show-groups');
            }
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