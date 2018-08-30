let ReportParser = require('./report_parser');

//Run ReportParser from command line
const args = process.argv;

let config = {
    [ReportParser.WORKING_DIR_KEY] : args[2],
    [ReportParser.FILENAME_KEY] : args[3],
    [ReportParser.TARGET_FIELD_KEY] : args[4],
    [ReportParser.REMOVE_AFTER_PARSE_KEY] : args[5]
}
console.log(config);
const callback = function(err, dataMatch){
    if(err){
        console.error(err);
    } else {
        console.log(dataMatch);
    }
};
const report_parser = new ReportParser.ReportParser();
report_parser.parse(config, callback);
