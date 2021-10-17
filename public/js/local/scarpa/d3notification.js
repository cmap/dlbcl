/**
 * Created by turner on 5/6/16.
 */
var scarpa = (function (scarpa) {

    scarpa.dispatch = d3.dispatch(

        // TSTable notifications
        "tstable_did_show_all_rows",
        "tstable_did_update_checkbox",
        "tstable_did_update_row_counter",
        "tstable_did_click_row",

        // Facet notifications
        "did_change_cmap_class_facet",
        "did_change_perturbagen_facet",
        "did_disable_data_lens_facet",
        "did_select_oe_kd_facet",
        "did_select_cell_line_specificity_facet",

        // FilterChain evaluation notification
        "do_evaluate_filter_chain"

    );

    return scarpa;
})(scarpa || {});
