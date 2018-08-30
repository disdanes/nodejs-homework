'use strict'
const assert = require('chai').assert;
const expect = require('chai').expect;
const should = require('chai').should();
const readline = require('readline');
const Readable = require('stream').Readable;
const ReportParser = require('./report_parser');

describe('ReportParser', () => {
    const report_parser = new ReportParser.ReportParser();
    const correct_config = {
        [ReportParser.WORKING_DIR_KEY] : '/var/tmp/working',
        [ReportParser.FILENAME_KEY] : 'qa.report',
        [ReportParser.TARGET_FIELD_KEY] : 'report_status',
    };
    const correct_config_gen_time = {
        [ReportParser.WORKING_DIR_KEY] : '/var/tmp/working',
        [ReportParser.FILENAME_KEY] : 'qa.report',
        [ReportParser.TARGET_FIELD_KEY] : 'generation_time',
    };
    const correct_config_no_match = {
        [ReportParser.WORKING_DIR_KEY] : '/var/tmp/working',
        [ReportParser.FILENAME_KEY] : 'qa.report',
        [ReportParser.TARGET_FIELD_KEY] : 'unknown_field',
    };


    const bad_config = {
        [ReportParser.WORKING_DIR_KEY] : undefined,
        [ReportParser.FILENAME_KEY] : undefined,
        [ReportParser.TARGET_FIELD_KEY] : undefined,
    };

    const empty_config = {};
    const empty_callback = () => {};
    const error_only_callback = (err, data) => {
        throw err;
    };
    const test_report =
`~~ROADSTER EPHEMERIS QA REPORT~~
generation_time : May 30 2018 00:11:22.333
mission_name : Tesla Roadster
x : 38525348573.230
y : 85375732943.355
z : -58902057343.909
report_status : OK
data_points_checked : 395
----------------------------------------------------`;

    const test_match_time = `May 30 2018 00:11:22.333`;

    const create_read_stream = () => {
        const stream = new Readable();
        stream._read = () => {};
        stream.push(test_report);
        stream.push(null);
        const readstream = readline.createInterface({
            input: stream
        });
        return readstream;
    };


    describe('process_report_line', () => {
        it('should pass the matched value to callback', (done) =>{
            const callback = (err, data) => {
                expect(data).to.equal(test_match_time);
            }
            const readstream = create_read_stream();
            readstream.on('line', (line) => {
                let task_info = {
                    'config': correct_config_gen_time,
                    'line': line,
                    'callback': callback
                }
                report_parser.process_report_line(task_info)
                .catch( (err) => {
                    done(err);
                });

            });
            readstream.on('close', () => {
                done();
            });

        });
        it('should not trigger callback if no match', (done)=>{
            const callback = (err, data) => {
                throw new Error(`Matched ${correct_config_no_match[ReportParser.TARGET_FIELD_KEY]} and it should not have`);
            }
            const readstream = create_read_stream();
            readstream.on('line', (line) => {
                let task_info = {
                    'config': correct_config_no_match,
                    'line': line,
                    'callback': callback
                }
                report_parser.process_report_line(task_info)
                .catch( (err) => {
                    done(err);
                });

            });
            readstream.on('close', () => {
                done();
            });

        });

    });

    describe('validate_config', ()=> {
        it('should return an error if there is no config', (done)=>{
            let keys_processed = 0;
            ReportParser.REQUIRED_KEYS.forEach((value) => {
                let test_config = Object.assign({}, correct_config);
                delete test_config[value];
                try{
                    const result = report_parser.validate_config(test_config);
                } catch(err){
                    keys_processed++;
                    expect(err.message).to.equal(
                        `Config is missing required key: ${value}`
                    );
                    if(keys_processed === ReportParser.REQUIRED_KEYS.length){
                        done();
                    }


                }
            });
        });
        it('should return an error if config values are invalid', (done)=>{
            let keys_processed = 0;
            ReportParser.REQUIRED_KEYS.forEach((value) => {
                let test_config = Object.assign({}, correct_config);
                test_config[value] = undefined;
                try{
                    const result = report_parser.validate_config(test_config);
                } catch(err){
                    keys_processed++;
                    expect(err.message).to.equal(
                        `Config ${value} is invalid type: ${test_config[value]}`
                    );
                    if(keys_processed === ReportParser.REQUIRED_KEYS.length){
                        done();
                    }
                }
            });
        });

    });

    describe('parse', ()=> {
        it('should return an error if the file doesnt exist', (done) => {
            const correct_fullname_filepath = report_parser.get_fullpath_filename(correct_config[ReportParser.WORKING_DIR_KEY], correct_config[ReportParser.FILENAME_KEY]);
            const result = report_parser.parse(
                correct_config, (err,data) => {
                    expect(err.message).to.equal(
                        `ENOENT: no such file or directory, open '${correct_fullname_filepath}'`
                    );
                    done();

                });
        });

    });


});
