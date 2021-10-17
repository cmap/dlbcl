//toggles visibility of popover tooltips
$(document).on('click', ".tooltip_trigger", function (e) {
    if ($('[aria-describedby]').length) {
        $('[aria-describedby]').each(function (i, el) {
            $(this).popover('hide');
        });
    }
    var self = this;
    var target_elem = $(this);
    var event_id = "#" + target_elem.attr("id");
    var popover_config = $(event_id).data("popover-config");

    if (0 === _.size(popover_config)) {
        return;
    }
    //TODO convert popover_config to JSON

    _.each(popover_config, function (config) {
        var $target;
        if(config.target_self && config.target_self.toLowerCase()==='true') {
            $target = target_elem;
        }
        else {
          var target_id = "#" + config.target_id;
          var $target = $(target_id);
        }
        if ($target.attr("aria-describedby")) {
            $target.popover("hide");
        }
        else {
            var content = $("#" + config.content_id).html();
            var placement = config.placement;
            var viewport = config.viewport || "body";
            var data = {
                html: true,
                content: content,
                placement: placement,
                trigger: 'manual',
                viewport: viewport
            };

            var add_class = null;

            if ($(event_id).data("tooltip-class") === "coaching_tips" || $(event_id).data("tooltip-class") === "header_announcements") {
                var css_class = $(event_id).data("tooltip-class");
                var template = '<div class="popover ' + css_class + '" role="tooltip"><div class="arrow"></div><div class="popover-content ' + css_class + '_text"></div></div>';
                data.template = template;
            }
            else if($(event_id).data("tooltip-class"))
            {
                add_class = $(event_id).data("tooltip-class");
            }
            $target.popover(data);
            $target.popover('show');
            if(add_class)
            {
                $(".popover").addClass(add_class);
            }
        }

    });
});