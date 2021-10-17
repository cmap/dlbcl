//PR constants
const PR500 = "PR500";
const PR500P = "PR500P";
const PR300 = "PR300";
const PR300P = "PR300P";
const dlbcl_public_data_url = '//s3.amazonaws.com/data.clue.io/prism/mts_downloads_1.json';
/**
 *
 * @param pert_type
 * @returns {string}
 */
DLBCL_pertTypeToString = function(pert_type) {
    switch (pert_type.toLowerCase()) {
        case "trt_poscon.es":
            return "Validation Compound";
            break;
        case "trt_poscon":
            return "Killing Control";
            break;
        case "trt_cp":
            return "User Compound";
            break;
        case "ctl_vehicle":
            return "Vehicle Control";
            break;
        default:
            return "User Compound";
            break;
    }
}











