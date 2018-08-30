'use strict'
const fs = require('fs');
const util = require('util');
const async = require('async');
const readline = require('readline');
// Static props that probably should be relegated to a config clas or env varss
const ENCODING = 'utf-8';
const KEY_VALUE_DELIMITER = ':';
const QUEUE_CONCURRENCY = 8;
const BYTES_PER_STREAM_ITERATION = 512;
const FULLPATH_FILENAME_KEY = 'fullpath_filename';
const WORKING_DIR_KEY = 'working_dir';
const FILENAME_KEY = 'filename';
const TARGET_FIELD_KEY = 'target_field';
const REMOVE_AFTER_PARSE_KEY = 'remove_after_parse';

const REQUIRED_KEYS = [ WORKING_DIR_KEY, FILENAME_KEY, TARGET_FIELD_KEY ];
const OPTIONAL_KEYS = [ REMOVE_AFTER_PARSE_KEY ];

class ReportParser {


    /**
     * Report Parser is mostly acting as a static class with parsing utilities
     **/
    constructor(){
    }


   /**
     * Combines a path and filename in one place for convenience
     * @param {string} path - full directory to a file
     * @param {string} filename - name of a file
     * @return {string} - full path to a file
     **/
    get_fullpath_filename(path, filename){
        return `${path}/${filename}`;
    }

    /**
     * Checks that the config has required fields
     * @param {object} config - parser config options
     **/
    validate_config(config){
        REQUIRED_KEYS.forEach((value) => {
            if(!config.hasOwnProperty(value)){
                throw new Error(`Config is missing required key: ${value}` );
            }
            let config_option = config[value]; 
            if(typeof config_option === 'string' || config_option instanceof String){
                //Good config
            } else {
                throw new Error(`Config ${value} is invalid type: ${typeof config_option}` );
            }
        });
    }

    /**
     * Deletes a file from disk
     * @param {object} config - parser config options
     * @param {function} callback - callback for handling errors
     **/
    async delete_file(config, callback){
        fs.unlink(config[FULLPATH_FILENAME_KEY], (err) => {
            if (err) {
                callback(err);   
            }
        });
    }

    /**
     * Parses a report line in format of "key : value"
     * and hands off matched key to the callback 
     * @param {object} task - wrapper  containing line, config, and callback
     **/
    async process_report_line(task){
        let line = task.line;
        let target_field = task.config[TARGET_FIELD_KEY];
        let delimiter = line.indexOf(KEY_VALUE_DELIMITER);
        if(delimiter !== -1){
            let key = line.slice(0, delimiter).trim();
            if(key === target_field){
                let value = line.slice(delimiter+1).trim();
                task.callback(null, value);
            }
        }
        return;
    }

    /**
     * opens a file as a read stream
     * utilizes builtin readline to generate lines for parsing
     * places generated lines into an async queue
     * @param {object} config - parser config options
     * @param {asyncqueue} queue - queue from async lib
     * @param {function} callback - callback for handling errors and matched report values
     **/
    async read_file_stream(config, queue, callback){
        const stream = fs.createReadStream(
            config[FULLPATH_FILENAME_KEY],
            {encoding: ENCODING, highWaterMark: BYTES_PER_STREAM_ITERATION}
        );
        const linestream = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });

        linestream.on('line', async (line) => {
            let task_info = {
                'config': config,
                'line': line,
                'callback': callback
            }

            queue.push(task_info, (err) => {
                if(err){
                    callback(err);
                } 
            });
        });
        linestream.on('close', async () => {
            if(config[REMOVE_AFTER_PARSE_KEY]){
                await this.delete_file(config, callback);

            }
            return;
        });
        stream.on('error', async(err) => {
            if(err){
                callback(err);
            }
        });
    }

    /**
     * Given proper config and a callback
     * will attempt to parse a report
     * and pass matched values to the callback
     * uses an async queue to schedule parsing
     * @param {object} config - parser config options
     * @param {function} callback - callback for handling errors and matched report values
     **/
    async parse(config, callback){
        try{
            this.validate_config(config);
        } catch(e){
            callback(e);
        }
        const working_dir = config[WORKING_DIR_KEY];
        const filename = config[FILENAME_KEY];
        config[FULLPATH_FILENAME_KEY] = this.get_fullpath_filename(working_dir, filename);
        const queue = async.queue(this.process_report_line, QUEUE_CONCURRENCY);
        await this.read_file_stream(config, queue, callback)
        .catch( (err) => {
            callback(err);
        });
    }

};

module.exports = {
    ReportParser: ReportParser,
    WORKING_DIR_KEY : WORKING_DIR_KEY,
    FILENAME_KEY: FILENAME_KEY,
    TARGET_FIELD_KEY: TARGET_FIELD_KEY,
    REMOVE_AFTER_PARSE_KEY: REMOVE_AFTER_PARSE_KEY,
    REQUIRED_KEYS: REQUIRED_KEYS,
    OPTIONAL_KEYS: OPTIONAL_KEYS
};
